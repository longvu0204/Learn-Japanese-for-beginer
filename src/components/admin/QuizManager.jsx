import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  addQuiz,
  updateQuiz,
  deleteQuiz,
  getAllQuizzes,
} from "../../firebase/firestore";
import { useLevels } from "../../hooks/useLevels";
import AddLevelButton from "../../components/AddLevelButton";

const EMPTY_QUESTION = () => ({
  id: `q${Date.now()}`,
  question: "",
  options: ["", "", "", ""],
  correctAnswerIndexes: [], // mảng vị trí (index) các đáp án đúng - hỗ trợ chọn nhiều
});

// Số đáp án tối thiểu cho 1 câu hỏi - không giới hạn số tối đa,
// admin có thể bấm "+ Thêm đáp án" thêm bao nhiêu tùy ý (3, 5, 6, ...)
const MIN_OPTIONS = 2;

// Với dữ liệu quiz cũ chỉ có field "correctAnswer" (1 chuỗi text), tự động
// chuyển sang correctAnswerIndexes để tương thích ngược khi mở sửa lại
function migrateQuestion(q) {
  if (q.correctAnswerIndexes) return q;
  const idx = (q.options || []).findIndex((opt) => opt === q.correctAnswer);
  return {
    ...q,
    correctAnswerIndexes: idx >= 0 ? [idx] : [],
  };
}

