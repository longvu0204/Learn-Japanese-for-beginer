import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import {
  getAllKanji,
  getProgress,
  markAsLearned,
  markAsNotLearned,
} from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";
import StrokeOrderModal from "../components/StrokeOrderModal";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

function Kanji() {
  const { currentUser } = useAuth();
  const [allKanji, setAllKanji] = useState([]);
  const [learned, setLearned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [detailChar, setDetailChar] = useState(null); // Kanji đang mở popup chi tiết
  const [showStroke, setShowStroke] = useState(false);
  const audioRef = useRef(null);

  const kanjiList = allKanji.filter((k) => k.jlptLevel === selectedLevel);
  const progressType = `kanji_${selectedLevel}`;

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllKanji();
        setAllKanji(data);
      } catch (err) {
        console.error("Lỗi tải kanji:", err);
      }
      setLoading(false);
    }
    loadData();
  }, [currentUser]);

  useEffect(() => {
    async function loadProgress() {
      try {
        const progress = await getProgress(currentUser.uid, progressType);
        setLearned(progress.learned);
      } catch (err) {
        setLearned([]);
      }
    }
    if (currentUser) loadProgress();
  }, [selectedLevel, currentUser]);

  const playAudio = (item) => {
    if (audioRef.current) {
      audioRef.current.src = `/audio/kanji/${item.id}.mp3`;
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleLearned = async (item) => {
    const isLearned = learned.includes(item.id);
    if (isLearned) {
      await markAsNotLearned(currentUser.uid, progressType, item.id);
      setLearned((prev) => prev.filter((id) => id !== item.id));
    } else {
      await markAsLearned(
        currentUser.uid,
        progressType,
        item.id,
        kanjiList.length,
      );
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
    kanjiList.length > 0
      ? Math.round((learned.length / kanjiList.length) * 100)
      : 0;

  return (
    <Layout>
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            Kanji
          </span>
          <span className="ml-2 text-sm text-stone-500">
            {kanjiList.length} chữ
          </span>
        </div>
        <span className="text-sm font-bold text-stone-700">
          Đã thuộc: {learned.length}/{kanjiList.length} ({progressPercent}%)
        </span>
      </div>

      <div className="w-full h-2 bg-stone-200 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-green-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Tab chọn cấp độ */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-bold border-2 border-black transition-colors ${
              selectedLevel === level
                ? "bg-black text-white"
                : "bg-[#f5e6a8] text-stone-800 hover:bg-[#f0dd8a]"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {kanjiList.length === 0 ? (
        <p className="text-stone-600">
          Chưa có dữ liệu Kanji cho cấp độ {selectedLevel}. Vào Admin Dashboard
          để thêm.
        </p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {kanjiList.map((item) => {
            const isLearned = learned.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => setDetailChar(item)}
                className={`relative aspect-square rounded-lg border-2 border-black flex items-center justify-center transition-colors ${
                  isLearned
                    ? "bg-green-100 hover:bg-green-200"
                    : "bg-[#f5e6a8] hover:bg-[#f0dd8a]"
                }`}
              >
                <span className="text-xl sm:text-2xl font-bold text-stone-900">
                  {item.char}
                </span>
                {isLearned && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-green-600 rounded-full border border-black flex items-center justify-center text-white text-[8px] font-bold">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <audio ref={audioRef} />

      {/* Popup chi tiết - hiện khi bấm vào 1 ô Kanji trong lưới */}
      {detailChar && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailChar(null)}
        >
          <div
            className="bg-[#faf6ec] border-2 border-black rounded-xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-center flex-1">
                <span className="text-6xl sm:text-7xl font-bold text-stone-900">
                  {detailChar.char}
                </span>
              </div>
              <button
                onClick={() => setDetailChar(null)}
                className="text-stone-500 font-bold text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-center text-lg font-bold text-stone-800 mb-4">
              {detailChar.meaning}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white border-2 border-black rounded-lg p-2 text-center">
                <p className="text-[10px] text-stone-500 mb-1">Âm On</p>
                <p className="font-bold text-stone-900 text-sm">
                  {detailChar.onyomi.length > 0
                    ? detailChar.onyomi.join(", ")
                    : "—"}
                </p>
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-2 text-center">
                <p className="text-[10px] text-stone-500 mb-1">Âm Kun</p>
                <p className="font-bold text-stone-900 text-sm">
                  {detailChar.kunyomi.length > 0
                    ? detailChar.kunyomi.join(", ")
                    : "—"}
                </p>
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-2 text-center">
                <p className="text-[10px] text-stone-500 mb-1">Số nét</p>
                <p className="font-bold text-stone-900 text-sm">
                  {detailChar.strokeCount}
                </p>
              </div>
            </div>

            {detailChar.examples?.length > 0 && (
              <>
                <p className="text-sm font-bold text-stone-700 mb-2">
                  Từ ghép ví dụ
                </p>
                <div className="flex flex-col gap-2 mb-4">
                  {detailChar.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="bg-white border border-stone-300 rounded-lg p-2 flex justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-stone-900">
                          {ex.word}
                        </span>
                        <span className="text-stone-500 text-xs ml-2">
                          ({ex.reading})
                        </span>
                      </div>
                      <span className="text-stone-600 text-xs flex-shrink-0">
                        {ex.meaning}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => playAudio(detailChar)}
                className="flex-1 bg-white border-2 border-black p-2 rounded-lg font-bold hover:bg-stone-100"
              >
                🔊 Nghe
              </button>
              <button
                onClick={() => setShowStroke(true)}
                className="flex-1 bg-white border-2 border-black p-2 rounded-lg font-bold hover:bg-stone-100"
              >
                ✍️ Cách viết
              </button>
            </div>

            <button
              onClick={() => toggleLearned(detailChar)}
              className={`w-full p-3 rounded-lg font-bold border-2 border-black ${
                learned.includes(detailChar.id)
                  ? "bg-green-700 text-white"
                  : "bg-white text-stone-800 hover:bg-stone-100"
              }`}
            >
              {learned.includes(detailChar.id)
                ? "✓ Đã thuộc"
                : "Đánh dấu đã thuộc"}
            </button>
          </div>
        </div>
      )}

      {showStroke && detailChar && (
        <StrokeOrderModal
          char={detailChar.char}
          onClose={() => setShowStroke(false)}
        />
      )}
    </Layout>
  );
}

export default Kanji;
