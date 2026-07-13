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

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

function Flashcard() {
  const { currentUser } = useAuth();
  const [allDecks, setAllDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [learned, setLearned] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const decksInLevel = allDecks.filter((d) => d.jlptLevel === selectedLevel);
  const deck = allDecks.find((d) => d.id === selectedDeckId);
  const progressType = deck ? `flashcard_${deck.id}` : null;

  useEffect(() => {
    getAllFlashcardDecks()
      .then((data) => {
        setAllDecks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startDeck = async (deckId) => {
    setSelectedDeckId(deckId);
    setCurrentIndex(0);
    try {
      const progress = await getProgress(
        currentUser.uid,
        `flashcard_${deckId}`,
      );
      setLearned(progress.learned);
    } catch (err) {
      setLearned([]);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-stone-600">Đang tải dữ liệu...</p>
      </Layout>
    );
  }

  // Màn hình 1: chưa chọn bộ - hiện tab cấp độ + danh sách bộ trong cấp độ đó
  if (!selectedDeckId) {
    return (
      <Layout>
        <div className="mb-4">
          <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            Flashcard
          </span>
        </div>

        <div className="flex gap-2 mb-6">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg font-bold border-2 border-black transition-colors ${
                selectedLevel === level
                  ? "bg-black text-white"
                  : "bg-[#f5e6a8] text-stone-800 hover:bg-[#f0dd8a]"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {decksInLevel.length === 0 ? (
          <p className="text-stone-600">
            Chưa có bộ flashcard nào cho cấp độ {selectedLevel}. Vào Admin
            Dashboard để thêm.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {decksInLevel.map((d) => (
              <button
                key={d.id}
                onClick={() => startDeck(d.id)}
                className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 text-left hover:bg-[#f0dd8a] transition-colors"
              >
                <p className="font-bold text-stone-900 mb-1">{d.title}</p>
                <p className="text-sm text-stone-600">
                  {d.cards.length} từ vựng
                </p>
              </button>
            ))}
          </div>
        )}
      </Layout>
    );
  }

  // Màn hình 2: đang học 1 bộ cụ thể
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
    handleNext();
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
      <button
        onClick={() => setSelectedDeckId(null)}
        className="text-sm font-bold text-stone-600 mb-4 hover:underline"
      >
        ← Chọn bộ khác
      </button>

      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            {deck.jlptLevel}
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
