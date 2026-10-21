/** Admin-only: delivery log, project status, repeated overdue alerts. */

import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import PageHeader from "../components/PageHeader";

import {

  getAdminDeliveryLog,

  getAdminInsights,

} from "../api/notificationApi";

import {

  formatNotificationMessage,

  notificationDeliveryStatus,

} from "../utils/notificationMessage";



function AdminNotificationCenter() {

  const [tab, setTab] = useState("projects");

  const [insights, setInsights] = useState({

    projects: [],

    repeatedOverdue: [],

    adminAlerts: [],

  });

  const [deliveryLog, setDeliveryLog] = useState([]);

  const [deliveryPagination, setDeliveryPagination] = useState({

    page: 1,

    totalPages: 1,

  });

  const [loading, setLoading] = useState(true);

  const [logLoading, setLogLoading] = useState(false);

  const [error, setError] = useState("");



  const loadInsights = async () => {

    const data = await getAdminInsights();

    setInsights({

      projects: data.projects || [],

      repeatedOverdue: data.repeatedOverdue || [],

      adminAlerts: data.adminAlerts || [],

    });

  };



  const loadDeliveryLog = async (page = 1) => {

    setLogLoading(true);

    try {

      const data = await getAdminDeliveryLog({ page, limit: 20 });

      setDeliveryLog(data.notifications || []);

      setDeliveryPagination(data.pagination || { page: 1, totalPages: 1 });

    } catch (logError) {

      setError(

        logError.response?.data?.message || "Failed to load delivery log"

      );

    } finally {

      setLogLoading(false);

    }

  };



  useEffect(() => {

    const load = async () => {

      try {

        setLoading(true);

        setError("");

        await Promise.all([loadInsights(), loadDeliveryLog(1)]);

      } catch (loadError) {

        setError(loadError.response?.data?.message || "Failed to load admin data");

      } finally {

        setLoading(false);

      }

    };

    load();

  }, []);



  if (loading) {

    return (

      <div className="text-center py-5">

        <div className="spinner-border text-primary" role="status" />

      </div>

    );

  }



  return (

    <div>

      <PageHeader

        title="Admin notification center"

        subtitle="Delivery tracking, project health, and repeated overdue tasks (admin only)"

      />



      {error && <div className="alert alert-danger">{error}</div>}



      <ul className="nav nav-tabs mb-3">

        <li className="nav-item">

          <button

            type="button"

            className={`nav-link ${tab === "projects" ? "active" : ""}`}

            onClick={() => setTab("projects")}

          >

            Project updates

          </button>

        </li>

        <li className="nav-item">

          <button

            type="button"

            className={`nav-link ${tab === "overdue" ? "active" : ""}`}

            onClick={() => setTab("overdue")}

          >

            Repeated overdue

          </button>

        </li>

        <li className="nav-item">

          <button

            type="button"

            className={`nav-link ${tab === "delivery" ? "active" : ""}`}

            onClick={() => setTab("delivery")}

          >

            Delivery log

          </button>

        </li>

      </ul>



      {tab === "projects" && (

        <div className="card shadow-sm">

          <div className="card-body p-0">

            <div className="table-responsive">

              <table className="table table-hover mb-0 align-middle">

                <thead className="table-light">

                  <tr>

                    <th>Project</th>

                    <th>Status</th>

                    <th>Owner</th>

                    <th>Tasks</th>

                    <th>Overdue</th>

                    <th>Completion</th>

                  </tr>

                </thead>

                <tbody>

                  {insights.projects.length === 0 && (

                    <tr>

                      <td colSpan={6} className="text-muted text-center py-4">

                        No projects found.

                      </td>

                    </tr>

                  )}

                  {insights.projects.map((project) => (

                    <tr key={project._id}>

                      <td>

                        <Link to={`/projects/${project._id}`} className="fw-semibold text-decoration-none">

                          {project.name}

                        </Link>

                      </td>

                      <td>

                        <span

                          className={`badge ${

                            project.archived ? "text-bg-secondary" : "text-bg-success"

                          }`}

                        >

                          {project.statusLabel}

                        </span>

                      </td>

                      <td>{project.owner?.name || "—"}</td>

                      <td>

                        {project.taskCompleted}/{project.taskTotal} done

                      </td>

                      <td>

                        {project.taskOverdue > 0 ? (

                          <span className="text-danger fw-semibold">

                            {project.taskOverdue}

                          </span>

                        ) : (

                          "0"

                        )}

                      </td>

                      <td>{project.completionPercent}%</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      )}



      {tab === "overdue" && (

        <div className="row g-3">

          <div className="col-lg-7">

            <div className="card shadow-sm h-100">

              <div className="card-header bg-light fw-semibold">

                Tasks overdue 2+ days

              </div>

              <ul className="list-group list-group-flush">

                {insights.repeatedOverdue.length === 0 && (

                  <li className="list-group-item text-muted">

                    No tasks are overdue for multiple days right now.

                  </li>

                )}

                {insights.repeatedOverdue.map((row) => (

                  <li

                    key={row.task._id}

                    className="list-group-item d-flex justify-content-between align-items-start gap-2"

                  >

                    <div>

                      <div className="fw-semibold">{row.task.title}</div>

                      <div className="small text-muted">

                        {row.project?.name} · {row.daysOverdue} days overdue

                        {row.assignee?.name && ` · ${row.assignee.name}`}

                      </div>

                    </div>

                    <Link

                      className="btn btn-sm btn-outline-brand flex-shrink-0"

                      to={`/projects/${row.project?._id}/tasks/${row.task._id}`}

                    >

                      Open

                    </Link>

                  </li>

                ))}

              </ul>

            </div>

          </div>

          <div className="col-lg-5">

            <div className="card shadow-sm h-100">

              <div className="card-header bg-light fw-semibold">

                Admin alerts sent

              </div>

              <ul className="list-group list-group-flush">

                {insights.adminAlerts.length === 0 && (

                  <li className="list-group-item text-muted small">

                    Alerts appear when a task stays overdue for 2 or more days (daily job).

                  </li>

                )}

                {insights.adminAlerts.map((item) => (

                  <li key={item._id} className="list-group-item small">

                    <div>{formatNotificationMessage(item)}</div>

                    <div className="text-muted">

                      {new Date(item.createdAt).toLocaleString()}

                    </div>

                  </li>

                ))}

              </ul>

            </div>

          </div>

        </div>

      )}



      {tab === "delivery" && (

        <div className="card shadow-sm">

          <div className="card-body p-0">

            {logLoading && (

              <div className="text-center py-4">

                <div className="spinner-border spinner-border-sm text-primary" />

              </div>

            )}

            {!logLoading && (

              <div className="table-responsive">

                <table className="table table-hover mb-0 align-middle small">

                  <thead className="table-light">

                    <tr>

                      <th>From</th>

                      <th>To</th>

                      <th>Message</th>

                      <th>Delivered</th>

                      <th>Receipt</th>

                    </tr>

                  </thead>

                  <tbody>

                    {deliveryLog.length === 0 && (

                      <tr>

                        <td colSpan={5} className="text-muted text-center py-4">

                          No notifications in the system yet.

                        </td>

                      </tr>

                    )}

                    {deliveryLog.map((item) => {

                      const status = notificationDeliveryStatus(item);

                      return (

                        <tr key={item._id}>

                          <td>{item.actor?.name || "System"}</td>

                          <td>

                            <div>{item.recipient?.name}</div>

                            <div className="text-muted">{item.recipient?.email}</div>

                          </td>

                          <td>{formatNotificationMessage(item)}</td>

                          <td className="text-muted">

                            {new Date(

                              item.deliveredAt || item.createdAt

                            ).toLocaleString()}

                          </td>

                          <td>

                            <span

                              className={`badge ${

                                status.variant === "success"

                                  ? "text-bg-success"

                                  : "text-bg-warning"

                              }`}

                            >

                              {status.label}

                            </span>

                            <div className="text-muted">{status.detail}</div>

                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            )}

            {deliveryPagination.totalPages > 1 && (

              <div className="d-flex justify-content-center gap-2 py-3">

                <button

                  type="button"

                  className="btn btn-outline-secondary btn-sm"

                  disabled={deliveryPagination.page <= 1}

                  onClick={() => loadDeliveryLog(deliveryPagination.page - 1)}

                >

                  Previous

                </button>

                <span className="small text-muted align-self-center">

                  Page {deliveryPagination.page} of {deliveryPagination.totalPages}

                </span>

                <button

                  type="button"

                  className="btn btn-outline-secondary btn-sm"

                  disabled={

                    deliveryPagination.page >= deliveryPagination.totalPages

                  }

                  onClick={() => loadDeliveryLog(deliveryPagination.page + 1)}

                >

                  Next

                </button>

              </div>

            )}

          </div>

        </div>

      )}

    </div>

  );

}



export default AdminNotificationCenter;


