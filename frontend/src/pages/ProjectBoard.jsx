import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProjectTasks } from "../api/projectApi";
import { createTask, updateTaskStatus, assignTask } from "../api/taskApi";
import { TASK_COLUMNS } from "../constants/taskStatus";
import { formatPriority } from "../utils/priority";

function ProjectBoard() {
  const { projectId } = useParams();

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [creating, setCreating] = useState(false);

  const formatDueDate = (value) => {
    if (!value) {
      return "";
    }
    return new Date(value).toLocaleDateString();
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

    try {
      setCreating(true);
      setError("");

      await createTask({
        projectId,
        title,
        description: newTaskDescription.trim(),
        dueDate: newTaskDueDate || null,
        priority: newTaskPriority,
      });

      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskDueDate("");
      setNewTaskPriority("medium");
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

  const tasksByStatus = (status) =>
    tasks.filter((task) => task.status === status);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">Task board</h1>
        <Link className="btn btn-outline-secondary" to="/projects">
          Back to projects
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={handleCreateTask}>
            <div className="row g-2">
              <div className="col-md-8">
                <label className="form-label small" htmlFor="taskTitle">
                  Title
                </label>
                <input
                  id="taskTitle"
                  type="text"
                  className="form-control"
                  placeholder="Task title"
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                />
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={creating}
                >
                  {creating ? "Adding..." : "Add task"}
                </button>
              </div>
              <div className="col-md-8">
                <label className="form-label small" htmlFor="taskDescription">
                  Description
                </label>
                <textarea
                  id="taskDescription"
                  className="form-control"
                  rows={2}
                  placeholder="Task description (optional)"
                  value={newTaskDescription}
                  onChange={(event) =>
                    setNewTaskDescription(event.target.value)
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small" htmlFor="taskDueDate">
                  Due date
                </label>
                <input
                  id="taskDueDate"
                  type="date"
                  className="form-control"
                  value={newTaskDueDate}
                  onChange={(event) => setNewTaskDueDate(event.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small" htmlFor="taskPriority">
                  Priority
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
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>

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

                  return (
                    <div
                      key={taskId}
                      className="card kanban-card mb-2 shadow-sm"
                    >
                      <div className="card-body p-2">
                        <p className="fw-semibold mb-1">{task.title}</p>
                        <span className="badge text-bg-light border mb-1">
                          {formatPriority(task.priority)}
                        </span>
                        {task.description && (
                          <p className="small text-muted mb-1">
                            {task.description}
                          </p>
                        )}
                        {task.dueDate && (
                          <p className="small text-muted mb-2">
                            Due: {formatDueDate(task.dueDate)}
                          </p>
                        )}
                        <Link
                          className="btn btn-sm btn-outline-primary w-100 mb-2"
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
