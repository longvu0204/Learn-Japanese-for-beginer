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

// Component tái sử dụng để hiển thị chi tiết đúng/sai của 1 bộ câu trả lời
// Dùng chung cho cả "kết quả vừa làm xong" và "xem lại lịch sử cũ"
function AnswerBreakdown({ answers }) {
  if (!answers || answers.length === 0) {
    return (
      <p className="text-sm text-stone-500">Chưa có chi tiết câu trả lời.</p>
    );
  }
  return (
    <div className="space-y-3">
      {answers.map((answer, i) => (
        <div key={i} className="border rounded-lg p-3 bg-white">
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
              {answer.selectedAnswer}
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
  );
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
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef(null);
  const [answers, setAnswers] = useState([]);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [showCurrentBreakdown, setShowCurrentBreakdown] = useState(false);

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

  const startQuiz = (quizId) => {
    const target = quizzes.find((q) => q.id === quizId);

    clearInterval(intervalRef.current);

    const pickedQuestions = pickQuestionsForAttempt(target);

    setSelectedQuizId(quizId);
    setActiveQuestions(pickedQuestions);
    setTimeLeft(target.timeLimit);
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswers([]);
    setIsFinished(false);
    setIsSaving(false);
    setShowCurrentBreakdown(false);
  };

  useEffect(() => {
    if (isFinished || !quiz) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isFinished, quiz]);

  useEffect(() => {
    if (isFinished && currentUser && quiz) {
      setIsSaving(true);
      const timeSpent = quiz.timeLimit - timeLeft;
      saveQuizResult(
        currentUser.uid,
        quiz.id,
        score,
        activeQuestions.length,
        timeSpent,
        answers,
      )
        .then(async () => {
          const data = await getQuizHistory(currentUser.uid, quiz.id);
          setHistory(data);
          setIsSaving(false);
        })
        .catch(() => setIsSaving(false));
    }
  }, [isFinished]);

  const handleSelectAnswer = (option) => {
    if (selectedAnswer) return;

    // Chỉ đánh dấu đã chọn - KHÔNG hiện đúng/sai ngay ở đây nữa
    setSelectedAnswer(option);

    setAnswers((prev) => [
      ...prev,
      {
        questionIndex: currentQIndex,
        question: currentQuestion.question,
        options: currentQuestion.options,
        selectedAnswer: option,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: option === currentQuestion.correctAnswer,
      },
    ]);

    // Vẫn tính điểm ngầm bên trong, chỉ là không hiển thị cho người học thấy ngay
    if (option === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }

    // Giữ khoảng dừng ngắn để người học thấy rõ lựa chọn của mình trước khi chuyển câu,
    // nhưng KHÔNG còn đợi 1s để "khoe" màu xanh/đỏ như trước
    setTimeout(() => {
      if (currentQIndex + 1 < activeQuestions.length) {
        setCurrentQIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        clearInterval(intervalRef.current);
        setIsFinished(true);
      }
    }, 400);
  };

  // Trong lúc làm bài: chỉ tô đậm đáp án ĐÃ CHỌN (không phân biệt đúng/sai),
  // các đáp án còn lại giữ nguyên style bình thường
  const getOptionStyle = (option) => {
    if (selectedAnswer === option) {
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

  if (!selectedQuizId) {
    return (
      <Layout>
        <h1 className="text-2xl font-bold text-stone-800 mb-4">
          Chọn bài trắc nghiệm
        </h1>

        <div className="flex gap-2 mb-6">
          {levels.map((level) => (
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

        {quizzesInLevel.length === 0 ? (
          <p className="text-stone-600">
            Chưa có quiz nào cho cấp độ {selectedLevel}.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
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

          {/* Nút hiện/ẩn đáp án chi tiết - CHỈ xuất hiện ở đây, sau khi đã làm xong toàn bộ */}
          <button
            onClick={() => setShowCurrentBreakdown((prev) => !prev)}
            className="text-sm font-bold text-blue-700 underline"
          >
            {showCurrentBreakdown
              ? "Ẩn đáp án chi tiết"
              : "📋 Xem đáp án chi tiết"}
          </button>

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

        {/* Đáp án chi tiết của LẦN VỪA LÀM XONG - hiện ngay tại đây, không cần vào lịch sử */}
        {showCurrentBreakdown && (
          <div className="w-full max-w-lg mx-auto mt-6 border-t pt-5">
            <h2 className="font-bold text-lg mb-3">
              Đáp án chi tiết (lần vừa làm)
            </h2>
            <AnswerBreakdown answers={answers} />
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
                      <AnswerBreakdown answers={item.answers} />
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

        <div className="flex flex-col gap-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelectAnswer(option)}
              className={`p-3 rounded-lg font-medium transition-colors ${getOptionStyle(option)}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Quiz;
