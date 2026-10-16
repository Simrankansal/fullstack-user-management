import { Link } from "react-router-dom";

function Home() {
  const token = localStorage.getItem("token");

  return (
    <div className="page page--home">
      <div className="hero card card--center">
        <span className="hero__badge">Learn MERN</span>
        <h1 className="hero__title">User Management App</h1>
        <p className="muted">
          Sign up, sign in, then manage users with full CRUD from your
          dashboard.
        </p>

        <div className="button-row">
          {token ? (
            <>
              <Link className="btn btn--primary" to="/dashboard">
                Go to Dashboard
              </Link>
              <Link className="btn btn--secondary" to="/users">
                Manage Users
              </Link>
            </>
          ) : (
            <>
              <Link className="btn btn--primary" to="/signup">
                Create account
              </Link>
              <Link className="btn btn--secondary" to="/login">
                Login
              </Link>
            </>
          )}
        </div>

        <div className="hero__features">
          <span className="hero__pill">Sign up & login</span>
          <span className="hero__pill">JWT auth</span>
          <span className="hero__pill">MongoDB CRUD</span>
        </div>
      </div>
    </div>
  );
}

export default Home;
