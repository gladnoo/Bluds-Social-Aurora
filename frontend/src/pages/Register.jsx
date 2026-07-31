import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { BlurLogoMark } from "../components/Icons.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao criar conta");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <BlurLogoMark size={30} />
        <h1 className="font-display italic font-semibold text-4xl text-ghost mt-2 mb-1">Bluds</h1>
        <p className="text-hush mb-8">Chama seus bluds pra cá.</p>

        {error && (
          <p className="bg-bloom/10 border border-bloom/30 text-bloom-soft text-sm p-3 rounded-xl mb-4">
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Nome de exibição"
          value={form.displayName}
          onChange={update("displayName")}
          className="w-full bg-mist-surface border border-mist-border rounded-xl p-3.5 mb-3 outline-none focus:border-aurora/50 placeholder-hush transition-colors"
          required
        />
        <input
          type="text"
          placeholder="Nome de usuário (sem espaços)"
          value={form.username}
          onChange={update("username")}
          className="w-full bg-mist-surface border border-mist-border rounded-xl p-3.5 mb-3 outline-none focus:border-aurora/50 placeholder-hush transition-colors"
          required
        />
        <input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={update("email")}
          className="w-full bg-mist-surface border border-mist-border rounded-xl p-3.5 mb-3 outline-none focus:border-aurora/50 placeholder-hush transition-colors"
          required
        />
        <input
          type="password"
          placeholder="Senha (mín. 6 caracteres)"
          value={form.password}
          onChange={update("password")}
          className="w-full bg-mist-surface border border-mist-border rounded-xl p-3.5 mb-5 outline-none focus:border-aurora/50 placeholder-hush transition-colors"
          required
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gradient-to-r from-aurora to-aurora-teal disabled:opacity-40 text-mist font-bold py-3.5 rounded-full transition-opacity hover:opacity-90"
        >
          {busy ? "Criando..." : "Criar conta"}
        </button>

        <p className="text-hush text-sm mt-5 text-center">
          Já tem um cantinho?{" "}
          <Link to="/login" className="text-aurora-soft hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
