import { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import {
  getAllHiragana,
  getProgress,
  markAsLearned,
  markAsNotLearned,
} from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";
import StrokeOrderModal from "../components/StrokeOrderModal";

// Cấu hình lại các hàng có 3 chữ cái: chèn ô trống "" để căn cột 1, 3, 5 trong Grid 5 cột
const SEION_ROWS = [
  ["a", "i", "u", "e", "o"],
  ["ka", "ki", "ku", "ke", "ko"],
  ["sa", "shi", "su", "se", "so"],
  ["ta", "chi", "tsu", "te", "to"],
  ["na", "ni", "nu", "ne", "no"],
  ["ha", "hi", "fu", "he", "ho"],
  ["ma", "mi", "mu", "me", "mo"],
  ["ya", "", "yu", "", "yo"], // Cột 1 (ya), Cột 3 (yu), Cột 5 (yo)
  ["ra", "ri", "ru", "re", "ro"],
  ["wa", "", "wo", "", "n"], // Cột 1 (wa), Cột 3 (wo), Cột 5 (n)
];

// Dakuten luôn đủ 5 cột
const DAKUTEN_ROWS = [
  ["ga", "gi", "gu", "ge", "go"],
  ["za", "ji", "zu", "ze", "zo"],
  ["da", "ji_di", "zu_du", "de", "do"],
  ["ba", "bi", "bu", "be", "bo"],
  ["pa", "pi", "pu", "pe", "po"],
];

// Yoon luôn gồm các nhóm 3 chữ cái đi kèm ya/yu/yo -> dùng Grid 3 cột
const YOON_ROWS = [
  ["kya", "kyu", "kyo"],
  ["sha", "shu", "sho"],
  ["cha", "chu", "cho"],
  ["nya", "nyu", "nyo"],
  ["hya", "hyu", "hyo"],
  ["mya", "myu", "myo"],
  ["rya", "ryu", "ryo"],
  ["gya", "gyu", "gyo"],
  ["ja", "ju", "jo"],
  ["bya", "byu", "byo"],
  ["pya", "pyu", "pyo"],
];

function Hiragana() {
  const { currentUser } = useAuth();
  const [chars, setChars] = useState([]);
  const [learned, setLearned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const audioRef = useRef(null);
  const [strokeChar, setStrokeChar] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllHiragana();
        setChars(data);
      } catch (err) {
        console.error("Lỗi tải hiragana:", err);
      }

      try {
        const progress = await getProgress(currentUser.uid, "hiragana");
        setLearned(progress.learned);
      } catch (err) {
        console.error("Lỗi tải tiến độ:", err);
        setLearned([]);
      }

      setLoading(false);
    }
    loadData();
  }, [currentUser]);

  const charMap = Object.fromEntries(chars.map((c) => [c.id, c]));

  const handleCharClick = (item) => {
    setSelected(item);
    if (audioRef.current) {
      audioRef.current.src = `/audio/hiragana/${item.audio}`;
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleLearned = async (item) => {
    const isLearned = learned.includes(item.id);
    if (isLearned) {
      await markAsNotLearned(currentUser.uid, "hiragana", item.id);
      setLearned((prev) => prev.filter((id) => id !== item.id));
    } else {
      await markAsLearned(currentUser.uid, "hiragana", item.id, chars.length);
      setLearned((prev) => [...prev, item.id]);
    }
  };

  // Render ô chữ cái đơn lẻ
  // const CharCell = ({ id }) => {
  //   if (!id) return <div className="w-20 h-20" />; // Nếu là ô trống "", render khung rỗng để giữ vị trí chân thực

  //   const item = charMap[id];
  //   if (!item) return <div className="w-20 h-20" />;
  //   const isLearned = learned.includes(item.id);

  const CharCell = ({ id }) => {
    const item = charMap[id];
    if (!item) return null;
    const isLearned = learned.includes(item.id);

    return (
      <div className="relative">
        <button
          onClick={() => handleCharClick(item)}
          className={`
            w-20 h-20 rounded-xl border-2 border-black flex flex-col items-center justify-center
            transition-colors
            ${
              selected?.id === item.id
                ? "bg-black text-white"
                : "bg-[#f5e6a8] text-stone-900 hover:bg-[#f0dd8a]"
            }
          `}
        >
          <span className="text-2xl font-bold">{item.char}</span>
          <span
            className={`text-xs mt-0.5 ${selected?.id === item.id ? "text-stone-300" : "text-stone-600"}`}
          >
            {item.romaji}
          </span>
        </button>

        {/* Nút mới: mở hướng dẫn viết, góc dưới trái */}
        <button
          onClick={() => setStrokeChar(item.char)}
          className="absolute -bottom-1.5 -left-1.5 w-5 h-5 rounded-full border-2 border-black bg-white flex items-center justify-center text-[10px]"
          title="Xem cách viết"
        >
          ✍️
        </button>

        <button
          onClick={() => toggleLearned(item)}
          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold ${
            isLearned ? "bg-green-600 text-white" : "bg-white text-stone-400"
          }`}
        >
          ✓
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-stone-600">Đang tải dữ liệu...</p>
      </Layout>
    );
  }

  const progressPercent =
    chars.length > 0 ? Math.round((learned.length / chars.length) * 100) : 0;

  return (
    <Layout>
      {/* Thanh tiến trình */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            Bảng chữ cái
          </span>
          <span className="ml-2 text-sm text-stone-500">
            {chars.length} chữ
          </span>
        </div>
        <span className="text-sm font-bold text-stone-700">
          Đã thuộc: {learned.length}/{chars.length} ({progressPercent}%)
        </span>
      </div>

      <div className="w-full h-2 bg-stone-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-green-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">Hiragana</h1>

      {/* Cấu trúc Grid lớn chia màn hình linh hoạt tùy theo độ rộng hiển thị */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 w-full items-start">
        {/* ================= PHẦN TRÁI: ÂM CƠ BẢN ================= */}
        <div className="w-full bg-white/50 p-6 rounded-2xl shadow-sm border border-stone-200/60">
          <p className="text-base font-bold text-stone-700 mb-4 border-b border-stone-200 pb-2">
            Âm cơ bản (Seion)
          </p>
          {/* Ép cố định container thành Grid 5 cột dóng thẳng tắp */}
          <div className="grid grid-cols-5 gap-y-3 gap-x-2 justify-items-center w-full">
            {SEION_ROWS.flat().map((id, index) => (
              <CharCell key={`seion-${index}`} id={id} />
            ))}
          </div>
        </div>

        {/* ================= PHẦN PHẢI: BIẾN ÂM & ÂM GHÉP ================= */}
        <div className="flex flex-col gap-8 w-full">
          {/* Biến âm */}
          <div className="bg-white/50 p-6 rounded-2xl shadow-sm border border-stone-200/60">
            <p className="text-base font-bold text-stone-700 mb-4 border-b border-stone-200 pb-2">
              Biến âm (Dakuten)
            </p>
            {/* Grid 5 cột vuông vức đồng bộ kích thước */}
            <div className="grid grid-cols-5 gap-y-3 gap-x-2 justify-items-center w-full">
              {DAKUTEN_ROWS.flat().map((id, index) => (
                <CharCell key={`dakuten-${index}`} id={id} />
              ))}
            </div>
          </div>

          {/* Âm ghép */}
          <div className="bg-white/50 p-6 rounded-2xl shadow-sm border border-stone-200/60">
            <p className="text-base font-bold text-stone-700 mb-4 border-b border-stone-200 pb-2">
              Âm ghép (Yoon)
            </p>
            {/* Đổi riêng nhóm Yoon sang Grid 3 cột tương thích cụm cụ thể */}
            <div className="grid grid-cols-3 gap-y-3 gap-x-2 justify-items-center w-full max-w-md mx-auto">
              {YOON_ROWS.flat().map((id, index) => (
                <CharCell key={`yoon-${index}`} id={id} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} />

      {/* Thêm modal, chỉ hiện khi có chữ được chọn để xem cách viết */}
      {strokeChar && (
        <StrokeOrderModal
          char={strokeChar}
          onClose={() => setStrokeChar(null)}
        />
      )}
    </Layout>
  );
}

export default Hiragana;
