import { useState, useRef } from "react";
import Layout from "../components/Layout";
import { kanjiData } from "../data/kanjiData";

function Kanji() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const audioRef = useRef(null);

  const current = kanjiData[selectedIndex];

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.src = `/audio/kanji/${current.id}.mp3`;
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
          Kanji N5
        </span>
        <span className="ml-2 text-sm text-stone-500">
          {kanjiData.length} chữ
        </span>
      </div>

      <div className="flex gap-6">
        {/* Danh sách Kanji bên trái */}
        <div className="w-48 flex flex-col gap-2">
          {kanjiData.map((k, index) => (
            <button
              key={k.id}
              onClick={() => setSelectedIndex(index)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 border-black transition-colors ${
                index === selectedIndex
                  ? "bg-black text-white"
                  : "bg-[#f5e6a8] text-stone-900 hover:bg-[#f0dd8a]"
              }`}
            >
              <span className="text-2xl font-bold">{k.char}</span>
              <span className="text-sm">{k.meaning}</span>
            </button>
          ))}
        </div>

        {/* Chi tiết bên phải */}
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

          <p className="text-sm font-bold text-stone-700 mb-2">Từ ghép ví dụ</p>
          <div className="flex flex-col gap-2">
            {current.examples.map((ex, i) => (
              <div
                key={i}
                className="bg-white border border-stone-300 rounded-lg p-3 flex justify-between"
              >
                <div>
                  <span className="font-bold text-stone-900">{ex.word}</span>
                  <span className="text-stone-500 text-sm ml-2">
                    ({ex.reading})
                  </span>
                </div>
                <span className="text-stone-600 text-sm">{ex.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <audio ref={audioRef} />
    </Layout>
  );
}

export default Kanji;
