import { useState, useEffect } from "react";
import {
  getAllLevels,
  addLevel as addLevelToDb,
  deleteLevel as deleteLevelFromDb,
} from "../firebase/firestore";

// Các cấp độ mặc định luôn có sẵn, không thể xóa
const DEFAULT_LEVELS = ["CCM301", "N5", "N4", "N3", "N2", "N1"];

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

  // Chỉ xóa được cấp độ do Admin tự thêm (customLevels), không xóa được
  // cấp độ mặc định (CCM301, N5-N1) để tránh vỡ dữ liệu quiz/flashcard cũ.
  const deleteLevel = async (name) => {
    if (DEFAULT_LEVELS.includes(name)) {
      return {
        success: false,
        message: "Không thể xóa cấp độ mặc định.",
      };
    }

    const target = customLevels.find((l) => l.name === name);
    if (!target) {
      return { success: false, message: "Không tìm thấy cấp độ này." };
    }

    try {
      await deleteLevelFromDb(target.id);
      loadLevels();
      return { success: true };
    } catch (err) {
      return { success: false, message: "Lỗi: " + err.message };
    }
  };

  return {
    levels,
    customLevels,
    defaultLevels: DEFAULT_LEVELS,
    loadingLevels,
    addLevel,
    deleteLevel,
  };
}
