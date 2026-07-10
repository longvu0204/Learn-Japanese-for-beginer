import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// Đọc file JSON bằng cách thủ công (vì import JSON trực tiếp trong ES Module cần cấu hình thêm)
const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url)),
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const quizzes = [
  {
    id: "n5-quiz-1",
    title: "N5 - Kiểm tra từ vựng cơ bản",
    timeLimit: 60,
    questions: [
      {
        id: "q1",
        question: "水 nghĩa là gì?",
        options: ["Lửa", "Nước", "Cây", "Núi"],
        correctAnswer: "Nước",
      },
      {
        id: "q2",
        question: "「やま」viết bằng Kanji là?",
        options: ["水", "火", "木", "山"],
        correctAnswer: "山",
      },
      {
        id: "q3",
        question: "こんにちは nghĩa là gì?",
        options: ["Tạm biệt", "Xin chào", "Cảm ơn", "Xin lỗi"],
        correctAnswer: "Xin chào",
      },
      {
        id: "q4",
        question: "Số 5 trong tiếng Nhật đọc là?",
        options: ["よん", "ご", "さん", "はち"],
        correctAnswer: "ご",
      },
    ],
  },
];

const hiragana = [
  { id: "a", char: "あ", romaji: "a", audio: "a.mp3" },
  { id: "i", char: "い", romaji: "i", audio: "i.mp3" },
  { id: "u", char: "う", romaji: "u", audio: "u.mp3" },
  { id: "e", char: "え", romaji: "e", audio: "e.mp3" },
  { id: "o", char: "お", romaji: "o", audio: "o.mp3" },
  { id: "ka", char: "か", romaji: "ka", audio: "ka.mp3" },
  { id: "ki", char: "き", romaji: "ki", audio: "ki.mp3" },
  { id: "ku", char: "く", romaji: "ku", audio: "ku.mp3" },
  { id: "ke", char: "け", romaji: "ke", audio: "ke.mp3" },
  { id: "ko", char: "こ", romaji: "ko", audio: "ko.mp3" },
  { id: "sa", char: "さ", romaji: "sa", audio: "sa.mp3" },
  { id: "shi", char: "し", romaji: "shi", audio: "shi.mp3" },
  { id: "su", char: "す", romaji: "su", audio: "su.mp3" },
  { id: "se", char: "せ", romaji: "se", audio: "se.mp3" },
  { id: "so", char: "そ", romaji: "so", audio: "so.mp3" },
  { id: "ta", char: "た", romaji: "ta", audio: "ta.mp3" },
  { id: "chi", char: "ち", romaji: "chi", audio: "chi.mp3" },
  { id: "tsu", char: "つ", romaji: "tsu", audio: "tsu.mp3" },
  { id: "te", char: "て", romaji: "te", audio: "te.mp3" },
  { id: "to", char: "と", romaji: "to", audio: "to.mp3" },
  { id: "na", char: "な", romaji: "na", audio: "na.mp3" },
  { id: "ni", char: "に", romaji: "ni", audio: "ni.mp3" },
  { id: "nu", char: "ぬ", romaji: "nu", audio: "nu.mp3" },
  { id: "ne", char: "ね", romaji: "ne", audio: "ne.mp3" },
  { id: "no", char: "の", romaji: "no", audio: "no.mp3" },
  { id: "ha", char: "は", romaji: "ha", audio: "ha.mp3" },
  { id: "hi", char: "ひ", romaji: "hi", audio: "hi.mp3" },
  { id: "fu", char: "ふ", romaji: "fu", audio: "fu.mp3" },
  { id: "he", char: "へ", romaji: "he", audio: "he.mp3" },
  { id: "ho", char: "ほ", romaji: "ho", audio: "ho.mp3" },
  { id: "ma", char: "ま", romaji: "ma", audio: "ma.mp3" },
  { id: "mi", char: "み", romaji: "mi", audio: "mi.mp3" },
  { id: "mu", char: "む", romaji: "mu", audio: "mu.mp3" },
  { id: "me", char: "め", romaji: "me", audio: "me.mp3" },
  { id: "mo", char: "も", romaji: "mo", audio: "mo.mp3" },
  { id: "ya", char: "や", romaji: "ya", audio: "ya.mp3" },
  { id: "yu", char: "ゆ", romaji: "yu", audio: "yu.mp3" },
  { id: "yo", char: "よ", romaji: "yo", audio: "yo.mp3" },
  { id: "ra", char: "ら", romaji: "ra", audio: "ra.mp3" },
  { id: "ri", char: "り", romaji: "ri", audio: "ri.mp3" },
  { id: "ru", char: "る", romaji: "ru", audio: "ru.mp3" },
  { id: "re", char: "れ", romaji: "re", audio: "re.mp3" },
  { id: "ro", char: "ろ", romaji: "ro", audio: "ro.mp3" },
  { id: "wa", char: "わ", romaji: "wa", audio: "wa.mp3" },
  { id: "wo", char: "を", romaji: "wo", audio: "wo.mp3" },
  { id: "n", char: "ん", romaji: "n", audio: "n.mp3" },
  { id: "ga", char: "が", romaji: "ga", audio: "ga.mp3" },
  { id: "gi", char: "ぎ", romaji: "gi", audio: "gi.mp3" },
  { id: "gu", char: "ぐ", romaji: "gu", audio: "gu.mp3" },
  { id: "ge", char: "げ", romaji: "ge", audio: "ge.mp3" },
  { id: "go", char: "ご", romaji: "go", audio: "go.mp3" },
  { id: "za", char: "ざ", romaji: "za", audio: "za.mp3" },
  { id: "ji", char: "じ", romaji: "ji", audio: "ji.mp3" },
  { id: "zu", char: "ず", romaji: "zu", audio: "zu.mp3" },
  { id: "ze", char: "ぜ", romaji: "ze", audio: "ze.mp3" },
  { id: "zo", char: "ぞ", romaji: "zo", audio: "zo.mp3" },
  { id: "da", char: "だ", romaji: "da", audio: "da.mp3" },
  { id: "ji_di", char: "ぢ", romaji: "ji", audio: "ji_di.mp3" },
  { id: "zu_du", char: "づ", romaji: "zu", audio: "zu_du.mp3" },
  { id: "de", char: "で", romaji: "de", audio: "de.mp3" },
  { id: "do", char: "ど", romaji: "do", audio: "do.mp3" },
  { id: "ba", char: "ば", romaji: "ba", audio: "ba.mp3" },
  { id: "bi", char: "び", romaji: "bi", audio: "bi.mp3" },
  { id: "bu", char: "ぶ", romaji: "bu", audio: "bu.mp3" },
  { id: "be", char: "べ", romaji: "be", audio: "be.mp3" },
  { id: "bo", char: "ぼ", romaji: "bo", audio: "bo.mp3" },
  { id: "pa", char: "ぱ", romaji: "pa", audio: "pa.mp3" },
  { id: "pi", char: "ぴ", romaji: "pi", audio: "pi.mp3" },
  { id: "pu", char: "ぷ", romaji: "pu", audio: "pu.mp3" },
  { id: "pe", char: "ぺ", romaji: "pe", audio: "pe.mp3" },
  { id: "po", char: "ぽ", romaji: "po", audio: "po.mp3" },
  { id: "kya", char: "きゃ", romaji: "kya", audio: "kya.mp3" },
  { id: "kyu", char: "きゅ", romaji: "kyu", audio: "kyu.mp3" },
  { id: "kyo", char: "きょ", romaji: "kyo", audio: "kyo.mp3" },
  { id: "sha", char: "しゃ", romaji: "sha", audio: "sha.mp3" },
  { id: "shu", char: "しゅ", romaji: "shu", audio: "shu.mp3" },
  { id: "sho", char: "しょ", romaji: "sho", audio: "sho.mp3" },
  { id: "cha", char: "ちゃ", romaji: "cha", audio: "cha.mp3" },
  { id: "chu", char: "ちゅ", romaji: "chu", audio: "chu.mp3" },
  { id: "cho", char: "ちょ", romaji: "cho", audio: "cho.mp3" },
  { id: "nya", char: "にゃ", romaji: "nya", audio: "nya.mp3" },
  { id: "nyu", char: "にゅ", romaji: "nyu", audio: "nyu.mp3" },
  { id: "nyo", char: "にょ", romaji: "nyo", audio: "nyo.mp3" },
  { id: "hya", char: "ひゃ", romaji: "hya", audio: "hya.mp3" },
  { id: "hyu", char: "ひゅ", romaji: "hyu", audio: "hyu.mp3" },
  { id: "hyo", char: "ひょ", romaji: "hyo", audio: "hyo.mp3" },
  { id: "mya", char: "みゃ", romaji: "mya", audio: "mya.mp3" },
  { id: "myu", char: "みゅ", romaji: "myu", audio: "myu.mp3" },
  { id: "myo", char: "みょ", romaji: "myo", audio: "myo.mp3" },
  { id: "rya", char: "りゃ", romaji: "rya", audio: "rya.mp3" },
  { id: "ryu", char: "りゅ", romaji: "ryu", audio: "ryu.mp3" },
  { id: "ryo", char: "りょ", romaji: "ryo", audio: "ryo.mp3" },
  { id: "gya", char: "ぎゃ", romaji: "gya", audio: "gya.mp3" },
  { id: "gyu", char: "ぎゅ", romaji: "gyu", audio: "gyu.mp3" },
  { id: "gyo", char: "ぎょ", romaji: "gyo", audio: "gyo.mp3" },
  { id: "ja", char: "じゃ", romaji: "ja", audio: "ja.mp3" },
  { id: "ju", char: "じゅ", romaji: "ju", audio: "ju.mp3" },
  { id: "jo", char: "じょ", romaji: "jo", audio: "jo.mp3" },
  { id: "bya", char: "びゃ", romaji: "bya", audio: "bya.mp3" },
  { id: "byu", char: "びゅ", romaji: "byu", audio: "byu.mp3" },
  { id: "byo", char: "びょ", romaji: "byo", audio: "byo.mp3" },
  { id: "pya", char: "ぴゃ", romaji: "pya", audio: "pya.mp3" },
  { id: "pyu", char: "ぴゅ", romaji: "pyu", audio: "pyu.mp3" },
  { id: "pyo", char: "ぴょ", romaji: "pyo", audio: "pyo.mp3" },
];
const katakana = [
  { id: "a", char: "ア", romaji: "a", audio: "a.mp3" },
  { id: "i", char: "イ", romaji: "i", audio: "i.mp3" },
  { id: "u", char: "ウ", romaji: "u", audio: "u.mp3" },
  { id: "e", char: "エ", romaji: "e", audio: "e.mp3" },
  { id: "o", char: "オ", romaji: "o", audio: "o.mp3" },
  { id: "ka", char: "カ", romaji: "ka", audio: "ka.mp3" },
  { id: "ki", char: "キ", romaji: "ki", audio: "ki.mp3" },
  { id: "ku", char: "ク", romaji: "ku", audio: "ku.mp3" },
  { id: "ke", char: "ケ", romaji: "ke", audio: "ke.mp3" },
  { id: "ko", char: "コ", romaji: "ko", audio: "ko.mp3" },
  { id: "sa", char: "サ", romaji: "sa", audio: "sa.mp3" },
  { id: "shi", char: "シ", romaji: "shi", audio: "shi.mp3" },
  { id: "su", char: "ス", romaji: "su", audio: "su.mp3" },
  { id: "se", char: "セ", romaji: "se", audio: "se.mp3" },
  { id: "so", char: "ソ", romaji: "so", audio: "so.mp3" },
  { id: "ta", char: "タ", romaji: "ta", audio: "ta.mp3" },
  { id: "chi", char: "チ", romaji: "chi", audio: "chi.mp3" },
  { id: "tsu", char: "ツ", romaji: "tsu", audio: "tsu.mp3" },
  { id: "te", char: "テ", romaji: "te", audio: "te.mp3" },
  { id: "to", char: "ト", romaji: "to", audio: "to.mp3" },
  { id: "na", char: "ナ", romaji: "na", audio: "na.mp3" },
  { id: "ni", char: "ニ", romaji: "ni", audio: "ni.mp3" },
  { id: "nu", char: "ヌ", romaji: "nu", audio: "nu.mp3" },
  { id: "ne", char: "ネ", romaji: "ne", audio: "ne.mp3" },
  { id: "no", char: "ノ", romaji: "no", audio: "no.mp3" },
  { id: "ha", char: "ハ", romaji: "ha", audio: "ha.mp3" },
  { id: "hi", char: "ヒ", romaji: "hi", audio: "hi.mp3" },
  { id: "fu", char: "フ", romaji: "fu", audio: "fu.mp3" },
  { id: "he", char: "ヘ", romaji: "he", audio: "he.mp3" },
  { id: "ho", char: "ホ", romaji: "ho", audio: "ho.mp3" },
  { id: "ma", char: "マ", romaji: "ma", audio: "ma.mp3" },
  { id: "mi", char: "ミ", romaji: "mi", audio: "mi.mp3" },
  { id: "mu", char: "ム", romaji: "mu", audio: "mu.mp3" },
  { id: "me", char: "メ", romaji: "me", audio: "me.mp3" },
  { id: "mo", char: "モ", romaji: "mo", audio: "mo.mp3" },
  { id: "ya", char: "ヤ", romaji: "ya", audio: "ya.mp3" },
  { id: "yu", char: "ユ", romaji: "yu", audio: "yu.mp3" },
  { id: "yo", char: "ヨ", romaji: "yo", audio: "yo.mp3" },
  { id: "ra", char: "ラ", romaji: "ra", audio: "ra.mp3" },
  { id: "ri", char: "リ", romaji: "ri", audio: "ri.mp3" },
  { id: "ru", char: "ル", romaji: "ru", audio: "ru.mp3" },
  { id: "re", char: "レ", romaji: "re", audio: "re.mp3" },
  { id: "ro", char: "ロ", romaji: "ro", audio: "ro.mp3" },
  { id: "wa", char: "ワ", romaji: "wa", audio: "wa.mp3" },
  { id: "wo", char: "ヲ", romaji: "wo", audio: "wo.mp3" },
  { id: "n", char: "ン", romaji: "n", audio: "n.mp3" },
  { id: "ga", char: "ガ", romaji: "ga", audio: "ga.mp3" },
  { id: "gi", char: "ギ", romaji: "gi", audio: "gi.mp3" },
  { id: "gu", char: "グ", romaji: "gu", audio: "gu.mp3" },
  { id: "ge", char: "ゲ", romaji: "ge", audio: "ge.mp3" },
  { id: "go", char: "ゴ", romaji: "go", audio: "go.mp3" },
  { id: "za", char: "ザ", romaji: "za", audio: "za.mp3" },
  { id: "ji", char: "ジ", romaji: "ji", audio: "ji.mp3" },
  { id: "zu", char: "ズ", romaji: "zu", audio: "zu.mp3" },
  { id: "ze", char: "ゼ", romaji: "ze", audio: "ze.mp3" },
  { id: "zo", char: "ゾ", romaji: "zo", audio: "zo.mp3" },
  { id: "da", char: "ダ", romaji: "da", audio: "da.mp3" },
  { id: "ji_di", char: "ヂ", romaji: "ji", audio: "ji_di.mp3" },
  { id: "zu_du", char: "ヅ", romaji: "zu", audio: "zu_du.mp3" },
  { id: "de", char: "デ", romaji: "de", audio: "de.mp3" },
  { id: "do", char: "ド", romaji: "do", audio: "do.mp3" },
  { id: "ba", char: "バ", romaji: "ba", audio: "ba.mp3" },
  { id: "bi", char: "ビ", romaji: "bi", audio: "bi.mp3" },
  { id: "bu", char: "ブ", romaji: "bu", audio: "bu.mp3" },
  { id: "be", char: "ベ", romaji: "be", audio: "be.mp3" },
  { id: "bo", char: "ボ", romaji: "bo", audio: "bo.mp3" },
  { id: "pa", char: "パ", romaji: "pa", audio: "pa.mp3" },
  { id: "pi", char: "ピ", romaji: "pi", audio: "pi.mp3" },
  { id: "pu", char: "プ", romaji: "pu", audio: "pu.mp3" },
  { id: "pe", char: "ペ", romaji: "pe", audio: "pe.mp3" },
  { id: "po", char: "ポ", romaji: "po", audio: "po.mp3" },
  { id: "kya", char: "キャ", romaji: "kya", audio: "kya.mp3" },
  { id: "kyu", char: "キュ", romaji: "kyu", audio: "kyu.mp3" },
  { id: "kyo", char: "キョ", romaji: "kyo", audio: "kyo.mp3" },
  { id: "sha", char: "シャ", romaji: "sha", audio: "sha.mp3" },
  { id: "shu", char: "シュ", romaji: "shu", audio: "shu.mp3" },
  { id: "sho", char: "ショ", romaji: "sho", audio: "sho.mp3" },
  { id: "cha", char: "チャ", romaji: "cha", audio: "cha.mp3" },
  { id: "chu", char: "チュ", romaji: "chu", audio: "chu.mp3" },
  { id: "cho", char: "チョ", romaji: "cho", audio: "cho.mp3" },
  { id: "nya", char: "ニャ", romaji: "nya", audio: "nya.mp3" },
  { id: "nyu", char: "ニュ", romaji: "nyu", audio: "nyu.mp3" },
  { id: "nyo", char: "ニョ", romaji: "nyo", audio: "nyo.mp3" },
  { id: "hya", char: "ヒャ", romaji: "hya", audio: "hya.mp3" },
  { id: "hyu", char: "ヒュ", romaji: "hyu", audio: "hyu.mp3" },
  { id: "hyo", char: "ヒョ", romaji: "hyo", audio: "hyo.mp3" },
  { id: "mya", char: "ミャ", romaji: "mya", audio: "mya.mp3" },
  { id: "myu", char: "ミュ", romaji: "myu", audio: "myu.mp3" },
  { id: "myo", char: "ミョ", romaji: "myo", audio: "myo.mp3" },
  { id: "rya", char: "リャ", romaji: "rya", audio: "rya.mp3" },
  { id: "ryu", char: "リュ", romaji: "ryu", audio: "ryu.mp3" },
  { id: "ryo", char: "リョ", romaji: "ryo", audio: "ryo.mp3" },
  { id: "gya", char: "ギャ", romaji: "gya", audio: "gya.mp3" },
  { id: "gyu", char: "ギュ", romaji: "gyu", audio: "gyu.mp3" },
  { id: "gyo", char: "ギョ", romaji: "gyo", audio: "gyo.mp3" },
  { id: "ja", char: "ジャ", romaji: "ja", audio: "ja.mp3" },
  { id: "ju", char: "ジュ", romaji: "ju", audio: "ju.mp3" },
  { id: "jo", char: "ジョ", romaji: "jo", audio: "jo.mp3" },
  { id: "bya", char: "ビャ", romaji: "bya", audio: "bya.mp3" },
  { id: "byu", char: "ビュ", romaji: "byu", audio: "byu.mp3" },
  { id: "byo", char: "ビョ", romaji: "byo", audio: "byo.mp3" },
  { id: "pya", char: "ピャ", romaji: "pya", audio: "pya.mp3" },
  { id: "pyu", char: "ピュ", romaji: "pyu", audio: "pyu.mp3" },
  { id: "pyo", char: "ピョ", romaji: "pyo", audio: "pyo.mp3" },
];

