import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Hiragana from "./pages/Hinagana";
import Flashcard from "./pages/Flashcard";
import Quiz from "./pages/Quiz";
import Katakana from "./pages/Katakana";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import Onboarding from "./pages/Onboarding";
import OnboardingGate from "./components/OnboardingGate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <Home />
              </OnboardingGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hiragana"
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <Hiragana />
              </OnboardingGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/katakana"
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <Katakana />
              </OnboardingGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/flashcard"
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <Flashcard />
              </OnboardingGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <Quiz />
              </OnboardingGate>
            </ProtectedRoute>
          }
        />

        {/* /admin và /onboarding KHÔNG bọc OnboardingGate, tránh vòng lặp redirect */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
