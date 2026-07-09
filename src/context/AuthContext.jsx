import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { getUserProfile } from "../firebase/firestore";

// 1. Tạo Context - giống khai báo 1 "kênh" để chia sẻ dữ liệu xuyên suốt component tree
const AuthContext = createContext(null);

// 2. Custom hook để các component khác dễ dàng lấy dữ liệu từ Context
export const useAuth = () => useContext(AuthContext);

// 3. Provider - component "bọc" toàn bộ app, cung cấp dữ liệu auth cho mọi component con
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged: Firebase tự động gọi hàm này mỗi khi trạng thái đăng nhập thay đổi
    // (đăng nhập, đăng xuất, hoặc khi F5 lại trang mà vẫn còn phiên đăng nhập)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Cleanup function: hủy lắng nghe khi component bị unmount (tránh memory leak)
    return unsubscribe;
  }, []);

  // Hàm mới: chủ động fetch lại profile từ Firestore, cập nhật vào Context
  const refreshProfile = async () => {
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    refreshProfile, // Export ra để component khác gọi được
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
