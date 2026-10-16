import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getUserById, updateUser } from "../api/userApi";
import { validateEmail, validateName } from "../utils/validation";

function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
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
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
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

      await updateUser(id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
      });

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
      <h1 className="h3 mb-4">Edit user</h1>

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

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Updating..." : "Update user"}
              </button>
              <Link className="btn btn-outline-secondary" to="/users">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditUser;
