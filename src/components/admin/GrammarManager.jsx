import { useState, useEffect } from "react";
import {
  addGrammarPoint,
  deleteGrammarPoint,
  getAllGrammar,
} from "../../firebase/firestore";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

function GrammarManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [form, setForm] = useState({
    id: "",
    title: "",
    jlptLevel: "N5",
    meaning: "",
    structure: "",
    explanation: "",
  });
  const [examples, setExamples] = useState([{ jp: "", reading: "", vi: "" }]);
  const [message, setMessage] = useState("");

  const loadItems = async () => {
    const data = await getAllGrammar();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const updateExample = (index, field, value) => {
    const updated = [...examples];
    updated[index] = { ...updated[index], [field]: value };
    setExamples(updated);
  };

  const addExampleField = () => {
    setExamples([...examples, { jp: "", reading: "", vi: "" }]);
  };

  const removeExample = (index) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addGrammarPoint({ ...form, examples });
      setMessage(`Đã thêm/cập nhật "${form.title}"`);
      setForm({
        id: "",
        title: "",
        jlptLevel: form.jlptLevel,
        meaning: "",
        structure: "",
        explanation: "",
      });
      setExamples([{ jp: "", reading: "", vi: "" }]);
      loadItems();
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Xóa mẫu ngữ pháp "${id}"?`)) return;
    await deleteGrammarPoint(id);
    loadItems();
  };

  const displayedItems =
    filterLevel === "ALL"
      ? items
      : items.filter((i) => i.jlptLevel === filterLevel);

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-800 mb-4">
        Quản lý Ngữ pháp
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 mb-6 max-w-2xl"
      >
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            placeholder="ID (vd: g4)"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            className="p-2 rounded border-2 border-black"
            required
          />
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

        <input
          placeholder="Mẫu câu (vd: 〜たいです)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full p-2 rounded border-2 border-black mb-3"
          required
        />
        <input
          placeholder="Ý nghĩa ngắn gọn"
          value={form.meaning}
          onChange={(e) => setForm({ ...form, meaning: e.target.value })}
          className="w-full p-2 rounded border-2 border-black mb-3"
          required
        />
        <input
          placeholder="Cấu trúc (vd: Động từ thể ます + たいです)"
          value={form.structure}
          onChange={(e) => setForm({ ...form, structure: e.target.value })}
          className="w-full p-2 rounded border-2 border-black mb-3"
          required
        />
        <textarea
          placeholder="Giải thích chi tiết"
          value={form.explanation}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          className="w-full p-2 rounded border-2 border-black mb-3 h-20"
          required
        />

        <h3 className="font-bold text-stone-800 mb-2">Ví dụ</h3>
        {examples.map((ex, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <input
              placeholder="Câu tiếng Nhật"
              value={ex.jp}
              onChange={(e) => updateExample(i, "jp", e.target.value)}
              className="p-2 rounded border-2 border-black"
              required
            />
            <input
              placeholder="Cách đọc (hiragana)"
              value={ex.reading}
              onChange={(e) => updateExample(i, "reading", e.target.value)}
              className="p-2 rounded border-2 border-black"
            />
            <div className="flex gap-1">
              <input
                placeholder="Nghĩa tiếng Việt"
                value={ex.vi}
                onChange={(e) => updateExample(i, "vi", e.target.value)}
                className="flex-1 p-2 rounded border-2 border-black"
                required
              />
              {examples.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExample(i)}
                  className="px-2 bg-red-600 text-white rounded-lg font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addExampleField}
          className="w-full bg-white border-2 border-black text-stone-800 p-2 rounded-lg font-bold hover:bg-stone-100 mt-1 mb-3"
        >
          + Thêm ví dụ
        </button>

        <button
          type="submit"
          className="w-full bg-black text-white p-3 rounded-lg font-bold"
        >
          Lưu mẫu ngữ pháp
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
      ) : displayedItems.length === 0 ? (
        <p className="text-stone-500">Chưa có mẫu ngữ pháp nào ở cấp độ này.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {displayedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border-2 border-black rounded-lg p-3 relative"
            >
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs font-bold"
              >
                ✕
              </button>
              <span className="inline-block bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1">
                {item.jlptLevel}
              </span>
              <p className="font-bold text-stone-900">{item.title}</p>
              <p className="text-xs text-stone-500">{item.meaning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GrammarManager;
