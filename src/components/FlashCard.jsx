import { useState } from "react";

function FlashCard({ card }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="w-80 h-48 cursor-pointer"
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
          className="absolute w-full h-full bg-red-600 rounded-xl flex items-center justify-center"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="text-6xl text-white font-bold">{card.front}</span>
        </div>

        {/* Mặt sau */}
        <div
          className="absolute w-full h-full bg-green-600 rounded-xl flex items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="text-2xl text-white text-center px-4">
            {card.back}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FlashCard;
