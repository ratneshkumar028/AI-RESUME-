import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Signup = () => {
  const { signup, error, setError, loading, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

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
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    };

    setForm(payload);
    setError(null);
    const result = await signup(payload);
    if (result.success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="auth-layout">
      <div className="card auth-card">
        <p className="eyebrow">AI Resume Builder</p>
        <h1>Create account</h1>
        <p className="muted">Set up your workspace to build resumes, tailor them with AI, and share live preview links.</p>
        {error ? <div className="alert">{error}</div> : null}
        <form onSubmit={handleSubmit} className="form">
          <label>Name</label>
          <input
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            value={form.name}
            onChange={handleChange}
            required
          />
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
            autoComplete="new-password"
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>
        <p className="muted">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
