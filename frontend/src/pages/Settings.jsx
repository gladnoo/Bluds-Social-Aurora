import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import Avatar from "../components/Avatar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { IconLock, IconGlobe, IconLogOut } from "../components/Icons.jsx";
import { isPushSupported, getPushSubscriptionStatus, subscribeToPush, unsubscribeFromPush } from "../lib/push.js";

function Section({ title, children }) {
  return (
    <div className="mx-4 mb-4 p-5 rounded-3xl bg-mist-surface border border-mist-border">
      <h2 className="font-display italic font-semibold text-lg mb-3">{title}</h2>
      {children}
    </div>
  );
}

function PrivacySection({ user, updateUser }) {
  const [isPrivate, setIsPrivate] = useState(user.isPrivate);
  const [requests, setRequests] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isPrivate) api.get("/api/users/me/follow-requests").then(({ data }) => setRequests(data));
  }, [isPrivate]);

  async function toggle() {
    setBusy(true);
    try {
      const { data } = await api.patch("/api/users/me", { isPrivate: !isPrivate });
      setIsPrivate(data.isPrivate);
      updateUser({ ...user, isPrivate: data.isPrivate });
    } finally {
      setBusy(false);
    }
  }

  async function respond(requestId, action) {
    await api.post(`/api/users/me/follow-requests/${requestId}/${action}`);
    setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  }

  return (
    <Section title="Privacidade">
      <button
        onClick={toggle}
        disabled={busy}
        className="w-full flex items-center justify-between p-3 rounded-2xl border border-mist-border hover:bg-mist-hover transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium">
          {isPrivate ? <IconLock size={16} className="text-aurora-soft" /> : <IconGlobe size={16} className="text-hush" />}
          {isPrivate ? "Conta privada" : "Conta pública"}
        </span>
        <span className={`w-10 h-6 rounded-full relative transition-colors ${isPrivate ? "bg-aurora" : "bg-mist-border"}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-mist transition-all ${isPrivate ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>
      <p className="text-hush text-xs mt-2">
        {isPrivate
          ? "Só quem você aprovar consegue ver seus posts e te seguir."
          : "Qualquer pessoa pode ver seus posts e te seguir direto."}
      </p>

      {isPrivate && requests && requests.length > 0 && (
        <div className="mt-4 pt-4 border-t border-mist-border">
          <p className="text-sm font-semibold mb-2">Pedidos de seguidor</p>
          <div className="flex flex-col gap-2">
            {requests.map((r) => (
              <div key={r.requestId} className="flex items-center gap-2.5">
                <Avatar user={r} size="w-9 h-9" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.displayName}</p>
                  <p className="text-hush text-xs truncate">@{r.username}</p>
                </div>
                <button
                  onClick={() => respond(r.requestId, "accept")}
                  className="text-xs font-semibold bg-gradient-to-r from-aurora to-aurora-teal text-mist px-3 py-1.5 rounded-full hover:opacity-90"
                >
                  Aceitar
                </button>
                <button
                  onClick={() => respond(r.requestId, "reject")}
                  className="text-xs font-semibold border border-mist-border px-3 py-1.5 rounded-full hover:bg-mist-hover"
                >
                  Recusar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

function AccountSection({ user, updateUser }) {
  const [username, setUsername] = useState(user.username);
  const [usernameMsg, setUsernameMsg] = useState({ type: "", text: "" });
  const [busyUsername, setBusyUsername] = useState(false);

  const [emailForm, setEmailForm] = useState({ email: user.email, currentPassword: "" });
  const [emailMsg, setEmailMsg] = useState({ type: "", text: "" });
  const [busyEmail, setBusyEmail] = useState(false);

  async function handleUsernameSubmit(e) {
    e.preventDefault();
    if (username === user.username) return;
    setBusyUsername(true);
    setUsernameMsg({ type: "", text: "" });
    try {
      const { data } = await api.patch("/api/users/me/username", { username });
      updateUser({ ...user, username: data.username });
      setUsernameMsg({ type: "ok", text: "Nome de usuário atualizado." });
    } catch (err) {
      setUsernameMsg({ type: "error", text: err.response?.data?.error || "Erro ao trocar o usuário" });
    } finally {
      setBusyUsername(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setBusyEmail(true);
    setEmailMsg({ type: "", text: "" });
    try {
      const { data } = await api.patch("/api/users/me/email", emailForm);
      updateUser({ ...user, email: data.email });
      setEmailForm({ email: data.email, currentPassword: "" });
      setEmailMsg({ type: "ok", text: "E-mail atualizado." });
    } catch (err) {
      setEmailMsg({ type: "error", text: err.response?.data?.error || "Erro ao trocar o e-mail" });
    } finally {
      setBusyEmail(false);
    }
  }

  return (
    <Section title="Conta">
      <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-2 mb-5 pb-5 border-b border-mist-border">
        <label className="text-sm font-medium text-hush">Nome de usuário</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-mist border border-mist-border rounded-xl px-3 focus-within:border-aurora/50">
            <span className="text-hush">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              className="flex-1 bg-transparent p-3 pl-1 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busyUsername || username === user.username}
            className="bg-gradient-to-r from-aurora to-aurora-teal disabled:opacity-40 text-mist font-bold px-4 rounded-xl text-sm"
          >
            Salvar
          </button>
        </div>
        {usernameMsg.text && (
          <p className={`text-sm ${usernameMsg.type === "ok" ? "text-aurora-soft" : "text-bloom"}`}>{usernameMsg.text}</p>
        )}
      </form>

      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2.5">
        <label className="text-sm font-medium text-hush">E-mail</label>
        <input
          type="email"
          value={emailForm.email}
          onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
          className="bg-mist border border-mist-border rounded-xl p-3 outline-none focus:border-aurora/50"
        />
        <input
          type="password"
          placeholder="Confirme sua senha atual"
          value={emailForm.currentPassword}
          onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
          className="bg-mist border border-mist-border rounded-xl p-3 outline-none focus:border-aurora/50"
        />
        {emailMsg.text && (
          <p className={`text-sm ${emailMsg.type === "ok" ? "text-aurora-soft" : "text-bloom"}`}>{emailMsg.text}</p>
        )}
        <button
          type="submit"
          disabled={busyEmail}
          className="self-start bg-gradient-to-r from-aurora to-aurora-teal disabled:opacity-40 text-mist font-bold px-5 py-2 rounded-full text-sm transition-opacity hover:opacity-90"
        >
          {busyEmail ? "Salvando..." : "Salvar e-mail"}
        </button>
      </form>
    </Section>
  );
}

function AccessibilitySection() {
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem("bluds_reduce_motion") === "1");

  function toggle() {
    const next = !reduceMotion;
    setReduceMotion(next);
    localStorage.setItem("bluds_reduce_motion", next ? "1" : "0");
    document.body.classList.toggle("reduce-motion", next);
  }

  return (
    <Section title="Acessibilidade">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-3 rounded-2xl border border-mist-border hover:bg-mist-hover transition-colors"
      >
        <span className="text-sm font-medium">Reduzir animações</span>
        <span className={`w-10 h-6 rounded-full relative transition-colors ${reduceMotion ? "bg-aurora" : "bg-mist-border"}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-mist transition-all ${reduceMotion ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>
      <p className="text-hush text-xs mt-2">Desliga a névoa animada e as transições, mantendo só o essencial.</p>
    </Section>
  );
}

function DataSection() {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const { data } = await api.get("/api/users/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bluds-meus-dados.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Meus dados">
      <p className="text-sm text-hush mb-3">Baixe uma cópia do seu perfil, posts, curtidas e salvos em JSON.</p>
      <button
        onClick={handleExport}
        disabled={busy}
        className="border border-mist-border px-4 py-2 rounded-full text-sm font-semibold hover:bg-mist-hover transition-colors disabled:opacity-40"
      >
        {busy ? "Preparando..." : "Exportar meus dados"}
      </button>
    </Section>
  );
}

function PushSection() {
  const [status, setStatus] = useState("checking"); // checking | unsupported | subscribed | unsubscribed
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPushSubscriptionStatus().then(setStatus);
  }, []);

  async function toggle() {
    setError("");
    setBusy(true);
    try {
      if (status === "subscribed") {
        await unsubscribeFromPush();
        setStatus("unsubscribed");
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Você precisa permitir notificações no navegador pra ativar.");
          return;
        }
        await subscribeToPush();
        setStatus("subscribed");
      }
    } catch (err) {
      setError("Não deu pra ativar agora. Tenta de novo em instantes.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "unsupported" || !isPushSupported()) {
    return (
      <Section title="Notificações push">
        <p className="text-hush text-sm">Seu navegador não tem suporte a notificações push.</p>
      </Section>
    );
  }

  const active = status === "subscribed";

  return (
    <Section title="Notificações push">
      <button
        onClick={toggle}
        disabled={busy || status === "checking"}
        className="w-full flex items-center justify-between p-3 rounded-2xl border border-mist-border hover:bg-mist-hover transition-colors disabled:opacity-50"
      >
        <span className="text-sm font-medium">Avisar mesmo com o app fechado</span>
        <span className={`w-10 h-6 rounded-full relative transition-colors ${active ? "bg-aurora" : "bg-mist-border"}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-mist transition-all ${active ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>
      {error && <p className="text-bloom text-xs mt-2">{error}</p>}
      <p className="text-hush text-xs mt-2">
        Curtidas, respostas, reposts, seguidores novos e menções — direto na sua tela.
      </p>
    </Section>
  );
}

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [busyPassword, setBusyPassword] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setBusyPassword(true);
    setPasswordMsg({ type: "", text: "" });
    try {
      await api.patch("/api/users/me/password", passwordForm);
      setPasswordMsg({ type: "ok", text: "Senha atualizada." });
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPasswordMsg({ type: "error", text: err.response?.data?.error || "Erro ao trocar a senha" });
    } finally {
      setBusyPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setBusyDelete(true);
    setDeleteError("");
    try {
      await api.delete("/api/users/me");
      logout();
      navigate("/login");
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Erro ao apagar a conta");
      setBusyDelete(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (!user) return null;

  return (
    <div>
      <div className="p-4 sticky top-0 bg-mist/80 backdrop-blur-sm z-10 flex items-center justify-between">
        <h1 className="font-display italic font-semibold text-2xl">Configurações</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-bloom text-sm font-semibold border border-bloom/30 hover:bg-bloom/10 px-3 py-1.5 rounded-full transition-colors"
        >
          <IconLogOut size={15} /> Sair
        </button>
      </div>

      <AccountSection user={user} updateUser={updateUser} />
      <PrivacySection user={user} updateUser={updateUser} />
      <PushSection />
      <AccessibilitySection />
      <DataSection />

      <Section title="Trocar senha">
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-2.5">
          <input
            type="password"
            placeholder="Senha atual"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            className="bg-mist border border-mist-border rounded-xl p-3 outline-none focus:border-aurora/50"
            required
          />
          <input
            type="password"
            placeholder="Nova senha (mín. 6 caracteres)"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            className="bg-mist border border-mist-border rounded-xl p-3 outline-none focus:border-aurora/50"
            required
          />
          {passwordMsg.text && (
            <p className={`text-sm ${passwordMsg.type === "ok" ? "text-aurora-soft" : "text-bloom"}`}>{passwordMsg.text}</p>
          )}
          <button
            type="submit"
            disabled={busyPassword}
            className="self-start bg-gradient-to-r from-aurora to-aurora-teal disabled:opacity-40 text-mist font-bold px-5 py-2 rounded-full transition-opacity hover:opacity-90"
          >
            {busyPassword ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </Section>

      <Section title="Zona de risco">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-bloom text-sm font-semibold hover:underline">
            Apagar minha conta
          </button>
        ) : (
          <div>
            <p className="text-sm mb-3">
              Isso apaga sua conta, posts, curtidas e tudo mais <strong>pra sempre</strong>. Não tem como desfazer.
            </p>
            {deleteError && <p className="text-bloom text-sm mb-2">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={busyDelete}
                className="bg-bloom disabled:opacity-40 text-mist font-bold px-4 py-2 rounded-full text-sm"
              >
                {busyDelete ? "Apagando..." : "Sim, apagar pra sempre"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="border border-mist-border px-4 py-2 rounded-full text-sm font-semibold hover:bg-mist-hover"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
