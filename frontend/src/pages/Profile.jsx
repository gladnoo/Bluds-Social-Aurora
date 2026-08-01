import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import api from "../api.js";
import Avatar from "../components/Avatar.jsx";
import PostCard from "../components/PostCard.jsx";
import FollowButton from "../components/FollowButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { IconCamera, IconLock, IconSettings, IconFlag, IconVerified } from "../components/Icons.jsx";
import ImageCropModal from "../components/ImageCropModal.jsx";
import ReportModal from "../components/ReportModal.jsx";
import BadgeRow from "../components/BadgeRow.jsx";
import { resolveImageUrl } from "../lib/media.js";

const TABS = [
  { key: "posts", label: "Posts", endpoint: "" },
  { key: "replies", label: "Respostas", endpoint: "/replies" },
  { key: "likes", label: "Curtidas", endpoint: "/likes" },
  { key: "media", label: "Mídia", endpoint: "/media" },
];

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: "", bio: "" });
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [cropTarget, setCropTarget] = useState(null); // "avatar" | "banner" | null
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busyBlock, setBusyBlock] = useState(false);

  const isMe = currentUser?.username === username;

  async function loadProfile() {
    const { data } = await api.get(`/api/users/${username}`);
    setProfile(data);
    setForm({ displayName: data.displayName, bio: data.bio });
  }

  async function loadTab(currentTab) {
    setLoadingPosts(true);
    const endpoint = TABS.find((t) => t.key === currentTab)?.endpoint ?? "";
    const { data } = await api.get(`/api/posts/user/${username}${endpoint}`);
    setPosts(data);
    setLoadingPosts(false);
  }

  useEffect(() => {
    setProfile(null);
    setTab("posts");
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (profile) loadTab(tab);
  }, [tab, profile?.username]);

  async function handleSaveProfile() {
    const { data } = await api.patch("/api/users/me", form);
    setProfile((p) => ({ ...p, ...data }));
    updateUser({ ...currentUser, ...data });
    setEditing(false);
  }

  function pickFile(target, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropTarget(target);
    setCropImageSrc(URL.createObjectURL(file));
    e.target.value = ""; // permite escolher o mesmo arquivo de novo depois
  }

  function cancelCrop() {
    setCropTarget(null);
    setCropImageSrc(null);
  }

  async function confirmCrop(file) {
    const target = cropTarget;
    setCropTarget(null);
    setCropImageSrc(null);

    const setUploading = target === "avatar" ? setUploadingAvatar : setUploadingBanner;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append(target, file);
      const { data } = await api.post(`/api/users/me/${target}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (target === "avatar") {
        setProfile((p) => ({ ...p, avatarUrl: data.avatarUrl }));
        updateUser({ ...currentUser, avatarUrl: data.avatarUrl });
      } else {
        setProfile((p) => ({ ...p, bannerUrl: data.bannerUrl }));
      }
    } finally {
      setUploading(false);
    }
  }

  function handlePostChange(id, updated) {
    if (updated?.__pinChanged) {
      loadProfile();
      return;
    }
    setPosts((prev) => {
      if (updated === null) return prev.filter((p) => p.id !== id);
      return prev.map((p) => (p.id === id ? updated : p));
    });
  }

  function handleFollowChange(followedByMe, pending) {
    setProfile((p) => ({
      ...p,
      followedByMe,
      pending,
      canSeePosts: p.canSeePosts || followedByMe,
      _count: { ...p._count, followers: p._count.followers + (followedByMe && !p.followedByMe ? 1 : 0) },
    }));
  }

  async function handleToggleBlock() {
    if (busyBlock) return;
    setBusyBlock(true);
    setMoreMenuOpen(false);
    try {
      const { data } = await api.post(`/api/users/${username}/block`);
      setProfile((p) => ({
        ...p,
        blockedByMe: data.blockedByMe,
        followedByMe: data.blockedByMe ? false : p.followedByMe,
        canSeePosts: data.blockedByMe ? false : p.canSeePosts,
      }));
      if (data.blockedByMe) setPosts([]);
      else loadTab(tab);
    } finally {
      setBusyBlock(false);
    }
  }

  const pinnedPost = useMemo(
    () => (tab === "posts" && profile?.pinnedPostId ? posts.find((p) => p.id === profile.pinnedPostId) : null),
    [profile, posts, tab]
  );
  const restPosts = pinnedPost ? posts.filter((p) => p.id !== pinnedPost.id) : posts;

  if (!profile) return <p className="p-8 text-hush">Carregando...</p>;

  const locked = !profile.canSeePosts;

  return (
    <div>
      <div className="p-4 pb-2 sticky top-0 bg-mist/80 backdrop-blur-sm z-10">
        <h1 className="font-display italic font-semibold text-2xl">{profile.displayName}</h1>
      </div>

      <div className="mx-4 mb-4 rounded-3xl bg-mist-surface border border-mist-border overflow-hidden">
        <div className="relative h-32 bg-gradient-to-br from-aurora/25 to-aurora-teal/20">
          {profile.bannerUrl && (
            <img src={resolveImageUrl(profile.bannerUrl)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          )}
          {isMe && (
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute bottom-2 right-2 bg-mist/70 backdrop-blur p-2 rounded-full text-ghost"
              title="Trocar capa"
            >
              <IconCamera size={15} />
            </button>
          )}
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile("banner", e)} />
        </div>

        <div className="p-5 pt-0">
          <div className="flex items-start justify-between -mt-8">
            <div className="relative">
              <Avatar user={profile} size="w-20 h-20" />
              {isMe && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 bg-gradient-to-br from-aurora to-aurora-teal rounded-full w-7 h-7 flex items-center justify-center border-2 border-mist text-mist"
                  title="Trocar foto"
                >
                  <IconCamera size={13} />
                </button>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile("avatar", e)} />
            </div>

            <div className="mt-8 flex items-center gap-2">
              {isMe && !editing && (
                <>
                  <Link
                    to="/settings"
                    className="border border-mist-border rounded-full p-2 hover:bg-mist-hover transition-colors"
                    title="Configurações"
                  >
                    <IconSettings size={16} />
                  </Link>
                  <button
                    onClick={() => setEditing(true)}
                    className="border border-mist-border rounded-full px-4 py-1.5 text-sm font-semibold hover:bg-mist-hover transition-colors"
                  >
                    Editar perfil
                  </button>
                </>
              )}
              {!isMe && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setMoreMenuOpen((v) => !v)}
                      className="border border-mist-border rounded-full p-2 hover:bg-mist-hover transition-colors text-sm leading-none"
                      title="Mais opções"
                    >
                      ···
                    </button>
                    {moreMenuOpen && (
                      <div className="absolute z-30 top-full mt-1 right-0 bg-mist-surface backdrop-blur-lg border border-mist-border rounded-2xl shadow-card py-1 w-44 overflow-hidden">
                        <button
                          onClick={handleToggleBlock}
                          disabled={busyBlock}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-mist-hover flex items-center gap-2.5"
                        >
                          <IconLock size={15} /> {profile.blockedByMe ? "Desbloquear" : "Bloquear"}
                        </button>
                        <button
                          onClick={() => {
                            setMoreMenuOpen(false);
                            setReportOpen(true);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-mist-hover flex items-center gap-2.5 text-bloom"
                        >
                          <IconFlag size={15} /> Denunciar
                        </button>
                      </div>
                    )}
                  </div>
                  {!profile.blockedByMe && (
                    <FollowButton
                      username={profile.username}
                      followedByMe={profile.followedByMe}
                      pending={profile.pending}
                      onChange={handleFollowChange}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {editing ? (
            <div className="mt-4 flex flex-col gap-2">
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="bg-mist border border-mist-border rounded-xl p-2.5 outline-none focus:border-aurora/50"
                placeholder="Nome de exibição"
              />
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="bg-mist border border-mist-border rounded-xl p-2.5 outline-none focus:border-aurora/50"
                placeholder="Bio"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  className="bg-gradient-to-r from-aurora to-aurora-teal px-4 py-1.5 rounded-full font-bold text-sm text-mist transition-opacity hover:opacity-90"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="border border-mist-border px-4 py-1.5 rounded-full font-semibold text-sm hover:bg-mist-hover transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-semibold">{profile.displayName}</h2>
                {profile.isVerified && <IconVerified size={16} className="text-aurora-soft" />}
                {profile.isPrivate && <IconLock size={14} className="text-hush" />}
              </div>
              <p className="text-hush">@{profile.username}</p>
              {profile.bio && <p className="mt-2 leading-relaxed">{profile.bio}</p>}
              <BadgeRow badges={profile.badges} />
              {profile._count && (
                <div className="flex gap-4 mt-3 text-sm text-hush">
                  <span>
                    <strong className="text-ghost">{profile._count.posts}</strong> posts
                  </span>
                  <span>
                    <strong className="text-ghost">{profile._count.following}</strong> seguindo
                  </span>
                  <span>
                    <strong className="text-ghost">{profile._count.followers}</strong> seguidores
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {profile.blockedByMe ? (
        <div className="mx-4 p-8 text-center border border-dashed border-mist-border rounded-2xl">
          <p className="text-ghost font-medium mb-1">Você bloqueou @{profile.username}.</p>
          <p className="text-hush text-sm">Desbloqueie pra ver os posts de novo.</p>
        </div>
      ) : locked ? (
        <div className="mx-4 p-8 text-center border border-dashed border-mist-border rounded-2xl">
          <IconLock size={22} className="text-hush mx-auto mb-2" />
          <p className="text-ghost font-medium mb-1">Essa conta é privada.</p>
          <p className="text-hush text-sm">Siga @{profile.username} pra ver os posts.</p>
        </div>
      ) : (
        <>
          <div className="flex border-b border-mist-border mb-1 px-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-sm font-semibold relative transition-colors ${
                  tab === t.key ? "text-ghost" : "text-hush hover:text-ghost"
                }`}
              >
                {t.label}
                {tab === t.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-aurora to-aurora-teal" />
                )}
              </button>
            ))}
          </div>

          {loadingPosts && <p className="p-4 text-hush">Carregando...</p>}

          {!loadingPosts && pinnedPost && (
            <PostCard post={pinnedPost} pinned onChange={(updated) => handlePostChange(pinnedPost.id, updated)} />
          )}

          <AnimatePresence initial={false}>
            {!loadingPosts &&
              restPosts.map((post) => (
                <PostCard key={post.id} post={post} onChange={(updated) => handlePostChange(post.id, updated)} />
              ))}
          </AnimatePresence>

          {!loadingPosts && posts.length === 0 && (
            <div className="mx-4 p-8 text-center border border-dashed border-mist-border rounded-2xl">
              <p className="text-hush text-sm">Nada por aqui ainda.</p>
            </div>
          )}
        </>
      )}

      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          aspect={cropTarget === "avatar" ? 1 : 3}
          shape={cropTarget === "avatar" ? "round" : "rect"}
          fileName={`${cropTarget}.jpg`}
          onCancel={cancelCrop}
          onConfirm={confirmCrop}
        />
      )}

      {reportOpen && (
        <ReportModal targetType="user" targetId={profile.id} onClose={() => setReportOpen(false)} />
      )}
    </div>
  );
}
