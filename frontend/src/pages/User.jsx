import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers, deleteUser } from "../api/userApi";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers();
      setUsers(data.users || []);
    } catch (fetchError) {
      setError(
        fetchError.response?.data?.message || "Failed to fetch users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteUser(id);
      setUsers((previousUsers) =>
        previousUsers.filter((user) => user._id !== id)
      );
    } catch (deleteError) {
      alert(
        deleteError.response?.data?.message || "Failed to delete user"
      );
    }
  };

  return (
    <div>
      <h1 className="h3 mb-4">User list</h1>

      <div className="card shadow-sm">
        <div className="card-body">
          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary" />
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-muted">
                        No users found.
                      </td>
                    </tr>
                  )}
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="fw-medium">{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <Link
                          className="btn btn-sm btn-outline-primary me-1"
                          to={`/users/edit/${user._id}`}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(user._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;
