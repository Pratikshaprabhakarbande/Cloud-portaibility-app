/**
 * App — route configuration.
 *  - Public-only routes: login / register / password reset.
 *  - Protected routes: rendered inside the dashboard Layout, gated by JWT
 *    (and role where applicable).
 *  - "Coming soon" routes are wired with the correct access control so the
 *    navigation behaves correctly ahead of later phases.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/layout/Layout.jsx';
import NotificationArea from './components/layout/NotificationArea.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import PublicOnlyRoute from './routes/PublicOnlyRoute.jsx';
import { ROLES } from './config/roles.js';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import NotFound from './pages/NotFound.jsx';

const NON_VIEWER = [ROLES.ADMIN, ROLES.CLOUD_ENGINEER, ROLES.DEVOPS_ENGINEER];

export default function App() {
  return (
    <BrowserRouter>
      <NotificationArea />
      <Routes>
        {/* Public-only */}
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
        <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

        {/* Protected app shell */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Coming soon (all roles) */}
          <Route path="/deployments" element={<ComingSoon />} />
          <Route path="/monitoring" element={<ComingSoon />} />
          <Route path="/security" element={<ComingSoon />} />
          <Route path="/compliance" element={<ComingSoon />} />
          <Route path="/finops" element={<ComingSoon />} />

          {/* Coming soon (non-viewer) */}
          <Route path="/terraform" element={<ProtectedRoute roles={NON_VIEWER}><ComingSoon /></ProtectedRoute>} />
          <Route path="/kubernetes" element={<ProtectedRoute roles={NON_VIEWER}><ComingSoon /></ProtectedRoute>} />
          <Route path="/ai-architect" element={<ProtectedRoute roles={NON_VIEWER}><ComingSoon /></ProtectedRoute>} />
          <Route path="/migration" element={<ProtectedRoute roles={NON_VIEWER}><ComingSoon /></ProtectedRoute>} />

          {/* Coming soon (admin only) */}
          <Route path="/admin/users" element={<ProtectedRoute roles={[ROLES.ADMIN]}><ComingSoon /></ProtectedRoute>} />
        </Route>

        {/* Redirects + 404 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
