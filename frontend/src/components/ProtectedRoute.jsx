import { Navigate, Outlet } from "react-router-dom";

// Parent route in App.jsx wraps protected pages; Outlet renders the child route (dashboard, users, etc.)
function ProtectedRoute() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
