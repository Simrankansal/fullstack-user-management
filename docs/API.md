# API Overview (MERN / MongoDB)

Base URL: `http://localhost:5000/api`

## Auth
- `POST /auth/signup` — register (first user becomes admin)
- `POST /auth/login` — returns `token` and `user` with `role`

## Notifications
- `GET /notifications?page&limit&read=read|unread`
- `GET /notifications/unread-count`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

## Projects (admin creates, assigns `ownerId`)
- `GET /projects` — list (excludes archived unless `archived=true`)
- `POST /projects` — **admin only** body: `name`, `ownerId`, `memberIds[]`, dates
- `GET /projects/:id` — overview
- `PATCH /projects/:id/archive` | `restore`
- `POST /projects/:id/members` — owner/admin
- `GET /projects/:id/tasks`

## Tasks
- `POST /tasks` — owner creates
- `PATCH /tasks/:id` — owner edits description, priority, dueDate, labelIds
- `POST /tasks/:id/attachments` — multipart `file`
- `GET /tasks/:id/watchers` | `POST` | `DELETE .../:userId`

## Reports
- `GET /reports/dashboard`
- `GET /reports/projects/:id`

## Attachments
- `DELETE /attachments/:id`

See controllers for full validation and permission errors (`403`).
