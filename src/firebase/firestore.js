import { db } from "./config";
import { initializeApp } from "firebase/app";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

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
  answers,
) => {
  const resultsRef = collection(db, "users", userId, "quizResults");

  await addDoc(resultsRef, {
    quizId,
    score,
    totalQuestions,
    timeSpent,
    answers, // <-- thêm dòng này
    completedAt: new Date().toISOString(),
  });
};

export const getQuizHistory = async (userId, quizId, limitCount = 10) => {
  const historyRef = collection(db, "users", userId, "quizResults");
  const snapshot = await getDocs(historyRef);

  const history = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((item) => item.quizId === quizId)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, limitCount);

  return history;
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

// Thêm 1 quiz mới (dùng cho Admin)
export const addQuiz = async (quizData) => {
  await addDoc(collection(db, "quizzes"), quizData);
};

// Cập nhật lại 1 quiz đã tồn tại (dùng khi Admin sửa hoặc nối thêm câu hỏi vào ngân hàng cũ)
export const updateQuiz = async (quizId, quizData) => {
  const quizRef = doc(db, "quizzes", quizId);
  await updateDoc(quizRef, quizData);
};

// Xóa 1 quiz
export const deleteQuiz = async (quizId) => {
  await deleteDoc(doc(db, "quizzes", quizId));
};

// Thêm 1 bộ flashcard mới (dùng cho Admin)
export const addFlashcardDeck = async (deckData) => {
  await addDoc(collection(db, "flashcardDecks"), deckData);
};

// ==== Quản lý danh sách CẤP ĐỘ dùng chung cho toàn bộ Manager ====
// (quiz, flashcard, kanji, listening, speaking, reading...) đều đọc từ đây

