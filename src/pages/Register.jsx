import { useState } from "react";
import { registerWithEmail } from "../firebase/auth";
import { createUserProfile } from "../firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await registerWithEmail(email, password);
      // Sau khi tạo tài khoản Auth thành công, tạo thêm hồ sơ user trong Firestore
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email,
        displayName: displayName,
      });
      await refreshProfile();
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-lg w-96">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Đăng ký tài khoản
        </h1>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Tên hiển thị"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="p-2 rounded bg-slate-700 text-white"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 rounded bg-slate-700 text-white"
          />
          <input
            type="password"
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 rounded bg-slate-700 text-white"
          />
          <button
            type="submit"
            className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
          >
            Đăng ký
          </button>
        </form>

        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}

        <p className="text-center mt-4">
          <Link to="/login" className="text-blue-400 underline">
            Đã có tài khoản? Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
