import { useState } from "react";
import Layout from "../components/Layout";
import Tabs from "../components/Tabs";
import KanaManager from "../components/admin/KanaManager";
import KanjiManager from "../components/admin/KanjiManager";
import QuizManager from "../components/admin/QuizManager";
import FlashcardManager from "../components/admin/FlashcardManager";
import GrammarManager from "../components/admin/GrammarManager";
import ListeningManager from "../components/admin/ListeningManager";
import SpeakingManager from "../components/admin/SpeakingManager";

const TABS = [
  { key: "hiragana", label: "Hiragana" },
  { key: "katakana", label: "Katakana" },
  { key: "kanji", label: "Kanji" },
  { key: "grammar", label: "Ngữ pháp" },
  { key: "flashcard", label: "Flashcard" },
  { key: "quiz", label: "Quiz" },
  { key: "listening", label: "Luyện nghe" },
  { key: "speaking", label: "Speaking" },
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
      {activeTab === "grammar" && <GrammarManager />}
      {activeTab === "flashcard" && <FlashcardManager />}
      {activeTab === "quiz" && <QuizManager />}
      {activeTab === "listening" && <ListeningManager />}
      {activeTab === "speaking" && <SpeakingManager />}
    </Layout>
  );
}

export default AdminDashboard;
