import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { getAllQuizzes, saveQuizResult } from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";

function Quiz() {
  const { currentUser } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef(null);

  // Effect 1: tải danh sách quiz khi component mount
  useEffect(() => {
    getAllQuizzes()
      .then((data) => {
        setQuizzes(data);
        if (data.length > 0) {
          setTimeLeft(data[0].timeLimit); // Set thời gian sau khi biết quiz là gì
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải quiz:", err);
        setLoading(false);
      });
  }, []);

  const quiz = quizzes[0];
  const currentQuestion = quiz?.questions[currentQIndex];

  // Effect 2: timer - chỉ chạy khi đã có quiz (tránh chạy khi chưa load xong)
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

  // Effect 3: lưu kết quả khi hoàn thành
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
        .catch((err) => {
          console.error("Lỗi lưu kết quả:", err);
          setIsSaving(false);
        });
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
    if (!selectedAnswer) return "bg-slate-800 hover:bg-slate-700";
    if (option === currentQuestion.correctAnswer) return "bg-green-600";
    if (option === selectedAnswer) return "bg-red-600";
    return "bg-slate-800 opacity-50";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <p className="text-white p-8">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <p className="text-white p-8">Chưa có quiz nào.</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <h1 className="text-3xl font-bold text-white">Kết quả</h1>
          <p className="text-xl text-slate-300">
            Điểm: {score} / {quiz.questions.length}
          </p>
          {isSaving ? (
            <p className="text-slate-500 text-sm">Đang lưu kết quả...</p>
          ) : (
            <p className="text-green-400 text-sm">Đã lưu kết quả!</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="w-full max-w-md flex justify-between text-white">
          <span>
            Câu {currentQIndex + 1} / {quiz.questions.length}
          </span>
          <span className={timeLeft <= 10 ? "text-red-500 font-bold" : ""}>
            ⏱ {timeLeft}s
          </span>
        </div>
        <h2 className="text-2xl text-white font-bold">
          {currentQuestion.question}
        </h2>
        <div className="w-full max-w-md flex flex-col gap-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelectAnswer(option)}
              className={`p-3 rounded-lg text-white transition-colors ${getOptionStyle(option)}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Quiz;
