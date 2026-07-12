import { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import {
  getAllKanji,
  getProgress,
  markAsLearned,
  markAsNotLearned,
} from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";
import StrokeOrderModal from "../components/StrokeOrderModal";

function Kanji() {
  const { currentUser } = useAuth();
  const [kanjiList, setKanjiList] = useState([]);
  const [learned, setLearned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const audioRef = useRef(null);
  const [showStroke, setShowStroke] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllKanji();
        setKanjiList(data);
      } catch (err) {
        console.error("Lỗi tải kanji:", err);
      }

      try {
        const progress = await getProgress(currentUser.uid, "kanji");
        setLearned(progress.learned);
      } catch (err) {
        console.error("Lỗi tải tiến độ:", err);
        setLearned([]);
      }

      setLoading(false);
    }
    loadData();
  }, [currentUser]);

  if (loading) {
    return (
      <Layout>
        <p className="text-stone-600">Đang tải dữ liệu...</p>
      </Layout>
    );
  }

  if (kanjiList.length === 0) {
    return (
      <Layout>
        <p className="text-stone-600">Chưa có dữ liệu Kanji.</p>
      </Layout>
    );
  }

  const current = kanjiList[selectedIndex];
  const isCurrentLearned = learned.includes(current.id);
  const progressPercent = Math.round((learned.length / kanjiList.length) * 100);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.src = `/audio/kanji/${current.id}.mp3`;
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleLearned = async () => {
    if (isCurrentLearned) {
      await markAsNotLearned(currentUser.uid, "kanji", current.id);
      setLearned((prev) => prev.filter((id) => id !== current.id));
    } else {
      await markAsLearned(
        currentUser.uid,
        "kanji",
        current.id,
        kanjiList.length,
      );
      setLearned((prev) => [...prev, current.id]);
    }
  };

  return (
    <Layout>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            Kanji N5
          </span>
          <span className="ml-2 text-sm text-stone-500">
            {kanjiList.length} chữ
          </span>
        </div>
        <span className="text-sm font-bold text-stone-700">
          Đã thuộc: {learned.length}/{kanjiList.length} ({progressPercent}%)
        </span>
      </div>

      <div className="w-full h-2 bg-stone-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-green-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex gap-6">
        <div className="w-48 flex flex-col gap-2">
          {kanjiList.map((k, index) => {
            const isLearned = learned.includes(k.id);
            return (
              <button
                key={k.id}
                onClick={() => setSelectedIndex(index)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 border-black transition-colors relative ${
                  index === selectedIndex
                    ? "bg-black text-white"
                    : "bg-[#f5e6a8] text-stone-900 hover:bg-[#f0dd8a]"
                }`}
              >
                <span className="text-2xl font-bold">{k.char}</span>
                <span className="text-sm">{k.meaning}</span>
                {isLearned && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-600 text-white rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 bg-[#f5e6a8] border-2 border-black rounded-xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="text-center flex-1">
              <span className="text-8xl font-bold text-stone-900">
                {current.char}
              </span>
            </div>
            <button
              onClick={playAudio}
              className="w-10 h-10 flex items-center justify-center bg-white border-2 border-black rounded-lg"
            >
              🔊
            </button>
            <button
              onClick={() => setShowStroke(true)}
              className="w-10 h-10 flex items-center justify-center bg-white border-2 border-black rounded-lg"
              title="Xem cách viết"
            >
              ✍️
            </button>
          </div>

          <p className="text-center text-xl font-bold text-stone-800 mb-6">
            {current.meaning}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
              <p className="text-xs text-stone-500 mb-1">Âm On</p>
              <p className="font-bold text-stone-900">
                {current.onyomi.join(", ")}
              </p>
            </div>
            <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
              <p className="text-xs text-stone-500 mb-1">Âm Kun</p>
              <p className="font-bold text-stone-900">
                {current.kunyomi.join(", ")}
              </p>
            </div>
            <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
              <p className="text-xs text-stone-500 mb-1">Số nét</p>
              <p className="font-bold text-stone-900">{current.strokeCount}</p>
            </div>
          </div>

          {current.examples?.length > 0 && (
            <>
              <p className="text-sm font-bold text-stone-700 mb-2">
                Từ ghép ví dụ
              </p>
              <div className="flex flex-col gap-2 mb-6">
                {current.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="bg-white border border-stone-300 rounded-lg p-3 flex justify-between"
                  >
                    <div>
                      <span className="font-bold text-stone-900">
                        {ex.word}
                      </span>
                      <span className="text-stone-500 text-sm ml-2">
                        ({ex.reading})
                      </span>
                    </div>
                    <span className="text-stone-600 text-sm">{ex.meaning}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <button
            onClick={toggleLearned}
            className={`w-full p-3 rounded-lg font-bold border-2 border-black ${
              isCurrentLearned
                ? "bg-green-700 text-white"
                : "bg-white text-stone-800 hover:bg-stone-100"
            }`}
          >
            {isCurrentLearned ? "✓ Đã thuộc" : "Đánh dấu đã thuộc"}
          </button>
        </div>
      </div>

      <audio ref={audioRef} />
      {/* Cuối component, trước </Layout> */}
      {showStroke && (
        <StrokeOrderModal
          char={current.char}
          onClose={() => setShowStroke(false)}
        />
      )}
    </Layout>
  );
}

export default Kanji;
