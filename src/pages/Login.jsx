import { useState } from "react";
import { loginWithEmail, loginWithGoogle } from "../firebase/auth";
import { useNavigate, Link } from "react-router-dom";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleEmailLogin = async (e) => {
    e.preventDefault(); // Ngăn form reload trang (mặc định của HTML form)
    try {
      await loginWithEmail(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-lg w-96">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Đăng nhập
        </h1>

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 rounded bg-slate-700 text-white"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 rounded bg-slate-700 text-white"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Đăng nhập
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-4 bg-red-600 text-white p-2 rounded hover:bg-red-700"
        >
          Đăng nhập với Google
        </button>

        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}

        <p className="text-center mt-4">
          <Link to="/register" className="text-blue-400 underline">
            Chưa có tài khoản? Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
