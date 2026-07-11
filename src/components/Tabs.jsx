function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-2 mb-6 border-b-2 border-black">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 font-bold text-sm rounded-t-lg border-2 border-b-0 ${
            activeTab === tab.key
              ? "bg-black text-white border-black"
              : "bg-[#f5e6a8] text-stone-700 border-black hover:bg-[#f0dd8a]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
