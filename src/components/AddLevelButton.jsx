import { useState } from "react";

// Nút "+ Thêm cấp độ" dùng chung cho mọi Manager.
// Cách dùng: <AddLevelButton onAdd={addLevel} />
// trong đó addLevel lấy từ hook useLevels().
function AddLevelButton({ onAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newLevel, setNewLevel] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCancel = () => {
    setIsOpen(false);
    setNewLevel("");
    setError("");
  };

  const handleAdd = async () => {
    setSaving(true);
    const result = await onAdd(newLevel);
    setSaving(false);

    if (result?.success) {
      setNewLevel("");
      setIsOpen(false);
      setError("");
    } else {
      setError(result?.message || "Không thể thêm cấp độ.");
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 rounded-lg font-bold border-2 border-dashed border-black text-stone-600 hover:bg-stone-100 text-sm whitespace-nowrap"
      >
        + Thêm cấp độ
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          autoFocus
          value={newLevel}
          onChange={(e) => setNewLevel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Vd: N0"
          className="p-2 rounded border-2 border-black text-sm w-24"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="bg-black text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-stone-800 disabled:opacity-50"
        >
          {saving ? "..." : "Lưu"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="text-stone-500 text-sm font-medium hover:underline"
        >
          Hủy
        </button>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}

export default AddLevelButton;
