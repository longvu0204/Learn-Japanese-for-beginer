import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    <div className="flex min-h-screen paper-grid">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

export default Layout;
