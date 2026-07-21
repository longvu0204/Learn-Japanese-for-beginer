import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { getAllListening, saveQuizResult } from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

function Listening() {
  const { currentUser } = useAuth();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [voicesReady, setVoicesReady] = useState(false);
  const utteranceRef = useRef(null);

  const itemsInLevel = allItems.filter((i) => i.jlptLevel === selectedLevel);

  useEffect(() => {
    getAllListening()
      .then((data) => {
        setAllItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Giọng đọc của trình duyệt cần thời gian tải danh sách giọng nói (voices) trước khi dùng được
  useEffect(() => {
    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setVoicesReady(true);
    }
    loadVoices();
    // Một số trình duyệt (Chrome) tải voices bất đồng bộ, cần lắng nghe sự kiện này
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Chọn ngẫu nhiên 1 câu khác với câu hiện tại (tránh lặp lại liên tiếp cùng 1 câu)
  const pickRandomItem = () => {
    if (itemsInLevel.length === 0) {
      setCurrentItem(null);
      return;
    }
    if (itemsInLevel.length === 1) {
      setCurrentItem(itemsInLevel[0]);
      return;
    }
    let next;
    do {
      const randomIndex = Math.floor(Math.random() * itemsInLevel.length);
      next = itemsInLevel[randomIndex];
    } while (currentItem && next.id === currentItem.id);
    setCurrentItem(next);
  };

  const startPractice = () => {
    setScore({ correct: 0, total: 0 });
    pickRandomItem();
    setSelectedAnswer(null);
    setHasPlayed(false);
  };

  const playAudio = () => {
    if (!currentItem) return;
    // Hủy phát âm cũ (nếu có) trước khi phát câu mới, tránh chồng chéo giọng đọc
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentItem.audioText);
    utterance.lang = "ja-JP"; // Ép giọng đọc tiếng Nhật
    utterance.rate = 0.9; // Đọc chậm hơn bình thường 1 chút, dễ nghe hơn cho người mới học

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setHasPlayed(true);
  };

  const handleSelectAnswer = async (option) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);

    const isCorrect = option === currentItem.correctAnswer;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextQuestion = () => {
    pickRandomItem();
    setSelectedAnswer(null);
    setHasPlayed(false);
    window.speechSynthesis.cancel();
  };

  const getOptionStyle = (option) => {
    if (!selectedAnswer)
      return "bg-white border-2 border-black hover:bg-stone-100";
    if (option === currentItem.correctAnswer)
      return "bg-green-700 border-2 border-black text-white";
    if (option === selectedAnswer)
      return "bg-red-600 border-2 border-black text-white";
    return "bg-stone-200 border-2 border-black opacity-50";
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-stone-600">Đang tải dữ liệu...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4">
        <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
          Luyện nghe
        </span>
      </div>

      <div className="flex gap-2 mb-6">
        {LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => {
              setSelectedLevel(level);
              setCurrentItem(null);
              setSelectedAnswer(null);
            }}
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

      {!voicesReady && (
        <p className="text-amber-700 text-sm mb-4">
          Đang chuẩn bị giọng đọc trình duyệt... (nếu lâu, thử tải lại trang)
        </p>
      )}

      {itemsInLevel.length === 0 ? (
        <p className="text-stone-600">
          Chưa có câu luyện nghe nào cho cấp độ {selectedLevel}.
        </p>
      ) : !currentItem ? (
        <div className="max-w-lg mx-auto bg-[#f5e6a8] border-2 border-black rounded-xl p-8 text-center">
          <p className="text-stone-700 mb-4">
            Cấp độ {selectedLevel} có {itemsInLevel.length} câu luyện nghe.
          </p>
          <button
            onClick={startPractice}
            className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-stone-800"
          >
            ▶ Bắt đầu luyện nghe
          </button>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-stone-700">
              Điểm: {score.correct}/{score.total}
            </span>
          </div>

          <div className="bg-[#f5e6a8] border-2 border-black rounded-xl p-8 mb-4 text-center">
            <button
              onClick={playAudio}
              className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-3 hover:bg-stone-800"
            >
              🔊
            </button>
            <p className="text-stone-600 text-sm">Bấm để nghe câu tiếng Nhật</p>
          </div>

          {!hasPlayed ? (
            <p className="text-center text-stone-500 text-sm mb-4">
              Hãy nghe câu trước khi trả lời
            </p>
          ) : (
            <>
              <p className="text-center font-bold text-stone-800 mb-4">
                {currentItem.question}
              </p>

              <div className="flex flex-col gap-3 mb-4">
                {currentItem.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectAnswer(option)}
                    className={`p-3 rounded-lg font-medium text-stone-800 transition-colors ${getOptionStyle(option)}`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {selectedAnswer && (
                <button
                  onClick={nextQuestion}
                  className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800"
                >
                  Câu tiếp theo →
                </button>
              )}
            </>
          )}
        </div>
      )}
    </Layout>
  );
}

export default Listening;
