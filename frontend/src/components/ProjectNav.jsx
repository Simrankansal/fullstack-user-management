/** In-project tabs: overview, board, edit (when allowed). */
import { Link, useParams, useLocation } from "react-router-dom";
import { getStoredUser, canManageProject } from "../utils/permissions";

function ProjectNav({ projectId, myRole }) {
  const params = useParams();
  const location = useLocation();
  const id = projectId || params.projectId;
  const user = getStoredUser();
  const base = `/projects/${id}`;

  const tabClass = (path) => {
    let active = false;
    if (path === base) {
      active =
        location.pathname === base ||
        location.pathname === `${base}/`;
    } else {
      active = location.pathname.startsWith(path);
    }
    return `nav-link${active ? " active" : ""}`;
  };

  return (
    <ul className="nav nav-tabs project-nav mb-4">
      <li className="nav-item">
        <Link className={tabClass(base)} to={base}>Overview</Link>
      </li>
      <li className="nav-item">
        <Link className={tabClass(`${base}/board`)} to={`${base}/board`}>
          Task board
        </Link>
      </li>
      {canManageProject(user, myRole) && (
        <li className="nav-item">
          <Link className={tabClass(`${base}/edit`)} to={`${base}/edit`}>
            Edit project
          </Link>
        </li>
      )}
    </ul>
  );
}

export default ProjectNav;
