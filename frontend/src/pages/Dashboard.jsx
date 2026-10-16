import { useEffect, useState } from "react";
import { getProjects, getProjectTasks } from "../api/projectApi";

function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const projectsData = await getProjects({ limit: 100, page: 1 });
        const projects = projectsData.projects || [];

        let pending = 0;
        let inProgress = 0;
        let completed = 0;

        for (const project of projects) {
          const tasksData = await getProjectTasks(project._id);
          const tasks = tasksData.tasks || [];

          for (const task of tasks) {
            if (task.status === "todo" || task.status === "in_review") {
              pending += 1;
            } else if (task.status === "in_progress") {
              inProgress += 1;
            } else if (task.status === "completed") {
              completed += 1;
            }
          }
        }

        setStats({
          totalProjects: projects.length,
          pending,
          inProgress,
          completed,
        });
      } catch (fetchError) {
        setError(
          fetchError.response?.data?.message ||
            "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const cards = [
    { label: "Total projects", value: stats.totalProjects, border: "primary" },
    { label: "Pending tasks", value: stats.pending, border: "warning" },
    { label: "In-progress tasks", value: stats.inProgress, border: "info" },
    { label: "Completed tasks", value: stats.completed, border: "success" },
  ];

  return (
    <div>
      <h1 className="h3 mb-4">Dashboard</h1>

      <div className="row g-3">
        {cards.map((card) => (
          <div key={card.label} className="col-sm-6 col-xl-3">
            <div className={`card border-${card.border} h-100`}>
              <div className="card-body">
                <p className="card-text text-muted small mb-1">{card.label}</p>
                <p className="display-6 fw-semibold mb-0">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
