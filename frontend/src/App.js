import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import LeftNav from "./components/LeftNav";
import { isAuthenticated, getUserRole } from "./utils/auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Books from "./pages/BooksPage";
import Wishlist from "./pages/WishlistPage";
import Cart from "./pages/CartPage";
import Order from "./pages/OrderPage";
import AdminDashboard from "./pages/AdminDashboared";
import AllBooks from "./pages/AllBooksPage";
import Authors from "./pages/AuthorsPage";
import AdminOrders from "./pages/AdminOrdersPage";
import InformationPage from "./pages/InformationPage";
import ReturnReplacementTable from "./pages/ReturnReplacementTable";

// Protected Route Wrapper
function ProtectedRoute({ children, role }) {
  if (!isAuthenticated()) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  const userRole = getUserRole();

  if (role && userRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Logout Component
function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
    navigate("/login", { replace: true });
  }, [navigate]);

  return <h2>Logging out...</h2>;
}

function App() {
  return (
    <Router>
      <div className="d-flex">
        {/* Left Sidebar */}
        <LeftNav />

        {/* Main Content */}
        <div className="flex-grow-1 p-0" style={{overflowX:"hidden"}}>
          <Routes>
            {/* Default route goes to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Profile (accessible to both roles) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* User Protected Routes */}
            <Route
              path="/all-books"
              element={
                <ProtectedRoute role="ROLE_USER">
                  <AllBooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute role="ROLE_USER">
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute role="ROLE_USER">
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order"
              element={
                <ProtectedRoute role="ROLE_USER">
                  <Order />
                </ProtectedRoute>
              }
            />
            <Route
              path="/returnReplacement"
              element={
                <ProtectedRoute role="ROLE_USER">
                  <ReturnReplacementTable />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/adminDashboard"
              element={
                <ProtectedRoute role="ROLE_ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books"
              element={
                <ProtectedRoute role="ROLE_ADMIN">
                  <Books />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authors"
              element={
                <ProtectedRoute role="ROLE_ADMIN">
                  <Authors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/adminOrders"
              element={
                <ProtectedRoute role="ROLE_ADMIN">
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/informationPage"
              element={
                <ProtectedRoute role="ROLE_ADMIN">
                  <InformationPage />
                </ProtectedRoute>
              }
            />

            {/* Logout Route (both roles) */}
            <Route
              path="/logout"
              element={
                <ProtectedRoute>
                  <Logout />
                </ProtectedRoute>
              }
            />

            {/* Catch-all unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
