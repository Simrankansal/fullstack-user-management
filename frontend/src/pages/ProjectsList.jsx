/** Paginated project list with search filters and archived view. */

import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import PageHeader from "../components/PageHeader";

import { getProjects } from "../api/projectApi";

import { getStoredUser, canCreateProject } from "../utils/permissions";

import { formatDateDDMMYYYY } from "../utils/formatDate";



function ProjectsList() {

  const user = getStoredUser();

  const [view, setView] = useState("active");

  const [order, setOrder] = useState("desc");

  const [projects, setProjects] = useState([]);

  const [pagination, setPagination] = useState({

    page: 1,

    limit: 10,

    total: 0,

    totalPages: 0,

  });



  const [search, setSearch] = useState("");

  const [ownerName, setOwnerName] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [ownerNameInput, setOwnerNameInput] = useState("");



  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  const fetchProjects = async (page = 1) => {

    try {

      setLoading(true);

      setError("");



      const data = await getProjects({

        page,

        limit: pagination.limit,

        search,

        ownerName,

        sort: "createdAt",

        order,

        archived: view === "archived" ? "true" : undefined,

      });



      setProjects(data.projects);

      setPagination(data.pagination);

    } catch (fetchError) {

      setError(

        fetchError.response?.data?.message || "Failed to load projects"

      );

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchProjects(pagination.page);

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [search, ownerName, order, view, pagination.page]);



  const handleSearchSubmit = (event) => {

    event.preventDefault();

    setSearch(searchInput.trim());

    setOwnerName(ownerNameInput.trim());

    setPagination((previous) => ({ ...previous, page: 1 }));

  };



  const clearFilters = () => {

    setSearchInput("");

    setOwnerNameInput("");

    setSearch("");

    setOwnerName("");

    setPagination((previous) => ({ ...previous, page: 1 }));

  };



  const switchView = (next) => {

    setView(next);

    setPagination((previous) => ({ ...previous, page: 1 }));

  };



  return (

    <div className="projects-page">

      <PageHeader

        title={view === "archived" ? "Archived projects" : "Projects"}

        subtitle={

          view === "archived"

            ? "Restore a project from its overview page when you need it active again."

            : "Search by name or owner, and sort by newest or oldest."

        }

      >

        {canCreateProject(user) && view === "active" && (

          <Link className="btn btn-brand btn-sm" to="/projects/new">

            + Create project

          </Link>

        )}

      </PageHeader>



      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">

        <ul className="nav task-tabs list-unstyled mb-0">

          <li className="nav-item">

            <button

              type="button"

              className={`nav-link border-0 ${view === "active" ? "active" : ""}`}

              onClick={() => switchView("active")}

            >

              Active

            </button>

          </li>

          <li className="nav-item">

            <button

              type="button"

              className={`nav-link border-0 ${view === "archived" ? "active" : ""}`}

              onClick={() => switchView("archived")}

            >

              Archived

            </button>

          </li>

        </ul>



        <div className="d-flex align-items-center gap-2">

          <label className="small text-secondary mb-0" htmlFor="projectOrder">

            Show

          </label>

          <select

            id="projectOrder"

            className="form-select form-select-sm projects-order-select"

            value={order}

            onChange={(event) => {

              setOrder(event.target.value);

              setPagination((previous) => ({ ...previous, page: 1 }));

            }}

          >

            <option value="desc">Newest first</option>

            <option value="asc">Oldest first</option>

          </select>

        </div>

      </div>



      <div className="card app-card projects-filter-card shadow-sm mb-3">

        <div className="card-body">

          <form className="app-form" onSubmit={handleSearchSubmit}>

            <div className="row g-3 align-items-end">

              <div className="col-md-5 form-field-block mb-0">

                <label className="form-label small" htmlFor="projectSearch">

                  Search name / description

                </label>

                <input

                  id="projectSearch"

                  type="search"

                  className="form-control"

                  value={searchInput}

                  onChange={(event) => setSearchInput(event.target.value)}

                  placeholder="Type to search…"

                />

              </div>

              <div className="col-md-4 form-field-block mb-0">

                <label className="form-label small" htmlFor="ownerSearch">

                  Owner name

                </label>

                <input

                  id="ownerSearch"

                  type="search"

                  className="form-control"

                  value={ownerNameInput}

                  onChange={(event) => setOwnerNameInput(event.target.value)}

                  placeholder="e.g. Simran"

                />

              </div>

              <div className="col-md-3 d-flex gap-2">

                <button type="submit" className="btn btn-brand btn-sm flex-grow-1">

                  Search

                </button>

                <button
                  type="button"
                  className={`btn btn-filter-clear btn-sm ${
                    search || ownerName ? "is-active" : ""
                  }`}
                  onClick={clearFilters}
                  disabled={!search && !ownerName}
                >
                  Clear
                </button>

              </div>

            </div>

          </form>

        </div>

      </div>



      <div className="card app-card shadow-sm">

        <div className="card-body p-0">

          {loading && (

            <div className="text-center py-5">

              <div className="spinner-border text-primary" role="status" />

            </div>

          )}



          {error && (

            <div className="alert alert-danger m-3 mb-0">{error}</div>

          )}



          {!loading && !error && (

            <div className="table-responsive">

              <table className="table table-hover align-middle mb-0 projects-table">

                <thead>

                  <tr>

                    <th>Name</th>

                    <th>Owner</th>

                    <th>Description</th>

                    <th>Start</th>

                    <th>End</th>

                    <th className="text-center">Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {projects.length === 0 && (

                    <tr>

                      <td colSpan={6} className="text-muted text-center py-4">

                        {view === "archived"

                          ? "No archived projects."

                          : "No projects found."}

                      </td>

                    </tr>

                  )}

                  {projects.map((project) => (

                    <tr key={project._id}>

                      <td className="fw-semibold">{project.name}</td>

                      <td>{project.owner?.name || "—"}</td>

                      <td className="text-secondary small">

                        {project.description || "—"}

                      </td>

                      <td>{formatDateDDMMYYYY(project.startDate)}</td>

                      <td>{formatDateDDMMYYYY(project.endDate)}</td>

                      <td>

                        <div className="project-row-actions">

                          <Link

                            className="btn btn-sm btn-icon-action btn-icon-muted"

                            to={`/projects/${project._id}`}

                            title="Overview"

                            aria-label="Overview"

                          >

                            <span aria-hidden="true">📋</span>

                          </Link>

                          {view === "active" && (

                            <Link

                              className="btn btn-sm btn-icon-action btn-icon-primary"

                              to={`/projects/${project._id}/board`}

                              title="Task board"

                              aria-label="Task board"

                            >

                              <span aria-hidden="true">📊</span>

                            </Link>

                          )}

                          <Link

                            className="btn btn-sm btn-icon-action btn-icon-muted"

                            to={`/projects/${project._id}/edit`}

                            title="Edit project"

                            aria-label="Edit project"

                          >

                            <span aria-hidden="true">✏️</span>

                          </Link>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}



          {pagination.totalPages > 1 && (

            <div className="d-flex justify-content-center align-items-center gap-3 py-3 border-top">

              <button

                type="button"

                className="btn btn-outline-secondary btn-sm"

                disabled={pagination.page <= 1}

                onClick={() =>

                  setPagination((previous) => ({

                    ...previous,

                    page: previous.page - 1,

                  }))

                }

              >

                Previous

              </button>

              <span className="small text-muted">

                Page {pagination.page} of {pagination.totalPages}

              </span>

              <button

                type="button"

                className="btn btn-outline-secondary btn-sm"

                disabled={pagination.page >= pagination.totalPages}

                onClick={() =>

                  setPagination((previous) => ({

                    ...previous,

                    page: previous.page + 1,

                  }))

                }

              >

                Next

              </button>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}



export default ProjectsList;


