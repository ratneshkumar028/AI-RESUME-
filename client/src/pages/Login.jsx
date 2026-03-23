import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const { login, error, setError, loading, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (token) navigate("/dashboard");
  }, [token, navigate]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    };

    setForm(payload);
    setError(null);
    const result = await login(payload);
    if (result.success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="auth-layout">
      <div className="card auth-card">
        <p className="eyebrow">AI Resume Builder</p>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to manage your templates, live links, imported resumes, and AI rewrites.</p>
        {error ? <div className="alert">{error}</div> : null}
        <form onSubmit={handleSubmit} className="form">
          <label>Email</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
          <label>Password</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="muted">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
