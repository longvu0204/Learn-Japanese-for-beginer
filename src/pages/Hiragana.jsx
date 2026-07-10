import { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import {
  getAllHiragana,
  getProgress,
  markAsLearned,
  markAsNotLearned,
} from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";

function Hiragana() {
  const { currentUser } = useAuth();
  const [chars, setChars] = useState([]);
  const [learned, setLearned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllHiragana();
        const progress = await getProgress(currentUser.uid, "hiragana");
        setChars(data);
        setLearned(progress.learned);
      } catch (err) {
        console.error("Lỗi tải dữ liệu Hiragana:", err);
      } finally {
        setLoading(false); // Luôn tắt loading dù thành công hay lỗi
      }
    }
    loadData();
  }, [currentUser]);

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

      {/* Thanh tiến độ */}
      <div className="w-full h-2 bg-stone-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-green-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">Hiragana</h1>

      <div className="grid grid-cols-5 gap-4">
        {chars.map((item) => {
          const isLearned = learned.includes(item.id);
          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => handleCharClick(item)}
                className={`
                  w-full aspect-square rounded-xl border-2 border-black flex flex-col items-center justify-center
                  transition-colors
                  ${
                    selected?.id === item.id
                      ? "bg-black text-white"
                      : "bg-[#f5e6a8] text-stone-900 hover:bg-[#f0dd8a]"
                  }
                `}
              >
                <span className="text-4xl font-bold">{item.char}</span>
                <span
                  className={`text-sm mt-1 ${selected?.id === item.id ? "text-stone-300" : "text-stone-600"}`}
                >
                  {item.romaji}
                </span>
              </button>

              {/* Checkbox đã thuộc, góc trên phải mỗi ô */}
              <button
                onClick={() => toggleLearned(item)}
                className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold ${
                  isLearned
                    ? "bg-green-600 text-white"
                    : "bg-white text-stone-400"
                }`}
              >
                ✓
              </button>
            </div>
          );
        })}
      </div>

      <audio ref={audioRef} />
    </Layout>
  );
}

export default Hiragana;
