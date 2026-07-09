import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { completeOnboarding } from "../firebase/firestore";

const LEVEL_OPTIONS = [
  {
    value: "absolute_beginner",
    label: "Mới bắt đầu, chưa biết gì",
    icon: "🌱",
  },
  { value: "knows_kana", label: "Đã thuộc Hiragana/Katakana", icon: "📝" },
  { value: "n5", label: "Đã học qua N5", icon: "📘" },
  { value: "n4_plus", label: "N4 trở lên", icon: "🎓" },
];

const GOAL_OPTIONS = [
  { value: "n5", label: "Đạt N5" },
  { value: "n3", label: "Đạt N3" },
  { value: "n1", label: "Đạt N1" },
  { value: "conversation", label: "Giao tiếp cơ bản, chưa cần thi" },
];

function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleFinish = async () => {
    setSaving(true);
    try {
      await completeOnboarding(currentUser.uid, selectedLevel, selectedGoal);
      navigate("/");
      // Không cần setSaving(false) vì component sẽ unmount khi navigate
    } catch (err) {
      console.error("Lỗi lưu onboarding:", err);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl p-8 w-full max-w-lg">
        {/* Thanh tiến trình 2 bước */}
        <div className="flex gap-2 mb-8">
          <div
            className={`h-1 flex-1 rounded ${step >= 1 ? "bg-blue-500" : "bg-slate-700"}`}
          />
          <div
            className={`h-1 flex-1 rounded ${step >= 2 ? "bg-blue-500" : "bg-slate-700"}`}
          />
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Trình độ hiện tại của bạn?
            </h1>
            <p className="text-slate-400 mb-6">
              Giúp chúng tôi gợi ý lộ trình học phù hợp nhất
            </p>

            <div className="flex flex-col gap-3">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedLevel(opt.value)}
                  className={`p-4 rounded-lg text-left flex items-center gap-3 transition-colors ${
                    selectedLevel === opt.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedLevel}
              className="w-full mt-6 bg-blue-600 text-white p-3 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              Tiếp tục
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Mục tiêu học của bạn?
            </h1>
            <p className="text-slate-400 mb-6">
              Đặt mục tiêu rõ ràng giúp bạn kiên trì hơn
            </p>

            <div className="flex flex-col gap-3">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedGoal(opt.value)}
                  className={`p-4 rounded-lg text-left transition-colors ${
                    selectedGoal === opt.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-slate-700 text-white p-3 rounded-lg hover:bg-slate-600"
              >
                Quay lại
              </button>
              <button
                onClick={handleFinish}
                disabled={!selectedGoal || saving}
                className="flex-1 bg-green-600 text-white p-3 rounded-lg font-bold disabled:opacity-40 hover:bg-green-700"
              >
                {saving ? "Đang lưu..." : "Bắt đầu học!"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
