import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";

// Giúp import file JSON mượt mà trong ES Module
const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

// Khởi tạo Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});

// Khởi tạo db để dùng ở các hàm bên dưới
const db = getFirestore();

const quizzes = [
  {
    id: "n5-quiz-1",
    title: "N5 - Kiểm tra từ vựng cơ bản",
    timeLimit: 60,
    questions: [
      {
        id: "q1",
        question: "水 nghĩa là gì?",
        options: ["Lửa", "Nước", "Cây", "Núi"],
        correctAnswer: "Nước",
      },
      {
        id: "q2",
        question: "「やま」viết bằng Kanji là?",
        options: ["水", "火", "木", "山"],
        correctAnswer: "山",
      },
      {
        id: "q3",
        question: "こんにちは nghĩa là gì?",
        options: ["Tạm biệt", "Xin chào", "Cảm ơn", "Xin lỗi"],
        correctAnswer: "Xin chào",
      },
      {
        id: "q4",
        question: "Số 5 trong tiếng Nhật đọc là?",
        options: ["よん", "ご", "さん", "はち"],
        correctAnswer: "ご",
      },
    ],
  },
];

const flashcardDecks = [
  {
    id: "n5-basic-1",
    title: "N5 - Từ vựng cơ bản 1",
    cards: [
      { id: "c1", front: "水", back: "みず (mizu) - Nước" },
      { id: "c2", front: "火", back: "ひ (hi) - Lửa" },
      { id: "c3", front: "木", back: "き (ki) - Cây" },
      { id: "c4", front: "山", back: "やま (yama) - Núi" },
      { id: "c5", front: "川", back: "かわ (kawa) - Sông" },
    ],
  },
];

async function seed() {
  console.log("Đang seed quizzes...");
  for (const quiz of quizzes) {
    const { id, ...data } = quiz; // Tách id ra riêng, phần còn lại là data
    await db.collection("quizzes").doc(id).set(data);
    console.log(`✓ Đã thêm quiz: ${id}`);
  }

  console.log("Đang seed flashcardDecks...");
  for (const deck of flashcardDecks) {
    const { id, ...data } = deck;
    await db.collection("flashcardDecks").doc(id).set(data);
    console.log(`✓ Đã thêm deck: ${id}`);
  }

  console.log("Hoàn thành!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Lỗi khi seed dữ liệu:", err);
  process.exit(1);
});
