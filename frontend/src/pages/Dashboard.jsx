import { useEffect, useState } from "react";
import { getProfile } from "../api/userApi";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();

        setUser(data.user);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <div>
      <h1>Dashboard</h1>

      {user && (
        <>
          <h2>Welcome, {user.name}</h2>

          <p>Email: {user.email}</p>

          <p>User ID: {user._id}</p>
        </>
      )}
    </div>
  );
}

export default Dashboard;