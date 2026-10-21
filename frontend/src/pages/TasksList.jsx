/** Cross-project task list with filters and overdue highlighting. */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProjects, getProjectTasks } from "../api/projectApi";
import { formatStatus, TASK_COLUMNS } from "../constants/taskStatus";
import { formatPriority, priorityPillClass } from "../utils/priority";
import TaskLabelChips from "../components/TaskLabelChips";

import { formatDateDDMMYYYY } from "../utils/formatDate";

function isOverdue(task) {
  if (!task.dueDate || task.status === "completed") {
    return false;
  }
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function TasksList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [quickTab, setQuickTab] = useState("all");

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

  const assigneeOptions = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      if (task.assignee?._id) {
        map.set(String(task.assignee._id), task.assignee.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAhead = new Date(today);
    weekAhead.setDate(weekAhead.getDate() + 7);

    return tasks.filter((task) => {
      if (statusFilter && task.status !== statusFilter) {
        return false;
      }
      if (priorityFilter && task.priority !== priorityFilter) {
        return false;
      }
      if (assigneeFilter === "unassigned" && task.assignee) {
        return false;
      }
      if (
        assigneeFilter &&
        assigneeFilter !== "unassigned" &&
        String(task.assignee?._id || "") !== assigneeFilter
      ) {
        return false;
      }
      if (dueFilter === "overdue" && !isOverdue(task)) {
        return false;
      }
      if (dueFilter === "week") {
        if (!task.dueDate) {
          return false;
        }
        const due = new Date(task.dueDate);
        if (due < today || due > weekAhead) {
          return false;
        }
      }
      if (dueFilter === "none" && task.dueDate) {
        return false;
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, dueFilter]);

  const applyQuickTab = (tab) => {
    setQuickTab(tab);
    setStatusFilter("");
    setDueFilter("");
    setPriorityFilter("");
    setAssigneeFilter("");
    if (tab === "todo") {
      setStatusFilter("todo");
    } else if (tab === "in_progress") {
      setStatusFilter("in_progress");
    } else if (tab === "completed") {
      setStatusFilter("completed");
    } else if (tab === "overdue") {
      setDueFilter("overdue");
    }
  };

  const clearAllFilters = () => {
    setQuickTab("all");
    setStatusFilter("");
    setPriorityFilter("");
    setAssigneeFilter("");
    setDueFilter("");
  };

  const hasActiveFilters =
    quickTab !== "all" ||
    statusFilter ||
    priorityFilter ||
    assigneeFilter ||
    dueFilter;

  return (
    <div>
      <h1 className="page-title">My tasks</h1>
      <p className="page-subtitle">Task board — everything assigned across your projects</p>

      <ul className="nav task-tabs mb-3 list-unstyled flex-row flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "todo", label: "To do" },
          { key: "in_progress", label: "In progress" },
          { key: "completed", label: "Done" },
          { key: "overdue", label: "Overdue" },
        ].map((tab) => (
          <li key={tab.key} className="nav-item">
            <button
              type="button"
              className={`nav-link ${quickTab === tab.key ? "active" : ""}`}
              onClick={() => applyQuickTab(tab.key)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="card app-card">
        <div className="card-body">
          <div className="row g-3 align-items-end mb-3">
            <div className="col-md-3 form-field-block mb-0">
              <label className="form-label small">Status</label>
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
            <div className="col-md-3 form-field-block mb-0">
              <label className="form-label small">Priority</label>
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="col-md-2 form-field-block mb-0">
              <label className="form-label small">Assignee</label>
              <select
                className="form-select"
                value={assigneeFilter}
                onChange={(event) => setAssigneeFilter(event.target.value)}
              >
                <option value="">Anyone</option>
                <option value="unassigned">Unassigned</option>
                {assigneeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 form-field-block mb-0">
              <label className="form-label small">Due date</label>
              <select
                className="form-select"
                value={dueFilter}
                onChange={(event) => setDueFilter(event.target.value)}
              >
                <option value="">Any</option>
                <option value="overdue">Overdue</option>
                <option value="week">Due within 7 days</option>
                <option value="none">No due date</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                type="button"
                className={`btn btn-filter-clear btn-sm w-100 ${
                  hasActiveFilters ? "is-active" : ""
                }`}
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
              >
                Clear filters
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary" />
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && filteredTasks.length === 0 && (
            <p className="text-muted mb-0">No tasks found.</p>
          )}

          {!loading && !error && filteredTasks.length > 0 && (
            <div className="rounded-3 border overflow-hidden">
              {filteredTasks.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <div
                    key={task._id}
                    className={`task-row row g-2 ${overdue ? "task-row-overdue" : "bg-white"}`}
                  >
                    <div className="col-lg-4">
                      <div className="fw-semibold">{task.title}</div>
                      <TaskLabelChips labels={task.labels} className="mt-1" />
                      <div className="small text-muted">
                        {task.projectName}
                        {task.dueDate && (
                          <> · Due {formatDateDDMMYYYY(task.dueDate)}</>
                        )}
                      </div>
                    </div>
                    <div className="col-6 col-lg-2">
                      <span className={priorityPillClass(task.priority)}>
                        {formatPriority(task.priority)}
                      </span>
                    </div>
                    <div className="col-6 col-lg-2">
                      <span className="badge text-bg-light border text-dark">
                        {formatStatus(task.status)}
                      </span>
                    </div>
                    <div className="col-6 col-lg-2 small">
                      {task.assignee?.name || "Unassigned"}
                    </div>
                    <div className="col-6 col-lg-2 text-lg-end">
                      <Link
                        className="btn btn-sm btn-brand"
                        to={`/projects/${task.projectId}/tasks/${task._id}`}
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TasksList;
