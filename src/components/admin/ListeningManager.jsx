import { useState, useEffect } from "react";
import {
  addListeningItem,
  deleteListeningItem,
  getAllListening,
} from "../../firebase/firestore";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

function computeNextId(items) {
  let maxNum = 0;
  items.forEach((item) => {
    const match = item.id.match(/^l(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `l${maxNum + 1}`;
}

function ListeningManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [form, setForm] = useState({
    id: "",
    jlptLevel: "N5",
    audioText: "",
    question: "",
    optionsText: "",
    correctAnswer: "",
  });
  const [message, setMessage] = useState("");

  const loadItems = async () => {
    const data = await getAllListening();
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

  const testPlay = () => {
    if (!form.audioText.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(form.audioText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const options = form.optionsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await addListeningItem({
        id: form.id,
        jlptLevel: form.jlptLevel,
        audioText: form.audioText,
        question: form.question,
        options,
        correctAnswer: form.correctAnswer,
      });
      setMessage(`Đã thêm câu luyện nghe (${form.jlptLevel})`);
      const newItems = await loadItems();
      setForm({
        id: computeNextId(newItems),
        jlptLevel: form.jlptLevel,
        audioText: "",
        question: "",
        optionsText: "",
        correctAnswer: "",
      });
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Xóa câu luyện nghe "${id}"?`)) return;
    await deleteListeningItem(id);
    loadItems();
  };

  const displayedItems =
    filterLevel === "ALL"
      ? items
      : items.filter((i) => i.jlptLevel === filterLevel);

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-800 mb-4">
        Quản lý Luyện nghe
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 mb-6 max-w-2xl"
      >
        <p className="text-sm font-bold text-stone-700 mb-3">
          ID sẽ tạo: {form.id}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
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
        </div>

        <div className="flex gap-2 mb-3">
          <input
            placeholder="Câu tiếng Nhật để đọc (vd: 今何時ですか。)"
            value={form.audioText}
            onChange={(e) => setForm({ ...form, audioText: e.target.value })}
            className="flex-1 p-2 rounded border-2 border-black"
            required
          />
          <button
            type="button"
            onClick={testPlay}
            className="px-4 bg-white border-2 border-black rounded-lg font-bold"
          >
            🔊 Nghe thử
          </button>
        </div>

        <input
          placeholder="Câu hỏi (vd: Người nói hỏi về điều gì?)"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          className="w-full p-2 rounded border-2 border-black mb-3"
          required
        />
        <input
          placeholder="Các đáp án, cách nhau bởi dấu phẩy"
          value={form.optionsText}
          onChange={(e) => setForm({ ...form, optionsText: e.target.value })}
          className="w-full p-2 rounded border-2 border-black mb-3"
          required
        />
        <input
          placeholder="Đáp án đúng (khớp chính xác 1 trong các đáp án trên)"
          value={form.correctAnswer}
          onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
          className="w-full p-2 rounded border-2 border-black mb-3"
          required
        />

        <button
          type="submit"
          className="w-full bg-black text-white p-3 rounded-lg font-bold"
        >
          Thêm câu luyện nghe
        </button>
        {message && (
          <p className="text-green-700 text-sm mt-2 font-medium">{message}</p>
        )}
      </form>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm font-bold text-stone-700">
          Lọc theo cấp độ:
        </span>
        <button
          onClick={() => setFilterLevel("ALL")}
          className={`px-3 py-1 rounded-lg text-sm font-bold border-2 border-black ${
            filterLevel === "ALL"
              ? "bg-black text-white"
              : "bg-white text-stone-700"
          }`}
        >
          Tất cả ({items.length})
        </button>
        {LEVELS.map((level) => {
          const count = items.filter((i) => i.jlptLevel === level).length;
          return (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-3 py-1 rounded-lg text-sm font-bold border-2 border-black ${
                filterLevel === level
                  ? "bg-black text-white"
                  : "bg-white text-stone-700"
              }`}
            >
              {level} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-stone-500">Đang tải...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {displayedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border-2 border-black rounded-lg p-3 flex justify-between items-center"
            >
              <div>
                <span className="inline-block bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2">
                  {item.jlptLevel}
                </span>
                <span className="font-medium text-stone-900">
                  {item.audioText}
                </span>
                <p className="text-xs text-stone-500 mt-1">{item.question}</p>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
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

export default ListeningManager;
