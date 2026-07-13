import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerWithEmail } from "../firebase/auth";
import { createUserProfile } from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser, refreshProfile } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await registerWithEmail(email, password);
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email,
        displayName: displayName,
      });
      await refreshProfile();
      navigate("/");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email này đã được đăng ký.");
      } else if (err.code === "auth/weak-password") {
        setError("Mật khẩu phải có ít nhất 6 ký tự.");
      } else {
        setError("Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen paper-grid flex items-center justify-center p-4">
      <div className="bg-[#faf6ec] border-2 border-black rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-stone-800">Tạo tài khoản</h1>
          <p className="text-stone-500 text-sm mt-1">
            Bắt đầu hành trình học tiếng Nhật
          </p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <div>
            <label className="text-stone-600 text-sm font-medium">
              Tên hiển thị
            </label>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-black mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

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
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-black mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white p-3 rounded-lg font-bold mt-2 hover:bg-stone-800 disabled:opacity-50"
          >
            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>

        {error && (
          <p className="text-red-700 text-sm text-center mt-4 bg-red-50 border border-red-300 rounded-lg p-2">
            {error}
          </p>
        )}

        <p className="text-center mt-6 text-sm text-stone-600">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-black font-bold underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
