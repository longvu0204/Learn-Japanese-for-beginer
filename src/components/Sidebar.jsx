import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MENU_ITEMS = [
  { path: "/", label: "Trang chủ", icon: "🏠" },
  { path: "/hiragana", label: "Hiragana", icon: "あ" },
  { path: "/katakana", label: "Katakana", icon: "ア" },
  { path: "/kanji", label: "Kanji", icon: "漢" },
  { path: "/grammar", label: "Ngữ pháp", icon: "文" },
  { path: "/flashcard", label: "Flashcard", icon: "🗂" },
  { path: "/quiz", label: "Trắc nghiệm", icon: "📝" },
  { path: "/listening", label: "Luyện nghe", icon: "🎧" },
  { path: "/speaking", label: "Speaking", icon: "🎤" },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { userProfile } = useAuth();

  return (
    <>
      {/* Lớp phủ tối - chỉ hiện trên mobile khi menu đang mở, bấm vào để đóng */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static top-0 left-0 h-screen z-50
          w-64 bg-[#faf5e4] border-r-2 border-black flex flex-col
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 md:mb-4">
            <p className="text-xs font-bold text-stone-500 tracking-wider">
              HỌC TẬP
            </p>
            {/* Nút đóng - chỉ hiện trên mobile */}
            <button
              onClick={onClose}
              className="md:hidden text-stone-500 text-xl leading-none"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {MENU_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  <span className="w-5 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {userProfile?.role === "admin" && (
          <div className="px-6">
            <Link
              to="/admin"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-amber-700 hover:bg-stone-200"
            >
              <span className="w-5 text-center">⚙️</span>
              Admin
            </Link>
          </div>
        )}

        <div className="p-6 border-t border-stone-300">
          <p className="text-sm text-stone-500 truncate">
            {userProfile?.displayName || "Người dùng"}
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
