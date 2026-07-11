import { useState, useEffect } from "react";
import {
  addKanjiChar,
  deleteKanjiChar,
  getAllKanji,
} from "../../firebase/firestore";

function KanjiManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    id: "",
    char: "",
    meaning: "",
    onyomi: "",
    kunyomi: "",
    strokeCount: "",
    jlptLevel: "N5",
  });
  const [message, setMessage] = useState("");

  const loadItems = async () => {
    const data = await getAllKanji();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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
        examples: [], // Tạm thời để trống, admin có thể bổ sung sau qua Firestore Console nếu cần
      });
      setMessage(`Đã thêm/cập nhật "${form.char}"`);
      setForm({
        id: "",
        char: "",
        meaning: "",
        onyomi: "",
        kunyomi: "",
        strokeCount: "",
        jlptLevel: "N5",
      });
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

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-800 mb-4">Quản lý Kanji</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 mb-6"
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
        </div>
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded-lg font-bold"
        >
          Thêm / Cập nhật
        </button>
        {message && (
          <p className="text-green-700 text-sm mt-2 font-medium">{message}</p>
        )}
      </form>

      {loading ? (
        <p className="text-stone-500">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border-2 border-black rounded-lg p-3 text-center relative"
            >
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs font-bold"
              >
                ✕
              </button>
              <p className="text-2xl font-bold">{item.char}</p>
              <p className="text-xs text-stone-500">{item.meaning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KanjiManager;
