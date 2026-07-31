import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { BlurLogoMark } from "../components/Icons.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao entrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <BlurLogoMark size={30} />
        <h1 className="font-display italic font-semibold text-4xl text-ghost mt-2 mb-1">Bluds</h1>
        <p className="text-hush mb-8">Seu cantinho com a galera.</p>

        {error && (
          <p className="bg-bloom/10 border border-bloom/30 text-bloom-soft text-sm p-3 rounded-xl mb-4">
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Usuário ou e-mail"
          value={form.identifier}
          onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          className="w-full bg-mist-surface border border-mist-border rounded-xl p-3.5 mb-3 outline-none focus:border-aurora/50 placeholder-hush transition-colors"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-mist-surface border border-mist-border rounded-xl p-3.5 mb-5 outline-none focus:border-aurora/50 placeholder-hush transition-colors"
          required
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gradient-to-r from-aurora to-aurora-teal disabled:opacity-40 text-mist font-bold py-3.5 rounded-full transition-opacity hover:opacity-90"
        >
          {busy ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-hush text-sm mt-5 text-center">
          Ainda não tem um cantinho?{" "}
          <Link to="/register" className="text-aurora-soft hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}
