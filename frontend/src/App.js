import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';
// pages & components
import Item from './pages/Items';
import AddItem from './pages/AddItem';
import StockTaking from './pages/StockTaking';
import StockLevel from './pages/StockLevel';
// import Item from './pages/Items';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/SimpleNavbar';
// import Purchase from './pages/Purchase';
import InventoryList from './components/InventoryList';
import Reports from './pages/Reports';
import Documents from './pages/Documents';

function App() {
  const { user } = useAuthContext();

  // Wrap your routing logic in a custom inner component so `useLocation()` works
  return (
    <div className="App">
      <BrowserRouter>
        <MainContent user={user} />
      </BrowserRouter>
    </div>
  );
}

function MainContent({ user }) {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <>
      {!hideNavbar && <Navbar />}
      {!hideNavbar && <div className="topbar"></div>}        <div className="pages">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/staff-dashboard" element={
              <ProtectedRoute requiredRole="staff">
                <StaffDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/inventory/items" element={
              <ProtectedRoute>
                <Item />
              </ProtectedRoute>
            } />
            <Route path="/inventory/add-item" element={
              <ProtectedRoute>
                <AddItem />
              </ProtectedRoute>
            } />
            <Route path="/inventory/stock-taking" element={
              <ProtectedRoute>
                <StockTaking />
              </ProtectedRoute>
            } />
            <Route path="/inventory/stock-level" element={
              <ProtectedRoute>
                <StockLevel />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <InventoryList />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute requiredRole="admin">
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/documents" element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            } />
            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
    </>
  );
}



export default App;
