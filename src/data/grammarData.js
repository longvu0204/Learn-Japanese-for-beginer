export const grammarData = [
  {
    id: "g1",
    title: "〜は〜です",
    jlptLevel: "N5",
    meaning: "A là B (câu khẳng định cơ bản)",
    structure: "Danh từ 1 + は + Danh từ 2 + です",
    explanation:
      "Dùng để giới thiệu, khẳng định A là B. です là dạng lịch sự của động từ 'là'.",
    examples: [
      {
        jp: "私は学生です。",
        reading: "わたしはがくせいです。",
        vi: "Tôi là học sinh.",
      },
      {
        jp: "これは本です。",
        reading: "これはほんです。",
        vi: "Đây là quyển sách.",
      },
    ],
  },
  {
    id: "g2",
    title: "〜ではありません",
    jlptLevel: "N5",
    meaning: "Không phải là (phủ định của です)",
    structure: "Danh từ 1 + は + Danh từ 2 + ではありません",
    explanation:
      "Dạng phủ định lịch sự của です, dùng để nói A không phải là B.",
    examples: [
      {
        jp: "私は先生ではありません。",
        reading: "わたしはせんせいではありません。",
        vi: "Tôi không phải là giáo viên.",
      },
    ],
  },
  {
    id: "g3",
    title: "〜があります／います",
    jlptLevel: "N5",
    meaning: "Có (tồn tại)",
    structure:
      "Nơi chốn + に + Danh từ + があります (vật) / がいます (người, động vật)",
    explanation:
      "あります dùng cho vật vô tri, います dùng cho người và động vật.",
    examples: [
      {
        jp: "机の上に本があります。",
        reading: "つくえのうえにほんがあります。",
        vi: "Trên bàn có quyển sách.",
      },
      {
        jp: "教室に学生がいます。",
        reading: "きょうしつにがくせいがいます。",
        vi: "Trong lớp có học sinh.",
      },
    ],
  },
];
