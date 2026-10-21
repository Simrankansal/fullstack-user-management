/** Edit user profile; admins can set role and active status. */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { getUserById, updateUser } from "../api/userApi";
import { validateEmail, validateName } from "../utils/validation";
import { getStoredUser, isAppAdmin } from "../utils/permissions";

function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const admin = isAppAdmin(currentUser);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member",
    isActive: true,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserById(id);

        setFormData({
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || "member",
          isActive: data.user.isActive !== false,
        });
      } catch (fetchError) {
        setError(
          fetchError.response?.data?.message || "Failed to fetch user"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
    };

    setFieldErrors(errors);

    return !errors.name && !errors.email;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      if (admin) {
        payload.role = formData.role;
        payload.isActive = formData.isActive;
      }

      await updateUser(id, payload);

      navigate("/users", { replace: true });
    } catch (submitError) {
      setError(
        submitError.response?.data?.message || "Failed to update user"
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
      <PageHeader title="Edit user">
        <Link className="btn btn-outline-secondary btn-sm" to="/users">
          Cancel
        </Link>
      </PageHeader>

      <div className="card shadow-sm" style={{ maxWidth: 480 }}>
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
              />
              {fieldErrors.name && (
                <div className="form-text text-danger">{fieldErrors.name}</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
              />
              {fieldErrors.email && (
                <div className="form-text text-danger">{fieldErrors.email}</div>
              )}
            </div>

            {admin && (
              <>
                <div className="mb-3">
                  <label className="form-label" htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    className="form-select"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="mb-3 form-check">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="isActive">
                    Active account
                  </label>
                </div>
              </>
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            <button
              type="submit"
              className="btn btn-brand"
              disabled={saving}
            >
              {saving ? "Updating..." : "Update user"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditUser;
