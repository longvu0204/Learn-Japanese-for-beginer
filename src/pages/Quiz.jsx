import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { getAllQuizzes, saveQuizResult } from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

function Quiz() {
  const { currentUser } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef(null);

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
  const currentQuestion = quiz?.questions[currentQIndex];

  const startQuiz = (quizId) => {
    const target = quizzes.find((q) => q.id === quizId);
    setSelectedQuizId(quizId);
    setTimeLeft(target.timeLimit);
    setCurrentQIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsFinished(false);
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
        quiz.questions.length,
        timeSpent,
      )
        .then(() => setIsSaving(false))
        .catch(() => setIsSaving(false));
    }
  }, [isFinished]);

  const handleSelectAnswer = (option) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    if (option === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
    setTimeout(() => {
      if (currentQIndex + 1 < quiz.questions.length) {
        setCurrentQIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        clearInterval(intervalRef.current);
        setIsFinished(true);
      }
    }, 1000);
  };

  const getOptionStyle = (option) => {
    if (!selectedAnswer)
      return "bg-white border-2 border-black hover:bg-stone-100";
    if (option === currentQuestion.correctAnswer)
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

  // Màn hình chọn quiz - hiện khi chưa chọn quiz nào
  if (!selectedQuizId) {
    return (
      <Layout>
        <h1 className="text-2xl font-bold text-stone-800 mb-4">
          Chọn bài trắc nghiệm
        </h1>

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
                  {q.questions.length} câu hỏi · {q.timeLimit}s
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
            {score} / {quiz.questions.length}
          </p>
          {isSaving ? (
            <p className="text-stone-500 text-sm">Đang lưu kết quả...</p>
          ) : (
            <p className="text-green-700 text-sm font-medium">
              ✓ Đã lưu kết quả!
            </p>
          )}
          <button
            onClick={() => setSelectedQuizId(null)}
            className="mt-4 bg-black text-white px-4 py-2 rounded-lg font-bold"
          >
            ← Chọn bài khác
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            Câu {currentQIndex + 1} / {quiz.questions.length}
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
              className={`p-3 rounded-lg font-medium text-stone-800 transition-colors ${getOptionStyle(option)}`}
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
