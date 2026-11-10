# Deployment Guide (MongoDB Atlas + Render + Vercel)

This guide deploys **EventBook** with:
- **Database**: Your existing MongoDB Atlas free cluster (`cluster0`), using a separate `event-booking` database for production while keeping your local `test` database untouched.
- **Backend**: Render Web Service (`server/`).
- **Frontend**: Vercel (`client/`).

---

## 1. MongoDB Atlas Setup (`cluster0`)

### A. Understand Local (`test`) vs Production (`event-booking`) Databases
- Your **local development** environment (`server/.env`) remains unchanged and continues using the **`test`** database inside `cluster0`.
- Your **production** environment (Render) uses a separate **`event-booking`** database inside the same **`cluster0`** cluster by specifying `/event-booking` in the connection string path.
- Even though `test` and `event-booking` share `cluster0`, MongoDB isolates them as **two completely separate databases** with independent `users`, `events`, and `bookings` collections.

### B. Create a Dedicated Production Database User (Least Privilege)
Rather than granting cluster-wide `readWriteAnyDatabase` permissions, create a dedicated production user scoped only to `event-booking` wherever your Atlas role settings allow it:
1. Open MongoDB Atlas → **Security** → **Database Access** → **Add New Database User**.
2. Choose **Password** authentication and generate a strong username and password (keep your local user untouched).
3. Under **Database User Privileges**, select **Built-in Role** (or **Add Specific Privilege**) → grant **`readWrite`** on database **`event-booking`**.
4. Save the user.

### C. Configure Network Access
1. Go to **Security** → **Network Access** → **Add IP Address**.
2. **Trade-off to know**:
   - Adding `0.0.0.0/0` (*Allow Access from Anywhere*) allows connections from any IP address. It is a broad, development-friendly setting commonly used on Render plans that use dynamic shared outbound IPs.
   - Because `0.0.0.0/0` exposes the database port broadly (relying solely on username/password authentication and TLS), restrict Network Access to Render's dedicated outbound IP addresses (or specific trusted IPs) whenever your Render plan and network setup allow it.

### D. Production `MONGO_URI` Format
Use your existing `cluster0` SRV host, the dedicated production user's credentials, and `/event-booking` in the path:

```text
mongodb+srv://<prod_db_username>:<prod_db_password>@<your-cluster0-host>/event-booking?retryWrites=true&w=majority
```

> Never commit `.env` files or share real passwords/connection strings.

---

## 2. Backend Deployment on Render (`server/`)

1. Push your updated repository to GitHub (make sure `server/.env` stays untracked).
2. In the Render dashboard, click **New +** → **Web Service** and connect your GitHub repository.
3. Configure the service settings:
   - **Name**: e.g. `event-booking-api`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` *(verified in `server/package.json` as `"start": "node server.js"`)*
   - **Health Check Path**: `/api/health`
4. Add the following **Environment Variables** in Render (before or right after creating the service):

| Key | Value | Notes |
| --- | --- | --- |
| `MONGO_URI` | `mongodb+srv://<prod_db_username>:<prod_db_password>@<your-cluster0-host>/event-booking?retryWrites=true&w=majority` | Uses the separate `event-booking` DB on `cluster0` |
| `JWT_SECRET` | `<long-random-secret>` | Generate a strong secret (e.g. 64 random hex chars); do not reuse the local dev secret |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime (e.g. `1d`, `7d`) |
| `CLIENT_URL` | `https://<your-vercel-app>.vercel.app` | Set/update after Vercel finishes deploying (no trailing slash) |

> Do **not** hardcode `PORT` on Render—Render injects `PORT` automatically and `server/server.js` falls back to `5000` only locally.

5. Deploy and verify `https://<your-render-service>.onrender.com/api/health` returns `{"status":"ok",...}`.

---

## 3. Frontend Deployment on Vercel (`client/`)

`client/vercel.json` is included so React Router paths (`/events/:id`, `/my-bookings`, `/admin`, and the `404` page) rewrite cleanly to `/index.html` on direct loads and browser refreshes.

1. In the Vercel dashboard, click **Add New...** → **Project** and import the same GitHub repository.
2. Configure the project settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add the **Environment Variable**:

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `https://<your-render-service>.onrender.com/api` |

4. Deploy the Vercel project and copy its production URL (e.g. `https://event-booking-xyz.vercel.app`).
5. **Final CORS Link**: Return to Render → **Environment** → set `CLIENT_URL` to your exact Vercel URL (comma-separate multiple URLs if you also use a custom domain, with no trailing slashes), and trigger a **Manual Deploy / Restart** on Render.

---

## 4. Creating & Promoting Your Production Admin Account

Public registration (`/register`) always assigns `role: "user"` for security.

- **Local admin account**: Stored in `cluster0` → `test` → `users` (local development only).
- **Production admin account**: Stored in `cluster0` → `event-booking` → `users` (separate from local).

To create your production admin account:
1. Open your deployed Vercel URL and register an account via `/register`.
2. In MongoDB Atlas, go to **Database** → **`cluster0`** → **Browse Collections**.
3. Select database **`event-booking`** → collection **`users`** (note: Mongoose maps the `User` model in `server/models/User.js` to `users`).
4. Find your newly registered user document by `email`, click **Edit Document**, change `"role": "user"` to `"role": "admin"`, and click **Update**.
5. Sign out and sign back in on your deployed Vercel app so a fresh JWT containing `role: "admin"` is issued and the **Admin** link (`/admin`) appears in the navigation bar.

