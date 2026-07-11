import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import {
  getAllHiragana,
  getAllKatakana,
  getAllKanji,
  getProgress,
} from "../firebase/firestore";

const GOAL_LABELS = {
  n5: "Đạt N5",
  n3: "Đạt N3",
  n1: "Đạt N1",
  conversation: "Giao tiếp cơ bản",
};

function Home() {
  const { userProfile, currentUser } = useAuth();
  const [progressData, setProgressData] = useState({
    hiragana: { learned: 0, total: 0 },
    katakana: { learned: 0, total: 0 },
    kanji: { learned: 0, total: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllProgress() {
      try {
        // Chạy song song 6 lệnh gọi Firestore cùng lúc, thay vì đợi lần lượt
        const [
          hiraganaList,
          katakanaList,
          kanjiList,
          hiraganaProg,
          katakanaProg,
          kanjiProg,
        ] = await Promise.all([
          getAllHiragana(),
          getAllKatakana(),
          getAllKanji(),
          getProgress(currentUser.uid, "hiragana"),
          getProgress(currentUser.uid, "katakana"),
          getProgress(currentUser.uid, "kanji"),
        ]);

        setProgressData({
          hiragana: {
            learned: hiraganaProg.learned.length,
            total: hiraganaList.length,
          },
          katakana: {
            learned: katakanaProg.learned.length,
            total: katakanaList.length,
          },
          kanji: { learned: kanjiProg.learned.length, total: kanjiList.length },
        });
      } catch (err) {
        console.error("Lỗi tải tiến độ tổng quan:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllProgress();
  }, [currentUser]);

  const MODULES = [
    { path: "/hiragana", title: "Hiragana", icon: "あ", key: "hiragana" },
    { path: "/katakana", title: "Katakana", icon: "ア", key: "katakana" },
    { path: "/kanji", title: "Kanji", icon: "漢", key: "kanji" },
  ];

  const getPercent = (key) => {
    const { learned, total } = progressData[key];
    return total > 0 ? Math.round((learned / total) * 100) : 0;
  };

  return (
    <Layout>
      <div className="mb-6">
        <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
          Trang chủ
        </span>
      </div>

      <h1 className="text-2xl font-bold text-stone-800 mb-1">
        Xin chào, {userProfile?.displayName || currentUser?.email}!
      </h1>
      <p className="text-stone-500 mb-8">
        Mục tiêu:{" "}
        {GOAL_LABELS[userProfile?.learningGoal] || "Chưa đặt mục tiêu"}
      </p>

      <h2 className="text-lg font-bold text-stone-800 mb-4">Lộ trình học</h2>

      {loading ? (
        <p className="text-stone-500">Đang tải tiến độ...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {MODULES.map((mod) => {
            const percent = getPercent(mod.key);
            const { learned, total } = progressData[mod.key];
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 hover:bg-[#f0dd8a] transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl w-10 h-10 flex items-center justify-center bg-white border-2 border-black rounded-lg">
                    {mod.icon}
                  </span>
                  <p className="font-bold text-stone-900">{mod.title}</p>
                </div>

                <div className="w-full h-2 bg-white border border-black rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="text-xs text-stone-600 font-medium">
                  {learned}/{total} · {percent}%
                </p>
              </Link>
            );
          })}
        </div>
      )}

      <h2 className="text-lg font-bold text-stone-800 mb-4">Luyện tập thêm</h2>

      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/flashcard"
          className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 flex items-center gap-4 hover:bg-[#f0dd8a] transition-colors"
        >
          <span className="text-3xl w-12 h-12 flex items-center justify-center bg-white border-2 border-black rounded-lg">
            🗂
          </span>
          <div>
            <p className="font-bold text-stone-900">Flashcard</p>
            <p className="text-sm text-stone-600">
              Học từ vựng qua thẻ ghi nhớ
            </p>
          </div>
        </Link>

        <Link
          to="/quiz"
          className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 flex items-center gap-4 hover:bg-[#f0dd8a] transition-colors"
        >
          <span className="text-3xl w-12 h-12 flex items-center justify-center bg-white border-2 border-black rounded-lg">
            📝
          </span>
          <div>
            <p className="font-bold text-stone-900">Trắc nghiệm</p>
            <p className="text-sm text-stone-600">Kiểm tra kiến thức N5</p>
          </div>
        </Link>
      </div>
    </Layout>
  );
}

export default Home;
