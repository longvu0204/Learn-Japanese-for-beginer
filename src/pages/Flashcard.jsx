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
import { useLevels } from "../hooks/useLevels";
import FlashcardGame from "../components/FlashcardGame";

// Xáo trộn mảng bằng thuật toán Fisher-Yates
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Hoa văn sóng Seigaiha mờ nhẹ làm nền trang trí phong cách Nhật Bản
function SeigaihaBackground() {
  return (
    <svg
      className="fixed inset-0 -z-10 w-full h-full opacity-[0.05] pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="seigaiha"
          width="56"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 28 A28 28 0 0 1 56 28 A28 28 0 0 1 28 14 A28 28 0 0 1 0 28 Z"
            fill="none"
            stroke="#8b1e3f"
            strokeWidth="1.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#seigaiha)" />
    </svg>
  );
}

function Flashcard() {
  const { levels } = useLevels();
  const { currentUser } = useAuth();
  const [allDecks, setAllDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [learned, setLearned] = useState([]);
  const [showGame, setShowGame] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Thứ tự học hiện tại (mảng index của deck.cards) - dùng để xáo trộn
  const [cardOrder, setCardOrder] = useState([]);
  // Chỉ hiện những từ chưa thuộc
  const [unlearnedOnly, setUnlearnedOnly] = useState(false);
  const [resetting, setResetting] = useState(false);
  // true khi người dùng đã bấm "Ôn tập lại" ở màn hình hoàn thành,
  // để bỏ qua màn hình đó và duyệt lại các thẻ như bình thường
  const [reviewingCompleted, setReviewingCompleted] = useState(false);

  const decksInLevel = allDecks.filter((d) => d.jlptLevel === selectedLevel);
  const deck = allDecks.find((d) => d.id === selectedDeckId);
  const progressType = deck ? `flashcard_${deck.id}` : null;

  // Loại bỏ ID trùng lặp và ID không còn thuộc bộ hiện tại (phòng dữ liệu cũ bị lỗi)
  // -> mọi chỗ hiển thị/lọc đều dùng danh sách "sạch" này thay vì learned thô
  const deckCardIds = deck ? new Set(deck.cards.map((c) => c.id)) : new Set();
  const validLearnedIds = Array.from(new Set(learned)).filter((id) =>
    deckCardIds.has(id),
  );

  // Danh sách index đang hiển thị (đã áp dụng xáo trộn + lọc chưa thuộc)
  const studyIndices = deck
    ? unlearnedOnly
      ? cardOrder.filter((i) => !validLearnedIds.includes(deck.cards[i].id))
      : cardOrder
    : [];
  const safeIndex =
    studyIndices.length > 0 ? currentIndex % studyIndices.length : 0;
  const currentCard =
    studyIndices.length > 0 ? deck.cards[studyIndices[safeIndex]] : null;
  const isCurrentLearned = currentCard
    ? validLearnedIds.includes(currentCard.id)
    : false;
  const progressPercent =
    deck && deck.cards.length > 0
      ? Math.min(
          100,
          Math.round((validLearnedIds.length / deck.cards.length) * 100),
        )
      : 0;
  // Đã học xong 100% bộ này -> dừng lại, hiện màn hình hoàn thành thay vì
  // lặp vòng vô hạn qua các thẻ
  const isDeckComplete =
    !!deck &&
    deck.cards.length > 0 &&
    validLearnedIds.length === deck.cards.length;

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
    setUnlearnedOnly(false);
    setReviewingCompleted(false);

    const targetDeck = allDecks.find((d) => d.id === deckId);
    setCardOrder(targetDeck ? targetDeck.cards.map((_, i) => i) : []);

    try {
      const progress = await getProgress(
        currentUser.uid,
        `flashcard_${deckId}`,
      );
      setLearned(Array.from(new Set(progress.learned)));
    } catch (err) {
      setLearned([]);
    }
  };

  const handleNext = () => {
    if (studyIndices.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % studyIndices.length);
  };

  const handlePrev = () => {
    if (studyIndices.length === 0) return;
    setCurrentIndex(
      (prev) => (prev - 1 + studyIndices.length) % studyIndices.length,
    );
  };

  const markLearned = async () => {
    if (!currentCard) return;

    // Thẻ này đã thuộc rồi -> chỉ chuyển tiếp, KHÔNG ghi trùng vào learned
    if (isCurrentLearned) {
      if (!unlearnedOnly) handleNext();
      return;
    }

    await markAsLearned(
      currentUser.uid,
      progressType,
      currentCard.id,
      deck.cards.length,
    );
    setLearned((prev) => [...prev, currentCard.id]);
    // Nếu đang lọc "chỉ chưa thuộc", danh sách tự rút ngắn nên không cần next
    if (!unlearnedOnly) handleNext();
  };

  const markNotLearned = async () => {
    if (!currentCard) return;
    if (isCurrentLearned) {
      await markAsNotLearned(currentUser.uid, progressType, currentCard.id);
      setLearned((prev) => prev.filter((id) => id !== currentCard.id));
    }
    handleNext();
  };

  const handleShuffle = () => {
    setCardOrder((prev) => shuffleArray(prev));
    setCurrentIndex(0);
  };

  const toggleUnlearnedOnly = () => {
    setUnlearnedOnly((prev) => !prev);
    setCurrentIndex(0);
  };

  const handleResetProgress = async () => {
    if (!deck || validLearnedIds.length === 0) return;
    if (!confirm(`Xóa toàn bộ tiến độ đã học của bộ "${deck.title}"?`)) return;

    setResetting(true);
    try {
      await Promise.all(
        validLearnedIds.map((id) =>
          markAsNotLearned(currentUser.uid, progressType, id),
        ),
      );
      setLearned([]);
      setCurrentIndex(0);
      setReviewingCompleted(false);
    } finally {
      setResetting(false);
    }
  };

  // Phím tắt: ← → chuyển thẻ, 1 = chưa thuộc, 2 = đã thuộc
  useEffect(() => {
    if (!selectedDeckId) return;
    if (isDeckComplete && !reviewingCompleted) return; // đang ở màn hoàn thành

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "1") markNotLearned();
      else if (e.key === "2") markLearned();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

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
        <SeigaihaBackground />

        <div className="mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#b23a2e] rounded-full" />
          <span className="inline-block bg-[#b23a2e] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide">
            フラッシュカード ・ Flashcard
          </span>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg font-bold border-2 transition-colors ${
                selectedLevel === level
                  ? "bg-[#b23a2e] border-[#b23a2e] text-white"
                  : "bg-[#fdf6e3] border-[#8b1e3f]/30 text-stone-800 hover:bg-[#f5ead0]"
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
                className="relative bg-[#fdf6e3] border-2 border-[#8b1e3f]/20 rounded-xl p-5 text-left hover:bg-[#f5ead0] transition-colors overflow-hidden"
              >
                <span className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b23a2e] to-[#d9843f]" />
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
  return (
    <Layout>
      <SeigaihaBackground />

      <button
        onClick={() => setSelectedDeckId(null)}
        className="text-sm font-bold text-stone-600 mb-4 hover:underline"
      >
        ← Chọn bộ khác
      </button>

      <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Huy hiệu cấp độ kiểu con dấu hanko */}
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#b23a2e] text-white text-xs font-bold border-2 border-[#8b1e3f]">
            {deck.jlptLevel}
          </span>
          <span className="text-sm text-stone-500">
            {deck.cards.length} từ vựng
          </span>
        </div>
        <span className="text-sm font-bold text-stone-700">
          Đã thuộc: {validLearnedIds.length}/{deck.cards.length} (
          {progressPercent}%)
        </span>
      </div>

      <div className="w-full h-2 bg-stone-200 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#b23a2e] to-[#d9843f] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Thanh công cụ: xáo trộn, chỉ ôn từ chưa thuộc, reset tiến độ */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={handleShuffle}
          className="px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-[#8b1e3f]/30 bg-[#fdf6e3] text-stone-700 hover:bg-[#f5ead0]"
        >
          🔀 Xáo trộn
        </button>
        <button
          onClick={toggleUnlearnedOnly}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-colors ${
            unlearnedOnly
              ? "bg-[#b23a2e] border-[#b23a2e] text-white"
              : "border-[#8b1e3f]/30 bg-[#fdf6e3] text-stone-700 hover:bg-[#f5ead0]"
          }`}
        >
          👁 Chỉ ôn từ chưa thuộc
        </button>
        <button
          onClick={handleResetProgress}
          disabled={resetting || validLearnedIds.length === 0}
          className="px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-stone-300 bg-white text-stone-500 hover:bg-stone-100 disabled:opacity-40"
        >
          {resetting ? "Đang xóa..." : "↺ Reset tiến độ"}
        </button>
        <button
          onClick={() => setShowGame(true)}
          className="bg-[#f5e6a8] border-2 border-black px-4 py-2 rounded-lg font-bold hover:bg-[#f0dd8a]"
        >
          🎮 Ôn tập (Trò chơi ghép thẻ)
        </button>
      </div>

      <h1 className="text-2xl font-bold text-stone-800 mb-1 font-serif">
        {deck.title}
      </h1>

      {isDeckComplete && !reviewingCompleted ? (
        <div className="bg-[#fdf6e3] border-2 border-[#8b1e3f]/20 rounded-xl p-10 text-center mt-4">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-bold text-stone-800 mb-1">
            Chúc mừng! Bạn đã thuộc hết {deck.cards.length} từ trong bộ "
            {deck.title}".
          </p>
          <p className="text-sm text-stone-500 mb-5">
            Bạn muốn ôn tập lại hay học bộ khác?
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => {
                setReviewingCompleted(true);
                setCurrentIndex(0);
              }}
              className="px-4 py-2 rounded-lg bg-[#b23a2e] text-white font-bold hover:bg-[#992f25]"
            >
              🔄 Ôn tập lại
            </button>
            <button
              onClick={handleResetProgress}
              disabled={resetting}
              className="px-4 py-2 rounded-lg border-2 border-[#8b1e3f]/30 bg-white text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-50"
            >
              {resetting ? "Đang xóa..." : "↺ Reset tiến độ, học lại từ đầu"}
            </button>
            <button
              onClick={() => setSelectedDeckId(null)}
              className="px-4 py-2 rounded-lg border-2 border-[#8b1e3f]/30 bg-white text-stone-700 font-bold hover:bg-stone-100"
            >
              ← Chọn bộ khác
            </button>
          </div>
        </div>
      ) : !currentCard ? (
        <div className="bg-[#fdf6e3] border-2 border-[#8b1e3f]/20 rounded-xl p-10 text-center mt-4">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-bold text-stone-800 mb-1">
            Bạn đã thuộc hết các từ đang hiển thị!
          </p>
          <button
            onClick={() => setUnlearnedOnly(false)}
            className="mt-2 text-sm font-bold text-[#b23a2e] hover:underline"
          >
            Xem lại toàn bộ bộ từ
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-500 mb-4">
            {safeIndex + 1} / {studyIndices.length}
            {isCurrentLearned && (
              <span className="ml-2 text-green-700 font-bold">✓ Đã thuộc</span>
            )}
          </p>

          <div className="flex flex-col items-center gap-4">
            <FlashCard key={currentCard.id} card={currentCard} />

            <div className="flex gap-3 w-full max-w-2xl">
              <button
                onClick={handlePrev}
                className="px-4 py-2 rounded-lg border-2 border-[#8b1e3f]/30 bg-[#fdf6e3] text-stone-800 font-medium hover:bg-[#f5ead0]"
              >
                ← Trước
              </button>
              <button
                onClick={markNotLearned}
                className="flex-1 px-4 py-2 rounded-lg bg-[#b23a2e] text-white font-bold hover:bg-[#992f25]"
              >
                ✕ Chưa thuộc
              </button>
              <button
                onClick={markLearned}
                className="flex-1 px-4 py-2 rounded-lg bg-[#4a7c59] text-white font-bold hover:bg-[#3e6949]"
              >
                ✓ Đã thuộc
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-lg border-2 border-[#8b1e3f]/30 bg-[#fdf6e3] text-stone-800 font-medium hover:bg-[#f5ead0]"
              >
                Sau →
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Phím tắt: ← → di chuyển thẻ · 1 chưa thuộc · 2 đã thuộc
            </p>
          </div>
        </>
      )}

      {showGame && (
        <FlashcardGame
          deck={deck}
          learnedIds={learned}
          onMarkLearned={(cardId) => {
            // Gọi đúng hàm đánh dấu đã thuộc hiện có trong file của bạn, ví dụ:
            markAsLearned(
              currentUser.uid,
              progressType,
              cardId,
              deck.cards.length,
            );
            setLearned((prev) => [...prev, cardId]);
          }}
          onClose={() => setShowGame(false)}
        />
      )}
    </Layout>
  );
}

export default Flashcard;
