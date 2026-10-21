/** Admin user list with role and status columns. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { getUsers, deleteUser } from "../api/userApi";
import ConfirmDialog from "../components/ConfirmDialog";
import { getApiErrorMessage } from "../utils/apiError";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers();
      setUsers(data.users || []);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Failed to fetch users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteId) {
      return;
    }
    try {
      await deleteUser(deleteId);
      setUsers((previousUsers) =>
        previousUsers.filter((user) => user._id !== deleteId)
      );
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Failed to delete user"));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div>
      <PageHeader title="User list" />

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
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-muted">
                        No users found.
                      </td>
                    </tr>
                  )}
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="fw-medium">{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            user.role === "admin"
                              ? "text-bg-primary"
                              : "text-bg-secondary"
                          }`}
                        >
                          {user.role || "member"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            user.isActive !== false
                              ? "text-bg-success"
                              : "text-bg-danger"
                          }`}
                        >
                          {user.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="btn btn-sm btn-outline-brand me-1"
                          to={`/users/edit/${user._id}`}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteId(user._id)}
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

      <ConfirmDialog
        show={Boolean(deleteId)}
        title="Delete user?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default Users;
