import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithEmail, loginWithGoogle } from "../firebase/auth";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(null); // "email" | "google" | null
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Nếu đã đăng nhập rồi mà lỡ vào lại /login, tự động đá về trang chủ
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingAction("email");
    try {
      await loginWithEmail(email, password);
      navigate("/");
    } catch (err) {
      setError("Email hoặc mật khẩu không đúng.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoadingAction("google");
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen paper-grid flex items-center justify-center p-4">
      <div className="bg-[#faf6ec] border-2 border-black rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-stone-800">Đăng nhập</h1>
        </div>

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
          <div>
            <label className="text-stone-600 text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-black mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="text-stone-600 text-sm font-medium">
              Mật khẩu
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-black mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loadingAction !== null}
            className="bg-black text-white p-3 rounded-lg font-bold mt-2 hover:bg-stone-800 disabled:opacity-50"
          >
            {loadingAction === "email" ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-stone-300" />
          <span className="text-stone-400 text-xs font-medium">HOẶC</span>
          <div className="flex-1 h-px bg-stone-300" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loadingAction !== null}
          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-black p-3 rounded-lg font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-50"
        >
          <span className="text-lg">G</span>
          {loadingAction === "google"
            ? "Đang kết nối..."
            : "Đăng nhập với Google"}
        </button>

        {error && (
          <p className="text-red-700 text-sm text-center mt-4 bg-red-50 border border-red-300 rounded-lg p-2">
            {error}
          </p>
        )}

        <p className="text-center mt-6 text-sm text-stone-600">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-black font-bold underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
