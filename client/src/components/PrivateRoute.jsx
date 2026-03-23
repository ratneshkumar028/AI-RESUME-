import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Simple guard for protected screens
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default PrivateRoute;
