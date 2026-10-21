/** Task detail: edit fields, attachments, watchers, and comments. */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import { getApiErrorMessage } from "../utils/apiError";
import { getProjectById, getProjectTasks } from "../api/projectApi";
import TaskLabelChips from "../components/TaskLabelChips";
import TaskLabelEditor from "../components/TaskLabelEditor";
import TaskWatcherSection from "../components/TaskWatcherSection";
import {
  addTaskComment,
  addTaskWatcher,
  assignTask,
  deleteTaskAttachment,
  getAttachmentUrl,
  getTaskActivity,
  listTaskAttachments,
  listTaskWatchers,
  removeTaskWatcher,
  updateTask,
  updateTaskStatus,
  uploadTaskAttachment,
} from "../api/taskApi";
import { formatStatus, TASK_COLUMNS } from "../constants/taskStatus";
import { formatPriority, priorityBadgeClass } from "../utils/priority";
import {
  getStoredUser,
  canAssignTask,
  canManageProject,
  canViewTaskWatchers,
  canManageTaskWatchers,
} from "../utils/permissions";
import { formatDateDDMMYYYY } from "../utils/formatDate";

function TaskDetail() {
  const { projectId, taskId } = useParams();
  const storedUser = getStoredUser();

  const [task, setTask] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [myRole, setMyRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [watchers, setWatchers] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [addingWatchers, setAddingWatchers] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    labelNames: [],
  });
  const [loading, setLoading] = useState(true);
  const [savingComment, setSavingComment] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);

  const canEdit = canManageProject(storedUser, myRole);
  const canAssign = canAssignTask(storedUser, myRole);
  const canWatch = canViewTaskWatchers(storedUser, myRole);
  const canManageWatchers = canManageTaskWatchers(storedUser, myRole, task);

  const loadTaskMeta = async () => {
    const tasksData = await getProjectTasks(projectId);
    const taskList = tasksData.tasks || [];
    const foundTask = taskList.find(
      (item) => String(item._id) === String(taskId)
    );
    const role = tasksData.myRole;
    setMyRole(role);
    setMembers((tasksData.members || []).filter((m) => m.user));
    return { foundTask, role };
  };

  const loadExtras = async (role = myRole) => {
    try {
      const activityData = await getTaskActivity(taskId);
      setActivity(activityData.activity || []);
      setComments(activityData.comments || []);
    } catch {
      setActivity([]);
      setComments([]);
    }

    try {
      const attachData = await listTaskAttachments(taskId);
      setAttachments(attachData.attachments || []);
    } catch {
      setAttachments([]);
    }

    if (canViewTaskWatchers(storedUser, role)) {
      try {
        const watcherData = await listTaskWatchers(taskId);
        setWatchers(watcherData.watchers || []);
      } catch {
        setWatchers([]);
      }
    } else {
      setWatchers([]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      try {
        const projectData = await getProjectById(projectId);
        setProjectName(projectData.project?.name || "");
      } catch {
        setProjectName("");
      }
      const { foundTask, role } = await loadTaskMeta();
      if (!foundTask) {
        setTask(null);
        setError("Task not found");
        return;
      }
      setTask(foundTask);
      setEditForm({
        title: foundTask.title,
        description: foundTask.description || "",
        priority: foundTask.priority || "medium",
        dueDate: foundTask.dueDate
          ? foundTask.dueDate.slice(0, 10)
          : "",
        labelNames: (foundTask.labels || []).map(
          (label) => label.name || String(label)
        ),
      });
      await loadExtras(role);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, taskId]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }
    const timer = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleAddComment = async (event) => {
    event.preventDefault();
    const body = commentBody.trim();
    if (!body) {
      return;
    }

    const optimistic = {
      _id: `temp-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      user: { name: storedUser?.name || "You" },
      pending: true,
    };

    setComments((prev) => [optimistic, ...prev]);
    setCommentBody("");

    try {
      setSavingComment(true);
      setError("");
      await addTaskComment(taskId, body);
      await loadExtras();
    } catch (commentError) {
      setComments((prev) => prev.filter((c) => c._id !== optimistic._id));
      setCommentBody(body);
      setError(commentError.response?.data?.message || "Failed to add comment");
    } finally {
      setSavingComment(false);
    }
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();
    try {
      setSavingTask(true);
      setError("");
      const data = await updateTask(taskId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
        labelNames: editForm.labelNames,
      });
      setTask(data.task);
      setEditMode(false);
      await loadExtras();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to update task");
    } finally {
      setSavingTask(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      setError("");
      const data = await updateTaskStatus(taskId, status);
      setTask(data.task);
      await loadExtras();
    } catch (statusError) {
      setError(statusError.response?.data?.message || "Failed to update status");
    }
  };

  const handleAssign = async (assigneeId) => {
    try {
      setError("");
      const data = await assignTask(taskId, assigneeId || null);
      setTask(data.task);
    } catch (assignError) {
      setError(assignError.response?.data?.message || "Failed to assign task");
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setUploading(true);
      setError("");
      await uploadTaskAttachment(taskId, file);
      await loadExtras();
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const applyDeleteAttachment = async () => {
    if (!attachmentToDelete) {
      return;
    }
    try {
      setError("");
      await deleteTaskAttachment(attachmentToDelete.id);
      setAttachments((prev) =>
        prev.filter((a) => a._id !== attachmentToDelete.id)
      );
      setSuccessMessage("Attachment deleted.");
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Failed to delete file"));
    } finally {
      setAttachmentToDelete(null);
    }
  };

  const isWatching = watchers.some(
    (w) => String(w.user?._id || w.user) === String(storedUser?._id)
  );

  const handleAddWatchers = async (userIds) => {
    try {
      setAddingWatchers(true);
      setError("");
      await Promise.all(userIds.map((userId) => addTaskWatcher(taskId, userId)));
      const watcherData = await listTaskWatchers(taskId);
      setWatchers(watcherData.watchers || []);
    } catch (watchError) {
      setError(watchError.response?.data?.message || "Failed to add watchers");
      throw watchError;
    } finally {
      setAddingWatchers(false);
    }
  };

  const handleRemoveWatcher = async (userId) => {
    try {
      await removeTaskWatcher(taskId, userId);
      const watcherData = await listTaskWatchers(taskId);
      setWatchers(watcherData.watchers || []);
    } catch (watchError) {
      setError(watchError.response?.data?.message || "Failed to remove watcher");
    }
  };

  const toggleWatch = async () => {
    try {
      if (isWatching) {
        await removeTaskWatcher(taskId, storedUser._id);
      } else {
        await addTaskWatcher(taskId);
      }
      const watcherData = await listTaskWatchers(taskId);
      setWatchers(watcherData.watchers || []);
    } catch (watchError) {
      setError(watchError.response?.data?.message || "Failed to update watchers");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error && !task) {
    return (
      <div>
        <div className="alert alert-danger">{error}</div>
        <Link to="/tasks">Back to my tasks</Link>
      </div>
    );
  }

  return (
    <div className="task-detail-page">
      <nav className="task-detail-nav mb-3" aria-label="Task navigation">
        <Link className="task-detail-back" to="/tasks">
          ← Back to my tasks
        </Link>
      </nav>

      <PageHeader
        title={task.title}
        subtitle={projectName ? `Task in ${projectName}` : "Task details"}
      >
        <Link
          className="btn btn-brand btn-sm"
          to={`/projects/${projectId}/board`}
        >
          Task board
        </Link>
        {canWatch && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={toggleWatch}
          >
            {isWatching ? "Unwatch" : "Watch task"}
          </button>
        )}
        {canEdit && (
          <button
            type="button"
            className="btn btn-outline-brand btn-sm"
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? "Cancel edit" : "Edit task"}
          </button>
        )}
      </PageHeader>

      {successMessage && (
        <div className="alert alert-success" role="status">{successMessage}</div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          {editMode ? (
            <form onSubmit={handleSaveTask} className="app-form task-edit-form">
              <div className="form-field-block">
                <label className="form-label" htmlFor="editTitle">Title</label>
                <input
                  id="editTitle"
                  className="form-control"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-field-block">
                <label className="form-label" htmlFor="editDesc">Description</label>
                <textarea
                  id="editDesc"
                  className="form-control"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="row g-3">
                <div className="col-md-6 form-field-block">
                  <label className="form-label" htmlFor="editPriority">Priority</label>
                  <select
                    id="editPriority"
                    className="form-select"
                    value={editForm.priority}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, priority: e.target.value }))
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="col-md-6 form-field-block">
                  <label className="form-label" htmlFor="editDue">Due date</label>
                  <input
                    id="editDue"
                    type="date"
                    className="form-control"
                    value={editForm.dueDate}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, dueDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-field-block task-label-field">
                <label className="form-label" htmlFor="editTaskLabels">
                  <span className="form-label-icon" aria-hidden="true">🏷️</span>
                  Labels
                </label>
                <TaskLabelEditor
                  id="editTaskLabels"
                  labels={editForm.labelNames}
                  onChange={(labelNames) =>
                    setEditForm((form) => ({ ...form, labelNames }))
                  }
                />
              </div>
              <div className="task-form-actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setEditMode(false)}
                  disabled={savingTask}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-brand btn-sm px-4"
                  disabled={savingTask}
                >
                  {savingTask ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="row mb-0">
              <dt className="col-sm-3">Description</dt>
              <dd className="col-sm-9">{task.description || "—"}</dd>
              <dt className="col-sm-3">Priority</dt>
              <dd className="col-sm-9">
                <span className={`badge ${priorityBadgeClass(task.priority)}`}>
                  {formatPriority(task.priority)}
                </span>
              </dd>
              <dt className="col-sm-3">Status</dt>
              <dd className="col-sm-9">
                <select
                  className="form-select form-select-sm w-auto d-inline-block"
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  {TASK_COLUMNS.map((col) => (
                    <option key={col.key} value={col.key}>{col.label}</option>
                  ))}
                </select>
              </dd>
              <dt className="col-sm-3">Assignee</dt>
              <dd className="col-sm-9">
                {canAssign ? (
                  <select
                    className="form-select form-select-sm w-auto"
                    value={task.assignee?._id ? String(task.assignee._id) : ""}
                    onChange={(e) => handleAssign(e.target.value)}
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
                ) : (
                  task.assignee?.name || "Unassigned"
                )}
              </dd>
              <dt className="col-sm-3">Due date</dt>
              <dd className="col-sm-9">
                {formatDateDDMMYYYY(task.dueDate)}
              </dd>
              <dt className="col-sm-3">Labels</dt>
              <dd className="col-sm-9">
                {task.labels?.length ? (
                  <TaskLabelChips labels={task.labels} />
                ) : (
                  "—"
                )}
              </dd>
            </dl>
          )}
        </div>
      </div>

      <section className="task-detail-discussion mb-3" aria-label="Comments and activity">
      <div className="card shadow-sm mb-3">
        <div className="card-header bg-light fw-semibold">Comments</div>
        <div className="card-body">
          <form onSubmit={handleAddComment} className="mb-3">
            <label className="form-label" htmlFor="comment">Add comment</label>
            <textarea
              id="comment"
              className="form-control mb-1"
              rows={3}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Write a comment… Use @FirstName to mention a teammate"
            />
            <p className="form-text small mb-2">
              Mentions: type @ plus first name, full name (no spaces), or email
              username (e.g. @Simran or @admin).
            </p>
            <button
              type="submit"
              className="btn btn-brand btn-sm"
              disabled={savingComment}
            >
              {savingComment ? "Saving…" : "Add comment"}
            </button>
          </form>

          <ul className="list-group list-group-flush">
            {comments.length === 0 && (
              <li className="list-group-item text-muted">No comments yet.</li>
            )}
            {comments.map((item) => (
              <li
                key={item._id}
                className={`list-group-item ${item.pending ? "opacity-75" : ""}`}
              >
                <strong>{item.user?.name}</strong> — {item.body}
                <div className="small text-muted">
                  {new Date(item.createdAt).toLocaleString()}
                  {item.pending && " (sending…)"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-light fw-semibold">Activity history</div>
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
      </section>

      <div className="card shadow-sm mb-3">
        <div className="card-header bg-light fw-semibold">Attachments</div>
        <div className="card-body">
          <input
            type="file"
            className="form-control form-control-sm mb-3"
            disabled={uploading}
            onChange={handleUpload}
          />
          <ul className="list-group list-group-flush">
            {attachments.length === 0 && (
              <li className="list-group-item text-muted">No attachments.</li>
            )}
            {attachments.map((file) => {
              const fileUrl = getAttachmentUrl(file.fileName);
              const isImage = file.mimeType?.startsWith("image/");
              return (
                <li key={file._id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <a href={fileUrl} target="_blank" rel="noreferrer">
                        {file.originalName}
                      </a>
                      <div className="small text-muted">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger flex-shrink-0"
                      onClick={() =>
                        setAttachmentToDelete({
                          id: file._id,
                          name: file.originalName,
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                  {isImage && (
                    <img
                      src={fileUrl}
                      alt={file.originalName}
                      className="task-attachment-preview mt-2"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {canWatch && (
        <div className="card shadow-sm mb-3">
          <div className="card-header bg-light fw-semibold">Watchers</div>
          <div className="card-body">
            <TaskWatcherSection
              watchers={watchers}
              members={members}
              canManage={canManageWatchers}
              currentUserId={storedUser?._id}
              adding={addingWatchers}
              onAdd={handleAddWatchers}
              onRemove={handleRemoveWatcher}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        show={Boolean(attachmentToDelete)}
        title="Delete attachment?"
        message={`Remove "${attachmentToDelete?.name}" from this task? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setAttachmentToDelete(null)}
        onConfirm={applyDeleteAttachment}
      />
    </div>
  );
}

export default TaskDetail;
