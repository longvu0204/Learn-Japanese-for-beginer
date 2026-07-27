import { useState, useEffect } from "react";
import {
  setFlashcardDeck,
  deleteFlashcardDeck,
  getAllFlashcardDecks,
  uploadCardImage,
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

const EMPTY_CARD = (id, front = "", back = "") => ({
  id,
  front,
  back,
  image: "",
});

function FlashcardManager() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deckId, setDeckId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jlptLevel, setJlptLevel] = useState("N5");
  const [cards, setCards] = useState([EMPTY_CARD("c1")]);
  const [message, setMessage] = useState("");

  // Thanh công cụ kiểu Quizlet
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestionsOn, setSuggestionsOn] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [uploadingIndex, setUploadingIndex] = useState(null);

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
    setCards([...cards, EMPTY_CARD(`c${cards.length + 1}`)]);
  };

  const removeCard = (index) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const resetForm = (newDecks) => {
    setDeckId(computeNextId(newDecks));
    setTitle("");
    setDescription("");
    setJlptLevel(jlptLevel); // giữ nguyên cấp độ vừa chọn, tiện nhập liên tiếp
    setCards([EMPTY_CARD("c1")]);
    setIsEditing(false);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setFlashcardDeck({
        id: deckId,
        title,
        description,
        jlptLevel,
        cards,
      });
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
    setDescription(deck.description || "");
    setJlptLevel(deck.jlptLevel);
    setCards(
      deck.cards.map((c, i) => ({
        id: c.id || `c${i + 1}`,
        front: c.front,
        back: c.back,
        image: c.image || "",
      })),
    );
    setSearchQuery("");
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm(decks);
  };

  // ==== Các tính năng thanh công cụ kiểu Quizlet ====

  // Nhập nhanh nhiều thẻ cùng lúc bằng cách dán văn bản (mỗi dòng 1 thẻ,
  // phân cách thuật ngữ/định nghĩa bằng Tab, " - " hoặc dấu phẩy)
  const handleImportConfirm = () => {
    const lines = importText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setImportOpen(false);
      return;
    }

    const parsed = lines.map((line, i) => {
      let front = line;
      let back = "";

      if (line.includes("\t")) {
        const [f, ...rest] = line.split("\t");
        front = f;
        back = rest.join(" ");
      } else if (line.includes(" - ")) {
        const idx = line.indexOf(" - ");
        front = line.slice(0, idx);
        back = line.slice(idx + 3);
      } else if (line.includes(",")) {
        const idx = line.indexOf(",");
        front = line.slice(0, idx);
        back = line.slice(idx + 1);
      }

      return EMPTY_CARD(`c${Date.now()}_${i}`, front.trim(), back.trim());
    });

    // Nếu form đang trống (chỉ có 1 thẻ chưa nhập gì) -> thay thế luôn
    const isFormEmpty = cards.length === 1 && !cards[0].front && !cards[0].back;

    setCards(isFormEmpty ? parsed : [...cards, ...parsed]);
    setImportText("");
    setImportOpen(false);
  };

  // Đảo mặt trước/sau của TẤT CẢ các thẻ trong form
  const handleSwapAll = () => {
    setCards((prev) =>
      prev.map((c) => ({ ...c, front: c.back, back: c.front })),
    );
  };

  // Xóa toàn bộ thẻ trong form hiện tại (bắt đầu lại từ 1 thẻ trống)
  const handleClearAllCards = () => {
    if (!confirm("Xóa tất cả các thẻ đang nhập trong form này?")) return;
    setCards([EMPTY_CARD("c1")]);
  };

  // Kéo-thả để sắp xếp lại thứ tự thẻ
  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (index) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...cards];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);
    setCards(updated);
    setDraggedIndex(null);
  };

  // Tải ảnh minh họa cho 1 thẻ lên Firebase Storage
  const handleImageChange = async (index, file) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const url = await uploadCardImage(file, deckId, cards[index].id);
      updateCard(index, "image", url);
    } catch (err) {
      setMessage("Lỗi tải ảnh: " + err.message);
    } finally {
      setUploadingIndex(null);
    }
  };

  // Danh sách thẻ hiển thị (có lọc theo tìm kiếm), vẫn giữ đúng index gốc
  const visibleCards = cards
    .map((c, i) => ({ ...c, _idx: i }))
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
      );
    });

  return (
    <div className="w-full min-w-0">
      <h2 className="text-xl font-bold text-stone-800 mb-4">
        Quản lý Flashcard
      </h2>

      {/* ============ FORM KIỂU QUIZLET (tông kem - đỏ, đồng bộ trang Flashcard) ============ */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#fdf6e3] border-2 border-black rounded-2xl overflow-hidden mb-6 max-w-4xl shadow-sm"
      >
        {/* Tiêu đề + mô tả */}
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-xs font-bold text-[#b23a2e] uppercase tracking-wide">
              {isEditing ? `Đang sửa: ${deckId}` : `ID sẽ tạo: ${deckId}`}
            </span>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-[#b23a2e] underline text-left hover:text-[#992f25]"
              >
                Hủy sửa, thêm mới
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border-2 border-black rounded-lg px-4 py-3">
              <p className="text-[11px] text-stone-500 mb-1">Tiêu đề</p>
              <input
                placeholder="Vd: Chữ Hán Bài 13"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-stone-900 font-bold placeholder-stone-400 outline-none"
                required
              />
            </div>
            <div className="bg-white border-2 border-black rounded-lg px-4 py-3">
              <p className="text-[11px] text-stone-500 mb-1">Cấp độ</p>
              <select
                value={jlptLevel}
                onChange={(e) => setJlptLevel(e.target.value)}
                className="w-full bg-transparent text-stone-900 font-bold outline-none"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white border-2 border-black rounded-lg px-4 py-3">
            <input
              placeholder="Thêm mô tả..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent text-stone-700 placeholder-stone-400 outline-none text-sm"
            />
          </div>
        </div>

        {/* Thanh công cụ */}
        <div className="bg-[#f5e6a8]/50 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-2 flex-wrap border-y-2 border-black">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setImportOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-stone-800 bg-white border-2 border-black hover:bg-stone-100"
            >
              + Nhập
            </button>
            <button
              type="button"
              disabled
              title="Tính năng này chưa hỗ trợ"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-stone-400 bg-stone-200 border-2 border-stone-300 cursor-not-allowed"
            >
              + Thêm sơ đồ <span className="text-amber-500">🔒</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-600 hidden sm:inline">
              Gợi ý
            </span>
            <button
              type="button"
              onClick={() => setSuggestionsOn((v) => !v)}
              title="Gợi ý tự động (đang phát triển)"
              className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors border-2 border-black ${
                suggestionsOn
                  ? "bg-[#b23a2e] justify-end"
                  : "bg-stone-300 justify-start"
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-white block" />
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              title="Tìm trong các thẻ"
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                searchOpen
                  ? "bg-white border-black text-stone-800"
                  : "border-transparent text-stone-600 hover:bg-white/60"
              }`}
            >
              🔍
            </button>
            <button
              type="button"
              onClick={handleSwapAll}
              title="Đảo mặt trước/sau của tất cả thẻ"
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:bg-white/60 hover:text-stone-900"
            >
              ⇄
            </button>
            <button
              type="button"
              disabled
              title="Bàn phím ký tự đặc biệt (đang phát triển)"
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 cursor-not-allowed"
            >
              ⌨
            </button>
            <button
              type="button"
              onClick={handleClearAllCards}
              title="Xóa tất cả thẻ trong form"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-red-600 hover:bg-red-700 border-2 border-black"
            >
              🗑
            </button>
          </div>
        </div>

        {/* Ô nhập bulk-import */}
        {importOpen && (
          <div className="bg-white px-4 sm:px-5 py-3 border-b-2 border-black">
            <p className="text-xs text-stone-500 mb-2">
              Dán danh sách từ vựng, mỗi dòng 1 thẻ. Phân cách thuật ngữ/định
              nghĩa bằng dấu Tab, " - " hoặc dấu phẩy. Vd:{" "}
              <span className="text-stone-700 font-medium">
                水 - みず: Nước
              </span>
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={"水 - みず: Nước\n火 - ひ: Lửa"}
              className="w-full h-28 bg-stone-50 text-stone-900 placeholder-stone-400 border-2 border-black rounded-lg p-3 text-sm outline-none resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setImportOpen(false);
                  setImportText("");
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-bold text-stone-600 hover:bg-stone-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleImportConfirm}
                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-[#b23a2e] text-white hover:bg-[#992f25]"
              >
                Nhập
              </button>
            </div>
          </div>
        )}

        {/* Ô tìm kiếm nhanh trong các thẻ */}
        {searchOpen && (
          <div className="bg-white px-4 sm:px-5 py-3 border-b-2 border-black">
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo thuật ngữ hoặc định nghĩa..."
              className="w-full bg-stone-50 text-stone-900 placeholder-stone-400 border-2 border-black rounded-lg p-2.5 text-sm outline-none"
            />
          </div>
        )}

        {/* Danh sách thẻ */}
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          {visibleCards.map((c) => (
            <div
              key={c.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(c._idx)}
              className="bg-white border-2 border-black rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-stone-500 font-bold text-sm">
                  {c._idx + 1}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    draggable
                    onDragStart={() => handleDragStart(c._idx)}
                    title="Kéo để sắp xếp lại"
                    className="cursor-grab text-stone-400 hover:text-stone-700 select-none"
                  >
                    ≡
                  </span>
                  {cards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCard(c._idx)}
                      title="Xóa thẻ này"
                      className="text-stone-400 hover:text-red-600"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <textarea
                    placeholder="Nhập thuật ngữ (vd: 水)"
                    value={c.front}
                    onChange={(e) =>
                      updateCard(c._idx, "front", e.target.value)
                    }
                    rows={2}
                    className="w-full bg-stone-50 text-stone-900 placeholder-stone-400 border-2 border-black rounded-lg p-3 outline-none resize-none"
                    required
                  />
                  <p className="text-[10px] text-stone-400 mt-1 tracking-wide uppercase">
                    Thuật ngữ
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    placeholder="Nhập định nghĩa (vd: みず - Nước)"
                    value={c.back}
                    onChange={(e) => updateCard(c._idx, "back", e.target.value)}
                    rows={2}
                    className="w-full bg-stone-50 text-stone-900 placeholder-stone-400 border-2 border-black rounded-lg p-3 outline-none resize-none"
                    required
                  />
                  <p className="text-[10px] text-stone-400 mt-1 tracking-wide uppercase">
                    Định nghĩa
                  </p>
                </div>

                {/* Ảnh minh họa */}
                <label className="w-24 h-20 flex-shrink-0 border-2 border-dashed border-stone-400 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-stone-600 hover:bg-stone-50 relative overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleImageChange(c._idx, e.target.files[0])
                    }
                  />
                  {uploadingIndex === c._idx ? (
                    <span className="text-[10px] text-stone-500">
                      Đang tải...
                    </span>
                  ) : c.image ? (
                    <>
                      <img
                        src={c.image}
                        alt="minh họa"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          updateCard(c._idx, "image", "");
                        }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 text-white text-[10px] rounded-full"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-stone-400 text-lg">🖼</span>
                      <span className="text-[10px] text-stone-500 font-bold">
                        Hình ảnh
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addCardField}
            className="w-full bg-white border-2 border-black text-stone-700 p-3 rounded-lg font-bold hover:bg-stone-100"
          >
            + Thêm thẻ
          </button>
        </div>

        {/* Nút lưu */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <button
            type="submit"
            className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800"
          >
            {isEditing ? "Cập nhật" : "Lưu bộ Flashcard"}
          </button>

          {message && (
            <p className="text-green-700 text-sm mt-2 font-medium">{message}</p>
          )}
        </div>
      </form>

      {/* ============ DANH SÁCH CÁC BỘ ĐÃ TẠO ============ */}
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
