import { useState, useEffect } from "react";
import {
  addKanjiChar,
  deleteKanjiChar,
  getAllKanji,
} from "../../firebase/firestore";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

function KanjiManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [form, setForm] = useState({
    id: "",
    char: "",
    meaning: "",
    onyomi: "",
    kunyomi: "",
    strokeCount: "",
    jlptLevel: "N5",
  });
  const [examples, setExamples] = useState([
    { word: "", reading: "", meaning: "" },
  ]);
  const [message, setMessage] = useState("");

  const loadItems = async () => {
    const data = await getAllKanji();
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
    setExamples([...examples, { word: "", reading: "", meaning: "" }]);
  };

  const removeExample = (index) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanedExamples = examples.filter(
        (ex) => ex.word.trim() && ex.reading.trim() && ex.meaning.trim(),
      );

      await addKanjiChar({
        ...form,
        strokeCount: Number(form.strokeCount),
        onyomi: form.onyomi
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        kunyomi: form.kunyomi
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        examples: cleanedExamples,
      });
      setMessage(`Đã thêm/cập nhật "${form.char}" (${form.jlptLevel})`);
      setForm({
        id: "",
        char: "",
        meaning: "",
        onyomi: "",
        kunyomi: "",
        strokeCount: "",
        jlptLevel: form.jlptLevel,
      });
      setExamples([{ word: "", reading: "", meaning: "" }]);
      loadItems();
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Xóa Kanji "${id}"?`)) return;
    await deleteKanjiChar(id);
    loadItems();
  };

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      char: item.char,
      meaning: item.meaning,
      onyomi: item.onyomi.join(", "),
      kunyomi: item.kunyomi.join(", "),
      strokeCount: String(item.strokeCount),
      jlptLevel: item.jlptLevel,
    });
    setExamples(
      item.examples && item.examples.length > 0
        ? item.examples
        : [{ word: "", reading: "", meaning: "" }],
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayedItems =
    filterLevel === "ALL"
      ? items
      : items.filter((i) => i.jlptLevel === filterLevel);

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-800 mb-4">Quản lý Kanji</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 mb-6 max-w-2xl"
      >
        <div className="grid grid-cols-3 gap-3 mb-3">
          <input
            placeholder="ID (vd: k6)"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            className="p-2 rounded border-2 border-black"
            required
          />
          <input
            placeholder="Chữ Kanji (vd: 木)"
            value={form.char}
            onChange={(e) => setForm({ ...form, char: e.target.value })}
            className="p-2 rounded border-2 border-black"
            required
          />
          <input
            placeholder="Nghĩa (vd: Cây)"
            value={form.meaning}
            onChange={(e) => setForm({ ...form, meaning: e.target.value })}
            className="p-2 rounded border-2 border-black"
            required
          />
          <input
            placeholder="Âm On, cách nhau bởi dấu phẩy"
            value={form.onyomi}
            onChange={(e) => setForm({ ...form, onyomi: e.target.value })}
            className="p-2 rounded border-2 border-black"
          />
          <input
            placeholder="Âm Kun, cách nhau bởi dấu phẩy"
            value={form.kunyomi}
            onChange={(e) => setForm({ ...form, kunyomi: e.target.value })}
            className="p-2 rounded border-2 border-black"
          />
          <input
            type="number"
            placeholder="Số nét"
            value={form.strokeCount}
            onChange={(e) => setForm({ ...form, strokeCount: e.target.value })}
            className="p-2 rounded border-2 border-black"
            required
          />

          <select
            value={form.jlptLevel}
            onChange={(e) => setForm({ ...form, jlptLevel: e.target.value })}
            className="p-2 rounded border-2 border-black bg-white"
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <h3 className="font-bold text-stone-800 mb-2">Từ ghép ví dụ</h3>
        {examples.map((ex, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <input
              placeholder="Từ ghép (vd: 水曜日)"
              value={ex.word}
              onChange={(e) => updateExample(i, "word", e.target.value)}
              className="p-2 rounded border-2 border-black"
            />
            <input
              placeholder="Cách đọc (vd: すいようび)"
              value={ex.reading}
              onChange={(e) => updateExample(i, "reading", e.target.value)}
              className="p-2 rounded border-2 border-black"
            />
            <div className="flex gap-1">
              <input
                placeholder="Nghĩa (vd: Thứ Tư)"
                value={ex.meaning}
                onChange={(e) => updateExample(i, "meaning", e.target.value)}
                className="flex-1 p-2 rounded border-2 border-black"
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
          + Thêm từ ghép
        </button>

        <button
          type="submit"
          className="w-full bg-black text-white p-3 rounded-lg font-bold"
        >
          Thêm / Cập nhật
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
        <p className="text-stone-500">Chưa có Kanji nào ở cấp độ này.</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {displayedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border-2 border-black rounded-lg p-3 text-center relative cursor-pointer hover:bg-stone-50"
              onClick={() => handleEdit(item)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs font-bold"
              >
                ✕
              </button>
              <span className="absolute -top-2 -left-2 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {item.jlptLevel}
              </span>
              <p className="text-2xl font-bold mt-1">{item.char}</p>
              <p className="text-xs text-stone-500">{item.meaning}</p>
              {item.examples?.length > 0 && (
                <p className="text-[10px] text-stone-400 mt-1">
                  {item.examples.length} từ ghép
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KanjiManager;
