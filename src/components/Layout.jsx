import { useState } from "react";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen paper-grid">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Thanh header - chỉ hiện trên mobile, có nút mở menu */}
        <header className="md:hidden flex items-center gap-3 p-4 bg-[#faf5e4] border-b-2 border-black sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-white border-2 border-black rounded-lg"
          >
            ☰
          </button>
          <span className="font-bold text-stone-800">日本語学習</span>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
