import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import FlashCard from "../components/FlashCard";
import { getAllFlashcardDecks } from "../firebase/firestore";

function Flashcard() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    getAllFlashcardDecks()
      .then((data) => {
        setDecks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải flashcard:", err);
        setLoading(false);
      });
  }, []); // [] nghĩa là chỉ chạy 1 lần khi component mount

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <p className="text-white p-8">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <p className="text-white p-8">Chưa có bộ flashcard nào.</p>
      </div>
    );
  }

  const deck = decks[0]; // Tạm thời dùng bộ đầu tiên
  const currentCard = deck.cards[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % deck.cards.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + deck.cards.length) % deck.cards.length,
    );
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-2xl font-bold text-white">{deck.title}</h1>
        <p className="text-slate-400">
          Thẻ {currentIndex + 1} / {deck.cards.length}
        </p>
        <FlashCard key={currentCard.id} card={currentCard} />
        <div className="flex gap-4">
          <button
            onClick={handlePrev}
            className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600"
          >
            ← Trước
          </button>
          <button
            onClick={handleNext}
            className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600"
          >
            Tiếp →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Flashcard;
