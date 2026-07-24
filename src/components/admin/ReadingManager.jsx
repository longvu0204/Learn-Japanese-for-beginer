import { useState, useEffect } from "react";
import {
  addReadingPassage,
  deleteReadingPassage,
  getAllReading,
} from "../../firebase/firestore";
import { parsePassage } from "../../utils/furiganaParser";

const LEVELS = ["JPD133", "N5", "N4", "N3", "N2", "N1"];

function computeNextId(items) {
  let maxNum = 0;
  items.forEach((item) => {
    const match = item.id.match(/^r(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `r${maxNum + 1}`;
}

function ReadingManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    id: "",
    jlptLevel: "N5",
    title: "",
    rawPassage: "",
  });
  // Câu hỏi đọc hiểu - mỗi câu có sampleAnswer + keywords, giống pattern GrammarManager/SpeakingManager
  const [questions, setQuestions] = useState([
    { question: "", sampleAnswer: "", keywordsText: "" },
  ]);
  const [message, setMessage] = useState("");

  const loadItems = async () => {
    const data = await getAllReading();
    setItems(data);
    setLoading(false);
    return data;
  };

  useEffect(() => {
    async function init() {
      const data = await loadItems();
      setForm((prev) => ({ ...prev, id: computeNextId(data) }));
    }
    init();
  }, []);

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addQuestionField = () => {
    setQuestions([
      ...questions,
      { question: "", sampleAnswer: "", keywordsText: "" },
    ]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Xem trước để Admin biết mình gõ cú pháp furigana đúng chưa, trước khi lưu
  const preview = form.rawPassage ? parsePassage(form.rawPassage) : null;

  const resetForm = (newItems) => {
    setForm({
      id: computeNextId(newItems),
      jlptLevel: form.jlptLevel,
      title: "",
      rawPassage: "",
    });
    setQuestions([{ question: "", sampleAnswer: "", keywordsText: "" }]);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { quizWords } = parsePassage(form.rawPassage);

      if (quizWords.length === 0) {
        setMessage(
          "Chưa có từ nào được đánh dấu **word[reading]** để kiểm tra.",
        );
        return;
      }

      const comprehensionQuestions = questions
        .filter((q) => q.question.trim() && q.sampleAnswer.trim())
        .map((q) => ({
          question: q.question,
          sampleAnswer: q.sampleAnswer,
          keywords: q.keywordsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }));

      if (comprehensionQuestions.length === 0) {
        setMessage("Cần ít nhất 1 câu hỏi đọc hiểu.");
        return;
      }

      await addReadingPassage({
        id: form.id,
        jlptLevel: form.jlptLevel,
        title: form.title,
        rawPassage: form.rawPassage,
        quizWords, // Lưu sẵn danh sách đã parse, đỡ phải parse lại mỗi lần người học vào trang
        comprehensionQuestions,
      });

      setMessage(
        isEditing
          ? `Đã cập nhật "${form.id}"`
          : `Đã thêm bài đọc (${form.jlptLevel})`,
      );
      const newItems = await loadItems();
      resetForm(newItems);
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Xóa bài đọc "${id}"?`)) return;
    await deleteReadingPassage(id);
    const newItems = await loadItems();
    if (form.id === id && isEditing) resetForm(newItems);
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setForm({
      id: item.id,
      jlptLevel: item.jlptLevel,
      title: item.title,
      rawPassage: item.rawPassage,
    });
    setQuestions(
      item.comprehensionQuestions.map((q) => ({
        question: q.question,
        sampleAnswer: q.sampleAnswer,
        keywordsText: q.keywords.join(", "),
      })),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm(items);
  };

  return (
    <div className="w-full min-w-0">
      <h2 className="text-xl font-bold text-stone-800 mb-4">
        Quản lý Luyện đọc
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[#f5e6a8] border-2 border-black rounded-xl p-4 sm:p-5 mb-6 max-w-3xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
          <span className="text-sm font-bold text-stone-700">
            {isEditing ? `Đang sửa: ${form.id}` : `ID sẽ tạo: ${form.id}`}
          </span>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-sm text-stone-600 underline text-left"
            >
              Hủy sửa, thêm mới
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <select
            value={form.jlptLevel}
            onChange={(e) => setForm({ ...form, jlptLevel: e.target.value })}
            className="p-2 rounded border-2 border-black bg-white"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <input
            placeholder="Tiêu đề bài đọc (vd: Một ngày của tôi)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="p-2 rounded border-2 border-black"
            required
          />
        </div>

        <label className="text-sm font-bold text-stone-700 block mb-1">
          Đoạn văn (cú pháp: từ[âm đọc] để có Furigana, **từ[âm đọc]** để đưa
          vào phần kiểm tra)
        </label>
        <textarea
          placeholder={
            "わたしは **毎日[まいにち]** **朝[あさ]** **八時[はちじ]**に **起[お]きます**。"
          }
          value={form.rawPassage}
          onChange={(e) => setForm({ ...form, rawPassage: e.target.value })}
          className="w-full p-2 rounded border-2 border-black mb-2 h-32 font-mono text-sm"
          required
        />

        {/* Xem trước - giúp Admin kiểm tra cú pháp đúng chưa trước khi lưu */}
        {preview && (
          <div className="bg-white border-2 border-black rounded-lg p-3 mb-3">
            <p className="text-xs text-stone-500 mb-2">Xem trước:</p>
            <p className="leading-loose mb-2">
              {preview.segments.map((seg, i) =>
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
                    <rt>{seg.reading}</rt>
                  </ruby>
                ),
              )}
            </p>
            <p className="text-xs text-stone-600">
              Từ sẽ kiểm tra ({preview.quizWords.length}):{" "}
              {preview.quizWords
                .map(
                  (w) =>
                    `${w.word}(${w.category === "kanji" ? "Kanji" : "Katakana"})`,
                )
                .join(", ")}
            </p>
          </div>
        )}

        <h3 className="font-bold text-stone-800 mb-2 mt-4">
          Câu hỏi đọc hiểu (mỗi câu 10 điểm)
        </h3>
        {questions.map((q, i) => (
          <div
            key={i}
            className="bg-white border-2 border-black rounded-lg p-3 mb-2"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-stone-600">
                Câu {i + 1}
              </span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  className="text-red-600 text-xs font-bold"
                >
                  Xóa
                </button>
              )}
            </div>
            <input
              placeholder="Câu hỏi (vd: 毎朝、何時に起きますか。)"
              value={q.question}
              onChange={(e) => updateQuestion(i, "question", e.target.value)}
              className="w-full p-2 rounded border-2 border-black mb-2 text-sm"
              required
            />
            <input
              placeholder="Câu trả lời mẫu"
              value={q.sampleAnswer}
              onChange={(e) =>
                updateQuestion(i, "sampleAnswer", e.target.value)
              }
              className="w-full p-2 rounded border-2 border-black mb-2 text-sm"
              required
            />
            <input
              placeholder="Từ khóa bắt buộc, cách nhau bởi dấu phẩy"
              value={q.keywordsText}
              onChange={(e) =>
                updateQuestion(i, "keywordsText", e.target.value)
              }
              className="w-full p-2 rounded border-2 border-black text-sm"
              required
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addQuestionField}
          className="w-full bg-white border-2 border-black text-stone-800 p-2 rounded-lg font-bold hover:bg-stone-100 mb-3"
        >
          + Thêm câu hỏi
        </button>

        <button
          type="submit"
          className="w-full bg-black text-white p-3 rounded-lg font-bold"
        >
          {isEditing ? "Cập nhật" : "Thêm bài đọc"}
        </button>
        {message && (
          <p className="text-green-700 text-sm mt-2 font-medium">{message}</p>
        )}
      </form>

      {loading ? (
        <p className="text-stone-500">Đang tải...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleEdit(item)}
              className="bg-white border-2 border-black rounded-lg p-3 flex justify-between items-start cursor-pointer hover:bg-stone-50"
            >
              <div className="min-w-0">
                <span className="inline-block bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2">
                  {item.jlptLevel}
                </span>
                <p className="font-medium text-stone-900 inline">
                  {item.title}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {item.quizWords?.length || 0} từ kiểm tra ·{" "}
                  {item.comprehensionQuestions?.length || 0} câu hỏi
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                className="w-6 h-6 bg-red-600 text-white rounded-full text-xs font-bold flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReadingManager;
