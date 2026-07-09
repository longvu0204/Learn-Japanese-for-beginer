import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { userProfile, currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Xin chào, {userProfile?.displayName || currentUser?.email}!
        </h1>
        <p className="text-slate-400">
          Level hiện tại: {userProfile?.level || "beginner"}
        </p>
      </div>
    </div>
  );
}

export default Home;
