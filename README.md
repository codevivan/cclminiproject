# Cloud-Based Canteen Pre-Order & Token Management System (Phase 1 + Google OAuth)

A full-stack web application designed for college canteens to eliminate waiting queues through cloud-based pre-ordering, digital token issuance, and real-time kitchen tracking.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19 + Vite, Vanilla CSS design system, React Router 7, Lucide Icons
- **Backend**: Node.js + Express.js REST API
- **Database**: MySQL 8.x with `mysql2/promise` connection pool
- **Authentication**:
  - Email/Password: `bcryptjs` password hashing (cost factor 12)
  - Google OAuth 2.0: Backend server-side code exchange & user profile verification
  - Sessions: JSON Web Tokens (JWT) stored in secure `httpOnly` cookies
- **Security**: Strict CORS policy with credentials, rate limiting on auth endpoints, input normalization & regex validation, SQL injection prevention with parameterized queries, strictly enforcing `student` role on Google Sign-In.

---

## 📁 Project Structure

```
CclMiniproject/
├── backend/
│   ├── .env.example              # Template environment variables (placeholders only)
│   ├── .env                      # Local environment configuration (contains real credentials, git-ignored)
│   ├── package.json              # Express, mysql2, bcryptjs, JWT, etc.
│   ├── sql/
│   │   └── schema.sql            # Database creation & users table schema
│   └── src/
│       ├── config/
│       │   └── db.js             # MySQL pool & connection health check
│       ├── controllers/
│       │   └── authController.js # register, login, logout, getMe, initiateGoogleAuth, googleCallback
│       ├── middleware/
│       │   ├── authMiddleware.js # protect & authorize('admin', 'student')
│       │   ├── rateLimiter.js    # Rate limiting for auth routes
│       │   └── validator.js      # Input validation & sanitization
│       ├── routes/
│       │   └── authRoutes.js     # Auth, Google OAuth, and role verification endpoints
│       ├── scripts/
│       │   ├── initDb.js         # Automated DB & table initialization with schema migrations
│       │   └── seedAdmin.js      # Safe CLI utility to create admin accounts
│       ├── app.js                # Express app configuration & middlewares
│       └── server.js             # Server startup & graceful shutdown
│
├── frontend/
│   ├── .env.example              # Frontend environment variables
│   ├── index.html                # App entrypoint with Google Fonts
│   ├── package.json              # React, Vite, React Router, Lucide Icons
│   ├── vite.config.js            # Dev server & /api proxy to port 5000
│   └── src/
│       ├── index.css             # Glassmorphism design system & variables
│       ├── main.jsx              # React root with BrowserRouter & AuthProvider
│       ├── App.jsx               # Route definitions & protected routes
│       ├── context/
│       │   └── AuthContext.jsx   # Global session state & /api/auth/me sync
│       ├── services/
│       │   └── api.js            # API fetch client (credentials: 'include')
│       ├── components/
│       │   ├── Navbar.jsx        # Auth-aware navbar with user avatar & role badges
│       │   ├── Footer.jsx        # Modern footer
│       │   ├── ProtectedRoute.jsx# Role-based route guard
│       │   ├── AlertMessage.jsx  # Error/success alert banner
│       │   └── LoadingSpinner.jsx# Polished loader
│       └── pages/
│           ├── LandingPage.jsx   # Canteen landing with food showcase & token preview
│           ├── LoginPage.jsx     # Login page with Google OAuth button & email form
│           ├── RegisterPage.jsx  # Student signup with Google one-click & email form
│           ├── StudentDashboard.jsx # Student portal with user avatar & token preview
│           ├── AdminDashboard.jsx   # Kitchen queue management & admin metrics
│           └── NotFoundPage.jsx  # 404 handler
│
├── .gitignore
└── README.md
```

---

## 🛠️ Step-by-Step Local Setup Guide

### 1. Configure MySQL Locally

#### Option A: Using XAMPP / WAMP
1. Start the **MySQL** module from the XAMPP / WAMP control panel.
2. The default port is `3306`, user is `root`, and password is empty `""`.

#### Option B: Using Standalone MySQL Server (Windows Installer)
1. Verify MySQL service is running via Windows Services or PowerShell:
   ```powershell
   Get-Service -Name *mysql*
   ```
2. Note your root password configured during installation.

