# Firestore Security Specification — MPI Fisika Kelas X Fase E

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every path not explicitly matched is denied (`allow read, write: if false`).
2. **Verified User Gate**: Every read and write requires `request.auth != null` and `request.auth.token.email_verified == true`.
3. **Path Variable ID Poisoning Guard**: Every single-document operation (`get`, `create`, `update`, `delete`) validates document ID path parameters against `^[a-zA-Z0-9_\-]+$` and `.size() <= 128` (NPSN `4..20` chars). `allow list` never invokes `get()` or `exists()`.
4. **Master Gate Relational Integrity**: Subcollections under `/schools/{npsn}/...` require `exists(/databases/$(database)/documents/schools/$(npsn))` and verified membership at `/schools/$(npsn)/members/$(request.auth.uid)`.
5. **Strict Schema & No Ghost Fields**: Every `create` and `update` invokes its standalone `isValid[Entity](incoming())` helper, enforcing `hasAll(...)` + `hasOnly(...)`, strict types, `.size()` bounds on every string/list, and server timestamp equality (`createdAt == request.time`, `updatedAt == request.time`).
6. **Tiered Identity Logic on LKPD Submissions**:
   - **Student Owner (`studentUid == request.auth.uid`)**: Can create LKPD only with `feedbackStatus == 'pending'` and empty `teacherFeedback`, and can update student fields (`title`, `groupName`, `groupLeader`, `members`, `className`, `school`, `date`, `labMode`, `glbRows`, `glbbAccelRows`, `glbbDecelRows`, `ans1`, `ans2`, `ans4`, `ans5`, `ans6`, `conclusion`, `updatedAt`) ONLY while `existing().status != 'finalized'`. Students CANNOT modify `teacherFeedback`, `feedbackBy`, `feedbackByUid`, `feedbackAt`, `feedbackStatus`, `studentUid`, `npsn`, or `createdAt`.
   - **School Teacher (`isSchoolTeacher(npsn)`)**: Can ONLY update `['teacherFeedback', 'feedbackBy', 'feedbackByUid', 'feedbackAt', 'feedbackStatus', 'updatedAt']` using `affectedKeys().hasOnly(...)` with `feedbackByUid == request.auth.uid`, and cannot alter student answers or ownership.
7. **PII Isolation & Zero Blanket Reads**: No passwords, emails, phones, or addresses are stored in readable collections. `/users/{userId}` is strictly owner-only (`get` only, no `list`). All `allow list` queries strictly evaluate `resource.data` (`studentUid == request.auth.uid || request.auth.uid in resource.data.allowedTeacherUids`).
8. **Terminal State Locking**: Once `LKPDSubmission.status == 'finalized'` or `StudentReport.status == 'archived'`, subsequent client modifications are blocked.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: Create `/schools/12345678/lkpdSubmissions/sub1` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Write `/users/uid1` with `request.auth.uid == 'uid1'` and `token.email_verified == false` -> `PERMISSION_DENIED`.
3. **Ghost Field / Shadow Update**: Update LKPD with extra field `{ isVerified: true }` -> Rejected by `isValidLKPDSubmission` (`hasOnly`).
4. **Student Self-Feedback Tampering**: Student updates own LKPD adding `{ teacherFeedback: 'Nilai 100', feedbackStatus: 'reviewed' }` -> Rejected by Tier 1 `affectedKeys().hasOnly(...)` check.
5. **Teacher Overwriting Student Answers**: Teacher updates LKPD adding `{ ans1: 'diubah guru' }` -> Rejected by Tier 2 `affectedKeys().hasOnly(...)` check.
6. **Identity Spoofing on Create**: User `uidA` creates `/schools/12345678/lkpdSubmissions/sub2` with `studentUid: 'uidB'` -> Rejected (`data.studentUid == request.auth.uid`).
7. **Role Escalation in School Member**: Student tries to update `/schools/12345678/members/uidA` changing `role` from `'murid'` to `'guru'` -> Rejected (immutable `role` or `allow update` restricts allowed fields).
8. **ID Poisoning (1.5KB Document ID)**: Create doc with ID of 1500 characters or invalid chars `../../admin` -> Rejected by `isValidId()`.
9. **Denial-of-Wallet Oversized String**: Create LKPD with `ans1` string of 10,000 characters -> Rejected by `ans1.size() <= 2000`.
10. **Forged Server Timestamp**: Create LKPD with backdated `createdAt` not equal to `request.time` -> Rejected by `data.createdAt == request.time`.
11. **Cross-School Query Scraping (`list`)**: User in school `99999999` attempts `list` on `/schools/12345678/quizResults` without `uid` in `studentUid` or `allowedTeacherUids` -> `PERMISSION_DENIED`.
12. **Terminal State Mutation**: Student attempts to update an LKPD whose `existing().status == 'finalized'` -> `PERMISSION_DENIED`.

## 3. Red Team Audit & Conflict Report
- **Identity Spoofing**: Closed (`studentUid == request.auth.uid`, `uid == request.auth.uid`, immutable on update).
- **State Shortcutting**: Closed (students can only create with `status == 'submitted'` and `feedbackStatus == 'pending'`; terminal `'finalized'` / `'archived'` states are locked).
- **Resource Poisoning**: Closed (`isValidId` + strict `.size()` caps on every string and array).
- **Query Trust Test**: Closed (`allow list` uses `resource.data` only, zero `get()`/`exists()` inside `allow list`).
- **PII Blanket Test**: Closed (`/users/{userId}` allows `get` only to `isOwner(userId)`).
