import { useEffect, useRef, useState } from "react";

function getStrokeOrderUrl(char) {
  const hex = char.codePointAt(0).toString(16).padStart(5, "0");
  return `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg/kanji/${hex}.svg`;
}

function StrokeOrderModal({ char, onClose }) {
  const [paths, setPaths] = useState([]);
  const [numberPositions, setNumberPositions] = useState([]); // Tọa độ đặt số cho từng nét
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const pathRefs = useRef([]);
  const svgUrl = getStrokeOrderUrl(char);

  useEffect(() => {
    async function loadStrokeData() {
      setLoading(true);
      setError(false);
      setPaths([]);
      setNumberPositions([]);
      try {
        const res = await fetch(svgUrl);
        if (!res.ok) throw new Error("HTTP " + res.status);

        const svgText = await res.text();
        const matches = [...svgText.matchAll(/<path[^>]*\sd="([^"]+)"/g)];
        const extractedPaths = matches.map((m) => m[1]);

        if (extractedPaths.length === 0) {
          throw new Error("Không tìm thấy nét vẽ nào trong file");
        }

        setPaths(extractedPaths);
      } catch (err) {
        console.error("Lỗi tải stroke order:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadStrokeData();
  }, [char]);

  useEffect(() => {
    if (loading || error || paths.length === 0) return;

    // Bước 1: đo độ dài + tính điểm bắt đầu thật của từng nét (để đặt số đúng vị trí)
    const positions = pathRefs.current.map((el) => {
      if (!el) return null;
      const startPoint = el.getPointAtLength(0); // Điểm đầu tiên của nét vẽ
      return { x: startPoint.x, y: startPoint.y };
    });
    setNumberPositions(positions);

    // Bước 2: thiết lập animation "vẽ dần" như cũ
    pathRefs.current.forEach((el) => {
      if (!el) return;
      const length = el.getTotalLength();
      el.style.strokeDasharray = length;
      el.style.strokeDashoffset = length;
      el.style.transition = "none";
    });

    requestAnimationFrame(() => {
      pathRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.transition = `stroke-dashoffset 0.6s ease ${i * 0.7}s`;
        el.style.strokeDashoffset = 0;
      });
    });
  }, [loading, error, paths, playKey]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#faf6ec] border-2 border-black rounded-xl p-6 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-stone-800 text-lg">
            Cách viết: {char}
          </h3>
          <button
            onClick={onClose}
            className="text-stone-500 font-bold text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {loading && (
          <p className="text-stone-500 text-center py-12">Đang tải...</p>
        )}

        {!loading && error && (
          <img
            src={svgUrl}
            alt={`Cách viết ${char}`}
            className="w-full aspect-square bg-white border-2 border-black rounded-lg object-contain"
          />
        )}

        {!loading && !error && (
          <>
            <svg
              viewBox="0 0 109 109"
              className="w-full aspect-square bg-white border-2 border-black rounded-lg"
            >
              {paths.map((d, i) => (
                <path
                  key={`path-${playKey}-${i}`}
                  ref={(el) => (pathRefs.current[i] = el)}
                  d={d}
                  fill="none"
                  stroke="#1c1917"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Số thứ tự nét - vẽ đè lên, có nền tròn màu để dễ đọc */}
              {numberPositions.map((pos, i) => {
                if (!pos) return null;
                return (
                  <g key={`num-${playKey}-${i}`}>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="5"
                      fill="#dc2626"
                      opacity="0.85"
                    />
                    <text
                      x={pos.x}
                      y={pos.y}
                      fontSize="7"
                      fill="white"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>

            <button
              onClick={() => setPlayKey((k) => k + 1)}
              className="w-full mt-4 bg-black text-white p-2 rounded-lg font-bold hover:bg-stone-800"
            >
              ▶ Xem lại
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default StrokeOrderModal;
