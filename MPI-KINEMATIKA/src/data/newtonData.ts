/**
 * Newton Physics Learning Hub - Data & Assets
 */

export const NEWTON_ASSETS = {
  heroAstronaut: '/src/assets/images/hero_astronaut_physics_1793972923325.jpg',
  conceptSoccerBall: '/src/assets/images/concept_soccer_ball_grass_1793972924030.jpg',
  studentMascot: '/src/assets/images/student_mascot_reaction_1793972924905.jpg',
  gameIslandMap: '/src/assets/images/game_quest_island_map_1793972925458.jpg',
};

export interface NewtonQuizItem {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string;
}

export const NEWTON_QUIZ_QUESTIONS: NewtonQuizItem[] = [
  {
    id: 1,
    question: "Sebuah benda diam di atas meja akan tetap diam jika tidak ada gaya luar yang mempengaruhinya. Fenomena ini sesuai dengan...",
    options: [
      { key: "A", text: "Hukum I Newton (Kelembaman)" },
      { key: "B", text: "Hukum II Newton (Percepatan)" },
      { key: "C", text: "Hukum III Newton (Aksi-Reaksi)" },
      { key: "D", text: "Hukum Kekekalan Energi" }
    ],
    correctKey: "A",
    explanation: "Hukum I Newton menyatakan benda cenderung mempertahankan keadaan awalnya (inersia/kelembaman), tetap diam atau bergerak lurus beraturan jika resultan gaya sama dengan nol (ΣF = 0)."
  },
  {
    id: 2,
    question: "Saat bus yang sedang melaju kencang tiba-tiba direm mendadak, tubuh penumpang akan terdorong ke depan karena...",
    options: [
      { key: "A", text: "Gaya dorong mesin bus bertambah besar" },
      { key: "B", text: "Tubuh mempertahankan keadaan gerak ke depan (inersia)" },
      { key: "C", text: "Gaya gravitasi menarik tubuh ke depan" },
      { key: "D", text: "Gaya gesek lantai bus menghilang" }
    ],
    correctKey: "B",
    explanation: "Karena sifat kelembaman (Hukum I Newton), tubuh penumpang berusaha mempertahankan geraknya ke depan ketika bus direm."
  },
  {
    id: 3,
    question: "Menurut Hukum II Newton, jika gaya yang diberikan semakin besar dengan massa benda tetap, maka percepatan benda akan ....",
    options: [
      { key: "A", text: "Semakin kecil" },
      { key: "B", text: "Semakin besar" },
      { key: "C", text: "Tetap sama" },
      { key: "D", text: "Tidak terpengaruh" }
    ],
    correctKey: "B",
    explanation: "Berdasarkan Hukum II Newton (F = m × a atau a = F/m), percepatan (a) berbanding lurus dengan resultan gaya (F). Jika F diperbesar, maka a juga semakin besar."
  },
  {
    id: 4,
    question: "Sebuah balok bermassa 4 kg ditarik dengan gaya tetap sebesar 20 N pada permukaan licin tanpa gesekan. Berapakah percepatan balok tersebut?",
    options: [
      { key: "A", text: "2.50 m/s²" },
      { key: "B", text: "5.00 m/s²" },
      { key: "C", text: "10.00 m/s²" },
      { key: "D", text: "80.00 m/s²" }
    ],
    correctKey: "B",
    explanation: "Gunakan rumus a = F / m. Maka a = 20 N / 4 kg = 5.00 m/s²."
  },
  {
    id: 5,
    question: "Jika sebuah balok diberi gaya 30 N menghasilkan percepatan 6 m/s², berapakah massa balok tersebut?",
    options: [
      { key: "A", text: "5 kg" },
      { key: "B", text: "180 kg" },
      { key: "C", text: "0.2 kg" },
      { key: "D", text: "24 kg" }
    ],
    correctKey: "A",
    explanation: "Dari F = m × a, maka m = F / a = 30 N / 6 m/s² = 5 kg."
  },
  {
    id: 6,
    question: "Pasangan gaya aksi dan reaksi pada Hukum III Newton selalu memiliki karakteristik berikut, KECUALI...",
    options: [
      { key: "A", text: "Besarnya sama (F_aksi = -F_reaksi)" },
      { key: "B", text: "Arahnya berlawanan" },
      { key: "C", text: "Bekerja pada benda yang sama" },
      { key: "D", text: "Bekerja pada dua benda yang berbeda" }
    ],
    correctKey: "C",
    explanation: "Gaya aksi-reaksi TIDAK bekerja pada benda yang sama, melainkan bekerja pada dua benda yang berbeda sehingga tidak saling meniadakan."
  },
  {
    id: 7,
    question: "Saat seorang perenang mendorong air ke arah belakang dengan tangannya, tubuh perenang akan terdorong ke depan. Hal ini merupakan contoh dari...",
    options: [
      { key: "A", text: "Hukum I Newton" },
      { key: "B", text: "Hukum II Newton" },
      { key: "C", text: "Hukum III Newton" },
      { key: "D", text: "Gaya Archimedes saja" }
    ],
    correctKey: "C",
    explanation: "Tangan memberikan gaya aksi ke belakang pada air, dan air memberikan gaya reaksi ke depan pada tubuh perenang (F_aksi = -F_reaksi)."
  },
  {
    id: 8,
    question: "Satuan gaya dalam Sistem Internasional (SI) adalah Newton (N). 1 Newton setara dengan...",
    options: [
      { key: "A", text: "1 kg·m/s" },
      { key: "B", text: "1 kg·m/s²" },
      { key: "C", text: "1 kg·m²/s²" },
      { key: "D", text: "1 g·cm/s²" }
    ],
    correctKey: "B",
    explanation: "Dari F = m × a, satuan massa adalah kg dan percepatan m/s², sehingga 1 N = 1 kg·m/s²."
  },
  {
    id: 9,
    question: "Dua benda A (2 kg) dan B (6 kg) ditarik dengan gaya yang sama besar. Perbandingan percepatan benda A terhadap benda B (a_A : a_B) adalah...",
    options: [
      { key: "A", text: "1 : 3" },
      { key: "B", text: "3 : 1" },
      { key: "C", text: "1 : 1" },
      { key: "D", text: "2 : 6" }
    ],
    correctKey: "B",
    explanation: "Percepatan berbanding terbalik dengan massa (a = F/m). Maka a_A : a_B = (F/2) : (F/6) = 6 : 2 = 3 : 1."
  },
  {
    id: 10,
    question: "Sebuah roket dapat meluncur ke luar angkasa karena menyemburkan gas panas berkecepatan tinggi ke bawah. Prinsip fisika ini didasari oleh...",
    options: [
      { key: "A", text: "Hukum III Newton tentang aksi dan reaksi" },
      { key: "B", text: "Hukum Gravitasi Universal saja" },
      { key: "C", text: "Hukum Kelembaman" },
      { key: "D", text: "Hukum Termodinamika ke-0" }
    ],
    correctKey: "A",
    explanation: "Roket mendorong gas ke bawah (aksi), dan gas mendorong balik roket ke atas dengan gaya yang sama besar (reaksi)."
  }
];

