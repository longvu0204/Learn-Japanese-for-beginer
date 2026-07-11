import { useState } from "react";
import Layout from "../components/Layout";
import Tabs from "../components/Tabs";
import KanaManager from "../components/admin/KanaManager";
import KanjiManager from "../components/admin/KanjiManager";
import QuizManager from "../components/admin/QuizManager";

const TABS = [
  { key: "hiragana", label: "Hiragana" },
  { key: "katakana", label: "Katakana" },
  { key: "kanji", label: "Kanji" },
  { key: "quiz", label: "Quiz" },
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("hiragana");

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-stone-800 mb-4">
        Admin Dashboard
      </h1>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "hiragana" && <KanaManager type="hiragana" />}
      {activeTab === "katakana" && <KanaManager type="katakana" />}
      {activeTab === "kanji" && <KanjiManager />}
      {activeTab === "quiz" && <QuizManager />}
    </Layout>
  );
}

export default AdminDashboard;
