import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { isAuthenticated, getUserRole } from "../utils/auth";
import "bootstrap-icons/font/bootstrap-icons.css";
import '../../src/style/leftNav.css';

function LeftNav() {
  const navigate = useNavigate();
  const role = getUserRole();
  const [isOpen, setIsOpen] = useState(false); 

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  const linkClass = ({ isActive }) =>
    "nav-link d-flex align-items-center gap-2 py-2 px-2 rounded" +
    (isActive ? " active fw-bold bg-primary text-white" : " text-dark hover-bg");

  const SidebarWrapper = ({ title, children }) => (
    <div className="mb-4">
      <h6 className="text-uppercase text-muted small fw-bold mb-3">{title}</h6>
      <ul className="nav flex-column gap-1">{children}</ul>
    </div>
  );

  const renderSidebarContent = () => {
    if (!isAuthenticated()) {
      return (
        <SidebarWrapper title="Access">
          <li className="nav-item">
            <NavLink className={linkClass} to="/login">
              <i className="bi bi-box-arrow-in-right fs-5"></i> Login
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className={linkClass} to="/register">
              <i className="bi bi-person-plus fs-5"></i> Register
            </NavLink>
          </li>
        </SidebarWrapper>
      );
    }

    if (role === "ROLE_ADMIN") {
      return (
        <>
          <SidebarWrapper title="Manage">
            <li className="nav-item">
              <NavLink className={linkClass} to="/adminDashboard">
                <i className="bi bi-speedometer2 fs-5"></i> Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/books">
                <i className="bi bi-book fs-5"></i> Books
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/authors">
                <i className="bi bi-person-workspace fs-5"></i> Authors
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/adminOrders">
                <i className="bi bi-receipt fs-5"></i> All Orders
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/informationPage">
                <i className="bi bi-info fs-5"></i> Info
              </NavLink>
            </li>
          </SidebarWrapper>

          <SidebarWrapper title="Account">
            <li className="nav-item">
              <NavLink className={linkClass} to="/profile">
                <i className="bi bi-person-circle fs-5"></i> Profile
              </NavLink>
            </li>
            <li className="nav-item">
              <button
                onClick={handleLogout}
                className="btn btn-link nav-link d-flex align-items-center gap-2 px-2 text-danger"
              >
                <i className="bi bi-box-arrow-right fs-5"></i> Logout
              </button>
            </li>
          </SidebarWrapper>
        </>
      );
    }

    if (role === "ROLE_USER") {
      return (
        <>
          <SidebarWrapper title="Shop">
            <li className="nav-item">
              <NavLink className={linkClass} to="/all-books">
                <i className="bi bi-book fs-5"></i> Books
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/wishlist">
                <i className="bi bi-heart fs-5"></i> Wishlist
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/cart">
                <i className="bi bi-cart3 fs-5"></i> Cart
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/order">
                <i className="bi bi-bag-check fs-5"></i> Orders
              </NavLink>
            </li>
          </SidebarWrapper>

          <SidebarWrapper title="Account">
            <li className="nav-item">
              <NavLink className={linkClass} to="/profile">
                <i className="bi bi-person-circle fs-5"></i> Profile
              </NavLink>
            </li>
            <li className="nav-item">
              <button
                onClick={handleLogout}
                className="btn btn-link nav-link d-flex align-items-center gap-2 px-2 text-danger"
              >
                <i className="bi bi-box-arrow-right fs-5"></i> Logout
              </button>
            </li>
          </SidebarWrapper>
        </>
      );
    }

    return null;
  };

  return (
    <>
      {/* Always visible top bar with Bookify text + hamburger */}
      <div
        className="d-flex align-items-center bg-light border-bottom shadow-sm position-fixed top-0 start-0 w-100 py-2"
        style={{ zIndex: 900, height: "56px", paddingLeft: "0px" }}
      >
        <button className="btn me-1" onClick={toggleSidebar} style={{ border: "none" }}>
          {isOpen ? (
            <i className="bi bi-x-lg fs-3"></i>
          ) : (
            <i className="bi bi-list fs-3"></i>
          )}
        </button>
        <h4 className="m-0">📚 Bookify</h4>
      </div>

      {/* Sidebar overlay (dark background when open) */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 850 }}
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar panel with slide animation */}
      <div
        className={`bg-light border-end vh-100 shadow-sm position-fixed top-0 start-0 sidebar-slide ${isOpen ? 'open' : 'closed'}`}
        style={{ width: "220px", zIndex: 851, padding: "70px 10px 10px 10px" }}
      >
        {renderSidebarContent()}
      </div>
    </>
  );
}

export default LeftNav;
