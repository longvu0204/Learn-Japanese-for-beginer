import { useState, useEffect } from "react";
import Layout from "../components/Layout";
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
      .catch(() => setLoading(false));
  }, []);

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

  const deck = decks[0];
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
    <Layout>
      <div className="mb-4">
        <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
          Bài 1
        </span>
        <span className="ml-2 text-sm text-stone-500">
          {deck.cards.length} từ vựng
        </span>
      </div>

      <h1 className="text-2xl font-bold text-stone-800 mb-1">{deck.title}</h1>
      <p className="text-sm text-stone-500 mb-4">
        {currentIndex + 1} / {deck.cards.length}
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

          <button className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700">
            ✕ Chưa thuộc
          </button>

          <button
            onClick={handleNext}
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
