import { useState, useEffect } from "react";
import {
  setFlashcardDeck,
  deleteFlashcardDeck,
  getAllFlashcardDecks,
} from "../../firebase/firestore";

const LEVELS = ["JPD133", "N5", "N4", "N3", "N2", "N1"];

// Tự động tính ID kế tiếp dựa trên số lớn nhất đang có (vd: có deck1..deck5 -> trả về "deck6")
function computeNextId(items) {
  let maxNum = 0;
  items.forEach((item) => {
    const match = item.id.match(/^deck(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `deck${maxNum + 1}`;
}

function FlashcardManager() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deckId, setDeckId] = useState("");
  const [title, setTitle] = useState("");
  const [jlptLevel, setJlptLevel] = useState("N5");
  const [cards, setCards] = useState([{ id: "c1", front: "", back: "" }]);
  const [message, setMessage] = useState("");

  const loadDecks = async () => {
    const data = await getAllFlashcardDecks();
    setDecks(data);
    setLoading(false);
    return data;
  };

  useEffect(() => {
    async function init() {
      const data = await loadDecks();
      setDeckId(computeNextId(data));
    }
    init();
  }, []);

  const updateCard = (index, field, value) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], [field]: value };
    setCards(updated);
  };

  const addCardField = () => {
    setCards([...cards, { id: `c${cards.length + 1}`, front: "", back: "" }]);
  };

  const removeCard = (index) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const resetForm = (newDecks) => {
    setDeckId(computeNextId(newDecks));
    setTitle("");
    setJlptLevel(jlptLevel); // giữ nguyên cấp độ vừa chọn, tiện nhập liên tiếp
    setCards([{ id: "c1", front: "", back: "" }]);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setFlashcardDeck({ id: deckId, title, jlptLevel, cards });
      setMessage(
        isEditing ? `Đã cập nhật "${deckId}"` : `Đã thêm bộ "${title}"`,
      );
      const newDecks = await loadDecks();
      resetForm(newDecks);
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Xóa bộ flashcard "${id}"?`)) return;
    await deleteFlashcardDeck(id);
    const newDecks = await loadDecks();
    if (deckId === id && isEditing) resetForm(newDecks);
  };

  // Bấm vào 1 bộ có sẵn để nạp dữ liệu vào form, chuyển sang chế độ sửa (ID giữ nguyên)
  const handleEdit = (deck) => {
    setIsEditing(true);
    setDeckId(deck.id);
    setTitle(deck.title);
    setJlptLevel(deck.jlptLevel);
    setCards(
      deck.cards.map((c, i) => ({
        id: c.id || `c${i + 1}`,
        front: c.front,
        back: c.back,
      })),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm(decks);
  };

  return (
    <div className="w-full min-w-0">
      <h2 className="text-xl font-bold text-stone-800 mb-4">
        Quản lý Flashcard
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[#f5e6a8] border-2 border-black rounded-xl p-4 sm:p-5 mb-6 max-w-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
          <span className="text-sm font-bold text-stone-700">
            {isEditing ? `Đang sửa: ${deckId}` : `ID sẽ tạo: ${deckId}`}
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
          <input
            placeholder="Tên bộ từ vựng"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 rounded border-2 border-black"
            required
          />
          <select
            value={jlptLevel}
            onChange={(e) => setJlptLevel(e.target.value)}
            className="p-2 rounded border-2 border-black bg-white"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <h3 className="font-bold text-stone-800 mb-2">Thẻ từ vựng</h3>
        {cards.map((c, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-2 mb-2">
            <input
              placeholder="Mặt trước (vd: 水)"
              value={c.front}
              onChange={(e) => updateCard(i, "front", e.target.value)}
              className="flex-1 min-w-0 p-2 rounded border-2 border-black"
              required
            />
            <input
              placeholder="Mặt sau (vd: みず - Nước)"
              value={c.back}
              onChange={(e) => updateCard(i, "back", e.target.value)}
              className="flex-1 min-w-0 p-2 rounded border-2 border-black"
              required
            />
            {cards.length > 1 && (
              <button
                type="button"
                onClick={() => removeCard(i)}
                className="px-3 bg-red-600 text-white rounded-lg font-bold flex-shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addCardField}
          className="w-full bg-white border-2 border-black text-stone-800 p-2 rounded-lg font-bold hover:bg-stone-100 mt-2"
        >
          + Thêm thẻ
        </button>

        <button
          type="submit"
          className="w-full bg-black text-white p-3 rounded-lg font-bold mt-3"
        >
          {isEditing ? "Cập nhật" : "Lưu bộ Flashcard"}
        </button>

        {message && (
          <p className="text-green-700 text-sm mt-2 font-medium">{message}</p>
        )}
      </form>

      {loading ? (
        <p className="text-stone-500">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {decks.map((d) => (
            <div
              key={d.id}
              onClick={() => handleEdit(d)}
              className="bg-white border-2 border-black rounded-lg p-3 relative cursor-pointer hover:bg-stone-50"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(d.id);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs font-bold"
              >
                ✕
              </button>
              <span className="inline-block bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1">
                {d.jlptLevel}
              </span>
              <p className="font-bold text-stone-900">{d.title}</p>
              <p className="text-xs text-stone-500">{d.cards.length} thẻ</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FlashcardManager;
