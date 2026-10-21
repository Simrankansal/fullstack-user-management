/** Project overview: team, completion, archive, and member management. */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ProjectNav from "../components/ProjectNav";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  archiveProject,
  getProjectById,
  addProjectMember,
  removeProjectMember,
  restoreProject,
} from "../api/projectApi";
import { getActiveUsers } from "../api/userApi";
import {
  getStoredUser,
  canManageProject,
  isAppAdmin,
} from "../utils/permissions";
import { formatDateDDMMYYYY } from "../utils/formatDate";
import { updateProject } from "../api/projectApi";
import { getApiErrorMessage } from "../utils/apiError";

function ProjectDetail() {
  const { projectId } = useParams();
  const user = getStoredUser();
  const admin = isAppAdmin(user);

  const [project, setProject] = useState(null);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [activeUsers, setActiveUsers] = useState([]);
  const [addUserId, setAddUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [confirmOwnerChange, setConfirmOwnerChange] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const canManage = canManageProject(user, myRole);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getProjectById(projectId);
      setProject(data.project);
      setNewOwnerId(data.project.owner?._id || data.project.owner || "");
      setMembers(data.members || []);
      setMyRole(data.myRole);
      setCompletionPercent(data.completionPercent ?? 0);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }
    const timer = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!canManage && !admin) {
      return;
    }
    const loadUsers = async () => {
      try {
        const data = await getActiveUsers();
        setActiveUsers(data.users || []);
      } catch {
        setActiveUsers([]);
      }
    };
    loadUsers();
  }, [canManage, admin]);

  const memberUserIds = new Set(
    members.map((m) => String(m.user?._id || m.user))
  );

  const availableToAdd = activeUsers.filter(
    (u) => !memberUserIds.has(String(u._id))
  );

  const handleArchiveToggle = async () => {
    try {
      setActionLoading(true);
      if (project.archived) {
        await restoreProject(projectId);
      } else {
        await archiveProject(projectId);
      }
      setConfirmArchive(false);
      await loadProject();
    } catch (archiveError) {
      setError(
        archiveError.response?.data?.message || "Failed to update project"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    if (!addUserId) {
      return;
    }
    try {
      setActionLoading(true);
      await addProjectMember(projectId, addUserId);
      setAddUserId("");
      await loadProject();
    } catch (addError) {
      setError(addError.response?.data?.message || "Failed to add member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeOwner = (event) => {
    event.preventDefault();
    const ownerId = newOwnerId;
    if (!ownerId || String(ownerId) === String(project.owner?._id || project.owner)) {
      return;
    }
    setConfirmOwnerChange(true);
  };

  const applyOwnerChange = async () => {
    try {
      setActionLoading(true);
      setError("");
      await updateProject(projectId, { ownerId: newOwnerId });
      await loadProject();
      setSuccessMessage("Project owner updated.");
    } catch (ownerError) {
      setError(getApiErrorMessage(ownerError, "Failed to change owner"));
    } finally {
      setActionLoading(false);
      setConfirmOwnerChange(false);
    }
  };

  const applyRemoveMember = async () => {
    if (!memberToRemove) {
      return;
    }
    try {
      setActionLoading(true);
      setError("");
      await removeProjectMember(projectId, memberToRemove.id);
      await loadProject();
      setSuccessMessage(`${memberToRemove.name} was removed from the project.`);
    } catch (removeError) {
      setError(getApiErrorMessage(removeError, "Failed to remove member"));
    } finally {
      setActionLoading(false);
      setMemberToRemove(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div>
        <div className="alert alert-danger">{error}</div>
        <Link to="/projects">Back to projects</Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={project.archived ? "Archived project" : project.description}
      >
        <Link className="btn btn-outline-secondary btn-sm" to="/projects">
          All projects
        </Link>
        {canManage && (
          <button
            type="button"
            className={`btn btn-sm ${
              project.archived ? "btn-success" : "btn-outline-warning"
            }`}
            onClick={() => setConfirmArchive(true)}
            disabled={actionLoading}
          >
            {project.archived ? "Restore" : "Archive"}
          </button>
        )}
      </PageHeader>

      {project.archived && (
        <div className="alert alert-warning">
          This project is archived. Restore it to manage tasks on the board.
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="status">{successMessage}</div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      <ProjectNav projectId={projectId} myRole={myRole} />

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light fw-semibold">Overview</div>
            <div className="card-body">
              <dl className="row mb-3">
                <dt className="col-sm-4">Owner</dt>
                <dd className="col-sm-8">{project.owner?.name || "—"}</dd>
                <dt className="col-sm-4">Start</dt>
                <dd className="col-sm-8">{formatDateDDMMYYYY(project.startDate)}</dd>
                <dt className="col-sm-4">End</dt>
                <dd className="col-sm-8">{formatDateDDMMYYYY(project.endDate)}</dd>
              </dl>
              <p className="small text-muted mb-1">Task completion</p>
              <div className="progress mb-2" style={{ height: "1.25rem" }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${completionPercent}%` }}
                >
                  {completionPercent}%
                </div>
              </div>
              {!project.archived && (
                <Link
                  className="btn btn-brand btn-sm"
                  to={`/projects/${projectId}/board`}
                >
                  Open task board
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light fw-semibold">Team</div>
            <div className="card-body">
              {admin && (
                <form
                  onSubmit={handleChangeOwner}
                  className="app-form border rounded p-3 mb-3 bg-light"
                >
                  <label className="form-label small fw-semibold" htmlFor="changeOwner">
                    <span className="form-label-icon" aria-hidden="true">👤</span>
                    Change project owner
                  </label>
                  <div className="row g-2 align-items-end">
                    <div className="col">
                      <select
                        id="changeOwner"
                        className="form-select form-select-sm"
                        value={newOwnerId}
                        onChange={(event) => setNewOwnerId(event.target.value)}
                      >
                        {activeUsers.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-auto">
                      <button
                        type="submit"
                        className="btn btn-brand btn-sm"
                        disabled={
                          actionLoading ||
                          String(newOwnerId) ===
                            String(project.owner?._id || project.owner)
                        }
                      >
                        Update owner
                      </button>
                    </div>
                  </div>
                </form>
              )}
              <ul className="list-group list-group-flush mb-3 team-member-list">
                {members.length === 0 && (
                  <li className="list-group-item text-muted">No members.</li>
                )}
                {members.map((member) => {
                  const memberUser = member.user;
                  const uid = String(memberUser?._id || memberUser);
                  const isOwner =
                    member.role === "owner" ||
                    String(project.owner?._id) === uid;

                  return (
                    <li
                      key={uid}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <span className="fw-medium">{memberUser?.name}</span>
                        <span className="text-muted small ms-2">
                          {memberUser?.email}
                        </span>
                        <span className="badge text-bg-secondary ms-2">
                          {member.role}
                        </span>
                      </div>
                      {canManage && !isOwner && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={actionLoading}
                          onClick={() =>
                            setMemberToRemove({
                              id: uid,
                              name: memberUser?.name || "Member",
                            })
                          }
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>

              {canManage && (
                <form onSubmit={handleAddMember} className="row g-2">
                  <div className="col">
                    <select
                      className="form-select form-select-sm"
                      value={addUserId}
                      onChange={(event) => setAddUserId(event.target.value)}
                    >
                      <option value="">Add team member…</option>
                      {availableToAdd.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-auto">
                    <button
                      type="submit"
                      className="btn btn-brand btn-sm"
                      disabled={!addUserId || actionLoading}
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        show={confirmArchive}
        title={project.archived ? "Restore project?" : "Archive project?"}
        message={
          project.archived
            ? "The project will become active again and appear in default lists."
            : "Archived projects are hidden from active lists. You can restore later."
        }
        confirmLabel={project.archived ? "Restore" : "Archive"}
        variant={project.archived ? "success" : "warning"}
        onCancel={() => setConfirmArchive(false)}
        onConfirm={handleArchiveToggle}
      />

      <ConfirmDialog
        show={Boolean(memberToRemove)}
        title="Remove team member?"
        message={`Remove ${memberToRemove?.name} from this project? They will lose access to its tasks.`}
        confirmLabel="Remove"
        onCancel={() => setMemberToRemove(null)}
        onConfirm={applyRemoveMember}
      />

      <ConfirmDialog
        show={confirmOwnerChange}
        title="Change project owner?"
        message="The selected user will become the project owner and can manage members and tasks."
        confirmLabel="Change owner"
        variant="warning"
        onCancel={() => setConfirmOwnerChange(false)}
        onConfirm={applyOwnerChange}
      />
    </div>
  );
}

export default ProjectDetail;
