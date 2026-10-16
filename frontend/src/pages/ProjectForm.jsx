import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createProject,
  getProjects,
  getProjectTasks,
  updateProject,
} from "../api/projectApi";
import { getUsers } from "../api/userApi";

function ProjectForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [allUsers, setAllUsers] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setAllUsers(data.users || []);
      } catch {
        setAllUsers([]);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    const loadProject = async () => {
      try {
        const data = await getProjects({ limit: 100 });
        const project = data.projects.find((item) => item._id === id);

        if (!project) {
          setError("Project not found or access denied");
          return;
        }

        setFormData({
          name: project.name,
          description: project.description || "",
          startDate: project.startDate
            ? project.startDate.slice(0, 10)
            : "",
          endDate: project.endDate ? project.endDate.slice(0, 10) : "",
        });

        const tasksData = await getProjectTasks(id);
        const memberIds = (tasksData.members || [])
          .filter((member) => member.role !== "owner")
          .map((member) => member.user._id);
        setSelectedMemberIds(memberIds);
      } catch (loadError) {
        setError(
          loadError.response?.data?.message || "Failed to load project"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const toggleMember = (userId) => {
    setSelectedMemberIds((previous) =>
      previous.includes(userId)
        ? previous.filter((item) => item !== userId)
        : [...previous, userId]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      memberIds: selectedMemberIds,
    };

    try {
      setSaving(true);

      if (isEdit) {
        await updateProject(id, payload);
        navigate(`/projects/${id}/board`);
      } else {
        const data = await createProject(payload);
        navigate(`/projects/${data.project._id}/board`);
      }
    } catch (submitError) {
      setError(
        submitError.response?.data?.message || "Failed to save project"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="h3 mb-4">
        {isEdit ? "Edit project" : "Create project"}
      </h1>

      <div className="card shadow-sm" >
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="name">
                Project name
              </label>
              <input
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="startDate">
                  Start date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="form-control"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="endDate">
                  End date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  className="form-control"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Team members</label>
              <div
                className="border rounded p-2 bg-light"
                style={{ maxHeight: 140, overflowY: "auto" }}
              >
                {allUsers.map((user) => (
                  <div key={user._id} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`member-${user._id}`}
                      checked={selectedMemberIds.includes(user._id)}
                      onChange={() => toggleMember(user._id)}
                    />
                    <label
                      className="form-check-label small"
                      htmlFor={`member-${user._id}`}
                    >
                      {user.name} ({user.email})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <Link className="btn btn-outline-secondary" to="/projects">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProjectForm;