export const GAME_LEVELS = [
  {
    id: 1,
    title: "Misi Level 1: Konsep Gaya dan Gerak",
    subtitle: "Pahami konsep gaya resultan dan kelembaman benda (Hukum I Newton)",
    starsRequired: 0,
    targetScore: 80,
    unlocked: true,
    description: "Uji pemahaman dasar tentang inersia dan resultan gaya ΣF = 0.",
    challengeQuestion: "Bila resultan gaya yang bekerja pada mobil balap adalah nol, apa yang terjadi pada mobil tersebut?",
    challengeOptions: [
      "Mobil pasti berhenti seketika",
      "Mobil mempertahankan kecepatan konstan tanpa percepatan",
      "Mobil berbelok ke kanan otomatis",
      "Mobil melayang di udara"
    ],
    correctIndex: 1
  },
  {
    id: 2,
    title: "Misi Level 2: Eksplorasi Percepatan Balok",
    subtitle: "Hitung percepatan benda berdasarkan Hukum II Newton (F = m × a)",
    starsRequired: 25,
    targetScore: 85,
    unlocked: true,
    description: "Kombinasikan massa dan gaya untuk mencapai percepatan target 5 m/s².",
    challengeQuestion: "Gaya 50 N bekerja pada troli 10 kg. Berapakah percepatan troli?",
    challengeOptions: ["0.2 m/s²", "5.0 m/s²", "500 m/s²", "40 m/s²"],
    correctIndex: 1
  },
  {
    id: 3,
    title: "Misi Level 3: Aksi dan Reaksi Ruang Angkasa",
    subtitle: "Kuasai hukum timbal balik gaya pada astronot dan roket",
    starsRequired: 50,
    targetScore: 90,
    unlocked: false,
    description: "Pahami pasangan aksi reaksi yang bekerja pada benda berbeda.",
    challengeQuestion: "Astronot mendorong satelit dengan gaya 100 N di luar angkasa. Gaya reaksi satelit pada astronot adalah...",
    challengeOptions: ["0 N karena hampa udara", "100 N berlawanan arah", "200 N searah", "50 N tegak lurus"],
    correctIndex: 1
  },
  {
    id: 4,
    title: "Misi Level 4: Gaya Gesek dan Permukaan",
    subtitle: "Taklukkan gesekan statis dan kinetis pada bidang miring",
    starsRequired: 80,
    targetScore: 90,
    unlocked: false,
    description: "Analisis pengaruh koefisien gesek terhadap perlambatan benda.",
    challengeQuestion: "Arah gaya gesek selalu...",
    challengeOptions: ["Searah dengan kecenderungan gerak", "Berlawanan dengan kecenderungan gerak benda", "Tegak lurus terhadap bidang", "Selalu mengarah ke pusat bumi"],
    correctIndex: 1
  },
  {
    id: 5,
    title: "Boss Battle: Kuil Observatorium Newton",
    subtitle: "Selesaikan teka-teki integratif Hukum Newton di kubah observatorium langit!",
    starsRequired: 120,
    targetScore: 95,
    unlocked: false,
    description: "Tantangan puncak menggabungkan GLBB, gaya gravitasi, dan dinamika gerak partikel.",
    challengeQuestion: "Mengapa benda bermassa 10 kg dan 1 kg jatuh dengan percepatan sama di ruang hampa bumi?",
    challengeOptions: [
      "Karena gaya gravitasi pada keduanya sama",
      "Karena rasio gaya gravitasi terhadap massa (F/m) bernilai konstan (g = 9.8 m/s²)",
      "Karena massa benda menjadi nol di ruang hampa",
      "Karena tidak ada gaya apapun yang bekerja"
    ],
    correctIndex: 1
  }
];
