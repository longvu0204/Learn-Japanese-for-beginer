import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../firebase/auth";
const MENU_ITEMS = [
  { path: "/", label: "Trang chủ", icon: "🏠" },
  { path: "/hiragana", label: "Hiragana", icon: "あ" },
  { path: "/katakana", label: "Katakana", icon: "ア" },
  { path: "/kanji", label: "Kanji", icon: "漢" },
  { path: "/grammar", label: "Ngữ pháp", icon: "文" },
  { path: "/flashcard", label: "Flashcard", icon: "🗂" },
  { path: "/quiz", label: "Trắc nghiệm", icon: "📝" },
];

function Sidebar() {
  const location = useLocation();
  const { userProfile } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-[#faf5e4] border-r-2 border-black flex flex-col">
      <div className="p-6">
        <p className="text-xs font-bold text-stone-500 tracking-wider mb-4">
          HỌC TẬP
        </p>
        <nav className="flex flex-col gap-1">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
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
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-amber-700 hover:bg-stone-200"
          >
            <span className="w-5 text-center">⚙️</span>
            Admin
          </Link>
        </div>
      )}

      <div className="mt-auto p-6 border-t border-stone-300">
        <p className="text-sm text-stone-500 truncate">
          {userProfile?.displayName || "Người dùng"}
        </p>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 mt-1 w-full rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 hover:text-red-900 transition-colors border border-transparent hover:border-red-300 text-left"
        >
          <span className="w-5 text-center">🚪</span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
