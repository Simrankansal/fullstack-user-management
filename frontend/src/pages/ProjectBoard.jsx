/** Kanban board for a project with permission-aware actions. */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ProjectNav from "../components/ProjectNav";
import { getProjectTasks } from "../api/projectApi";
import { createTask, updateTaskStatus, assignTask } from "../api/taskApi";
import TaskLabelChips from "../components/TaskLabelChips";
import TaskLabelEditor from "../components/TaskLabelEditor";
import { TASK_COLUMNS } from "../constants/taskStatus";
import { formatPriority, priorityBadgeClass } from "../utils/priority";
import { formatDateDDMMYYYY } from "../utils/formatDate";
import {
  getStoredUser,
  canAssignTask,
  canManageProject,
} from "../utils/permissions";

function ProjectBoard() {
  const { projectId } = useParams();
  const storedUser = getStoredUser();

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskLabelNames, setNewTaskLabelNames] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [creating, setCreating] = useState(false);

  const canCreate = canManageProject(storedUser, myRole);
  const canAssign = canAssignTask(storedUser, myRole);

  const formatDueDate = (value) => {
    if (!value) {
      return "";
    }
    return formatDateDDMMYYYY(value);
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === "completed") {
      return false;
    }
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const loadBoard = async (showFullPageLoader = false) => {
    try {
      if (showFullPageLoader) {
        setLoading(true);
      }
      setError("");

      const data = await getProjectTasks(projectId);
      setTasks(data.tasks || []);
      setMembers((data.members || []).filter((member) => member.user));
      setMyRole(data.myRole);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load board");
    } finally {
      if (showFullPageLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadBoard(true);
  }, [projectId]);

  const handleCreateTask = async (event) => {
    event.preventDefault();

    const title = newTaskTitle.trim();

    if (!title) {
      setError("Task title is required");
      return;
    }
    if (!newTaskDescription.trim()) {
      setError("Task description is required");
      return;
    }
    if (!newTaskDueDate) {
      setError("Due date is required");
      return;
    }

    try {
      setCreating(true);
      setError("");

      await createTask({
        projectId,
        title,
        description: newTaskDescription.trim(),
        dueDate: newTaskDueDate || null,
        priority: newTaskPriority,
        labelNames: newTaskLabelNames,
      });

      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskDueDate("");
      setNewTaskPriority("medium");
      setNewTaskLabelNames([]);
      await loadBoard(false);
    } catch (createError) {
      setError(createError.response?.data?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      setError("");
      await updateTaskStatus(taskId, status);
      await loadBoard(false);
    } catch (statusError) {
      setError(statusError.response?.data?.message || "Failed to update status");
    }
  };

  const handleAssign = async (taskId, assigneeId) => {
    try {
      setError("");
      await assignTask(taskId, assigneeId || null);
      await loadBoard(false);
    } catch (assignError) {
      setError(assignError.response?.data?.message || "Failed to assign task");
    }
  };

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

  const tasksByStatus = (status) =>
    filteredTasks.filter((task) => task.status === status);

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
        title="Project Task Board"
        subtitle="Manage this project's tasks by status (To Do, In Progress, and more)"
      >
        <Link className="btn btn-outline-secondary btn-sm" to="/projects">
          All projects
        </Link>
      </PageHeader>

      <ProjectNav projectId={projectId} myRole={myRole} />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label small">Status</label>
              <select
                className="form-select form-select-sm"
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
            <div className="col-md-3">
              <label className="form-label small">Priority</label>
              <select
                className="form-select form-select-sm"
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
            <div className="col-md-3">
              <label className="form-label small">Assignee</label>
              <select
                className="form-select form-select-sm"
                value={assigneeFilter}
                onChange={(event) => setAssigneeFilter(event.target.value)}
              >
                <option value="">Anyone</option>
                <option value="unassigned">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user._id} value={String(member.user._id)}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small">Due date</label>
              <select
                className="form-select form-select-sm"
                value={dueFilter}
                onChange={(event) => setDueFilter(event.target.value)}
              >
                <option value="">Any</option>
                <option value="overdue">Overdue</option>
                <option value="week">Due within 7 days</option>
                <option value="none">No due date</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {canCreate && (
        <div className="card shadow-sm mb-4 task-create-card">
          <div className="card-body p-4">
            <form onSubmit={handleCreateTask} className="app-form task-create-form">
              <div className="row g-4">
                <div className="col-md-8 form-field-block">
                  <label className="form-label small" htmlFor="taskTitle">
                    <span className="form-label-icon" aria-hidden="true">✏️</span>
                    Title <span className="text-danger">*</span>
                  </label>
                  <input
                    id="taskTitle"
                    type="text"
                    className="form-control"
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(event) => setNewTaskTitle(event.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button
                    type="submit"
                    className="btn btn-brand w-100"
                    disabled={creating}
                  >
                    {creating ? "Adding..." : "Add task"}
                  </button>
                </div>
                <div className="col-md-8 form-field-block">
                  <label className="form-label small" htmlFor="taskDescription">
                    <span className="form-label-icon" aria-hidden="true">📝</span>
                    Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="taskDescription"
                    className="form-control"
                    rows={2}
                    placeholder="What needs to be done?"
                    value={newTaskDescription}
                    onChange={(event) =>
                      setNewTaskDescription(event.target.value)
                    }
                    required
                  />
                </div>
                <div className="col-md-4 form-field-block">
                  <label className="form-label small" htmlFor="taskDueDate">
                    <span className="form-label-icon" aria-hidden="true">📅</span>
                    Due date <span className="text-danger">*</span>
                  </label>
                  <input
                    id="taskDueDate"
                    type="date"
                    className="form-control"
                    value={newTaskDueDate}
                    onChange={(event) => setNewTaskDueDate(event.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4 col-lg-3 form-field-block">
                  <label className="form-label small" htmlFor="taskPriority">
                    <span className="form-label-icon" aria-hidden="true">⚡</span>
                    Priority <span className="text-danger">*</span>
                  </label>
                  <select
                    id="taskPriority"
                    className="form-select"
                    value={newTaskPriority}
                    onChange={(event) => setNewTaskPriority(event.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-field-block task-label-field">
                <label className="form-label small" htmlFor="taskLabelInput">
                  <span className="form-label-icon" aria-hidden="true">🏷️</span>
                  Labels
                  <span className="text-muted fw-normal ms-1">(optional)</span>
                </label>
                <TaskLabelEditor
                  id="taskLabelInput"
                  labels={newTaskLabelNames}
                  onChange={setNewTaskLabelNames}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {!canCreate && (
        <p className="text-muted small mb-3">
          You can update status on assigned tasks; only owners can create or assign.
        </p>
      )}

      <div className="row g-3">
        {TASK_COLUMNS.map((column) => (
          <div key={column.key} className="col-md-6 col-xl-3">
            <div className="card h-100 shadow-sm">
              <div className="card-header bg-light fw-semibold text-center py-2">
                {column.label}
              </div>
              <div className="card-body kanban-column p-2">
                {tasksByStatus(column.key).map((task) => {
                  const taskId = String(task._id);
                  const assigneeId = task.assignee?._id
                    ? String(task.assignee._id)
                    : "";
                  const isCritical = task.priority === "critical";
                  const overdue = isOverdue(task);

                  return (
                    <div
                      key={taskId}
                      className={`card kanban-card mb-2 shadow-sm ${
                        isCritical ? "border-danger border-2" : ""
                      } ${overdue ? "kanban-card-overdue" : ""}`}
                    >
                      <div className="card-body p-2">
                        <p className="fw-semibold mb-1">{task.title}</p>
                        <TaskLabelChips labels={task.labels} className="mb-1" />
                        <span
                          className={`badge mb-1 ${priorityBadgeClass(task.priority)}`}
                        >
                          {formatPriority(task.priority)}
                        </span>
                        {task.description && (
                          <p className="small text-muted mb-1">
                            {task.description}
                          </p>
                        )}
                        {task.dueDate && (
                          <p
                            className={`small mb-2 ${
                              overdue ? "text-danger fw-semibold" : "text-muted"
                            }`}
                          >
                            Due: {formatDueDate(task.dueDate)}
                            {overdue ? " (overdue)" : ""}
                          </p>
                        )}
                        <Link
                          className="btn btn-sm btn-outline-brand w-100 mb-2"
                          to={`/projects/${projectId}/tasks/${taskId}`}
                        >
                          Task details
                        </Link>
                        <label className="form-label small mb-0">Status</label>
                        <select
                          className="form-select form-select-sm mb-2"
                          value={task.status}
                          onChange={(event) =>
                            handleStatusChange(taskId, event.target.value)
                          }
                        >
                          {TASK_COLUMNS.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {canAssign ? (
                          <>
                            <label className="form-label small mb-0">
                              Assignee
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={assigneeId}
                              onChange={(event) =>
                                handleAssign(taskId, event.target.value)
                              }
                            >
                              <option value="">Unassigned</option>
                              {members.map((member) => (
                                <option
                                  key={member.user._id}
                                  value={String(member.user._id)}
                                >
                                  {member.user.name}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <p className="small mb-0 text-muted">
                            {task.assignee?.name || "Unassigned"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectBoard;