const kanji = [
  {
    id: "k1",
    char: "水",
    meaning: "Nước",
    onyomi: ["スイ"],
    kunyomi: ["みず"],
    strokeCount: 4,
    jlptLevel: "N5",
    examples: [
      { word: "水曜日", reading: "すいようび", meaning: "Thứ Tư" },
      { word: "水道", reading: "すいどう", meaning: "Đường nước" },
    ],
  },
  {
    id: "k2",
    char: "火",
    meaning: "Lửa",
    onyomi: ["カ"],
    kunyomi: ["ひ"],
    strokeCount: 4,
    jlptLevel: "N5",
    examples: [
      { word: "火曜日", reading: "かようび", meaning: "Thứ Ba" },
      { word: "花火", reading: "はなび", meaning: "Pháo hoa" },
    ],
  },
  {
    id: "k3",
    char: "木",
    meaning: "Cây, gỗ",
    onyomi: ["モク", "ボク"],
    kunyomi: ["き"],
    strokeCount: 4,
    jlptLevel: "N5",
    examples: [
      { word: "木曜日", reading: "もくようび", meaning: "Thứ Năm" },
      { word: "木造", reading: "もくぞう", meaning: "Kết cấu gỗ" },
    ],
  },
  {
    id: "k4",
    char: "山",
    meaning: "Núi",
    onyomi: ["サン"],
    kunyomi: ["やま"],
    strokeCount: 3,
    jlptLevel: "N5",
    examples: [
      { word: "山道", reading: "やまみち", meaning: "Đường núi" },
      { word: "富士山", reading: "ふじさん", meaning: "Núi Phú Sĩ" },
    ],
  },
  {
    id: "k5",
    char: "川",
    meaning: "Sông",
    onyomi: ["セン"],
    kunyomi: ["かわ"],
    strokeCount: 3,
    jlptLevel: "N5",
    examples: [
      { word: "川岸", reading: "かわぎし", meaning: "Bờ sông" },
      { word: "河川", reading: "かせん", meaning: "Sông ngòi" },
    ],
  },
];

