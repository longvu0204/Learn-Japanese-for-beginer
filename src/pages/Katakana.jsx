import { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import {
  getAllKatakana,
  getProgress,
  markAsLearned,
  markAsNotLearned,
} from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";
import StrokeOrderModal from "../components/StrokeOrderModal";

// Định nghĩa cấu trúc hàng cho Âm cơ bản (Seion) - chèn ô trống "" để căn cột 1, 3, 5
const SEION_ROWS = [
  ["a", "i", "u", "e", "o"],
  ["ka", "ki", "ku", "ke", "ko"],
  ["sa", "shi", "su", "se", "so"],
  ["ta", "chi", "tsu", "te", "to"],
  ["na", "ni", "nu", "ne", "no"],
  ["ha", "hi", "fu", "he", "ho"],
  ["ma", "mi", "mu", "me", "mo"],
  ["ya", "", "yu", "", "yo"],
  ["ra", "ri", "ru", "re", "ro"],
  ["wa", "", "wo", "", "n"],
];

// Biến âm (Dakuten)
const DAKUTEN_ROWS = [
  ["ga", "gi", "gu", "ge", "go"],
  ["za", "ji", "zu", "ze", "zo"],
  ["da", "ji_di", "zu_du", "de", "do"],
  ["ba", "bi", "bu", "be", "bo"],
  ["pa", "pi", "pu", "pe", "po"],
];

// Âm ghép (Yoon) -> dùng hệ Grid 3 cột dọc
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

function Katakana() {
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
        const data = await getAllKatakana();
        setChars(data);
      } catch (err) {
        console.error("Lỗi tải katakana:", err);
      }

      try {
        const progress = await getProgress(currentUser.uid, "katakana");
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
      audioRef.current.src = `/audio/katakana/${item.audio}`;
      audioRef.current.play().catch((err) => {
        console.log("Không phát được âm thanh:", err);
      });
    }
  };

  const toggleLearned = async (item) => {
    const isLearned = learned.includes(item.id);
    if (isLearned) {
      await markAsNotLearned(currentUser.uid, "katakana", item.id);
      setLearned((prev) => prev.filter((id) => id !== item.id));
    } else {
      await markAsLearned(currentUser.uid, "katakana", item.id, chars.length);
      setLearned((prev) => [...prev, item.id]);
    }
  };

  const CharCell = ({ id }) => {
    if (!id) return <div className="w-14 h-14 md:w-20 md:h-20" />; // Giữ vị trí chuẩn cho ô trống

    const item = charMap[id];
    if (!item) return <div className="w-14 h-14 md:w-20 md:h-20" />;
    const isLearned = learned.includes(item.id);

    return (
      <div className="relative">
        <button
          onClick={() => handleCharClick(item)}
          className={`
            w-14 h-14 md:w-20 md:h-20 rounded-xl border-2 border-black flex flex-col items-center justify-center
            transition-colors
            ${
              selected?.id === item.id
                ? "bg-black text-white"
                : "bg-[#f5e6a8] text-stone-900 hover:bg-[#f0dd8a]"
            }
          `}
        >
          <span className="text-lg md:text-2xl font-bold">{item.char}</span>
          <span
            className={`text-[10px] md:text-xs mt-0.5 ${
              selected?.id === item.id ? "text-stone-300" : "text-stone-600"
            }`}
          >
            {item.romaji}
          </span>
        </button>

        {/* Nút xem cách viết */}
        <button
          onClick={() => setStrokeChar(item.char)}
          className="absolute -bottom-1 -left-1 md:-bottom-1.5 md:-left-1.5 w-4 h-4 md:w-5 md:h-5 rounded-full border border-black md:border-2 bg-white flex items-center justify-center text-[8px] md:text-[10px]"
          title="Xem cách viết"
        >
          ✍️
        </button>

        {/* Nút đánh dấu đã thuộc */}
        <button
          onClick={() => toggleLearned(item)}
          className={`absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 w-4 h-4 md:w-5 md:h-5 rounded-full border border-black md:border-2 flex items-center justify-center text-[8px] md:text-[10px] font-bold ${
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

      <h1 className="text-2xl font-bold text-stone-800 mb-6">Katakana</h1>

      {/* Cấu trúc responsive layout: flex-col trên Mobile, flex-row trên Desktop XL */}
      <div className="flex flex-col xl:flex-row gap-6 xl:gap-10 items-start overflow-x-auto w-full">
        {/* ================= PHẦN TRÁI: ÂM CƠ BẢN ================= */}
        <div className="w-full xl:w-auto bg-white/50 p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200/60">
          <p className="text-base font-bold text-stone-700 mb-4 border-b border-stone-200 pb-2">
            Âm cơ bản (Seion)
          </p>
          <div className="grid grid-cols-5 gap-y-2.5 gap-x-1.5 md:gap-y-3 md:gap-x-2 justify-items-center w-full">
            {SEION_ROWS.flat().map((id, index) => (
              <CharCell key={`seion-${index}`} id={id} />
            ))}
          </div>
        </div>

        {/* ================= PHẦN PHẢI: BIẾN ÂM & ÂM GHÉP ================= */}
        <div className="flex flex-col gap-6 md:gap-8 w-full xl:w-auto">
          {/* Biến âm */}
          <div className="bg-white/50 p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200/60">
            <p className="text-base font-bold text-stone-700 mb-4 border-b border-stone-200 pb-2">
              Biến âm (Dakuten)
            </p>
            <div className="grid grid-cols-5 gap-y-2.5 gap-x-1.5 md:gap-y-3 md:gap-x-2 justify-items-center w-full">
              {DAKUTEN_ROWS.flat().map((id, index) => (
                <CharCell key={`dakuten-${index}`} id={id} />
              ))}
            </div>
          </div>

          {/* Âm ghép */}
          <div className="bg-white/50 p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200/60">
            <p className="text-base font-bold text-stone-700 mb-4 border-b border-stone-200 pb-2">
              Âm ghép (Yoon)
            </p>
            <div className="grid grid-cols-3 gap-y-2.5 gap-x-1.5 md:gap-y-3 md:gap-x-2 justify-items-center w-full max-w-md mx-auto">
              {YOON_ROWS.flat().map((id, index) => (
                <CharCell key={`yoon-${index}`} id={id} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} />

      {/* Modal hướng dẫn cách viết */}
      {strokeChar && (
        <StrokeOrderModal
          char={strokeChar}
          onClose={() => setStrokeChar(null)}
        />
      )}
    </Layout>
  );
}

export default Katakana;
