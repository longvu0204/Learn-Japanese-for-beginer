import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import {
  getAllQuizzes,
  saveQuizResult,
  getQuizHistory,
} from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useLevels } from "../hooks/useLevels";

// Xáo trộn mảng bằng thuật toán Fisher-Yates - đảm bảo random đều, không lệch
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Nếu quiz là ngân hàng câu hỏi (isRandomPool), lấy ngẫu nhiên questionsPerAttempt câu
// Nếu không, dùng nguyên danh sách câu hỏi của quiz
function pickQuestionsForAttempt(targetQuiz) {
  if (
    targetQuiz.isRandomPool &&
    targetQuiz.questionsPerAttempt &&
    targetQuiz.questionsPerAttempt < targetQuiz.questions.length
  ) {
    return shuffleArray(targetQuiz.questions).slice(
      0,
      targetQuiz.questionsPerAttempt,
    );
  }
  return targetQuiz.questions;
}

function Quiz() {
  const { currentUser } = useAuth();
  const { levels } = useLevels();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [history, setHistory] = useState([]);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  // Lưu đáp án đã chọn cho TỪNG câu theo index, cho phép quay lại đổi đáp án tự do
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef(null);
  const [answers, setAnswers] = useState([]);
  const [expandedHistory, setExpandedHistory] = useState(null);

  useEffect(() => {
    getAllQuizzes()
      .then((data) => {
        setQuizzes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const quizzesInLevel = quizzes.filter((q) => q.jlptLevel === selectedLevel);
  const quiz = quizzes.find((q) => q.id === selectedQuizId);
  const currentQuestion = activeQuestions[currentQIndex];
  const currentSelected = selectedAnswers[currentQIndex]; // undefined nếu câu này chưa chọn

  const startQuiz = (quizId) => {
    const target = quizzes.find((q) => q.id === quizId);

    clearInterval(intervalRef.current);

    const pickedQuestions = pickQuestionsForAttempt(target);

    setSelectedQuizId(quizId);
    setActiveQuestions(pickedQuestions);
    setTimeLeft(target.timeLimit);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setScore(0);
    setAnswers([]);
    setIsFinished(false);
    setIsSaving(false);
  };

  useEffect(() => {
    if (isFinished || !quiz) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsFinished(true); // Hết giờ -> tự nộp bài với các câu đã chọn tới lúc đó
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isFinished, quiz]);

  // Chấm điểm + tổng hợp toàn bộ câu trả lời CHỈ khi bài thi kết thúc (nộp bài hoặc hết giờ)
  // Tính trực tiếp từ selectedAnswers tại đúng thời điểm này, tránh việc đọc state cũ (stale closure)
  useEffect(() => {
    if (isFinished && currentUser && quiz) {
      let finalScore = 0;
      const finalAnswers = activeQuestions.map((q, idx) => {
        const sel = selectedAnswers[idx] ?? null;
        const isCorrect = sel === q.correctAnswer;
        if (isCorrect) finalScore += 1;
        return {
          questionIndex: idx,
          question: q.question,
          options: q.options,
          selectedAnswer: sel,
          correctAnswer: q.correctAnswer,
          isCorrect,
        };
      });

      setScore(finalScore);
      setAnswers(finalAnswers);
      setIsSaving(true);

      const timeSpent = quiz.timeLimit - timeLeft;
      saveQuizResult(
        currentUser.uid,
        quiz.id,
        finalScore,
        activeQuestions.length,
        timeSpent,
        finalAnswers,
      )
        .then(async () => {
          const data = await getQuizHistory(currentUser.uid, quiz.id);
          setHistory(data);
          setIsSaving(false);
        })
        .catch(() => setIsSaving(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  // Chỉ đánh dấu đáp án đang chọn - KHÔNG chấm đúng/sai, KHÔNG tự chuyển câu
  const handleSelectOption = (option) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQIndex]: option }));
  };

  const goToPrevQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex((prev) => prev - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQIndex + 1 < activeQuestions.length) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      // Đang ở câu cuối -> nộp bài
      clearInterval(intervalRef.current);
      setIsFinished(true);
    }
  };

  const isLastQuestion = currentQIndex === activeQuestions.length - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  // Chỉ tô đen ô đang được CHỌN, không tiết lộ đúng/sai trong lúc làm bài
  const getOptionStyle = (option) => {
    if (currentSelected === option) {
      return "bg-black border-2 border-black text-white";
    }
    return "bg-white border-2 border-black hover:bg-stone-100";
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-stone-600">Đang tải dữ liệu...</p>
      </Layout>
    );
  }

  // Màn hình chọn quiz - hiện khi chưa chọn quiz nào
  if (!selectedQuizId) {
    return (
      <Layout>
        <h1 className="text-2xl font-bold text-stone-800 mb-4">
          Chọn bài trắc nghiệm
        </h1>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
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

        {quizzesInLevel.length === 0 ? (
          <p className="text-stone-600">
            Chưa có quiz nào cho cấp độ {selectedLevel}.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzesInLevel.map((q) => (
              <button
                key={q.id}
                onClick={() => startQuiz(q.id)}
                className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 text-left hover:bg-[#f0dd8a] transition-colors"
              >
                <p className="font-bold text-stone-900 mb-1">{q.title}</p>
                <p className="text-sm text-stone-600">
                  {q.isRandomPool && q.questionsPerAttempt
                    ? `${q.questionsPerAttempt}/${q.questions.length} câu hỏi (random) · ${q.timeLimit}s`
                    : `${q.questions.length} câu hỏi · ${q.timeLimit}s`}
                </p>
              </button>
            ))}
          </div>
        )}
      </Layout>
    );
  }

  if (isFinished) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto bg-[#f5e6a8] border-2 border-black rounded-xl p-8 flex flex-col items-center gap-3 mt-12">
          <h1 className="text-2xl font-bold text-stone-800">Kết quả</h1>
          <p className="text-3xl font-bold text-stone-900">
            {score} / {activeQuestions.length}
          </p>
          {isSaving ? (
            <p className="text-stone-500 text-sm">Đang lưu kết quả...</p>
          ) : (
            <p className="text-green-700 text-sm font-medium">
              ✓ Đã lưu kết quả!
            </p>
          )}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => startQuiz(quiz.id)}
              className="bg-[#f5e6a8] border-2 border-black px-4 py-2 rounded-lg font-bold hover:bg-[#f0dd8a]"
            >
              🔄 Làm lại bài
            </button>

            <button
              onClick={() => setSelectedQuizId(null)}
              className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-stone-800"
            >
              ← Chọn bài khác
            </button>
          </div>
        </div>

        {/* Xem lại chi tiết đáp án bài vừa làm - vì giờ không hiện lúc làm bài nữa,
            phần này là nơi duy nhất để biết đúng/sai từng câu */}
        {!isSaving && answers.length > 0 && (
          <div className="max-w-lg mx-auto mt-6">
            <h2 className="font-bold text-lg mb-3">Chi tiết bài vừa làm</h2>
            <div className="space-y-3">
              {answers.map((answer, i) => (
                <div
                  key={i}
                  className={`border-2 rounded-lg p-3 bg-white ${
                    answer.isCorrect ? "border-green-600" : "border-red-500"
                  }`}
                >
                  <p className="font-semibold mb-2">Câu {i + 1}</p>
                  <p className="mb-2">{answer.question}</p>
                  <p>
                    <span className="font-medium">Bạn chọn:</span>{" "}
                    <span
                      className={
                        answer.isCorrect
                          ? "text-green-700 font-bold"
                          : "text-red-600 font-bold"
                      }
                    >
                      {answer.selectedAnswer || "(chưa chọn)"}
                    </span>
                  </p>
                  {!answer.isCorrect && (
                    <p>
                      <span className="font-medium">Đáp án đúng:</span>{" "}
                      <span className="text-green-700 font-bold">
                        {answer.correctAnswer}
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full mt-6 border-t pt-5">
          <h2 className="font-bold text-lg mb-3">Lịch sử làm bài</h2>

          {history.length === 0 ? (
            <p className="text-sm text-stone-500">Chưa có lịch sử.</p>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className="border rounded-lg bg-white overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedHistory(
                        expandedHistory === item.id ? null : item.id,
                      )
                    }
                    className="w-full flex justify-between items-center px-4 py-3 hover:bg-stone-50"
                  >
                    <div className="text-left">
                      <p className="font-bold">Lần {history.length - index}</p>
                      <p className="text-xs text-stone-500">
                        {new Date(item.completedAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {item.score}/{item.totalQuestions}
                      </p>
                      <p className="text-xs">{item.timeSpent}s</p>
                    </div>
                  </button>

                  {expandedHistory === item.id && (
                    <div className="border-t bg-stone-50 p-4">
                      {!item.answers || item.answers.length === 0 ? (
                        <p className="text-sm text-stone-500">
                          Lần làm này chưa lưu chi tiết câu trả lời.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {item.answers.map((answer, i) => (
                            <div
                              key={i}
                              className="border rounded-lg p-3 bg-white"
                            >
                              <p className="font-semibold mb-2">Câu {i + 1}</p>
                              <p className="mb-2">{answer.question}</p>
                              <p>
                                <span className="font-medium">Bạn chọn:</span>{" "}
                                <span
                                  className={
                                    answer.isCorrect
                                      ? "text-green-700 font-bold"
                                      : "text-red-600 font-bold"
                                  }
                                >
                                  {answer.selectedAnswer || "(chưa chọn)"}
                                </span>
                              </p>
                              {!answer.isCorrect && (
                                <p>
                                  <span className="font-medium">
                                    Đáp án đúng:
                                  </span>{" "}
                                  <span className="text-green-700 font-bold">
                                    {answer.correctAnswer}
                                  </span>
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            Câu {currentQIndex + 1} / {activeQuestions.length}
          </span>
          <span className="text-xs font-bold text-stone-600">
            Đã trả lời: {answeredCount}/{activeQuestions.length}
          </span>
          <span
            className={`text-sm font-bold px-3 py-1 rounded-full border-2 border-black ${
              timeLeft <= 10
                ? "bg-red-600 text-white"
                : "bg-white text-stone-800"
            }`}
          >
            ⏱ {timeLeft}s
          </span>
        </div>

        <div className="bg-[#f5e6a8] border-2 border-black rounded-xl p-8 mb-4 text-center">
          <h2 className="text-xl font-bold text-stone-900">
            {currentQuestion.question}
          </h2>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelectOption(option)}
              className={`p-3 rounded-lg font-medium transition-colors ${getOptionStyle(option)}`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Điều hướng bằng mũi tên - hoàn toàn tự chọn, không tự động chuyển câu */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={goToPrevQuestion}
            disabled={currentQIndex === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border-2 border-black bg-white font-bold hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Trước
          </button>

          <button
            onClick={goToNextQuestion}
            disabled={currentSelected === undefined}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border-2 border-black bg-black text-white font-bold hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLastQuestion ? "Nộp bài ✓" : "Tiếp →"}
          </button>
        </div>

        {currentSelected === undefined && (
          <p className="text-center text-xs text-stone-500 mt-2">
            Chọn 1 đáp án để tiếp tục
          </p>
        )}
      </div>
    </Layout>
  );
}

export default Quiz;
