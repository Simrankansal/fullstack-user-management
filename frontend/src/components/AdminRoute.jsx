/** Restricts child routes to portal admins only. */
import { Navigate, Outlet } from "react-router-dom";
import { getStoredUser, isAppAdmin } from "../utils/permissions";

function AdminRoute() {
  const user = getStoredUser();

  if (!isAppAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
