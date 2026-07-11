import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import FlashCard from "../components/FlashCard";
import {
  getAllFlashcardDecks,
  getProgress,
  markAsLearned,
  markAsNotLearned,
} from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";

function Flashcard() {
  const { currentUser } = useAuth();
  const [decks, setDecks] = useState([]);
  const [learned, setLearned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const deck = decks[0];
  const progressType = deck ? `flashcard_${deck.id}` : null;

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllFlashcardDecks();
        setDecks(data);

        if (data.length > 0) {
          const progress = await getProgress(
            currentUser.uid,
            `flashcard_${data[0].id}`,
          );
          setLearned(progress.learned);
        }
      } catch (err) {
        console.error("Lỗi tải flashcard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  if (loading) {
    return (
      <Layout>
        <p className="text-stone-600">Đang tải dữ liệu...</p>
      </Layout>
    );
  }

  if (decks.length === 0) {
    return (
      <Layout>
        <p className="text-stone-600">Chưa có bộ flashcard nào.</p>
      </Layout>
    );
  }

  const currentCard = deck.cards[currentIndex];
  const isCurrentLearned = learned.includes(currentCard.id);
  const progressPercent = Math.round(
    (learned.length / deck.cards.length) * 100,
  );

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % deck.cards.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + deck.cards.length) % deck.cards.length,
    );
  };

  const markLearned = async () => {
    await markAsLearned(
      currentUser.uid,
      progressType,
      currentCard.id,
      deck.cards.length,
    );
    setLearned((prev) => [...prev, currentCard.id]);
    handleNext(); // Tự động chuyển thẻ tiếp theo sau khi đánh dấu
  };

  const markNotLearned = async () => {
    if (isCurrentLearned) {
      await markAsNotLearned(currentUser.uid, progressType, currentCard.id);
      setLearned((prev) => prev.filter((id) => id !== currentCard.id));
    }
    handleNext();
  };

  return (
    <Layout>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            Bài 1
          </span>
          <span className="ml-2 text-sm text-stone-500">
            {deck.cards.length} từ vựng
          </span>
        </div>
        <span className="text-sm font-bold text-stone-700">
          Đã thuộc: {learned.length}/{deck.cards.length} ({progressPercent}%)
        </span>
      </div>

      <div className="w-full h-2 bg-stone-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-green-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <h1 className="text-2xl font-bold text-stone-800 mb-1">{deck.title}</h1>
      <p className="text-sm text-stone-500 mb-4">
        {currentIndex + 1} / {deck.cards.length}
        {isCurrentLearned && (
          <span className="ml-2 text-green-700 font-bold">✓ Đã thuộc</span>
        )}
      </p>

      <div className="flex flex-col items-center gap-4">
        <FlashCard key={currentCard.id} card={currentCard} />

        <div className="flex gap-3 w-full max-w-2xl">
          <button
            onClick={handlePrev}
            className="px-4 py-2 rounded-lg border-2 border-black bg-white text-stone-800 font-medium hover:bg-stone-100"
          >
            ← Trước
          </button>

          <button
            onClick={markNotLearned}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
          >
            ✕ Chưa thuộc
          </button>

          <button
            onClick={markLearned}
            className="flex-1 px-4 py-2 rounded-lg bg-green-700 text-white font-bold hover:bg-green-800"
          >
            ✓ Đã thuộc
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-lg border-2 border-black bg-white text-stone-800 font-medium hover:bg-stone-100"
          >
            Sau →
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Flashcard;
