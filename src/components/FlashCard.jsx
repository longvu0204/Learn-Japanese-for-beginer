import { useState } from "react";

function FlashCard({ card }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="w-full max-w-2xl h-72 cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Mặt trước */}
        <div
          className="absolute w-full h-full bg-[#f5e6a8] border-2 border-black rounded-xl flex flex-col items-center justify-center gap-3"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="text-6xl font-bold text-stone-900">
            {card.front}
          </span>
          <span className="text-xs text-stone-500 flex items-center gap-1">
            ✨ Click để lật
          </span>
        </div>

        {/* Mặt sau */}
        <div
          className="absolute w-full h-full bg-[#f5e6a8] border-2 border-black rounded-xl flex items-center justify-center px-8"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="text-2xl text-stone-900 text-center">
            {card.back}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FlashCard;
