import { useState, useEffect } from "react";
import { addKanaChar, deleteKanaChar } from "../../firebase/firestore";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";

function KanaManager({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: "", char: "", romaji: "", audio: "" });
  const [message, setMessage] = useState("");

  const loadItems = async () => {
    const snapshot = await getDocs(collection(db, type));
    setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadItems();
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addKanaChar(type, form);
      setMessage(`Đã thêm/cập nhật "${form.char}"`);
      setForm({ id: "", char: "", romaji: "", audio: "" });
      loadItems(); // Tải lại danh sách sau khi thêm
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Xóa chữ "${id}"?`)) return;
    await deleteKanaChar(type, id);
    loadItems();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-800 mb-4">
        Quản lý {type === "hiragana" ? "Hiragana" : "Katakana"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 mb-6"
      >
        <div className="grid grid-cols-4 gap-3 mb-3">
          <input
            placeholder="ID (vd: a, ka, kya)"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            className="p-2 rounded border-2 border-black"
            required
          />
          <input
            placeholder="Chữ (vd: あ)"
            value={form.char}
            onChange={(e) => setForm({ ...form, char: e.target.value })}
            className="p-2 rounded border-2 border-black"
            required
          />
          <input
            placeholder="Romaji (vd: a)"
            value={form.romaji}
            onChange={(e) => setForm({ ...form, romaji: e.target.value })}
            className="p-2 rounded border-2 border-black"
            required
          />
          <input
            placeholder="Tên file audio (vd: a.mp3)"
            value={form.audio}
            onChange={(e) => setForm({ ...form, audio: e.target.value })}
            className="p-2 rounded border-2 border-black"
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
        <div className="grid grid-cols-6 gap-3">
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
              <p className="text-xl font-bold">{item.char}</p>
              <p className="text-xs text-stone-500">{item.romaji}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KanaManager;