function QuizManager() {
  // editingQuizId = null nghĩa là đang tạo quiz MỚI
  // editingQuizId có giá trị nghĩa là đang SỬA quiz đã tồn tại
  const [editingQuizId, setEditingQuizId] = useState(null);

  // Danh sách cấp độ dùng chung, có thể thêm/xóa ngay tại đây
  const { levels, customLevels, addLevel, deleteLevel } = useLevels();

  const [title, setTitle] = useState("");
  const [searchQuestion, setSearchQuestion] = useState("");
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

  // Danh sách quiz đã tạo, để Admin xem lại / chọn sửa
  const [quizList, setQuizList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadQuizList = () => {
    setLoadingList(true);
    getAllQuizzes()
      .then((data) => {
        setQuizList(data);
        setLoadingList(false);
      })
      .catch(() => setLoadingList(false));
  };

  useEffect(() => {
    loadQuizList();
  }, []);

  const resetForm = () => {
    setEditingQuizId(null);
    setTitle("");
    setJlptLevel("N5");
    setTimeLimit(60);
    setQuestions([EMPTY_QUESTION()]);
    setIsRandomPool(false);
    setQuestionsPerAttempt(60);
    setMessage("");
    setImportError("");
  };

  // Bấm vào 1 quiz trong danh sách để load lại toàn bộ đề lên form và sửa
  const handleSelectQuizToEdit = (q) => {
    setEditingQuizId(q.id);
    setTitle(q.title || "");
    setJlptLevel(q.jlptLevel || "N5");
    setTimeLimit(q.timeLimit || 60);
    setQuestions(
      q.questions && q.questions.length > 0
        ? q.questions.map(migrateQuestion)
        : [EMPTY_QUESTION()],
    );
    setIsRandomPool(!!q.isRandomPool);
    setQuestionsPerAttempt(q.questionsPerAttempt || 60);
    setMessage("");
    setImportError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Xóa 1 quiz khỏi danh sách - nếu đang sửa đúng quiz đó thì reset form về trạng thái tạo mới
  const handleDeleteQuiz = async (e, quizId, quizTitle) => {
    e.stopPropagation(); // tránh kích hoạt handleSelectQuizToEdit khi bấm nút xóa
    if (!confirm(`Xóa quiz "${quizTitle}"? Hành động này không thể hoàn tác.`))
      return;

    setDeletingId(quizId);
    try {
      await deleteQuiz(quizId);
      if (editingQuizId === quizId) {
        resetForm();
      }
      loadQuizList();
    } catch (err) {
      setMessage("Lỗi khi xóa: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  // Tick/bỏ tick 1 đáp án đúng - cho phép chọn nhiều đáp án cho cùng 1 câu
  const toggleCorrectAnswer = (qIndex, optIndex) => {
    const current = questions[qIndex].correctAnswerIndexes || [];
    const updated = current.includes(optIndex)
      ? current.filter((i) => i !== optIndex)
      : [...current, optIndex];
    updateQuestion(qIndex, "correctAnswerIndexes", updated);
  };

  // Thêm 1 ô đáp án mới cho 1 câu hỏi (không giới hạn số lượng - 3, 5, 6... tùy ý)
  const addOptionField = (qIndex) => {
    const updated = [...questions];
    updated[qIndex] = {
      ...updated[qIndex],
      options: [...updated[qIndex].options, ""],
    };
    setQuestions(updated);
  };

  // Xóa 1 ô đáp án khỏi câu hỏi - đồng thời cập nhật lại correctAnswerIndexes
  // (bỏ index bị xóa, dịch các index phía sau lùi lại 1) để không bị lệch đáp án đúng
  const removeOptionField = (qIndex, optIndex) => {
    const updated = [...questions];
    const q = updated[qIndex];
    if (q.options.length <= MIN_OPTIONS) return;

    const newOptions = q.options.filter((_, i) => i !== optIndex);
    const newCorrectIndexes = (q.correctAnswerIndexes || [])
      .filter((i) => i !== optIndex)
      .map((i) => (i > optIndex ? i - 1 : i));

    updated[qIndex] = {
      ...q,
      options: newOptions,
      correctAnswerIndexes: newCorrectIndexes,
    };
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
    setQuestions([...questions, EMPTY_QUESTION()]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

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

        // Số đáp án linh hoạt: đọc động các cột Option1, Option2, ... Option10,
        // câu nào ít đáp án hơn thì cứ để trống các cột Option thừa trong file
        const MAX_OPTION_COLUMNS = 10;

        rows.forEach((row, index) => {
          const rowNum = index + 2; // +2 vì dòng 1 là tiêu đề, Excel đếm từ dòng 1

          const questionText = String(row["Question"] || "").trim();

          const options = [];
          for (let i = 1; i <= MAX_OPTION_COLUMNS; i++) {
            const val = String(row[`Option${i}`] || "").trim();
            if (val) options.push(val);
          }

          const correctAnswerRaw = String(row["CorrectAnswer"] || "").trim();

          // Kiểm tra dữ liệu hợp lệ trước khi thêm - báo rõ dòng nào lỗi để Admin dễ sửa file
          if (
            !questionText ||
            options.length < MIN_OPTIONS ||
            !correctAnswerRaw
          ) {
            errors.push(
              `Dòng ${rowNum}: thiếu dữ liệu (cần Question, tối thiểu ${MIN_OPTIONS} đáp án, và CorrectAnswer).`,
            );
            return;
          }

          // Cho phép nhiều đáp án đúng, cách nhau bằng dấu ";" (vd: "Đáp án A;Đáp án C")
          const correctTexts = correctAnswerRaw
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean);
          const correctAnswerIndexes = correctTexts
            .map((text) => options.findIndex((opt) => opt === text))
            .filter((idx) => idx !== -1);

          if (
            correctAnswerIndexes.length === 0 ||
            correctAnswerIndexes.length !== correctTexts.length
          ) {
            errors.push(
              `Dòng ${rowNum}: "CorrectAnswer" không khớp với các đáp án đã cho (nhiều đáp án đúng cách nhau bằng dấu ";").`,
            );
            return;
          }

          importedQuestions.push({
            id: `imp${Date.now()}_${importedQuestions.length}`,
            question: questionText,
            options,
            correctAnswerIndexes,
          });
        });

        if (importedQuestions.length === 0) {
          setImportError("Không có dòng nào hợp lệ. " + errors.join(" "));
          return;
        }

        // Đang sửa quiz có sẵn -> nối thêm vào cuối danh sách câu hỏi hiện tại
        // Tạo mới -> thay thế toàn bộ như cũ
        const isAppendMode = !!editingQuizId;
        const finalQuestions = isAppendMode
          ? [...questions, ...importedQuestions]
          : importedQuestions;

        setQuestions(finalQuestions);

        // Gợi ý bật random pool nếu tổng số câu vượt quá số câu random hiện tại
        if (finalQuestions.length > questionsPerAttempt) {
          setIsRandomPool(true);
        }

        const modeText = isAppendMode
          ? `Đã NỐI THÊM ${importedQuestions.length} câu vào ngân hàng hiện có (tổng cộng ${finalQuestions.length} câu).`
          : `Đã nhập thành công ${importedQuestions.length} câu hỏi từ Excel.`;

        if (errors.length > 0) {
          setImportError(
            `${modeText} Bỏ qua ${errors.length} dòng lỗi: ${errors.join(" ")}`,
          );
        } else {
          setImportError("");
          setMessage(`${modeText} Kiểm tra lại rồi bấm "Lưu Quiz".`);
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

    // Mỗi câu hỏi phải có ít nhất 1 đáp án đúng được tick chọn
    const missingAnswerIndex = questions.findIndex(
      (q) => !q.correctAnswerIndexes || q.correctAnswerIndexes.length === 0,
    );
    if (missingAnswerIndex !== -1) {
      setMessage(
        `Lỗi: Câu ${missingAnswerIndex + 1} chưa được tick đáp án đúng nào.`,
      );
      return;
    }

    const quizData = {
      title,
      jlptLevel,
      timeLimit: Number(timeLimit),
      questions, // Toàn bộ ngân hàng câu hỏi
      isRandomPool,
      questionsPerAttempt: isRandomPool ? Number(questionsPerAttempt) : null,
    };

    try {
      if (editingQuizId) {
        // Đang sửa quiz có sẵn -> cập nhật lại đúng quiz đó, không tạo trùng
        await updateQuiz(editingQuizId, quizData);
        setMessage("Đã cập nhật quiz thành công!");
      } else {
        // Tạo quiz mới
        await addQuiz(quizData);
        setMessage("Đã thêm quiz thành công!");
      }
      loadQuizList();
      resetForm();
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  const filteredQuestions = questions.filter((q) =>
    q.question.toLowerCase().includes(searchQuestion.toLowerCase()),
  );

  return (
    <div className="max-w-2xl w-full min-w-0">
      {/* Danh sách quiz đã tạo - bấm vào để xem lại / sửa */}
      <div className="bg-white border-2 border-black rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-stone-800">
            📋 Các quiz đã tạo
          </h2>
          {editingQuizId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-bold text-blue-700 hover:underline"
            >
              + Tạo quiz mới
            </button>
          )}
        </div>

        {loadingList ? (
          <p className="text-sm text-stone-500">Đang tải danh sách...</p>
        ) : quizList.length === 0 ? (
          <p className="text-sm text-stone-500">Chưa có quiz nào.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {quizList.map((q) => (
              <div
                key={q.id}
                onClick={() => handleSelectQuizToEdit(q)}
                className={`relative flex items-center justify-between gap-2 text-left p-2 rounded-lg border-2 cursor-pointer hover:bg-stone-100 ${
                  editingQuizId === q.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-black"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-bold text-stone-900 truncate">
                    {q.title}{" "}
                    <span className="text-xs font-normal text-stone-500">
                      ({q.jlptLevel})
                    </span>
                  </p>
                  <p className="text-xs text-stone-600">
                    {q.isRandomPool && q.questionsPerAttempt
                      ? `${q.questionsPerAttempt}/${q.questions?.length || 0} câu (random)`
                      : `${q.questions?.length || 0} câu`}{" "}
                    · {q.timeLimit}s
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteQuiz(e, q.id, q.title)}
                  disabled={deletingId === q.id}
                  title="Xóa quiz này"
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingId === q.id ? "…" : "✕"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold text-stone-800 mb-4">
        {editingQuizId ? "✏️ Đang sửa quiz" : "Thêm Quiz mới"}
      </h2>

      {/* Khu vực nhập từ Excel - đặt trên cùng để Admin thấy ngay */}
      <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 mb-4">
        <p className="font-bold text-stone-800 mb-1">
          📥 Nhập câu hỏi từ Excel
        </p>
        <p className="text-xs text-stone-600 mb-2">
          Cột bắt buộc: <b>Question</b>, ít nhất 2 cột <b>Option...</b>{" "}
          (Option1, Option2, Option3... tối đa 10, câu nào ít đáp án hơn thì để
          trống cột Option thừa), và <b>CorrectAnswer</b>. Nếu câu có nhiều đáp
          án đúng, ghi cách nhau bằng dấu <b>;</b> trong cột CorrectAnswer (vd:{" "}
          <b>Đáp án A;Đáp án C</b>).
          {editingQuizId
            ? " Đang sửa quiz có sẵn nên import sẽ NỐI THÊM vào ngân hàng câu hỏi hiện có."
            : " Import sẽ THAY THẾ toàn bộ danh sách câu hỏi hiện tại bên dưới."}
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
            <div className="flex items-center gap-2 mt-1">
              <select
                value={jlptLevel}
                onChange={(e) => setJlptLevel(e.target.value)}
                className="flex-1 p-2 rounded border-2 border-black bg-white"
              >
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <AddLevelButton
                customLevels={customLevels}
                onAdd={addLevel}
                onDelete={deleteLevel}
              />
            </div>
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

        <div className="mb-3">
          <input
            type="text"
            placeholder="🔍 Tìm theo nội dung câu hỏi..."
            value={searchQuestion}
            onChange={(e) => setSearchQuestion(e.target.value)}
            className="w-full p-2 rounded-lg border-2 border-black"
          />
        </div>

        <div className="border-2 border-black rounded-xl bg-stone-50 p-3 max-h-[700px] overflow-y-auto">
          <div className="flex flex-col gap-4">
            {filteredQuestions.map((q) => {
              // Lấy index của câu hỏi trong mảng gốc
              const qIndex = questions.findIndex((item) => item.id === q.id);

              return (
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

                  <p className="text-xs text-stone-500 -mb-1">
                    Tick chọn 1 hoặc nhiều đáp án đúng
                  </p>

                  {q.options.map((opt, optIndex) => {
                    const isChecked = (q.correctAnswerIndexes || []).includes(
                      optIndex,
                    );
                    return (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCorrectAnswer(qIndex, optIndex)}
                          title="Đánh dấu đây là đáp án đúng"
                          className="w-5 h-5 flex-shrink-0 accent-green-700"
                        />
                        <input
                          type="text"
                          placeholder={`Đáp án ${optIndex + 1}`}
                          value={opt}
                          onChange={(e) =>
                            updateOption(qIndex, optIndex, e.target.value)
                          }
                          className={`flex-1 p-2 rounded border-2 ${
                            isChecked
                              ? "border-green-700 bg-green-50"
                              : "border-black"
                          }`}
                          required
                        />
                        {q.options.length > MIN_OPTIONS && (
                          <button
                            type="button"
                            onClick={() => removeOptionField(qIndex, optIndex)}
                            title="Xóa đáp án này"
                            className="flex-shrink-0 w-8 h-8 rounded-lg border-2 border-black text-red-700 font-bold hover:bg-red-50"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => addOptionField(qIndex)}
                    className="self-start text-sm font-bold text-blue-700 hover:underline"
                  >
                    + Thêm đáp án
                  </button>
                </div>
              );
            })}
          </div>
        </div>

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
          {editingQuizId ? "Cập nhật Quiz" : "Lưu Quiz"}
        </button>

        {message && (
          <p className="text-green-700 text-center font-medium">{message}</p>
        )}
      </form>
    </div>
  );
}

export default QuizManager;
