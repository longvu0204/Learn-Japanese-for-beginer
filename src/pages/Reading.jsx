import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getAllReading, saveReadingResult } from "../firebase/firestore";
import { parsePassage } from "../utils/furiganaParser";
import { useAuth } from "../context/AuthContext";

const LEVELS = ["JPD133", "N5", "N4", "N3", "N2", "N1"];
const VOCAB_TOTAL_POINTS = 25;
const COMPREHENSION_POINTS_PER_QUESTION = 10;

function Reading() {
  const { currentUser } = useAuth();
  const [allPassages, setAllPassages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [selectedPassage, setSelectedPassage] = useState(null);
  const [showFurigana, setShowFurigana] = useState(true);

  // Trạng thái phần kiểm tra từ vựng
  const [vocabAnswers, setVocabAnswers] = useState({}); // { word: đáp án người dùng gõ }
  const [vocabGraded, setVocabGraded] = useState(false);
  const [vocabScore, setVocabScore] = useState(0);

  // Trạng thái phần câu hỏi đọc hiểu
  const [comprehensionAnswers, setComprehensionAnswers] = useState({}); // { index: text }
  const [comprehensionResults, setComprehensionResults] = useState(null); // [{matched, missing, points}]
  const [comprehensionGraded, setComprehensionGraded] = useState(false);

  const passagesInLevel = allPassages.filter(
    (p) => p.jlptLevel === selectedLevel,
  );

  useEffect(() => {
    getAllReading()
      .then((data) => {
        setAllPassages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startPassage = (passage) => {
    setSelectedPassage(passage);
    setShowFurigana(true);
    setVocabAnswers({});
    setVocabGraded(false);
    setVocabScore(0);
    setComprehensionAnswers({});
    setComprehensionResults(null);
    setComprehensionGraded(false);
  };

  const backToList = () => {
    setSelectedPassage(null);
  };

  const parsed = selectedPassage
    ? parsePassage(selectedPassage.rawPassage)
    : null;
  const quizWords = selectedPassage?.quizWords || [];

  const handleVocabChange = (word, value) => {
    setVocabAnswers((prev) => ({ ...prev, [word]: value }));
  };

  const gradeVocab = () => {
    let correctCount = 0;
    quizWords.forEach((qw) => {
      const userInput = (vocabAnswers[qw.word] || "").trim();
      if (userInput === qw.reading.trim()) correctCount += 1;
    });
    const score = Math.round(
      (correctCount / quizWords.length) * VOCAB_TOTAL_POINTS,
    );
    setVocabScore(score);
    setVocabGraded(true);
  };

  const handleComprehensionChange = (index, value) => {
    setComprehensionAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const gradeComprehension = async () => {
    const results = selectedPassage.comprehensionQuestions.map((q, index) => {
      const userAnswer = (comprehensionAnswers[index] || "").trim();
      const matched = [];
      const missing = [];
      q.keywords.forEach((k) => {
        if (userAnswer.includes(k)) matched.push(k);
        else missing.push(k);
      });
      const points = Math.round(
        (matched.length / q.keywords.length) *
          COMPREHENSION_POINTS_PER_QUESTION,
      );
      return { matched, missing, points, userAnswer };
    });

    setComprehensionResults(results);
    setComprehensionGraded(true);

    const totalComprehension = results.reduce((sum, r) => sum + r.points, 0);
    const totalScore = vocabScore + totalComprehension;

    try {
      await saveReadingResult(
        currentUser.uid,
        selectedPassage.id,
        selectedPassage.jlptLevel,
        vocabScore,
        totalComprehension,
        totalScore,
      );
    } catch (err) {
      console.error("Lỗi lưu kết quả luyện đọc:", err);
    }
  };

  const totalComprehensionScore = comprehensionResults
    ? comprehensionResults.reduce((sum, r) => sum + r.points, 0)
    : 0;
  const grandTotal = vocabScore + totalComprehensionScore;
  const maxTotal =
    VOCAB_TOTAL_POINTS +
    selectedPassage?.comprehensionQuestions.length *
      COMPREHENSION_POINTS_PER_QUESTION;

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
          Luyện đọc
        </span>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => {
              setSelectedLevel(level);
              setSelectedPassage(null);
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-bold border-2 border-black transition-colors ${
              selectedLevel === level
                ? "bg-black text-white"
                : "bg-[#f5e6a8] text-stone-800 hover:bg-[#f0dd8a]"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {!selectedPassage ? (
        passagesInLevel.length === 0 ? (
          <p className="text-stone-600">
            Chưa có bài đọc nào cho cấp độ {selectedLevel}.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {passagesInLevel.map((p) => (
              <button
                key={p.id}
                onClick={() => startPassage(p)}
                className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 text-left hover:bg-[#f0dd8a] transition-colors"
              >
                <p className="font-bold text-stone-900 mb-1">{p.title}</p>
                <p className="text-sm text-stone-600">
                  {p.quizWords.length} từ · {p.comprehensionQuestions.length}{" "}
                  câu hỏi
                </p>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="max-w-2xl mx-auto">
          <button
            onClick={backToList}
            className="text-sm font-bold text-stone-600 underline mb-4 hover:text-stone-800"
          >
            ← Chọn bài khác
          </button>

          <h1 className="text-xl sm:text-2xl font-bold text-stone-800 mb-4">
            {selectedPassage.title}
          </h1>

          {/* Đoạn văn có furigana */}
          <div className="bg-[#f5e6a8] border-2 border-black rounded-xl p-4 sm:p-6 mb-4">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowFurigana((prev) => !prev)}
                className="text-xs px-3 py-1.5 rounded-full border-2 border-black bg-white hover:bg-stone-100 font-medium"
              >
                {showFurigana ? "Ẩn Furigana" : "Hiện Furigana"}
              </button>
            </div>
            <p className="leading-loose text-lg break-words">
              {parsed.segments.map((seg, i) =>
                seg.type === "plain" ? (
                  <span key={i}>{seg.text}</span>
                ) : (
                  <ruby
                    key={i}
                    className={
                      seg.isQuizWord
                        ? "underline decoration-2 decoration-red-500"
                        : ""
                    }
                  >
                    {seg.word}
                    {showFurigana && <rt>{seg.reading}</rt>}
                  </ruby>
                ),
              )}
            </p>
          </div>

          {/* Phần 1: Kiểm tra từ vựng (25 điểm) */}
          <div className="bg-white border-2 border-black rounded-xl p-4 sm:p-5 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-stone-800">
                1. Đọc từ vựng (25 điểm)
              </h2>
              {vocabGraded && (
                <span className="font-bold text-lg text-green-700">
                  {vocabScore}/25
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mb-3">
              Gõ cách đọc (hiragana) của các từ được gạch chân đỏ trong bài.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quizWords.map((qw) => {
                const userInput = vocabAnswers[qw.word] || "";
                const isCorrect =
                  vocabGraded && userInput.trim() === qw.reading.trim();
                return (
                  <div key={qw.word} className="flex items-center gap-2">
                    <span className="font-bold text-lg w-20 flex-shrink-0">
                      {qw.word}
                    </span>
                    <input
                      value={userInput}
                      onChange={(e) =>
                        handleVocabChange(qw.word, e.target.value)
                      }
                      disabled={vocabGraded}
                      placeholder="ひらがな"
                      className={`flex-1 min-w-0 p-2 rounded border-2 text-sm ${
                        vocabGraded
                          ? isCorrect
                            ? "border-green-600 bg-green-50"
                            : "border-red-500 bg-red-50"
                          : "border-black"
                      }`}
                    />
                    {vocabGraded && !isCorrect && (
                      <span className="text-xs text-stone-500 flex-shrink-0">
                        ({qw.reading})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {!vocabGraded && (
              <button
                onClick={gradeVocab}
                className="w-full mt-4 bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800"
              >
                Chấm điểm từ vựng
              </button>
            )}
          </div>

          {/* Phần 2: Câu hỏi đọc hiểu (20 điểm) - chỉ hiện sau khi đã chấm từ vựng */}
          {vocabGraded && (
            <div className="bg-white border-2 border-black rounded-xl p-4 sm:p-5 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-stone-800">
                  2. Trả lời câu hỏi (
                  {selectedPassage.comprehensionQuestions.length *
                    COMPREHENSION_POINTS_PER_QUESTION}{" "}
                  điểm)
                </h2>
                {comprehensionGraded && (
                  <span className="font-bold text-lg text-green-700">
                    {totalComprehensionScore}/
                    {selectedPassage.comprehensionQuestions.length *
                      COMPREHENSION_POINTS_PER_QUESTION}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {selectedPassage.comprehensionQuestions.map((q, index) => {
                  const result = comprehensionResults?.[index];
                  return (
                    <div key={index}>
                      <p className="font-medium text-stone-800 mb-2">
                        Câu {index + 1}: {q.question}
                      </p>
                      <textarea
                        value={comprehensionAnswers[index] || ""}
                        onChange={(e) =>
                          handleComprehensionChange(index, e.target.value)
                        }
                        disabled={comprehensionGraded}
                        placeholder="Nhập câu trả lời..."
                        className="w-full p-2 rounded border-2 border-black h-20 disabled:bg-stone-100"
                      />
                      {result && (
                        <div className="mt-2 bg-stone-50 border border-stone-300 rounded-lg p-2">
                          <p className="text-sm font-bold text-stone-700 mb-1">
                            Điểm: {result.points}/
                            {COMPREHENSION_POINTS_PER_QUESTION}
                          </p>
                          {result.matched.length > 0 && (
                            <p className="text-xs text-green-700">
                              ✓ {result.matched.join(", ")}
                            </p>
                          )}
                          {result.missing.length > 0 && (
                            <p className="text-xs text-red-600">
                              ✕ Thiếu: {result.missing.join(", ")}
                            </p>
                          )}
                          <p className="text-xs text-stone-500 mt-1">
                            Mẫu: {q.sampleAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!comprehensionGraded && (
                <button
                  onClick={gradeComprehension}
                  className="w-full mt-4 bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800"
                >
                  Chấm điểm câu hỏi
                </button>
              )}
            </div>
          )}

          {/* Tổng điểm cuối cùng */}
          {comprehensionGraded && (
            <div className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 text-center">
              <p className="text-sm text-stone-600 mb-1">Tổng điểm</p>
              <p className="text-3xl font-bold text-stone-900 mb-3">
                {grandTotal}/{maxTotal}
              </p>
              <button
                onClick={() => startPassage(selectedPassage)}
                className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800"
              >
                🔄 Làm lại bài này
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

export default Reading;
