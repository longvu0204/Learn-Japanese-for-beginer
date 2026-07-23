import { useState, useEffect } from "react";
import {
  addSpeakingItem,
  deleteSpeakingItem,
  getAllSpeaking,
} from "../../firebase/firestore";
import {
  compressImageToBase64,
  estimateBase64Size,
} from "../../utils/imageUtils";

const LEVELS = ["JPD133", "N5", "N4", "N3", "N2", "N1"];
const TYPES = [
  { value: "audio", label: "Câu hỏi bằng giọng nói" },
  { value: "image", label: "Câu hỏi bằng hình ảnh" },
];

function computeNextId(items) {
  let maxNum = 0;
  items.forEach((item) => {
    const match = item.id.match(/^s(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `s${maxNum + 1}`;
}

function SpeakingManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageSizeWarning, setImageSizeWarning] = useState("");
  const [form, setForm] = useState({
    id: "",
    jlptLevel: "N5",
    type: "audio",
    audioText: "",
    promptText: "",
    imageUrl: "",
    sampleAnswer: "",
    keywordsText: "",
    hint: "",
  });
  const [message, setMessage] = useState("");

  const loadItems = async () => {
    const data = await getAllSpeaking();
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

  // Nén ảnh ngay khi chọn, chuyển thành base64, KHÔNG cần Storage
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setImageSizeWarning("");
    try {
      const base64 = await compressImageToBase64(file, 600, 0.7);
      const sizeKB = Math.round(estimateBase64Size(base64) / 1024);

      if (sizeKB > 700) {
        setImageSizeWarning(
          `Ảnh sau khi nén vẫn khá lớn (~${sizeKB}KB). Nên chọn ảnh khác đơn giản hơn.`,
        );
      }

      setForm((prev) => ({ ...prev, imageUrl: base64 }));
      setImagePreview(base64);
    } catch (err) {
      setMessage("Lỗi xử lý ảnh: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = (newItems) => {
    setForm({
      id: computeNextId(newItems),
      jlptLevel: form.jlptLevel,
      type: "audio",
      audioText: "",
      promptText: "",
      imageUrl: "",
      sampleAnswer: "",
      keywordsText: "",
      hint: "",
    });
    setImagePreview(null);
    setImageSizeWarning("");
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.type === "image" && !form.imageUrl) {
        setMessage("Vui lòng chọn ảnh cho câu hỏi dạng hình ảnh.");
        return;
      }

      const keywords = form.keywordsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await addSpeakingItem({
        id: form.id,
        jlptLevel: form.jlptLevel,
        type: form.type,
        audioText: form.audioText,
        promptText: form.type === "image" ? form.promptText : "",
        imageUrl: form.type === "image" ? form.imageUrl : "",
        sampleAnswer: form.sampleAnswer,
        keywords,
        hint: form.hint,
      });

      setMessage(
        isEditing
          ? `Đã cập nhật "${form.id}"`
          : `Đã thêm câu Speaking (${form.jlptLevel})`,
      );
      const newItems = await loadItems();
      resetForm(newItems);
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Xóa câu Speaking "${id}"?`)) return;
    await deleteSpeakingItem(id);
    const newItems = await loadItems();
    if (form.id === id && isEditing) {
      resetForm(newItems);
    }
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setForm({
      id: item.id,
      jlptLevel: item.jlptLevel,
      type: item.type || "audio",
      audioText: item.audioText || "",
      promptText: item.promptText || "",
      imageUrl: item.imageUrl || "",
      sampleAnswer: item.sampleAnswer,
      keywordsText: item.keywords.join(", "),
      hint: item.hint || "",
    });
    setImagePreview(item.imageUrl || null);
    setImageSizeWarning("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm(items);
  };

  const displayedItems = items.filter((item) => {
    const matchLevel = filterLevel === "ALL" || item.jlptLevel === filterLevel;

    const keyword = searchKeyword.toLowerCase();

    const matchSearch =
      keyword === "" ||
      item.audioText?.toLowerCase().includes(keyword) ||
      item.promptText?.toLowerCase().includes(keyword) ||
      item.sampleAnswer?.toLowerCase().includes(keyword) ||
      item.keywords.some((k) => k.toLowerCase().includes(keyword));

    return matchLevel && matchSearch;
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-800 mb-4">
        Quản lý Speaking
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 mb-6 max-w-2xl"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-stone-700">
            {isEditing ? `Đang sửa: ${form.id}` : `ID sẽ tạo: ${form.id}`}
          </span>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-sm text-stone-600 underline"
            >
              Hủy sửa, thêm mới
            </button>
          )}
        </div>

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

          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="p-2 rounded border-2 border-black bg-white"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {form.type === "audio" ? (
          <div className="flex gap-2 mb-3">
            <input
              placeholder="Câu hỏi tiếng Nhật (vd: お名前は何ですか。)"
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
        ) : (
          <div className="mb-3">
            <input
              placeholder="Yêu cầu hiển thị (vd: Hãy mô tả bức tranh này bằng tiếng Nhật)"
              value={form.promptText}
              onChange={(e) => setForm({ ...form, promptText: e.target.value })}
              className="w-full p-2 rounded border-2 border-black mb-2"
              required
            />

            <div className="flex gap-2 mb-2">
              <input
                placeholder="Câu hỏi tiếng Nhật đi kèm (không bắt buộc, vd: この絵について説明してください。)"
                value={form.audioText}
                onChange={(e) =>
                  setForm({ ...form, audioText: e.target.value })
                }
                className="flex-1 p-2 rounded border-2 border-black"
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
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="w-full p-2 rounded border-2 border-black bg-white"
            />
            {uploading && (
              <p className="text-stone-500 text-xs mt-1">Đang nén ảnh...</p>
            )}
            {imageSizeWarning && (
              <p className="text-amber-700 text-xs mt-1">{imageSizeWarning}</p>
            )}
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Xem trước"
                className="mt-2 w-full max-h-48 object-contain border-2 border-black rounded-lg bg-white"
              />
            )}
          </div>
        )}

        <input
          placeholder="Câu trả lời mẫu"
          value={form.sampleAnswer}
          onChange={(e) => setForm({ ...form, sampleAnswer: e.target.value })}
          className="w-full p-2 rounded border-2 border-black mb-3"
          required
        />
        <input
          placeholder="Từ khóa bắt buộc, cách nhau bởi dấu phẩy"
          value={form.keywordsText}
          onChange={(e) => setForm({ ...form, keywordsText: e.target.value })}
          className="w-full p-2 rounded border-2 border-black mb-3"
          required
        />
        <input
          placeholder="Gợi ý cho người học (không bắt buộc)"
          value={form.hint}
          onChange={(e) => setForm({ ...form, hint: e.target.value })}
          className="w-full p-2 rounded border-2 border-black mb-3"
        />

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-black text-white p-3 rounded-lg font-bold disabled:opacity-50"
        >
          {uploading
            ? "Đang xử lý ảnh..."
            : isEditing
              ? "Cập nhật"
              : "Thêm câu Speaking"}
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

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Tìm theo câu hỏi hoặc từ khóa..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full p-2 rounded-lg border-2 border-black bg-white"
        />
      </div>

      <div className="flex flex-col h-full">
        {loading ? (
          <p className="text-stone-500">Đang tải...</p>
        ) : (
          <div
            className="flex-1 overflow-y-auto flex flex-col gap-2 pr-2"
            style={{ maxHeight: "calc(100vh - 260px)" }}
          >
            {displayedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleEdit(item)}
                className="bg-white border-2 border-black rounded-lg p-3 flex justify-between items-start gap-3 cursor-pointer hover:bg-stone-50"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {item.type === "image" && item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-12 h-12 object-cover border border-black rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2">
                      {item.jlptLevel}
                    </span>
                    <span className="inline-block bg-stone-300 text-stone-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2">
                      {item.type === "image" ? "🖼 Ảnh" : "🔊 Âm thanh"}
                    </span>
                    <p className="font-medium text-stone-900 break-words">
                      {item.type === "image" ? item.promptText : item.audioText}
                    </p>
                    <p className="text-xs text-stone-500 mt-1 break-words">
                      Từ khóa: {item.keywords.join(", ")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="w-7 h-7 bg-red-600 text-white rounded-full text-xs font-bold flex-shrink-0 self-start"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SpeakingManager;
