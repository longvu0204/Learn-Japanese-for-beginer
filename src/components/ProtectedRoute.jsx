import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Chưa đăng nhập → redirect về trang login
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
