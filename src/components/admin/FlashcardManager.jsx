import { useState, useEffect } from "react";
import {
  setFlashcardDeck,
  deleteFlashcardDeck,
  getAllFlashcardDecks,
} from "../../firebase/firestore";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

function FlashcardManager() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deckId, setDeckId] = useState("");
  const [title, setTitle] = useState("");
  const [jlptLevel, setJlptLevel] = useState("N5");
  const [cards, setCards] = useState([{ id: "c1", front: "", back: "" }]);
  const [message, setMessage] = useState("");

  const loadDecks = async () => {
    const data = await getAllFlashcardDecks();
    setDecks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDecks();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setFlashcardDeck({ id: deckId, title, jlptLevel, cards });
      setMessage(`Đã lưu bộ "${title}"`);
      setDeckId("");
      setTitle("");
      setCards([{ id: "c1", front: "", back: "" }]);
      loadDecks();
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Xóa bộ flashcard "${id}"?`)) return;
    await deleteFlashcardDeck(id);
    loadDecks();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-800 mb-4">
        Quản lý Flashcard
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 mb-6 max-w-2xl"
      >
        <div className="grid grid-cols-3 gap-3 mb-3">
          <input
            placeholder="ID bộ (vd: n4-basic-2)"
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            className="p-2 rounded border-2 border-black"
            required
          />
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
          <div key={i} className="flex gap-2 mb-2">
            <input
              placeholder="Mặt trước (vd: 水)"
              value={c.front}
              onChange={(e) => updateCard(i, "front", e.target.value)}
              className="flex-1 p-2 rounded border-2 border-black"
              required
            />
            <input
              placeholder="Mặt sau (vd: みず - Nước)"
              value={c.back}
              onChange={(e) => updateCard(i, "back", e.target.value)}
              className="flex-1 p-2 rounded border-2 border-black"
              required
            />
            {cards.length > 1 && (
              <button
                type="button"
                onClick={() => removeCard(i)}
                className="px-3 bg-red-600 text-white rounded-lg font-bold"
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
          Lưu bộ Flashcard
        </button>

        {message && (
          <p className="text-green-700 text-sm mt-2 font-medium">{message}</p>
        )}
      </form>

      {loading ? (
        <p className="text-stone-500">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {decks.map((d) => (
            <div
              key={d.id}
              className="bg-white border-2 border-black rounded-lg p-3 relative"
            >
              <button
                onClick={() => handleDelete(d.id)}
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
