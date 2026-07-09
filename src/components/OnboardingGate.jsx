import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

function OnboardingGate({ children }) {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập nhưng chưa hoàn thành onboarding → bắt buộc đi qua trang Onboarding trước
  if (userProfile && !userProfile.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default OnboardingGate;
