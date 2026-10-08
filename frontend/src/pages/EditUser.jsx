import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getUserById,
  updateUser,
} from "../api/userApi";

function EditUser() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserById(id);

        setFormData({
          name: data.user.name,
          email: data.user.email,
        });
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to fetch user"
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
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const data = await updateUser(
        id,
        formData
      );

      setMessage(data.message);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to update user"
      );
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return <h2>Loading...</h2>;
  }


  return (
    <div>
      <h1>Edit User</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Email</label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
        >
          {saving ? "Updating..." : "Update User"}
        </button>
      </form>

      {message && <p>{message}</p>}

      {error && <p>{error}</p>}

      <button
        onClick={() => navigate("/users")}
      >
        Back to Users
      </button>
    </div>
  );
}

export default EditUser;