const flashcardDecks = [
  {
    id: "n5-basic-1",
    title: "N5 - Từ vựng cơ bản 1",
    cards: [
      { id: "c1", front: "水", back: "みず (mizu) - Nước" },
      { id: "c2", front: "火", back: "ひ (hi) - Lửa" },
      { id: "c3", front: "木", back: "き (ki) - Cây" },
      { id: "c4", front: "山", back: "やま (yama) - Núi" },
      { id: "c5", front: "川", back: "かわ (kawa) - Sông" },
    ],
  },
];

async function seed() {
  console.log("Đang seed quizzes...");
  for (const quiz of quizzes) {
    const { id, ...data } = quiz;
    await db.collection("quizzes").doc(id).set(data);
    console.log(`✓Đã thêm quiz: ${id}`);
  }

  console.log("Đang seed flashcardDecks...");
  for (const deck of flashcardDecks) {
    const { id, ...data } = deck;
    await db.collection("flashcardDecks").doc(id).set(data);
    console.log(`✓ Đã thêm deck: ${id}`);
  }

  console.log("Đang seed hiragana...");
  for (const item of hiragana) {
    const { id, ...data } = item;
    await db.collection("hiragana").doc(id).set(data);
  }
  console.log(`✓ Đã thêm ${hiragana.length} chữ hiragana`);

  console.log("Đang seed katakana...");
  for (const item of katakana) {
    const { id, ...data } = item;
    await db.collection("katakana").doc(id).set(data);
  }
  console.log(`✓ Đã thêm ${katakana.length} chữ katakana`);

  console.log("Đang seed kanji...");
  for (const item of kanji) {
    const { id, ...data } = item;
    await db.collection("kanji").doc(id).set(data);
  }
  console.log(`✓ Đã thêm ${kanji.length} chữ kanji`);

  console.log("Hoàn thành!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Lỗi khi seed dữ liệu:", err);
  process.exit(1);
});
