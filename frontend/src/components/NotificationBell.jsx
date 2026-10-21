/** Header bell with unread badge and quick notification preview. */
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationApi";
import {
  formatNotificationMessage,
  formatNotificationSubtitle,
  notificationIcon,
} from "../utils/notificationMessage";
import { getNotificationTargetPath } from "../utils/notificationNavigation";
import { getStoredUser, isAppAdmin } from "../utils/permissions";

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const admin = isAppAdmin(getStoredUser());

  const refreshCount = async () => {
    try {
      const data = await getUnreadNotificationCount();
      setUnreadCount(data.count || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      try {
        setLoadingPreview(true);
        const data = await getNotifications({ page: 1, limit: 8 });
        setPreview(data.notifications || []);
        await refreshCount();
      } catch {
        setPreview([]);
      } finally {
        setLoadingPreview(false);
      }
    }
  };

  const openNotification = async (item) => {
    if (!item.isRead) {
      await markNotificationRead(item._id);
      await refreshCount();
    }
    setOpen(false);
    const path = getNotificationTargetPath(item);
    if (path) {
      navigate(path);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markAllNotificationsRead();
      setPreview((items) => items.map((row) => ({ ...row, isRead: true })));
      await refreshCount();
    } catch {
      /* ignore */
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="notification-bell position-relative" ref={containerRef}>
      <button
        type="button"
        className="btn btn-notification position-relative"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <span className="notification-bell-icon" aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-unread-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <div>
              <div className="notification-dropdown-title">Notifications</div>
              <div className="notification-dropdown-subtitle">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "All caught up"}
              </div>
            </div>
            <div className="notification-dropdown-actions">
              <button
                type="button"
                className="notification-action-link"
                disabled={markingAll || unreadCount === 0}
                onClick={handleMarkAllRead}
              >
                {markingAll ? "Updating…" : "Mark all read"}
              </button>
              <Link
                to="/notifications"
                className="notification-action-link primary"
                onClick={() => setOpen(false)}
              >
                View all
              </Link>
            </div>
          </div>

          <div className="notification-preview-list">
            {loadingPreview && (
              <div className="notification-loading">
                <div className="spinner-border spinner-border-sm text-primary" />
                <span>Loading notifications…</span>
              </div>
            )}

            {!loadingPreview && preview.length === 0 && (
              <div className="notification-empty-state">
                <div className="notification-empty-icon" aria-hidden="true">
                  ✨
                </div>
                <p className="notification-empty-title">No notifications yet</p>
                <p className="notification-empty-text">
                  When a teammate assigns you a task or adds you to a project,
                  their name will appear here.
                </p>
              </div>
            )}

            {!loadingPreview &&
              preview.map((item) => {
                const subtitle = formatNotificationSubtitle(item);
                return (
                  <button
                    key={item._id}
                    type="button"
                    className={`notification-item w-100 text-start ${
                      item.isRead ? "" : "unread"
                    }`}
                    onClick={() => openNotification(item)}
                  >
                    <span className="notification-item-icon" aria-hidden="true">
                      {notificationIcon(item.type)}
                    </span>
                    <span className="notification-item-body">
                      <span className="notification-item-message">
                        {formatNotificationMessage(item)}
                      </span>
                      {subtitle && (
                        <span className="notification-item-meta">{subtitle}</span>
                      )}
                      <span className="notification-item-time">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </span>
                    {!item.isRead && (
                      <span className="notification-item-dot" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
          </div>

          {admin && (
            <div className="notification-dropdown-footer">
              <Link
                to="/admin/notifications"
                className="notification-admin-link"
                onClick={() => setOpen(false)}
              >
                Admin delivery & project monitor
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