#### Option C: Using Docker (Quickest Alternative)
```bash
docker run --name canteen-mysql -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=canteen_db -p 3306:3306 -d mysql:8
```

---

### 2. Configure Backend Environment

Open `backend/.env` (or copy from `backend/.env.example`):
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Match your local MySQL setup
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=canteen_db
DB_PORT=3306

# JWT & Cookie
JWT_SECRET=super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=24h
COOKIE_EXPIRES_IN_DAYS=1

# Google OAuth 2.0 Credentials (From Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

> [!NOTE]
> In Google Cloud Console, ensure **Authorized redirect URIs** contains:
> `http://localhost:5000/api/auth/google/callback`
> And **Authorized JavaScript origins** contains:
> `http://localhost:5173` and `http://localhost:5000`

---

### 3. Initialize / Migrate the Database

Run the automated script to create or update the `canteen_db` database and `users` table:
```bash
cd backend
npm run db:init
```

The script automatically executes schema migrations:
- Makes `password_hash` nullable (`VARCHAR(255) NULL DEFAULT NULL`) so Google users don't need a local password.
- Adds `google_id VARCHAR(100) NULL UNIQUE`.
- Adds `avatar_url VARCHAR(500) NULL DEFAULT NULL`.
- Adds `auth_provider ENUM('local', 'google') NOT NULL DEFAULT 'local'`.

---

### 4. Create the First Administrator Account

Students cannot self-register as administrators via the frontend form or Google Login. To safely create an admin account, run the CLI seeder:

#### Interactive Mode:
```bash
cd backend
npm run seed:admin
```
Follow the on-screen prompts to input Name, Email, and Password.

#### Command-Line Flags Mode:
```bash
cd backend
node src/scripts/seedAdmin.js --name "Canteen Manager" --email "admin@canteen.edu" --password "AdminSecure123"
```
The password will be hashed with `bcrypt` (12 rounds) and stored with `role = 'admin'`.

---

### 5. Start Backend and Frontend Development Servers

#### Terminal 1 (Backend API):
```bash
cd backend
npm run dev
```
*Backend runs on `http://localhost:5000`*

#### Terminal 2 (Frontend React App):
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

Open `http://localhost:5173` in your browser.

---

## 🔒 Google OAuth Security Architecture

1. **Backend Validation**:
   - The frontend never touches `GOOGLE_CLIENT_SECRET`.
   - The browser redirects to `/api/auth/google`, which redirects to Google's OAuth consent screen.
   - Google callbacks are handled at `/api/auth/google/callback`.
   - The backend validates the authorization code directly with Google's token endpoint (`https://oauth2.googleapis.com/token`) and retrieves the verified user profile from Google's UserInfo API (`https://www.googleapis.com/oauth2/v3/userinfo`).
2. **Student Role Enforcement**:
   - Google users are **strictly assigned `role = 'student'`**.
   - If an existing admin email attempts to sign in via Google, the request is rejected with a clear message: `"Admin accounts must sign in using administrator email and password credentials."` This completely prevents privilege escalation.
3. **Session Issuance**:
   - Upon successful verification, the backend issues an `httpOnly`, `sameSite: 'lax'` JWT cookie.
   - The user is redirected to `http://localhost:5173/student/dashboard`.
   - On page reload, the React frontend calls `/api/auth/me` to automatically restore the user session.
4. **Error Handling**:
   - If the user cancels the Google prompt or an error occurs, they are redirected back to `http://localhost:5173/login?error=...` where a friendly error alert is displayed.

---

## 🧪 How to Test Google Login

1. Ensure MySQL is running and `npm run db:init` was executed.
2. Open `http://localhost:5173/login` in your browser.
3. Click the **"Continue with Google"** button.
4. You will be redirected to Google's sign-in consent screen.
5. Choose your Google account.
6. Google redirects to `http://localhost:5000/api/auth/google/callback`.
7. The backend will:
   - Exchange the authorization code for tokens.
   - Fetch your name, verified email, and profile picture.
   - Find or create your account in the MySQL `users` table with `role = 'student'`.
   - Set the secure HTTP-only `token` cookie.
   - Redirect you to `http://localhost:5173/student/dashboard`.
8. The Student Dashboard will load, displaying your name, email, Google avatar, and student badge.
9. Click **"Sign Out"** or the Navbar **"Logout"** button to clear the cookie session.
