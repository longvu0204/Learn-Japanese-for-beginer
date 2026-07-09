import { useState } from "react";
import Navbar from "../components/Navbar";
import { addQuiz } from "../firebase/firestore";

function AdminDashboard() {
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [questions, setQuestions] = useState([
    { id: "q1", question: "", options: ["", "", "", ""], correctAnswer: "" },
  ]);
  const [message, setMessage] = useState("");

  // Cập nhật 1 field của 1 câu hỏi cụ thể trong mảng questions
  const updateQuestion = (index, field, value) => {
    const updated = [...questions]; // Copy mảng cũ (tránh mutate trực tiếp state)
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  // Cập nhật 1 option cụ thể trong 1 câu hỏi
  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...questions];
    const newOptions = [...updated[qIndex].options];
    newOptions[optIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options: newOptions };
    setQuestions(updated);
  };

  const addQuestionField = () => {
    setQuestions([
      ...questions,
      {
        id: `q${questions.length + 1}`,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
      },
    ]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addQuiz({ title, timeLimit: Number(timeLimit), questions });
      setMessage("Đã thêm quiz thành công!");
      // Reset form
      setTitle("");
      setTimeLimit(60);
      setQuestions([
        {
          id: "q1",
          question: "",
          options: ["", "", "", ""],
          correctAnswer: "",
        },
      ]);
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          Admin - Thêm Quiz mới
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-slate-300 text-sm">Tên quiz</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 rounded bg-slate-800 text-white mt-1"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 text-sm">Thời gian (giây)</label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="w-full p-2 rounded bg-slate-800 text-white mt-1"
              required
            />
          </div>

          <h2 className="text-xl text-white font-bold mt-4">Câu hỏi</h2>

          {questions.map((q, qIndex) => (
            <div
              key={q.id}
              className="bg-slate-800 p-4 rounded-lg flex flex-col gap-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Câu {qIndex + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-400 text-sm"
                  >
                    Xóa câu này
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Nội dung câu hỏi"
                value={q.question}
                onChange={(e) =>
                  updateQuestion(qIndex, "question", e.target.value)
                }
                className="p-2 rounded bg-slate-700 text-white"
                required
              />

              {q.options.map((opt, optIndex) => (
                <input
                  key={optIndex}
                  type="text"
                  placeholder={`Đáp án ${optIndex + 1}`}
                  value={opt}
                  onChange={(e) =>
                    updateOption(qIndex, optIndex, e.target.value)
                  }
                  className="p-2 rounded bg-slate-700 text-white"
                  required
                />
              ))}

              <input
                type="text"
                placeholder="Đáp án đúng (phải khớp chính xác 1 trong các đáp án trên)"
                value={q.correctAnswer}
                onChange={(e) =>
                  updateQuestion(qIndex, "correctAnswer", e.target.value)
                }
                className="p-2 rounded bg-slate-700 text-white"
                required
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestionField}
            className="bg-slate-700 text-white p-2 rounded hover:bg-slate-600"
          >
            + Thêm câu hỏi
          </button>

          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 mt-4"
          >
            Lưu Quiz
          </button>

          {message && <p className="text-green-400 text-center">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default AdminDashboard;
