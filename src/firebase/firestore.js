import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "./config";
import { initializeApp } from "firebase/app";

// Tạo hồ sơ user mới trong collection "users"
export const createUserProfile = async (uid, data) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    ...data,
    level: "beginner",
    role: "user",
    onboardingCompleted: false,
    initialLevel: null,
    learningGoal: null,
    createdAt: new Date().toISOString(),
  });
};

// Lấy thông tin hồ sơ user theo uid
export const getUserProfile = async (uid) => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return snapshot.data();
  }
  return null;
};

// Lưu kết quả 1 lần làm quiz
export const saveQuizResult = async (
  userId,
  quizId,
  score,
  totalQuestions,
  timeSpent,
) => {
  const resultsRef = collection(db, "users", userId, "quizResults");
  await addDoc(resultsRef, {
    quizId,
    score,
    totalQuestions,
    timeSpent,
    completedAt: new Date().toISOString(),
  });
};
// Lấy tất cả bộ flashcard
export const getAllFlashcardDecks = async () => {
  const snapshot = await getDocs(collection(db, "flashcardDecks"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Lấy tất cả quiz
export const getAllQuizzes = async () => {
  const snapshot = await getDocs(collection(db, "quizzes"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Thêm 1 bộ flashcard mới (dùng cho Admin)
export const addFlashcardDeck = async (deckData) => {
  await addDoc(collection(db, "flashcardDecks"), deckData);
};

// Thêm 1 quiz mới (dùng cho Admin)
export const addQuiz = async (quizData) => {
  await addDoc(collection(db, "quizzes"), quizData);
};

export const completeOnboarding = async (uid, initialLevel, learningGoal) => {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      onboardingCompleted: true,
      initialLevel,
      learningGoal,
    },
    { merge: true }, // Chỉ cập nhật các field này, giữ nguyên field khác
  );
};
