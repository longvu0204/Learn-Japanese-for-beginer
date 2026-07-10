import { useState, useRef } from "react";
import Layout from "../components/Layout";
import { katakanaData } from "../data/katakanaData";

function Katakana() {
  const [selected, setSelected] = useState(null);
  const audioRef = useRef(null);

  const handleCharClick = (item) => {
    setSelected(item);
    if (audioRef.current) {
      audioRef.current.src = `/audio/katakana/${item.audio}`;
      audioRef.current.play().catch((err) => {
        console.log("Không phát được âm thanh:", err);
      });
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
          Bảng chữ cái
        </span>
        <span className="ml-2 text-sm text-stone-500">
          {katakanaData.length} chữ
        </span>
      </div>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">Katakana</h1>

      <div className="grid grid-cols-5 gap-4">
        {katakanaData.map((item) => (
          <button
            key={item.id}
            onClick={() => handleCharClick(item)}
            className={`
              aspect-square rounded-xl border-2 border-black flex flex-col items-center justify-center
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
        ))}
      </div>

      <audio ref={audioRef} />
    </Layout>
  );
}

export default Katakana;
