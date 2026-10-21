/** Application routes and layout wrappers. */
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProjectsList from "./pages/ProjectsList";
import ProjectForm from "./pages/ProjectForm";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectBoard from "./pages/ProjectBoard";
import TaskDetail from "./pages/TaskDetail";
import TasksList from "./pages/TasksList";
import Notifications from "./pages/Notifications";
import AdminNotificationCenter from "./pages/AdminNotificationCenter";
import User from "./pages/User";
import EditUser from "./pages/EditUser";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import GuestRoute from "./components/GuestRoute";
import DashboardLayout from "./components/DashboardLayout";
import RootRedirect from "./components/RootRedirect";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<GuestRoute />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksList />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/projects" element={<ProjectsList />} />
            <Route element={<AdminRoute />}>
              <Route path="/users" element={<User />} />
              <Route path="/users/edit/:id" element={<EditUser />} />
              <Route path="/projects/new" element={<ProjectForm />} />
              <Route
                path="/admin/notifications"
                element={<AdminNotificationCenter />}
              />
            </Route>
            <Route
              path="/projects/:projectId/tasks/:taskId"
              element={<TaskDetail />}
            />
            <Route path="/projects/:projectId/board" element={<ProjectBoard />} />
            <Route path="/projects/:id/edit" element={<ProjectForm />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
