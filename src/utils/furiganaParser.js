// Phân tích cú pháp: từ[âm đọc] -> hiển thị furigana thường
//                     **từ[âm đọc]** -> hiển thị furigana + đánh dấu là từ cần kiểm tra (gạch chân)
// Trả về mảng các "segment" để render, và mảng riêng các từ cần quiz (đã khử trùng lặp theo "word")

const KATAKANA_REGEX = /^[\u30A0-\u30FFー]+$/; // Dải Unicode Katakana
const KANJI_REGEX = /[\u4E00-\u9FFF]/; // Có chứa ít nhất 1 ký tự Kanji

export function parsePassage(rawText) {
  const segments = [];
  const quizWordsMap = new Map(); // dùng Map để tự loại trùng theo "word"

  // Regex bắt 2 dạng: **word[reading]** (ưu tiên trước) hoặc word[reading] thường
  const regex = /\*\*([^\[\]*]+)\[([^\[\]]+)\]\*\*|([^\[\]*]+)\[([^\[\]]+)\]/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(rawText)) !== null) {
    // Phần text thường nằm TRƯỚC chỗ khớp (ví dụ khoảng trắng, trợ từ は/を/に...)
    if (match.index > lastIndex) {
      segments.push({
        type: "plain",
        text: rawText.slice(lastIndex, match.index),
      });
    }

    const isQuizWord = match[1] !== undefined;
    const word = isQuizWord ? match[1] : match[3];
    const reading = isQuizWord ? match[2] : match[4];

    segments.push({ type: "ruby", word, reading, isQuizWord });

    if (isQuizWord && !quizWordsMap.has(word)) {
      const category = KATAKANA_REGEX.test(word)
        ? "katakana"
        : KANJI_REGEX.test(word)
          ? "kanji"
          : "other";
      quizWordsMap.set(word, { word, reading, category });
    }

    lastIndex = regex.lastIndex;
  }

  // Phần text còn sót lại ở cuối chuỗi
  if (lastIndex < rawText.length) {
    segments.push({ type: "plain", text: rawText.slice(lastIndex) });
  }

  return {
    segments,
    quizWords: Array.from(quizWordsMap.values()),
  };
}
