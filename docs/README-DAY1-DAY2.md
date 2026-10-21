# Day 1 & Day 2 — Setup (MERN)

## Stack
- **MongoDB** (not MySQL) with Mongoose models matching the assignment tables
- **Express** REST API
- **React** + Vite frontend

## Backend setup
```bash
cd backend
cp .env.example .env   # or copy vars from docs/API.md
npm install
npm run dev
```

## Frontend setup (Create React App — `react-scripts`)
```bash
cd frontend
npm install
npm start
```
Production build: `npm run build` → deploy the `build/` folder.  
Set `REACT_APP_API_URL` on your host to your live API (see `frontend/README.md`).

## Roles
1. **Admin** — users, create projects, assign **project owner**
2. **Project owner** — members, tasks, archive own project
3. **Project member** — view, comment, attachments, watchers; update **assigned** task status only

First registered user becomes **admin** if none exists. Log in again after signup to refresh `role` in localStorage.

## Tests
```bash
cd backend
npm test
```

## Known gaps (Day 3)
- Admin activity log UI
- Full Supertest integration suite
- `.env.example` in backend root (use `docs/API.md` + sample vars above)
