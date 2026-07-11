import { useState } from "react";
import { addQuiz } from "../../firebase/firestore";

function QuizManager() {
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [questions, setQuestions] = useState([
    { id: "q1", question: "", options: ["", "", "", ""], correctAnswer: "" },
  ]);
  const [message, setMessage] = useState("");

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

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
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-stone-800 mb-4">Thêm Quiz mới</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-stone-600 text-sm">Tên quiz</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded border-2 border-black mt-1"
            required
          />
        </div>

        <div>
          <label className="text-stone-600 text-sm">Thời gian (giây)</label>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            className="w-full p-2 rounded border-2 border-black mt-1"
            required
          />
        </div>

        <h3 className="text-lg text-stone-800 font-bold mt-2">Câu hỏi</h3>

        {questions.map((q, qIndex) => (
          <div
            key={q.id}
            className="bg-[#f5e6a8] border-2 border-black p-4 rounded-lg flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-stone-600 text-sm font-bold">
                Câu {qIndex + 1}
              </span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-700 text-sm font-bold"
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
              className="p-2 rounded border-2 border-black"
              required
            />

            {q.options.map((opt, optIndex) => (
              <input
                key={optIndex}
                type="text"
                placeholder={`Đáp án ${optIndex + 1}`}
                value={opt}
                onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                className="p-2 rounded border-2 border-black"
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
              className="p-2 rounded border-2 border-black"
              required
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestionField}
          className="bg-white border-2 border-black text-stone-800 p-2 rounded-lg font-bold hover:bg-stone-100"
        >
          + Thêm câu hỏi
        </button>

        <button
          type="submit"
          className="bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800 mt-2"
        >
          Lưu Quiz
        </button>

        {message && (
          <p className="text-green-700 text-center font-medium">{message}</p>
        )}
      </form>
    </div>
  );
}

export default QuizManager;
