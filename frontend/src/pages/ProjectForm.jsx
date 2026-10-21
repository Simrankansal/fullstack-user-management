/** Create or edit a project (admin create with owner; members on edit). */

import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";

import ProjectNav from "../components/ProjectNav";

import {

  createProject,

  getProjectById,

  getProjectTasks,

  updateProject,

} from "../api/projectApi";

import { getActiveUsers } from "../api/userApi";

import {

  getStoredUser,

  canCreateProject,

  isAppAdmin,

} from "../utils/permissions";



function ProjectForm() {

  const { id } = useParams();

  const isEdit = Boolean(id);

  const navigate = useNavigate();

  const user = getStoredUser();

  const admin = isAppAdmin(user);



  const [formData, setFormData] = useState({

    name: "",

    description: "",

    startDate: "",

    endDate: "",

    ownerId: "",

  });

  const [myRole, setMyRole] = useState(null);

  const [allUsers, setAllUsers] = useState([]);

  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const [loading, setLoading] = useState(isEdit);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");



  useEffect(() => {

    if (!isEdit && !canCreateProject(user)) {

      navigate("/projects", { replace: true });

    }

  }, [isEdit, user, navigate]);



  useEffect(() => {

    const loadUsers = async () => {

      try {

        const data = await getActiveUsers();

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

        const data = await getProjectById(id);

        const project = data.project;



        setFormData({

          name: project.name,

          description: project.description || "",

          startDate: project.startDate

            ? project.startDate.slice(0, 10)

            : "",

          endDate: project.endDate ? project.endDate.slice(0, 10) : "",

          ownerId: project.owner?._id || project.owner || "",

        });



        const tasksData = await getProjectTasks(id);

        setMyRole(tasksData.myRole);

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

    if (!formData.description.trim()) {

      setError("Description is required");

      return;

    }

    if (!formData.startDate || !formData.endDate) {

      setError("Start date and end date are required");

      return;

    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {

      setError("Start date cannot be after end date");

      return;

    }



    const payload = {

      name: formData.name.trim(),

      description: formData.description.trim(),

      startDate: formData.startDate,

      endDate: formData.endDate,

      memberIds: selectedMemberIds,

    };



    try {

      setSaving(true);



      if (isEdit) {

        if (admin && formData.ownerId) {

          payload.ownerId = formData.ownerId;

        }

        await updateProject(id, payload);

        navigate(`/projects/${id}`);

      } else {

        if (!formData.ownerId) {

          setError("Project owner is required");

          setSaving(false);

          return;

        }

        const data = await createProject({

          ...payload,

          ownerId: formData.ownerId,

        });

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

      <PageHeader title={isEdit ? "Edit project" : "Create project"}>

        <Link

          className="btn btn-outline-secondary btn-sm"

          to={isEdit ? `/projects/${id}` : "/projects"}

        >

          Cancel

        </Link>

      </PageHeader>



      {isEdit && <ProjectNav projectId={id} myRole={myRole} />}



      <div className="card shadow-sm project-form-card">

        <div className="card-body">

          <form onSubmit={handleSubmit} className="app-form">

            <div className="form-field-block">

              <label className="form-label" htmlFor="name">

                <span className="form-label-icon" aria-hidden="true">📁</span>

                Project name <span className="text-danger">*</span>

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

            <div className="form-field-block">

              <label className="form-label" htmlFor="description">

                <span className="form-label-icon" aria-hidden="true">📝</span>

                Description <span className="text-danger">*</span>

              </label>

              <textarea

                id="description"

                name="description"

                className="form-control"

                rows={3}

                value={formData.description}

                onChange={handleChange}

                required

              />

            </div>

            {(admin || !isEdit) && (

              <div className="form-field-block">

                <label className="form-label" htmlFor="ownerId">

                  <span className="form-label-icon" aria-hidden="true">👤</span>

                  Project owner <span className="text-danger">*</span>

                </label>

                <select

                  id="ownerId"

                  name="ownerId"

                  className="form-select"

                  value={formData.ownerId}

                  onChange={handleChange}

                  required

                  disabled={isEdit && !admin}

                >

                  <option value="">Select owner…</option>

                  {allUsers.map((u) => (

                    <option key={u._id} value={u._id}>

                      {u.name} ({u.email})

                    </option>

                  ))}

                </select>

                {isEdit && !admin && (

                  <p className="form-text small mb-0">

                    Only an admin can change the project owner (use Team on overview or ask admin).

                  </p>

                )}

              </div>

            )}

            <div className="row g-3">

              <div className="col-md-6 form-field-block">

                <label className="form-label" htmlFor="startDate">

                  <span className="form-label-icon" aria-hidden="true">📅</span>

                  Start date <span className="text-danger">*</span>

                </label>

                <input

                  id="startDate"

                  name="startDate"

                  type="date"

                  className="form-control"

                  value={formData.startDate}

                  onChange={handleChange}

                  required

                />

              </div>

              <div className="col-md-6 form-field-block">

                <label className="form-label" htmlFor="endDate">

                  <span className="form-label-icon" aria-hidden="true">📅</span>

                  End date <span className="text-danger">*</span>

                </label>

                <input

                  id="endDate"

                  name="endDate"

                  type="date"

                  className="form-control"

                  value={formData.endDate}

                  onChange={handleChange}

                  required

                />

              </div>

            </div>



            {isEdit && (

              <div className="form-field-block">

                <label className="form-label">

                  <span className="form-label-icon" aria-hidden="true">👥</span>

                  Team members

                </label>

                <div className="member-picker border rounded p-3 bg-light mt-1">

                  {allUsers.map((activeUser) => (

                    <div key={activeUser._id} className="form-check mb-2">

                      <input

                        className="form-check-input"

                        type="checkbox"

                        id={`member-${activeUser._id}`}

                        checked={selectedMemberIds.includes(activeUser._id)}

                        onChange={() => toggleMember(activeUser._id)}

                        disabled={

                          String(activeUser._id) === String(formData.ownerId)

                        }

                      />

                      <label

                        className="form-check-label small"

                        htmlFor={`member-${activeUser._id}`}

                      >

                        {activeUser.name} ({activeUser.email})

                      </label>

                    </div>

                  ))}

                </div>

              </div>

            )}



            {error && <div className="alert alert-danger">{error}</div>}



            <button

              type="submit"

              className="btn btn-brand align-self-start mt-1"

              disabled={saving}

            >

              {saving ? "Saving..." : "Save"}

            </button>

          </form>

        </div>

      </div>

    </div>

  );

}



export default ProjectForm;


