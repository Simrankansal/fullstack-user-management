import { useEffect, useState } from "react";

import {
  getUsers,
  deleteUser,
} from "../api/userApi";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const data = await getUsers();

      setUsers(data.users);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to fetch users"
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
        previousUsers.filter(
          (user) => user._id !== id
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to delete user"
      );
    }
  };


  if (loading) {
    return <h2>Loading users...</h2>;
  }


  if (error) {
    return <h2>{error}</h2>;
  }


  return (
    <div>
      <h1>Users</h1>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        users.map((user) => (
          <div key={user._id}>
            <h3>{user.name}</h3>

            <p>{user.email}</p>

         <button
  onClick={() =>
    window.location.href = `/users/edit/${user._id}`
  }
>
  Edit
</button>

<button
  onClick={() =>
    handleDelete(user._id)
  }
>
  Delete
</button>
            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Users;