# SmartPark front end

React 19 + Vite 8 + Tailwind 3 single-page app for the SmartPark Spring Boot API. See the [root README](../README.md) for the whole system.

```bash
npm install
npm run dev      # http://localhost:5173, /api is proxied to http://localhost:8080 (override with BACKEND_URL)
npm run lint     # oxlint
npm test         # Vitest
npm run build    # production bundle in dist/
```

* `src/services/api.js`: axios client. Same-origin `/api/v1`, attaches the access token, refreshes it once on a 401, and signs the user out if that fails.
* `src/context`: `AuthContext` (session), `NotificationContext` (30 s polling while signed in), `ToastContext` (toasts and confirm dialogs).
* `src/routes`: lazy-loaded pages and role guards. The guards only shape the UI; the API enforces every permission.
* `vercel.json` deploys this folder to Vercel and proxies `/api` to the hosted API (edit the destination URL first).
