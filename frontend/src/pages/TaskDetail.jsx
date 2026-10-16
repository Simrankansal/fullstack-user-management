import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProjectTasks } from "../api/projectApi";
import { addTaskComment, getTaskActivity } from "../api/taskApi";
import { formatStatus } from "../constants/taskStatus";
import { formatPriority } from "../utils/priority";

function TaskDetail() {
  const { projectId, taskId } = useParams();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingComment, setSavingComment] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const tasksData = await getProjectTasks(projectId);
      const taskList = tasksData.tasks || [];

      const foundTask = taskList.find(
        (item) => String(item._id) === String(taskId)
      );

      if (!foundTask) {
        setTask(null);
        setError("Task not found");
        return;
      }

      setTask(foundTask);

      try {
        const activityData = await getTaskActivity(taskId);
        setActivity(activityData.activity || []);
        setComments(activityData.comments || []);
      } catch {
        setActivity([]);
        setComments([]);
      }
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, taskId]);

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!commentBody.trim()) {
      return;
    }

    try {
      setSavingComment(true);
      setError("");
      await addTaskComment(taskId, commentBody.trim());
      setCommentBody("");
      await loadData();
    } catch (commentError) {
      setError(commentError.response?.data?.message || "Failed to add comment");
    } finally {
      setSavingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div>
        <div className="alert alert-danger">{error || "Task not found"}</div>
        <Link to={`/projects/${projectId}/board`}>Back to board</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">{task.title}</h1>
        <Link
          className="btn btn-outline-secondary"
          to={`/projects/${projectId}/board`}
        >
          Back to board
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <dl className="row mb-0">
            <dt className="col-sm-3">Description</dt>
            <dd className="col-sm-9">{task.description || "—"}</dd>
            <dt className="col-sm-3">Priority</dt>
            <dd className="col-sm-9">{formatPriority(task.priority)}</dd>
            <dt className="col-sm-3">Status</dt>
            <dd className="col-sm-9">
              <span className="badge text-bg-secondary">
                {formatStatus(task.status)}
              </span>
            </dd>
            <dt className="col-sm-3">Assignee</dt>
            <dd className="col-sm-9">{task.assignee?.name || "Unassigned"}</dd>
            <dt className="col-sm-3">Due date</dt>
            <dd className="col-sm-9">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "—"}
            </dd>
          </dl>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-header bg-light fw-semibold">Comments</div>
        <div className="card-body">
          <form onSubmit={handleAddComment} className="mb-3">
            <label className="form-label" htmlFor="comment">
              Add comment
            </label>
            <textarea
              id="comment"
              className="form-control mb-2"
              rows={3}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={savingComment}
            >
              {savingComment ? "Saving..." : "Add comment"}
            </button>
          </form>

          <ul className="list-group list-group-flush">
            {comments.length === 0 && (
              <li className="list-group-item text-muted">No comments yet.</li>
            )}
            {comments.map((item) => (
              <li key={item._id} className="list-group-item">
                <strong>{item.user?.name}</strong> — {item.body}
                <div className="small text-muted">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-light fw-semibold">
          Activity history
        </div>
        <div className="card-body p-0">
          <ul className="list-group list-group-flush">
            {activity.length === 0 && (
              <li className="list-group-item text-muted">No activity yet.</li>
            )}
            {activity.map((item) => (
              <li key={item._id} className="list-group-item">
                <strong>{item.user?.name}</strong> — {item.action}
                {item.oldValue && item.newValue && (
                  <span> ({item.oldValue} → {item.newValue})</span>
                )}
                <div className="small text-muted">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TaskDetail;
