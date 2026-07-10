import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const MODULES = [
  {
    path: "/hiragana",
    title: "Hiragana",
    desc: "Bảng chữ cái cơ bản",
    icon: "あ",
  },
  {
    path: "/katakana",
    title: "Katakana",
    desc: "Bảng chữ cái mượn từ nước ngoài",
    icon: "ア",
  },
  {
    path: "/flashcard",
    title: "Flashcard",
    desc: "Học từ vựng qua thẻ ghi nhớ",
    icon: "🗂",
  },
  {
    path: "/quiz",
    title: "Trắc nghiệm",
    desc: "Kiểm tra kiến thức N5",
    icon: "📝",
  },
];

const GOAL_LABELS = {
  n5: "Đạt N5",
  n3: "Đạt N3",
  n1: "Đạt N1",
  conversation: "Giao tiếp cơ bản",
};

function Home() {
  const { userProfile, currentUser } = useAuth();

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

      <div className="grid grid-cols-2 gap-4">
        {MODULES.map((mod) => (
          <Link
            key={mod.path}
            to={mod.path}
            className="bg-[#f5e6a8] border-2 border-black rounded-xl p-5 flex items-center gap-4 hover:bg-[#f0dd8a] transition-colors"
          >
            <span className="text-3xl w-12 h-12 flex items-center justify-center bg-white border-2 border-black rounded-lg">
              {mod.icon}
            </span>
            <div>
              <p className="font-bold text-stone-900">{mod.title}</p>
              <p className="text-sm text-stone-600">{mod.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}

export default Home;
