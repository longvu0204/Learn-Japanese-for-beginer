import { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { katakanaData } from "../data/katakanaData"; // Import 1 mảng duy nhất

function Katakana() {
  const [selected, setSelected] = useState(null);
  const audioRef = useRef(null);

  const handleCharClick = (item) => {
    if (!item) return;
    setSelected(item);

    if (audioRef.current) {
      // Gọi file âm thanh từ thư mục public/audio/katakana/
      audioRef.current.src = `/audio/katakana/${item.audio}`;
      audioRef.current.play().catch((err) => {
        console.log("Không phát được âm thanh:", err);
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center lg:text-left">
          Bảng Chữ Cái Katakana
        </h1>

        {/* BỐ CỤC CHIA THÀNH 2 PHẦN TRÁI - PHẢI */}
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* ================= CỘT TRÁI: ÂM CƠ BẢN ================= */}
          <div className="w-full lg:w-1/2 bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
            <h2 className="text-xl font-semibold text-blue-400 mb-4 border-b border-slate-700 pb-2">
              Âm Cơ Bản (清音)
            </h2>

            {/* Hàng A -> Ma (Index 0 đến 34) */}
            <div className="grid grid-cols-5 gap-3 mb-3">
              {katakanaData.slice(0, 35).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleCharClick(item)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${selected?.id === item.id ? "bg-blue-600 scale-95" : "bg-slate-800 hover:bg-slate-700"}`}
                >
                  <span className="text-3xl font-medium">{item.char}</span>
                  <span className="text-xs text-slate-400 mt-1">
                    {item.romaji}
                  </span>
                </button>
              ))}
            </div>

            {/* Hàng Ya Yu Yo (Bốc thủ công index 35, 36, 37 kèm ô trống) */}
            <div className="grid grid-cols-5 gap-3 mb-3">
              <button
                onClick={() => handleCharClick(katakanaData[35])}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${selected?.id === katakanaData[35].id ? "bg-blue-600" : "bg-slate-800 hover:bg-slate-700"}`}
              >
                <span className="text-3xl font-medium">
                  {katakanaData[35].char}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {katakanaData[35].romaji}
                </span>
              </button>
              <div className="aspect-square"></div>
              <button
                onClick={() => handleCharClick(katakanaData[36])}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${selected?.id === katakanaData[36].id ? "bg-blue-600" : "bg-slate-800 hover:bg-slate-700"}`}
              >
                <span className="text-3xl font-medium">
                  {katakanaData[36].char}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {katakanaData[36].romaji}
                </span>
              </button>
              <div className="aspect-square"></div>
              <button
                onClick={() => handleCharClick(katakanaData[37])}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${selected?.id === katakanaData[37].id ? "bg-blue-600" : "bg-slate-800 hover:bg-slate-700"}`}
              >
                <span className="text-3xl font-medium">
                  {katakanaData[37].char}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {katakanaData[37].romaji}
                </span>
              </button>
            </div>

            {/* Hàng Ra -> Ro (Index 38 đến 42) */}
            <div className="grid grid-cols-5 gap-3 mb-3">
              {katakanaData.slice(38, 43).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleCharClick(item)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${selected?.id === item.id ? "bg-blue-600 scale-95" : "bg-slate-800 hover:bg-slate-700"}`}
                >
                  <span className="text-3xl font-medium">{item.char}</span>
                  <span className="text-xs text-slate-400 mt-1">
                    {item.romaji}
                  </span>
                </button>
              ))}
            </div>

            {/* Hàng Wa Wo N (Bốc thủ công index 43, 44, 45 kèm ô trống) */}
            <div className="grid grid-cols-5 gap-3">
              <button
                onClick={() => handleCharClick(katakanaData[43])}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${selected?.id === katakanaData[43].id ? "bg-blue-600" : "bg-slate-800 hover:bg-slate-700"}`}
              >
                <span className="text-3xl font-medium">
                  {katakanaData[43].char}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {katakanaData[43].romaji}
                </span>
              </button>
              <div className="aspect-square"></div>
              <button
                onClick={() => handleCharClick(katakanaData[44])}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${selected?.id === katakanaData[44].id ? "bg-blue-600" : "bg-slate-800 hover:bg-slate-700"}`}
              >
                <span className="text-3xl font-medium">
                  {katakanaData[44].char}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {katakanaData[44].romaji}
                </span>
              </button>
              <div className="aspect-square"></div>
              <button
                onClick={() => handleCharClick(katakanaData[45])}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${selected?.id === katakanaData[45].id ? "bg-blue-600" : "bg-slate-800 hover:bg-slate-700"}`}
              >
                <span className="text-3xl font-medium">
                  {katakanaData[45].char}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {katakanaData[45].romaji}
                </span>
              </button>
            </div>
          </div>

          {/* ================= CỘT PHẢI: BIẾN ÂM & ÂM GHÉP ================= */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            {/* PHẦN BIẾN ÂM (Index từ 46 đến 70) */}
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
              <h2 className="text-xl font-semibold text-emerald-400 mb-4 border-b border-slate-700 pb-2">
                Biến Âm (濁音 / 半濁音)
              </h2>
              <div className="grid grid-cols-5 gap-3">
                {katakanaData.slice(46, 71).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCharClick(item)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${selected?.id === item.id ? "bg-blue-600 scale-95" : "bg-slate-800 hover:bg-slate-700"}`}
                  >
                    <span className="text-3xl font-medium">{item.char}</span>
                    <span className="text-xs text-slate-400 mt-1">
                      {item.romaji}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* PHẦN ÂM GHÉP (Index từ 71 đến hết mảng) */}
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
              <h2 className="text-xl font-semibold text-amber-400 mb-4 border-b border-slate-700 pb-2">
                Âm Ghép (拗音)
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {katakanaData.slice(71).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCharClick(item)}
                    className={`py-3 rounded-lg flex flex-col items-center justify-center transition-all ${selected?.id === item.id ? "bg-blue-600 scale-95" : "bg-slate-800 hover:bg-slate-700"}`}
                  >
                    <span className="text-2xl font-medium">{item.char}</span>
                    <span className="text-xs text-slate-400 mt-1">
                      {item.romaji}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <audio ref={audioRef} />
      </div>
    </div>
  );
}

export default Katakana;
