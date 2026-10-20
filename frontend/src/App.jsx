import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import Home from './pages/Home';
import Flats from './pages/Flats';
import FlatDetail from './pages/FlatDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import TenantRegister from './pages/TenantRegister';
import { ForgotPassword, ResetPassword } from './pages/Password';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Contact from './pages/Contact';
import Compare from './pages/Compare';

function Guard({ admin, children }) {
  const { user, isAdmin, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={admin ? '/login?portal=admin' : '/login'} state={{ from: loc.pathname }} replace />;
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (!admin && isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/flats" element={<Flats />} />
        <Route path="/flats/:id" element={<FlatDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/tenant" element={<TenantRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
        <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