// Lấy danh sách các cấp độ do Admin tự thêm (ngoài các cấp độ mặc định)
export const getAllLevels = async () => {
  const snapshot = await getDocs(collection(db, "levels"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Thêm 1 cấp độ mới, dùng chung cho mọi Manager
export const addLevel = async (levelName) => {
  await addDoc(collection(db, "levels"), { name: levelName });
};

// Xóa 1 cấp độ (chỉ xóa được cấp độ do Admin tự thêm, không xóa được cấp độ mặc định)
export const deleteLevel = async (levelId) => {
  await deleteDoc(doc(db, "levels", levelId));
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
// Lấy tiến độ 1 loại (hiragana/katakana/kanji) của user
export const getProgress = async (userId, type) => {
  const progressRef = doc(db, "users", userId, "progress", type);
  const snapshot = await getDoc(progressRef);
  if (snapshot.exists()) {
    return snapshot.data();
  }
  return { learned: [], total: 0 };
};

// Đánh dấu 1 item là "đã thuộc"
export const markAsLearned = async (userId, type, itemId, total) => {
  const progressRef = doc(db, "users", userId, "progress", type);
  const snapshot = await getDoc(progressRef);

  if (snapshot.exists()) {
    await updateDoc(progressRef, {
      learned: arrayUnion(itemId), // Thêm itemId vào mảng, tự tránh trùng lặp
    });
  } else {
    await setDoc(progressRef, { learned: [itemId], total });
  }
};

// Bỏ đánh dấu "đã thuộc" (nếu user muốn học lại)
export const markAsNotLearned = async (userId, type, itemId) => {
  const progressRef = doc(db, "users", userId, "progress", type);
  await updateDoc(progressRef, {
    learned: arrayRemove(itemId),
  });
};

export const getAllHiragana = async () => {
  const snapshot = await getDocs(collection(db, "hiragana"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getAllKatakana = async () => {
  const snapshot = await getDocs(collection(db, "katakana"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Thêm 1 chữ Hiragana/Katakana mới (dùng chung logic vì cấu trúc giống nhau)
export const addKanaChar = async (type, charData) => {
  const { id, ...data } = charData;
  await setDoc(doc(db, type, id), data); // type = "hiragana" hoặc "katakana"
};

export const deleteKanaChar = async (type, id) => {
  await deleteDoc(doc(db, type, id));
};

// Thêm 1 chữ Kanji mới
export const addKanjiChar = async (kanjiData) => {
  const { id, ...data } = kanjiData;
  await setDoc(doc(db, "kanji", id), data);
};

export const deleteKanjiChar = async (id) => {
  await deleteDoc(doc(db, "kanji", id));
};

export const getAllKanji = async () => {
  const snapshot = await getDocs(collection(db, "kanji"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getAllGrammar = async () => {
  const snapshot = await getDocs(collection(db, "grammar"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addGrammarPoint = async (grammarData) => {
  const { id, ...data } = grammarData;
  await setDoc(doc(db, "grammar", id), data);
};

export const deleteGrammarPoint = async (id) => {
  await deleteDoc(doc(db, "grammar", id));
};

export const deleteFlashcardDeck = async (deckId) => {
  await deleteDoc(doc(db, "flashcardDecks", deckId));
};
export const setFlashcardDeck = async (deckData) => {
  const { id, ...data } = deckData;
  await setDoc(doc(db, "flashcardDecks", id), data);
};

// Tải ảnh minh họa cho 1 thẻ flashcard lên Firebase Storage, trả về URL công khai
export const uploadCardImage = async (file, deckId, cardId) => {
  const path = `flashcards/${deckId}/${cardId}-${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const getAllListening = async () => {
  const snapshot = await getDocs(collection(db, "listening"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addListeningItem = async (itemData) => {
  const { id, ...data } = itemData;
  await setDoc(doc(db, "listening", id), data);
};

export const deleteListeningItem = async (id) => {
  await deleteDoc(doc(db, "listening", id));
};

export const getAllSpeaking = async () => {
  const snapshot = await getDocs(collection(db, "speaking"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addSpeakingItem = async (itemData) => {
  const { id, ...data } = itemData;
  await setDoc(doc(db, "speaking", id), data);
};

export const deleteSpeakingItem = async (id) => {
  await deleteDoc(doc(db, "speaking", id));
};

export const saveSpeakingResult = async (
  userId,
  speakingItemId,
  jlptLevel,
  userAnswer,
  percent,
  matchedKeywords,
) => {
  const historyRef = collection(db, "users", userId, "speakingHistory");
  await addDoc(historyRef, {
    speakingItemId,
    jlptLevel,
    userAnswer,
    percent,
    matchedKeywords,
    completedAt: new Date().toISOString(),
  });
};

export const getSpeakingHistory = async (userId, limitCount = 20) => {
  const historyRef = collection(db, "users", userId, "speakingHistory");
  const snapshot = await getDocs(historyRef);
  const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  // Sắp xếp mới nhất trước, giới hạn số lượng hiển thị
  return all
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, limitCount);
};

export const getAllReading = async () => {
  const snapshot = await getDocs(collection(db, "readingPassages"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addReadingPassage = async (passageData) => {
  const { id, ...data } = passageData;
  await setDoc(doc(db, "readingPassages", id), data);
};

export const deleteReadingPassage = async (id) => {
  await deleteDoc(doc(db, "readingPassages", id));
};

// Lưu kết quả luyện đọc vào lịch sử (giống cách saveSpeakingResult)
export const saveReadingResult = async (
  userId,
  passageId,
  jlptLevel,
  vocabScore,
  comprehensionScore,
  totalScore,
) => {
  const historyRef = collection(db, "users", userId, "readingHistory");
  await addDoc(historyRef, {
    passageId,
    jlptLevel,
    vocabScore,
    comprehensionScore,
    totalScore,
    completedAt: new Date().toISOString(),
  });
};

export const getReadingHistory = async (userId, limitCount = 20) => {
  const historyRef = collection(db, "users", userId, "readingHistory");
  const snapshot = await getDocs(historyRef);
  const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return all
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, limitCount);
};
