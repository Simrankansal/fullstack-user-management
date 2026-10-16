import { Navigate } from "react-router-dom";

function RootRedirect() {
  const token = localStorage.getItem("token");
  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

export default RootRedirect;
