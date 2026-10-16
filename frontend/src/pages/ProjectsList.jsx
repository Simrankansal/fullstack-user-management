import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { getProjects } from "../api/projectApi";



function formatDate(value) {

  if (!value) {

    return "—";

  }

  return new Date(value).toLocaleDateString();

}



function ProjectsList() {

  const [projects, setProjects] = useState([]);

  const [pagination, setPagination] = useState({

    page: 1,

    limit: 10,

    total: 0,

    totalPages: 0,

  });

  const [search, setSearch] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [sort, setSort] = useState("createdAt");

  const [order, setOrder] = useState("desc");

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

        sort,

        order,

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

  }, [search, sort, order, pagination.page]);



  const handleSearchSubmit = (event) => {

    event.preventDefault();

    setSearch(searchInput.trim());

    setPagination((previous) => ({ ...previous, page: 1 }));

  };



  return (

    <div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">

        <h1 className="h3 mb-0">Projects</h1>

        <Link className="btn btn-primary" to="/projects/new">

          Create project

        </Link>

      </div>



      <div className="card shadow-sm">

        <div className="card-body">

          <form

            className="row g-2 align-items-end mb-3"

            onSubmit={handleSearchSubmit}

          >

            <div className="col-md-5">

              <label className="form-label small">Search</label>

              <input

                type="search"

                className="form-control"

                value={searchInput}

                onChange={(event) => setSearchInput(event.target.value)}

              />

            </div>

            <div className="col-md-3">

              <label className="form-label small">Sort by</label>

              <select

                className="form-select"

                value={sort}

                onChange={(event) => setSort(event.target.value)}

              >

                <option value="createdAt">Created date</option>

                <option value="name">Name</option>

                <option value="startDate">Start date</option>

              </select>

            </div>

            <div className="col-md-2">

              <label className="form-label small">Order</label>

              <select

                className="form-select"

                value={order}

                onChange={(event) => setOrder(event.target.value)}

              >

                <option value="desc">Newest first</option>

                <option value="asc">Oldest first</option>

              </select>

            </div>

            <div className="col-md-2">

              <button type="submit" className="btn btn-outline-primary w-100">

                Apply

              </button>

            </div>

          </form>



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

                    <th>Owner</th>

                    <th>Description</th>

                    <th>Start</th>

                    <th>End</th>

                    <th>Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {projects.length === 0 && (

                    <tr>

                      <td colSpan={6} className="text-muted">

                        No projects found.

                      </td>

                    </tr>

                  )}

                  {projects.map((project) => (

                    <tr key={project._id}>

                      <td className="fw-medium">{project.name}</td>

                      <td>{project.owner?.name || "—"}</td>

                      <td>{project.description || "—"}</td>

                      <td>{formatDate(project.startDate)}</td>

                      <td>{formatDate(project.endDate)}</td>

                      <td>

                        <Link

                          className="btn btn-sm btn-outline-primary me-1"

                          to={`/projects/${project._id}/board`}

                        >

                          Board

                        </Link>

                        <Link

                          className="btn btn-sm btn-outline-secondary"

                          to={`/projects/${project._id}/edit`}

                        >

                          Edit

                        </Link>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}



          {pagination.totalPages > 1 && (

            <div className="d-flex justify-content-center align-items-center gap-3 mt-3">

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


