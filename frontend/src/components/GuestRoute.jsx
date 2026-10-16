import { Navigate, Outlet } from "react-router-dom";

// If user is already logged in, do not show login/signup again — send them to dashboard
function GuestRoute() {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
