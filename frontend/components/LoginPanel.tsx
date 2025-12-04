import { FormEvent, useState } from "react";
import { useAuth } from "../hooks/useAuth";

const LoginPanel = () => {
  const { loginUser, signupUser, loading, error } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "login") {
      await loginUser(form.email, form.password);
    } else {
      await signupUser(form.name, form.email, form.password);
    }
  };

  return (
    <section className="card login-card">
      <header>
        <h3>{mode === "login" ? "Login" : "Create account"}</h3>
        <p>Authenticate to access your course catalog.</p>
      </header>
      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        )}
        <input
          placeholder="Email"
          value={form.email}
          type="email"
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
        <input
          placeholder="Password"
          value={form.password}
          type="password"
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />
        {error && <p className="status">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
        </button>
      </form>
      <button className="link" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        {mode === "login" ? "Need an account? Sign up" : "Already registered? Login"}
      </button>
    </section>
  );
};

export default LoginPanel;
