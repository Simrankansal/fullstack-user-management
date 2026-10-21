# FlowDesk frontend (Create React App)

Standard **React** app using **react-scripts** (Create React App). No Vite.

## Local development

```bash
cd frontend
npm install
npm start
```

Runs at [http://localhost:3000](http://localhost:3000). Start the **backend** on port 5000.

Optional `.env` (see `.env.example`):

- `REACT_APP_API_URL` — API base (default `http://localhost:5000/api`)

## Production build

```bash
npm run build
```

Output folder: **`build/`** (upload this folder to static hosting).

Set environment variables on your host:

| Variable | Example |
|----------|---------|
| `REACT_APP_API_URL` | `https://your-api.com/api` |
| `REACT_APP_UPLOADS_URL` | `https://your-api.com/uploads` |

## Deploy notes

- **SPA routing:** `public/_redirects` is included for Netlify (`/* → index.html`).
- **Vercel / IIS:** configure all routes to serve `index.html`.
- **Same server as API:** you can serve `build/` from Express and keep API on `/api`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server |
| `npm run build` | Optimized production build |
| `npm test` | Run tests once |
