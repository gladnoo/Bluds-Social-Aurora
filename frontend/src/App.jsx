import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import RightRail from "./components/RightRail.jsx";
import Feed from "./pages/Feed.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import PostThread from "./pages/PostThread.jsx";
import Search from "./pages/Search.jsx";
import Bookmarks from "./pages/Bookmarks.jsx";
import Hashtag from "./pages/Hashtag.jsx";
import Settings from "./pages/Settings.jsx";
import Notifications from "./pages/Notifications.jsx";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) return null;

  return (
    <>
      {/* Névoa/aurora animada ao fundo — fixa, atrás de todo o conteúdo */}
      <div className="aurora-field" />

      <div className="flex max-w-6xl mx-auto">
        <Sidebar />
        <main className="flex-1 min-h-screen border-x border-mist-border/60 pb-24 md:pb-0 max-w-2xl mx-auto">
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/post/:id" element={<PostThread />} />
            <Route path="/search" element={<Search />} />
            <Route path="/hashtag/:tag" element={<Hashtag />} />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Notifications />
                </PrivateRoute>
              }
            />
            <Route
              path="/bookmarks"
              element={
                <PrivateRoute>
                  <Bookmarks />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
        <RightRail />
      </div>
      <BottomNav />
    </>
  );
}
