import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

// Đăng ký tài khoản mới bằng email
export const registerWithEmail = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Đăng nhập bằng email
export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Đăng nhập bằng Google
export const loginWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

// Đăng xuất
export const logout = () => {
  return signOut(auth);
};
