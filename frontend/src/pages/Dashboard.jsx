/** Dashboard summary cards from the reports API. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../api/reportApi";
import LoadingSpinner from "../components/LoadingSpinner";
import { getApiErrorMessage } from "../utils/apiError";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data.stats);
      } catch (fetchError) {
        setError(getApiErrorMessage(fetchError, "Failed to load dashboard"));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading dashboard…" />;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const projectCards = [
    {
      label: "Total projects",
      value: stats.projects.total,
      accent: "accent-indigo",
    },
    {
      label: "Active",
      value: stats.projects.active,
      accent: "accent-emerald",
    },
    {
      label: "Archived",
      value: stats.projects.archived,
      accent: "accent-violet",
    },
  ];

  const taskCards = [
    { label: "To do", value: stats.tasks.todo, accent: "accent-sky" },
    {
      label: "In progress",
      value: stats.tasks.in_progress,
      accent: "accent-indigo",
    },
    { label: "In review", value: stats.tasks.in_review, accent: "accent-amber" },
    { label: "Completed", value: stats.tasks.completed, accent: "accent-emerald" },
    { label: "Overdue", value: stats.tasks.overdue, accent: "accent-rose" },
    {
      label: "Due in 7 days",
      value: stats.tasks.dueWithinSevenDays,
      accent: "accent-amber",
    },
    {
      label: "Assigned to me",
      value: stats.tasks.assignedToMe,
      accent: "accent-violet",
    },
  ];

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Snapshot of your projects and tasks at a glance
      </p>

      <h2 className="h6 text-secondary fw-semibold mb-3">Projects</h2>
      <div className="row g-3 mb-4">
        {projectCards.map((card) => (
          <div key={card.label} className="col-sm-6 col-xl-4">
            <div className={`metric-card ${card.accent}`}>
              <div className="metric-label">{card.label}</div>
              <div className="metric-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="h6 text-secondary fw-semibold mb-3">Tasks</h2>
      <div className="row g-3 mb-4">
        {taskCards.map((card) => (
          <div key={card.label} className="col-sm-6 col-xl-3">
            <div className={`metric-card ${card.accent}`}>
              <div className="metric-label">{card.label}</div>
              <div className="metric-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {stats.memberTaskProgress?.projects?.length > 0 && (
        <>
          <h2 className="h6 text-secondary fw-semibold mb-1">
            Member-wise task progress
          </h2>
          <p className="small text-secondary mb-3">
            {stats.memberTaskProgress.projects.some((p) => p.canViewTeam)
              ? "Team progress on projects you manage or administer."
              : "Your assigned task progress on each project."}
          </p>
          <div className="row g-3 mb-4">
            {stats.memberTaskProgress.projects.map((project) => (
              <div key={String(project.projectId)} className="col-lg-6">
                <div className="card app-card h-100 member-progress-card">
                  <div className="card-body">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                      <Link
                        to={`/projects/${project.projectId}`}
                        className="fw-semibold text-decoration-none member-progress-project"
                      >
                        {project.projectName}
                      </Link>
                      {project.canViewTeam && (
                        <span className="badge rounded-pill bg-light text-secondary border">
                          Team view
                        </span>
                      )}
                    </div>
                    {project.members.length === 0 ? (
                      <p className="text-muted small mb-0">
                        No assigned tasks for members yet.
                      </p>
                    ) : (
                      <ul className="list-unstyled mb-0 member-progress-list">
                        {project.members.map((member) => (
                          <li
                            key={String(member.userId)}
                            className="member-progress-row"
                          >
                            <div className="member-progress-row-head">
                              <span className="member-progress-name">
                                {member.name}
                                {member.role === "owner" && (
                                  <span className="member-progress-role">
                                    Owner
                                  </span>
                                )}
                              </span>
                              <span className="member-progress-stats small text-secondary">
                                {member.completed}/{member.assigned} done
                                {member.pending > 0 && (
                                  <span className="text-warning-emphasis">
                                    {" "}
                                    · {member.pending} open
                                  </span>
                                )}
                              </span>
                            </div>
                            <div
                              className="progress member-progress-bar"
                              role="progressbar"
                              aria-valuenow={member.completionPercent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${member.name} task completion`}
                            >
                              <div
                                className="progress-bar"
                                style={{
                                  width: `${member.completionPercent}%`,
                                }}
                              />
                            </div>
                            <span className="member-progress-pct small text-secondary">
                              {member.assigned === 0
                                ? "No tasks assigned"
                                : `${member.completionPercent}%`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
