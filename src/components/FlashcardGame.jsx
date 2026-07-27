import { useState, useEffect, useRef } from "react";

// Xáo trộn mảng - thuật toán Fisher-Yates
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Từ danh sách thẻ {id, front, back} -> tạo ra 2N ô: mỗi thẻ tách thành 1 ô "front" + 1 ô "back"
function buildTiles(cards) {
  const tiles = [];
  cards.forEach((card) => {
    tiles.push({
      tileKey: `${card.id}-front`,
      cardId: card.id,
      content: card.front,
      side: "front",
    });
    tiles.push({
      tileKey: `${card.id}-back`,
      cardId: card.id,
      content: card.back,
      side: "back",
    });
  });
  return shuffleArray(tiles);
}

function FlashcardGame({ deck, learnedIds, onMarkLearned, onClose }) {
  const [tiles, setTiles] = useState([]);
  const [flippedKeys, setFlippedKeys] = useState([]); // tối đa 2 ô đang lật cùng lúc
  const [matchedCardIds, setMatchedCardIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isChecking, setIsChecking] = useState(false); // khóa thao tác trong lúc đang so 2 ô
  const intervalRef = useRef(null);

  const initGame = () => {
    setTiles(buildTiles(deck.cards));
    setFlippedKeys([]);
    setMatchedCardIds([]);
    setMoves(0);
    setMistakes(0);
    setElapsedSeconds(0);
    setIsChecking(false);
  };

  useEffect(() => {
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.id]);

  const isComplete = matchedCardIds.length === deck.cards.length;

  // Đếm giờ - dừng khi hoàn thành
  useEffect(() => {
    if (isComplete) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isComplete]);

  const handleTileClick = (tile) => {
    if (isChecking) return; // đang bận so sánh 2 ô trước đó, chặn bấm thêm
    if (matchedCardIds.includes(tile.cardId)) return; // ô đã ghép đúng rồi, không cho bấm lại
    if (flippedKeys.includes(tile.tileKey)) return; // đang lật sẵn ô này rồi

    const newFlipped = [...flippedKeys, tile.tileKey];
    setFlippedKeys(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves((prev) => prev + 1);

      const [key1, key2] = newFlipped;
      const tile1 = tiles.find((t) => t.tileKey === key1);
      const tile2 = tiles.find((t) => t.tileKey === key2);
      const isMatch = tile1.cardId === tile2.cardId;

      if (isMatch) {
        // Ghép đúng - giữ lật, khóa lại vĩnh viễn
        setTimeout(() => {
          setMatchedCardIds((prev) => [...prev, tile1.cardId]);
          setFlippedKeys([]);
          setIsChecking(false);
        }, 500);
      } else {
        // Sai - lật úp lại sau 1 giây để người chơi kịp nhìn thấy 2 mặt vừa mở
        setMistakes((prev) => prev + 1);
        setTimeout(() => {
          setFlippedKeys([]);
          setIsChecking(false);
        }, 900);
      }
    }
  };

  const unlearnedMatchedCount = deck.cards.filter(
    (c) => matchedCardIds.includes(c.id) && !learnedIds.includes(c.id),
  ).length;

  const handleMarkAllLearned = () => {
    deck.cards.forEach((c) => {
      if (!learnedIds.includes(c.id)) {
        onMarkLearned(c.id);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#faf6ec] border-2 border-black rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-stone-800 text-lg">
            🎮 Ghép thẻ trí nhớ — {deck.title}
          </h3>
          <button
            onClick={onClose}
            className="text-stone-500 font-bold text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {!isComplete ? (
          <>
            <div className="flex justify-between items-center mb-3 text-sm font-bold text-stone-700">
              <span>⏱ {elapsedSeconds}s</span>
              <span>Lượt: {moves}</span>
              <span>
                Đã ghép: {matchedCardIds.length}/{deck.cards.length}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {tiles.map((tile) => {
                const isFlipped = flippedKeys.includes(tile.tileKey);
                const isMatched = matchedCardIds.includes(tile.cardId);
                const isVisible = isFlipped || isMatched;

                return (
                  <button
                    key={tile.tileKey}
                    onClick={() => handleTileClick(tile)}
                    disabled={isMatched}
                    className={`aspect-square rounded-lg border-2 border-black flex items-center justify-center p-1 text-center transition-colors ${
                      isMatched
                        ? "bg-green-100 border-green-600 cursor-default"
                        : isVisible
                          ? "bg-white"
                          : "bg-[#f5e6a8] hover:bg-[#f0dd8a]"
                    }`}
                  >
                    {isVisible ? (
                      <span
                        className={`font-bold ${tile.side === "front" ? "text-lg sm:text-xl" : "text-xs sm:text-sm"} text-stone-900 break-words`}
                      >
                        {tile.content}
                      </span>
                    ) : (
                      <span className="text-2xl text-stone-400">?</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-2xl font-bold text-stone-800 mb-2">
              🎉 Hoàn thành!
            </p>
            <div className="flex justify-center gap-6 text-sm text-stone-600 mb-6">
              <span>⏱ {elapsedSeconds}s</span>
              <span>Lượt: {moves}</span>
              <span>Sai: {mistakes}</span>
            </div>

            {unlearnedMatchedCount > 0 && (
              <button
                onClick={handleMarkAllLearned}
                className="w-full bg-green-700 text-white p-3 rounded-lg font-bold hover:bg-green-800 mb-3"
              >
                ✓ Đánh dấu {unlearnedMatchedCount} từ vừa ghép là đã thuộc
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={initGame}
                className="flex-1 bg-white border-2 border-black text-stone-800 p-3 rounded-lg font-bold hover:bg-stone-100"
              >
                🔄 Chơi lại
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlashcardGame;
