import { useState, useEffect } from "react";
import { getAllLevels, addLevel as addLevelToDb } from "../firebase/firestore";

// Các cấp độ mặc định luôn có sẵn, không thể xóa
const DEFAULT_LEVELS = ["CCM301", "N5", "N4", "N3", "N2", "N1"];

// Hook dùng chung cho tất cả Manager (quiz, flashcard, kanji, listening,
// speaking, reading...) để lấy danh sách cấp độ và thêm cấp độ mới.
// Cấp độ mới thêm ở bất kỳ Manager nào sẽ lưu vào Firestore và hiện ra
// ở TẤT CẢ các Manager khác (vì cùng đọc chung 1 collection "levels").
export function useLevels() {
  const [customLevels, setCustomLevels] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(true);

  const loadLevels = () => {
    setLoadingLevels(true);
    getAllLevels()
      .then((data) => {
        setCustomLevels(data);
        setLoadingLevels(false);
      })
      .catch(() => setLoadingLevels(false));
  };

  useEffect(() => {
    loadLevels();
  }, []);

  // Danh sách cuối cùng = cấp độ mặc định + cấp độ Admin tự thêm (loại trùng)
  const customNames = customLevels.map((l) => l.name);
  const levels = [
    ...DEFAULT_LEVELS,
    ...customNames.filter((name) => !DEFAULT_LEVELS.includes(name)),
  ];

  const addLevel = async (name) => {
    const trimmed = (name || "").trim();

    if (!trimmed) {
      return { success: false, message: "Tên cấp độ không được để trống." };
    }
    if (levels.includes(trimmed)) {
      return { success: false, message: "Cấp độ này đã tồn tại." };
    }

    try {
      await addLevelToDb(trimmed);
      loadLevels();
      return { success: true };
    } catch (err) {
      return { success: false, message: "Lỗi: " + err.message };
    }
  };

  return { levels, loadingLevels, addLevel };
}
