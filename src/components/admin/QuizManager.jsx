import { useState } from "react";
import * as XLSX from "xlsx";
import { addQuiz } from "../../firebase/firestore";

const LEVELS = ["CCM301", "N5", "N4", "N3", "N2", "N1"];

function QuizManager() {
  const [title, setTitle] = useState("");
  const [jlptLevel, setJlptLevel] = useState("N5");
  const [timeLimit, setTimeLimit] = useState(60);
  const [questions, setQuestions] = useState([
    { id: "q1", question: "", options: ["", "", "", ""], correctAnswer: "" },
  ]);
  const [message, setMessage] = useState("");
  const [importError, setImportError] = useState("");

  // Cấu hình ngân hàng câu hỏi random
  const [isRandomPool, setIsRandomPool] = useState(false);
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState(60);

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

  // Đọc file Excel, chuyển từng dòng thành 1 câu hỏi, thay thế toàn bộ danh sách câu hỏi hiện tại
  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportError("");
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        // Chuyển sheet thành mảng object, mỗi object tương ứng 1 dòng, key lấy từ dòng tiêu đề
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          setImportError("File Excel không có dữ liệu.");
          return;
        }

        const importedQuestions = [];
        const errors = [];

        rows.forEach((row, index) => {
          const rowNum = index + 2; // +2 vì dòng 1 là tiêu đề, Excel đếm từ dòng 1

          const questionText = String(row["Question"] || "").trim();
          const option1 = String(row["Option1"] || "").trim();
          const option2 = String(row["Option2"] || "").trim();
          const option3 = String(row["Option3"] || "").trim();
          const option4 = String(row["Option4"] || "").trim();
          const correctAnswer = String(row["CorrectAnswer"] || "").trim();

          // Kiểm tra dữ liệu hợp lệ trước khi thêm - báo rõ dòng nào lỗi để Admin dễ sửa file
          if (
            !questionText ||
            !option1 ||
            !option2 ||
            !option3 ||
            !option4 ||
            !correctAnswer
          ) {
            errors.push(`Dòng ${rowNum}: thiếu dữ liệu (cần đủ 6 cột).`);
            return;
          }

          const options = [option1, option2, option3, option4];
          if (!options.includes(correctAnswer)) {
            errors.push(
              `Dòng ${rowNum}: "CorrectAnswer" không khớp với 4 đáp án đã cho.`,
            );
            return;
          }

          importedQuestions.push({
            id: `q${importedQuestions.length + 1}`,
            question: questionText,
            options,
            correctAnswer,
          });
        });

        if (importedQuestions.length === 0) {
          setImportError("Không có dòng nào hợp lệ. " + errors.join(" "));
          return;
        }

        setQuestions(importedQuestions);

        // Nếu import từ 60 câu trở lên, gợi ý bật random pool để Admin không quên
        if (importedQuestions.length > questionsPerAttempt) {
          setIsRandomPool(true);
        }

        if (errors.length > 0) {
          setImportError(
            `Đã nhập ${importedQuestions.length} câu hợp lệ, bỏ qua ${errors.length} dòng lỗi: ${errors.join(" ")}`,
          );
        } else {
          setImportError("");
          setMessage(
            `Đã nhập thành công ${importedQuestions.length} câu hỏi từ Excel. Kiểm tra lại rồi bấm "Lưu Quiz".`,
          );
        }
      } catch (err) {
        console.error("Lỗi đọc file Excel:", err);
        setImportError(
          "Không đọc được file. Đảm bảo đúng định dạng .xlsx và đúng tên cột.",
        );
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = ""; // Reset input để chọn lại cùng 1 file vẫn kích hoạt onChange
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Không cho lưu nếu bật random pool nhưng số câu random > tổng số câu hiện có
    if (isRandomPool && Number(questionsPerAttempt) > questions.length) {
      setMessage(
        `Lỗi: số câu random mỗi lần thi (${questionsPerAttempt}) lớn hơn tổng số câu hiện có (${questions.length}).`,
      );
      return;
    }

    try {
      await addQuiz({
        title,
        jlptLevel,
        timeLimit: Number(timeLimit),
        questions, // Lưu toàn bộ ngân hàng câu hỏi (vd. 197 câu)
        isRandomPool,
        questionsPerAttempt: isRandomPool ? Number(questionsPerAttempt) : null,
      });
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
      setIsRandomPool(false);
      setQuestionsPerAttempt(60);
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  return (
    <div className="max-w-2xl w-full min-w-0">
      <h2 className="text-xl font-bold text-stone-800 mb-4">Thêm Quiz mới</h2>

      {/* Khu vực nhập từ Excel - đặt trên cùng để Admin thấy ngay */}
      <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 mb-4">
        <p className="font-bold text-stone-800 mb-1">
          📥 Nhập câu hỏi từ Excel
        </p>
        <p className="text-xs text-stone-600 mb-2">
          File cần đúng 6 cột theo thứ tự:{" "}
          <b>Question, Option1, Option2, Option3, Option4, CorrectAnswer</b>.
          Import sẽ THAY THẾ toàn bộ danh sách câu hỏi hiện tại bên dưới.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleExcelImport}
          className="w-full p-2 rounded border-2 border-black bg-white text-sm"
        />
        {importError && (
          <p className="text-red-600 text-xs mt-2">{importError}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <label className="text-stone-600 text-sm">Cấp độ</label>
            <select
              value={jlptLevel}
              onChange={(e) => setJlptLevel(e.target.value)}
              className="w-full p-2 rounded border-2 border-black mt-1 bg-white"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
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

        {/* Cấu hình ngân hàng câu hỏi random - mỗi lần làm chọn ngẫu nhiên N câu trong tổng số câu */}
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4">
          <label className="flex items-center gap-2 font-bold text-stone-800">
            <input
              type="checkbox"
              checked={isRandomPool}
              onChange={(e) => setIsRandomPool(e.target.checked)}
            />
            Đây là ngân hàng câu hỏi (random mỗi lần làm)
          </label>

          {isRandomPool && (
            <div className="mt-2">
              <label className="text-stone-600 text-sm">
                Số câu random mỗi lần thi
              </label>
              <input
                type="number"
                value={questionsPerAttempt}
                onChange={(e) => setQuestionsPerAttempt(Number(e.target.value))}
                className="w-full p-2 rounded border-2 border-black mt-1"
                min={1}
                max={questions.length || 1}
              />
              <p className="text-xs text-stone-500 mt-1">
                Ngân hàng hiện có {questions.length} câu. Mỗi lần học viên làm
                bài sẽ được random {questionsPerAttempt} câu trong số đó.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <h3 className="text-lg text-stone-800 font-bold">
            Câu hỏi ({questions.length})
          </h3>
        </div>

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
