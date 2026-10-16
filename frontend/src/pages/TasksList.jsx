import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProjects, getProjectTasks } from "../api/projectApi";
import { formatStatus, TASK_COLUMNS } from "../constants/taskStatus";
import { formatPriority } from "../utils/priority";

function formatDate(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString();
}

function TasksList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const loadAllTasks = async () => {
      try {
        setLoading(true);
        setError("");

        const projectsData = await getProjects({ limit: 100, page: 1 });
        const projects = projectsData.projects || [];
        const combined = [];

        for (const project of projects) {
          const tasksData = await getProjectTasks(project._id);
          const projectTasks = tasksData.tasks || [];

          for (const task of projectTasks) {
            combined.push({
              ...task,
              projectId: project._id,
              projectName: project.name,
            });
          }
        }

        combined.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setTasks(combined);
      } catch (loadError) {
        setError(
          loadError.response?.data?.message || "Failed to load tasks"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAllTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    if (!statusFilter) {
      return tasks;
    }
    return tasks.filter((task) => task.status === statusFilter);
  }, [tasks, statusFilter]);

  return (
    <div>
      <h1 className="h3 mb-4">Task list</h1>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-3">
              <label className="form-label small">Filter by status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                {TASK_COLUMNS.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
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
            <div className="table-responsive">
              <table className="table table-striped align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Due date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-muted">
                        No tasks found.
                      </td>
                    </tr>
                  )}
                  {filteredTasks.map((task) => (
                    <tr key={task._id}>
                      <td>{task.title}</td>
                      <td>{task.projectName}</td>
                      <td>{formatPriority(task.priority)}</td>
                      <td>
                        <span className="badge text-bg-secondary">
                          {formatStatus(task.status)}
                        </span>
                      </td>
                      <td>{task.assignee?.name || "Unassigned"}</td>
                      <td>{formatDate(task.dueDate)}</td>
                      <td>
                        <Link
                          className="btn btn-sm btn-outline-primary me-1"
                          to={`/projects/${task.projectId}/tasks/${task._id}`}
                        >
                          Details
                        </Link>
                        <Link
                          className="btn btn-sm btn-outline-secondary"
                          to={`/projects/${task.projectId}/board`}
                        >
                          Board
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TasksList;
