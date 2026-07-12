import { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import {
  getAllKanji,
  getProgress,
  markAsLearned,
  markAsNotLearned,
} from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

function Kanji() {
  const { currentUser } = useAuth();
  const [allKanji, setAllKanji] = useState([]);
  const [learned, setLearned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const audioRef = useRef(null);

  // Lọc danh sách theo cấp độ đang chọn
  const kanjiList = allKanji.filter((k) => k.jlptLevel === selectedLevel);
  const progressType = `kanji_${selectedLevel}`; // Tách tiến độ riêng theo từng cấp độ

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

  // Tải lại tiến độ mỗi khi đổi cấp độ (vì mỗi cấp độ có progress riêng)
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
    setSelectedIndex(0); // Reset về chữ đầu tiên khi đổi cấp độ
  }, [selectedLevel, currentUser]);

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

  const playAudio = () => {
    if (audioRef.current && kanjiList[selectedIndex]) {
      audioRef.current.src = `/audio/kanji/${kanjiList[selectedIndex].id}.mp3`;
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleLearned = async () => {
    const current = kanjiList[selectedIndex];
    const isLearned = learned.includes(current.id);
    if (isLearned) {
      await markAsNotLearned(currentUser.uid, progressType, current.id);
      setLearned((prev) => prev.filter((id) => id !== current.id));
    } else {
      await markAsLearned(
        currentUser.uid,
        progressType,
        current.id,
        kanjiList.length,
      );
      setLearned((prev) => [...prev, current.id]);
    }
  };

  return (
    <Layout>
      <div className="mb-4">
        <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
          Kanji
        </span>
      </div>

      {/* Tab chọn cấp độ N5-N1 */}
      <div className="flex gap-2 mb-4">
        {LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-4 py-2 rounded-lg font-bold border-2 border-black transition-colors ${
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
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-500">
              {kanjiList.length} chữ
            </span>
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
            <div className="w-48 flex flex-col gap-2 max-h-[500px] overflow-y-auto">
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
              {(() => {
                const current = kanjiList[selectedIndex];
                if (!current) return null;
                const isCurrentLearned = learned.includes(current.id);

                return (
                  <>
                    <div className="relative mb-6">
                      <div className="text-center">
                        <span className="text-8xl font-bold text-stone-900">
                          {current.char}
                        </span>
                      </div>
                      <button
                        onClick={playAudio}
                        className="absolute top-0 right-0 w-10 h-10 flex items-center justify-center bg-white border-2 border-black rounded-lg"
                      >
                        🔊
                      </button>
                    </div>

                    <p className="text-center text-xl font-bold text-stone-800 mb-6">
                      {current.meaning}
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
                        <p className="text-xs text-stone-500 mb-1">Âm On</p>
                        <p className="font-bold text-stone-900">
                          {current.onyomi.length > 0
                            ? current.onyomi.join(", ")
                            : "—"}
                        </p>
                      </div>
                      <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
                        <p className="text-xs text-stone-500 mb-1">Âm Kun</p>
                        <p className="font-bold text-stone-900">
                          {current.kunyomi.length > 0
                            ? current.kunyomi.join(", ")
                            : "—"}
                        </p>
                      </div>
                      <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
                        <p className="text-xs text-stone-500 mb-1">Số nét</p>
                        <p className="font-bold text-stone-900">
                          {current.strokeCount}
                        </p>
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
                              <span className="text-stone-600 text-sm">
                                {ex.meaning}
                              </span>
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
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      <audio ref={audioRef} />
    </Layout>
  );
}

export default Kanji;
