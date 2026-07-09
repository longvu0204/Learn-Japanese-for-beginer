import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../firebase/auth";

function Navbar() {
  const { userProfile, currentUser } = useAuth();

  return (
    <nav className="bg-slate-800 px-6 py-4 flex justify-between items-center">
      <div className="flex gap-6">
        <Link to="/" className="text-white font-bold">
          日本語学習
        </Link>
        <Link to="/hiragana" className="text-slate-300 hover:text-white">
          Hiragana
        </Link>
        <Link to="/katakana" className="text-slate-300 hover:text-white">
          Katakana
        </Link>
        <Link to="/flashcard" className="text-slate-300 hover:text-white">
          Flashcard
        </Link>
        <Link to="/quiz" className="text-slate-300 hover:text-white">
          Quiz
        </Link>
        {userProfile?.role === "admin" && (
          <Link to="/admin" className="text-yellow-400 hover:text-yellow-300">
            Admin
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-slate-400 text-sm">
          {userProfile?.displayName || currentUser?.email}
        </span>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Đăng xuất
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
