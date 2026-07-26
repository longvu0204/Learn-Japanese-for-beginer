import { useState } from "react";

// Nút "Quản lý cấp độ" dùng chung cho mọi Manager - vừa thêm vừa xóa cấp độ.
// Cách dùng:
//   const { customLevels, addLevel, deleteLevel } = useLevels();
//   <AddLevelButton
//     customLevels={customLevels}
//     onAdd={addLevel}
//     onDelete={deleteLevel}
//   />
// Chỉ cấp độ do Admin tự thêm (customLevels) mới hiện nút xóa; cấp độ
// mặc định (CCM301, N5-N1) không có trong customLevels nên không thể xóa.
function AddLevelButton({ customLevels = [], onAdd, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newLevel, setNewLevel] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingName, setDeletingName] = useState(null);

  const handleClose = () => {
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
      setError("");
    } else {
      setError(result?.message || "Không thể thêm cấp độ.");
    }
  };

  const handleDelete = async (name) => {
    setDeletingName(name);
    const result = await onDelete(name);
    setDeletingName(null);

    if (!result?.success) {
      setError(result?.message || "Không thể xóa cấp độ.");
    } else {
      setError("");
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 rounded-lg font-bold border-2 border-dashed border-black text-stone-600 hover:bg-stone-100 text-sm whitespace-nowrap"
      >
        ⚙ Quản lý cấp độ
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="absolute z-10 top-0 left-0 bg-white border-2 border-black rounded-xl p-3 w-64 shadow-lg flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <p className="font-bold text-stone-800 text-sm">Quản lý cấp độ</p>
          <button
            type="button"
            onClick={handleClose}
            className="text-stone-500 text-sm font-bold hover:underline"
          >
            Đóng
          </button>
        </div>

        {/* Danh sách cấp độ Admin tự thêm - có nút xóa */}
        {customLevels.length > 0 && (
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {customLevels.map((l) => (
              <div
                key={l.id}
                className="flex justify-between items-center bg-stone-100 rounded px-2 py-1"
              >
                <span className="text-sm text-stone-800">{l.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(l.name)}
                  disabled={deletingName === l.name}
                  className="text-red-600 text-xs font-bold hover:underline disabled:opacity-50"
                >
                  {deletingName === l.name ? "..." : "Xóa"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Ô thêm cấp độ mới */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            autoFocus
            value={newLevel}
            onChange={(e) => setNewLevel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Vd: N0"
            className="flex-1 p-2 rounded border-2 border-black text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="bg-black text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-stone-800 disabled:opacity-50"
          >
            {saving ? "..." : "Thêm"}
          </button>
        </div>

        {error && <p className="text-red-600 text-xs">{error}</p>}
      </div>
    </div>
  );
}

export default AddLevelButton;
