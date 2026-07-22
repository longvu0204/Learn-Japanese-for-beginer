import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getAllSpeaking } from "../firebase/firestore";

const LEVELS = ["JPD133", "N5", "N4", "N3", "N2", "N1"];

function Speaking() {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [currentItem, setCurrentItem] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState(null); // null | { matched, missing, percent }
  const [sessionScore, setSessionScore] = useState({ total: 0, sumPercent: 0 });

  const itemsInLevel = allItems.filter((i) => i.jlptLevel === selectedLevel);

  useEffect(() => {
    getAllSpeaking()
      .then((data) => {
        setAllItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const pickRandomItem = () => {
    if (itemsInLevel.length === 0) {
      setCurrentItem(null);
      return;
    }
    let next;
    do {
      const randomIndex = Math.floor(Math.random() * itemsInLevel.length);
      next = itemsInLevel[randomIndex];
    } while (
      itemsInLevel.length > 1 &&
      currentItem &&
      next.id === currentItem.id
    );
    setCurrentItem(next);
  };

  const startPractice = () => {
    setSessionScore({ total: 0, sumPercent: 0 });
    pickRandomItem();
    setUserAnswer("");
    setResult(null);
  };

  const playQuestion = () => {
    if (!currentItem) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentItem.audioText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Chấm điểm: kiểm tra câu trả lời có chứa bao nhiêu % từ khóa bắt buộc
  const gradeAnswer = () => {
    if (!userAnswer.trim()) return;

    const matched = [];
    const missing = [];

    currentItem.keywords.forEach((keyword) => {
      if (userAnswer.includes(keyword)) {
        matched.push(keyword);
      } else {
        missing.push(keyword);
      }
    });

    const percent = Math.round(
      (matched.length / currentItem.keywords.length) * 100,
    );

    setResult({ matched, missing, percent });
    setSessionScore((prev) => ({
      total: prev.total + 1,
      sumPercent: prev.sumPercent + percent,
    }));
  };

  const nextQuestion = () => {
    pickRandomItem();
    setUserAnswer("");
    setResult(null);
    window.speechSynthesis.cancel();
  };

  const getFeedbackLabel = (percent) => {
    if (percent === 100) return { text: "Xuất sắc!", color: "text-green-700" };
    if (percent >= 50)
      return { text: "Khá tốt, còn thiếu vài ý", color: "text-amber-700" };
    return { text: "Cần cải thiện thêm", color: "text-red-700" };
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
          Phòng Speaking
        </span>
      </div>

      <div className="flex gap-2 mb-6">
        {LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => {
              setSelectedLevel(level);
              setCurrentItem(null);
              setResult(null);
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

      {itemsInLevel.length === 0 ? (
        <p className="text-stone-600">
          Chưa có câu hỏi Speaking nào cho cấp độ {selectedLevel}.
        </p>
      ) : !currentItem ? (
        <div className="max-w-lg mx-auto bg-[#f5e6a8] border-2 border-black rounded-xl p-8 text-center">
          <p className="text-stone-700 mb-4">
            Cấp độ {selectedLevel} có {itemsInLevel.length} câu hỏi Speaking.
          </p>
          <button
            onClick={startPractice}
            className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-stone-800"
          >
            ▶ Bắt đầu luyện nói
          </button>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-stone-700">
              Trung bình:{" "}
              {sessionScore.total > 0
                ? Math.round(sessionScore.sumPercent / sessionScore.total)
                : 0}
              % ({sessionScore.total} câu)
            </span>
          </div>

          <div className="bg-[#f5e6a8] border-2 border-black rounded-xl p-8 mb-4 text-center">
            <button
              onClick={playQuestion}
              className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-3 hover:bg-stone-800"
            >
              🔊
            </button>
            <p className="text-stone-600 text-sm">
              Bấm để nghe câu hỏi, sau đó trả lời bên dưới
            </p>
            {currentItem.hint && (
              <p className="text-stone-500 text-xs mt-2 italic">
                💡 {currentItem.hint}
              </p>
            )}

            {/* Nút đổi sang câu ngẫu nhiên khác, dùng được cả khi chưa trả lời */}
            {!result && (
              <button
                onClick={nextQuestion}
                className="mt-4 text-sm text-stone-600 underline hover:text-stone-800"
              >
                🎲 Câu khác
              </button>
            )}
          </div>

          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Nhập câu trả lời bằng tiếng Nhật..."
            disabled={result !== null}
            className="w-full p-3 rounded-lg border-2 border-black h-24 mb-4 bg-white disabled:bg-stone-100"
          />

          {!result ? (
            <button
              onClick={gradeAnswer}
              disabled={!userAnswer.trim()}
              className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800 disabled:opacity-40"
            >
              Chấm điểm
            </button>
          ) : (
            <div className="bg-white border-2 border-black rounded-xl p-5">
              <p
                className={`font-bold text-lg mb-3 ${getFeedbackLabel(result.percent).color}`}
              >
                {getFeedbackLabel(result.percent).text} ({result.percent}%)
              </p>

              {result.matched.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-stone-500 mb-1">Từ khóa đã có:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.matched.map((k) => (
                      <span
                        key={k}
                        className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full border border-green-600"
                      >
                        ✓ {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.missing.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-stone-500 mb-1">Còn thiếu:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.missing.map((k) => (
                      <span
                        key={k}
                        className="bg-red-100 text-red-700 text-sm px-2 py-1 rounded-full border border-red-500"
                      >
                        ✕ {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-stone-100 rounded-lg p-3 mb-4">
                <p className="text-xs text-stone-500 mb-1">Câu trả lời mẫu</p>
                <p className="font-medium text-stone-900">
                  {currentItem.sampleAnswer}
                </p>
              </div>

              <button
                onClick={nextQuestion}
                className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800"
              >
                Câu tiếp theo →
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

export default Speaking;
