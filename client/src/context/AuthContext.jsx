import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  const handleAuth = async (endpoint, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/auth/${endpoint}`, payload);
      const { token: jwt, user: userData } = res.data;
      setToken(jwt);
      setUser(userData);
      localStorage.setItem("token", jwt);
      localStorage.setItem("user", JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const login = (payload) => handleAuth("login", payload);
  const signup = (payload) => handleAuth("signup", payload);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
