/** App shell — FlowDesk light sidebar + indigo accent. */
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { logoutUser } from "../utils/auth";
import NotificationBell from "./NotificationBell";
import { getStoredUser, isAppAdmin } from "../utils/permissions";

function useIsMobile(breakpoint = 992) {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < breakpoint
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

function initials(name) {
  if (!name) {
    return "?";
  }
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DashboardLayout() {
  const location = useLocation();
  const user = getStoredUser();
  const admin = isAppAdmin(user);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const linkClass = (path) => {
    const current = location.pathname;
    let isActive = false;

    if (path === "/dashboard") {
      isActive = current === "/dashboard";
    } else if (path === "/tasks") {
      isActive = current === "/tasks";
    } else if (path === "/notifications") {
      isActive = current === "/notifications";
    } else if (path === "/projects") {
      isActive =
        current === "/projects" || current.startsWith("/projects/");
    } else if (path === "/users") {
      isActive =
        current === "/users" || current.startsWith("/users/");
    } else if (path === "/admin/notifications") {
      isActive = current.startsWith("/admin/notifications");
    }

    return `nav-link${isActive ? " active" : ""}`;
  };

  const sectionLabel =
    location.pathname.startsWith("/tasks")
      ? "My tasks"
      : location.pathname.startsWith("/projects")
        ? "Projects"
        : location.pathname.startsWith("/notifications")
          ? "Notifications"
          : "Overview";

  const sidebarClass = `dashboard-sidebar d-flex flex-column flex-shrink-0 p-3 ${
    isMobile ? (sidebarOpen ? "sidebar-open" : "sidebar-closed") : ""
  }`;

  return (
    <div className="dashboard-shell d-flex">
      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={sidebarClass}>
        <div className="sidebar-brand pb-3 mb-1">
          <span className="sidebar-brand-mark">F</span>
          <span>FlowDesk</span>
        </div>

        {admin && (
          <Link to="/projects/new" className="btn btn-brand btn-sm w-100 mb-3">
            + New project
          </Link>
        )}

        <p className="sidebar-section">Menu</p>
        <ul className="nav nav-pills flex-column mb-auto gap-0">
          <li className="nav-item">
            <Link to="/dashboard" className={linkClass("/dashboard")}>
              Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/tasks" className={linkClass("/tasks")}>
              My tasks
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/projects" className={linkClass("/projects")}>
              Projects
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/notifications" className={linkClass("/notifications")}>
              Notifications
            </Link>
          </li>
          {admin && (
            <>
              <li className="nav-item">
                <Link
                  to="/admin/notifications"
                  className={linkClass("/admin/notifications")}
                >
                  Admin alerts
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/users" className={linkClass("/users")}>
                  Users
                </Link>
              </li>
            </>
          )}
        </ul>

        <div className="sidebar-footer pt-3 border-top">
          <button
            type="button"
            className="btn btn-outline-sidebar btn-sm w-100"
            onClick={logoutUser}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="dashboard-main flex-grow-1 d-flex flex-column min-vh-100">
        <header className="dashboard-topbar d-flex align-items-center justify-content-between px-3 py-2 gap-3">
          <div className="d-flex align-items-center gap-2 flex-grow-1">
            {isMobile && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setSidebarOpen((open) => !open)}
              >
                ☰
              </button>
            )}
            <span className="small fw-medium text-secondary d-none d-md-inline">
              {sectionLabel}
            </span>
            <input
              type="search"
              className="topbar-search d-none d-lg-block ms-md-3"
              placeholder="Search projects or tasks…"
              readOnly
              aria-label="Search (coming soon)"
            />
          </div>
          <div className="d-flex align-items-center gap-3">
            <NotificationBell />
            <div className="user-chip d-flex align-items-center gap-2">
              <div className="user-chip-avatar">{initials(user?.name)}</div>
              <div className="d-none d-sm-block text-end">
                <div className="small fw-semibold lh-1">{user?.name}</div>
                <div className="text-secondary" style={{ fontSize: "0.7rem" }}>
                  {user?.role === "admin" ? "Administrator" : "Member"}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow-1 dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
