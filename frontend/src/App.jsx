import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import RightRail from "./components/RightRail.jsx";

// Cada página só é baixada quando o usuário realmente acessa ela,
// em vez de tudo vir junto no carregamento inicial do app.
const Feed = lazy(() => import("./pages/Feed.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const PostThread = lazy(() => import("./pages/PostThread.jsx"));
const Search = lazy(() => import("./pages/Search.jsx"));
const Bookmarks = lazy(() => import("./pages/Bookmarks.jsx"));
const Hashtag = lazy(() => import("./pages/Hashtag.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Notifications = lazy(() => import("./pages/Notifications.jsx"));

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
          <Suspense fallback={null}>
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
          </Suspense>
        </main>
        <RightRail />
      </div>
      <BottomNav />
    </>
  );
}
