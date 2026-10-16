import { Link, Outlet, useLocation } from "react-router-dom";
import { logoutUser } from "../utils/auth";

function DashboardLayout() {
  const location = useLocation();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const linkClass = (path) => {
    const current = location.pathname;
    let isActive = false;

    if (path === "/dashboard") {
      isActive = current === "/dashboard";
    } else if (path === "/tasks") {
      isActive = current === "/tasks";
    } else if (path === "/projects") {
      isActive =
        current === "/projects" || current.startsWith("/projects/");
    } else if (path === "/users") {
      isActive =
        current === "/users" ||
        current.startsWith("/users/");
    }

    return `nav-link${isActive ? " active" : ""}`;
  };

  return (
    <div className="d-flex">
      <aside
        className="dashboard-sidebar bg-dark text-white d-flex flex-column flex-shrink-0 p-3"
      >
        <span className="fs-5 fw-semibold text-center pb-3 border-bottom border-secondary">
          Project Management
        </span>

        <ul className="nav nav-pills flex-column mt-3 mb-auto gap-1">
          <li className="nav-item">
            <Link to="/dashboard" className={linkClass("/dashboard")}>
              Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/projects" className={linkClass("/projects")}>
              Projects
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/tasks" className={linkClass("/tasks")}>
              Task list
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/users" className={linkClass("/users")}>
              User list
            </Link>
          </li>
        </ul>

        <div className="border-top border-secondary pt-3">
          {user?.name && (
            <p className="small text-secondary mb-2">{user.name}</p>
          )}
          <button
            type="button"
            className="btn btn-outline-light btn-sm w-100"
            onClick={logoutUser}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-grow-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
