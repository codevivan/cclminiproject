import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OwnerAuthPage from './pages/OwnerAuthPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-cream)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Dedicated Owner Authentication (Sign In & Controlled Account Creation) */}
          <Route path="/owner/auth" element={<OwnerAuthPage />} />
          <Route path="/owner/login" element={<OwnerAuthPage />} />
          <Route path="/admin/login" element={<OwnerAuthPage />} />

          {/* Protected Student Dashboard & Ordering */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'OWNER']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Dedicated Owner Dashboard */}
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Compatibility route for /admin/dashboard redirecting to Owner Dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Access Denied Route */}
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Global Slide-out Canteen Tray (Cart) */}
      <CartDrawer />

      <Footer />
    </div>
  );
}

export default App;
