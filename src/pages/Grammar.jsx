import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  getAllGrammar,
  getProgress,
  markAsLearned,
  markAsNotLearned,
} from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";

function Grammar() {
  const { currentUser } = useAuth();
  const [grammarList, setGrammarList] = useState([]);
  const [learned, setLearned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllGrammar();
        setGrammarList(data);
      } catch (err) {
        console.error("Lỗi tải ngữ pháp:", err);
      }
      try {
        const progress = await getProgress(currentUser.uid, "grammar");
        setLearned(progress.learned);
      } catch (err) {
        setLearned([]);
      }
      setLoading(false);
    }
    loadData();
  }, [currentUser]);

  if (loading) {
    return (
      <Layout>
        <p className="text-stone-600">Đang tải dữ liệu...</p>
      </Layout>
    );
  }

  if (grammarList.length === 0) {
    return (
      <Layout>
        <p className="text-stone-600">Chưa có dữ liệu ngữ pháp.</p>
      </Layout>
    );
  }

  const current = grammarList[selectedIndex];
  const isCurrentLearned = learned.includes(current.id);
  const progressPercent = Math.round(
    (learned.length / grammarList.length) * 100,
  );

  const toggleLearned = async () => {
    if (isCurrentLearned) {
      await markAsNotLearned(currentUser.uid, "grammar", current.id);
      setLearned((prev) => prev.filter((id) => id !== current.id));
    } else {
      await markAsLearned(
        currentUser.uid,
        "grammar",
        current.id,
        grammarList.length,
      );
      setLearned((prev) => [...prev, current.id]);
    }
  };

  return (
    <Layout>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
            Ngữ pháp N5
          </span>
          <span className="ml-2 text-sm text-stone-500">
            {grammarList.length} mẫu câu
          </span>
        </div>
        <span className="text-sm font-bold text-stone-700">
          Đã thuộc: {learned.length}/{grammarList.length} ({progressPercent}%)
        </span>
      </div>

      <div className="w-full h-2 bg-stone-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-green-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex flex-col gap-2">
          {grammarList.map((g, index) => {
            const isLearned = learned.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => setSelectedIndex(index)}
                className={`text-left p-3 rounded-lg border-2 border-black transition-colors relative ${
                  index === selectedIndex
                    ? "bg-black text-white"
                    : "bg-[#f5e6a8] text-stone-900 hover:bg-[#f0dd8a]"
                }`}
              >
                <p className="font-bold">{g.title}</p>
                <p
                  className={`text-xs ${index === selectedIndex ? "text-stone-300" : "text-stone-600"}`}
                >
                  {g.meaning}
                </p>
                {isLearned && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-600 text-white rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 bg-[#f5e6a8] border-2 border-black rounded-xl p-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            {current.title}
          </h2>
          <p className="text-stone-700 mb-4">{current.meaning}</p>

          <div className="bg-white border-2 border-black rounded-lg p-4 mb-4">
            <p className="text-xs text-stone-500 mb-1">Cấu trúc</p>
            <p className="font-bold text-stone-900">{current.structure}</p>
          </div>

          <div className="bg-white border border-stone-300 rounded-lg p-4 mb-6">
            <p className="text-xs text-stone-500 mb-1">Giải thích</p>
            <p className="text-stone-800">{current.explanation}</p>
          </div>

          <p className="text-sm font-bold text-stone-700 mb-2">Ví dụ</p>
          <div className="flex flex-col gap-2 mb-6">
            {current.examples.map((ex, i) => (
              <div
                key={i}
                className="bg-white border border-stone-300 rounded-lg p-3"
              >
                <p className="font-bold text-stone-900">{ex.jp}</p>
                <p className="text-stone-500 text-sm">{ex.reading}</p>
                <p className="text-stone-700 text-sm mt-1">{ex.vi}</p>
              </div>
            ))}
          </div>

          <button
            onClick={toggleLearned}
            className={`w-full p-3 rounded-lg font-bold border-2 border-black ${
              isCurrentLearned
                ? "bg-green-700 text-white"
                : "bg-white text-stone-800 hover:bg-stone-100"
            }`}
          >
            {isCurrentLearned ? "✓ Đã thuộc" : "Đánh dấu đã thuộc"}
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Grammar;
