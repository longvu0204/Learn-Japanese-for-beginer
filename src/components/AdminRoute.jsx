import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile?.role !== "admin") {
    // Đã đăng nhập nhưng không phải admin → đá về trang chủ
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
