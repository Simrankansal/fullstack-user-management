/** Full notification inbox with filters, pagination, and mark-read actions. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationApi";
import {
  formatNotificationMessage,
  formatNotificationSubtitle,
  notificationIcon,
} from "../utils/notificationMessage";
import { getNotificationTargetPath } from "../utils/notificationNavigation";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });
  const [readFilter, setReadFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async (page = pagination.page) => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: pagination.limit };
      if (readFilter === "read") {
        params.read = "true";
      } else if (readFilter === "unread") {
        params.read = "false";
      }
      const data = await getNotifications(params);
      setNotifications(data.notifications || []);
      setPagination(data.pagination || pagination);
    } catch (loadError) {
      setError(
        loadError.response?.data?.message || "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readFilter]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((items) =>
        items.map((item) =>
          item._id === id ? { ...item, isRead: true } : item
        )
      );
    } catch (markError) {
      setError(markError.response?.data?.message || "Failed to mark as read");
    }
  };

  const openNotification = async (item) => {
    if (!item.isRead) {
      try {
        await markNotificationRead(item._id);
        setNotifications((items) =>
          items.map((row) =>
            row._id === item._id ? { ...row, isRead: true } : row
          )
        );
      } catch (markError) {
        setError(markError.response?.data?.message || "Failed to mark as read");
        return;
      }
    }
    const path = getNotificationTargetPath(item);
    if (path) {
      navigate(path);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markAllNotificationsRead();
      await loadNotifications(pagination.page);
    } catch (markError) {
      setError(markError.response?.data?.message || "Failed to mark all read");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div>
      <PageHeader title="Notifications">
        <button
          type="button"
          className="btn btn-outline-brand btn-sm"
          disabled={markingAll}
          onClick={handleMarkAllRead}
        >
          {markingAll ? "Updating…" : "Mark all as read"}
        </button>
      </PageHeader>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <label className="form-label small">Filter</label>
              <select
                className="form-select"
                value={readFilter}
                onChange={(event) => setReadFilter(event.target.value)}
              >
                <option value="">All</option>
                <option value="unread">Unread only</option>
                <option value="read">Read only</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary" />
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && (
            <ul className="list-group list-group-flush">
              {notifications.length === 0 && (
                <li className="list-group-item text-muted">No notifications.</li>
              )}
              {notifications.map((item) => {
                const targetPath = getNotificationTargetPath(item);
                return (
                  <li
                    key={item._id}
                    className={`list-group-item d-flex justify-content-between align-items-start gap-3 ${
                      item.isRead ? "" : "list-group-item-primary"
                    } ${targetPath ? "notification-row-clickable" : ""}`}
                  >
                    <button
                      type="button"
                      className="btn btn-link text-start text-decoration-none text-body p-0 flex-grow-1"
                      disabled={!targetPath}
                      onClick={() => openNotification(item)}
                    >
                      <div className="d-flex gap-2 align-items-start">
                        <span>{notificationIcon(item.type)}</span>
                        <div>
                          <div>{formatNotificationMessage(item)}</div>
                          {formatNotificationSubtitle(item) && (
                            <div className="small text-muted">
                              {formatNotificationSubtitle(item)}
                            </div>
                          )}
                          <div className="small text-muted">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </button>
                    {!item.isRead && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-brand flex-shrink-0"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleMarkRead(item._id);
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => loadNotifications(pagination.page - 1)}
              >
                Previous
              </button>
              <span className="small text-muted">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadNotifications(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
