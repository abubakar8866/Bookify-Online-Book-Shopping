import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { isAuthenticated, getUserRole } from "../utils/auth";
import "bootstrap-icons/font/bootstrap-icons.css";

function LeftNav() {
  const navigate = useNavigate();
  const role = getUserRole();
  const [collapsed, setCollapsed] = useState(false); // desktop collapse
  const [isMobileOpen, setIsMobileOpen] = useState(false); // mobile open/close

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const linkClass = ({ isActive }) =>
    "nav-link d-flex align-items-center gap-2 py-2 px-2 rounded" +
    (isActive ? " active fw-bold bg-primary text-white" : " text-dark hover-bg");

  const SidebarWrapper = ({ title, children }) => (
    <div className="mb-4">
      {!collapsed && (
        <h6 className="text-uppercase text-muted small fw-bold mb-3">
          {title}
        </h6>
      )}
      <ul className="nav flex-column gap-1">{children}</ul>
    </div>
  );

  // Sidebar content
  const renderSidebarContent = () => {
    if (!isAuthenticated()) {
      return (
        <SidebarWrapper title="Access">
          <li className="nav-item">
            <NavLink className={linkClass} to="/login">
              <i className="bi bi-box-arrow-in-right fs-5"></i>
              {!collapsed && " Login"}
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className={linkClass} to="/register">
              <i className="bi bi-person-plus fs-5"></i>
              {!collapsed && " Register"}
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
                <i className="bi bi-speedometer2 fs-5"></i>
                {!collapsed && " Dashboard"}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/books">
                <i className="bi bi-book fs-5"></i>
                {!collapsed && " Books"}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/authors">
                <i className="bi bi-person-workspace fs-5"></i>
                {!collapsed && " Authors"}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/adminOrders">
                <i className="bi bi-receipt fs-5"></i>
                {!collapsed && " All Orders"}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/informationPage">
                <i className="bi bi-info fs-5"></i>
                {!collapsed && " Info"}
              </NavLink>
            </li>
          </SidebarWrapper>
          <SidebarWrapper title="Account">
            <li className="nav-item">
              <NavLink className={linkClass} to="/profile">
                <i className="bi bi-person-circle fs-5"></i>
                {!collapsed && " Profile"}
              </NavLink>
            </li>
            <li className="nav-item">
              <button
                onClick={handleLogout}
                className="btn btn-link nav-link d-flex align-items-center gap-2 px-2 text-danger"
              >
                <i className="bi bi-box-arrow-right fs-5"></i>
                {!collapsed && " Logout"}
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
                <i className="bi bi-book fs-5"></i>
                {!collapsed && " Books"}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/wishlist">
                <i className="bi bi-heart fs-5"></i>
                {!collapsed && " Wishlist"}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/cart">
                <i className="bi bi-cart3 fs-5"></i>
                {!collapsed && " Cart"}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/order">
                <i className="bi bi-bag-check fs-5"></i>
                {!collapsed && " Orders"}
              </NavLink>
            </li>
          </SidebarWrapper>
          <SidebarWrapper title="Account">
            <li className="nav-item">
              <NavLink className={linkClass} to="/profile">
                <i className="bi bi-person-circle fs-5"></i>
                {!collapsed && " Profile"}
              </NavLink>
            </li>
            <li className="nav-item">
              <button
                onClick={handleLogout}
                className="btn btn-link nav-link d-flex align-items-center gap-2 px-2 text-danger"
              >
                <i className="bi bi-box-arrow-right fs-5"></i>
                {!collapsed && " Logout"}
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
      {/* ===== MOBILE TOPBAR ===== */}
      <div className="d-lg-none d-flex justify-content-start align-items-center p-2 bg-light border-bottom shadow-sm position-fixed top-0 mb-3" style={{ zIndex: 1050, width: "100vw", height:"56px"}}>
        <button className="btn btn-light d-flex gap-2" >
          <i className="bi bi-list fs-" onClick={toggleMobile}></i>
        </button>
        <h4 className="m-0">📚 Bookify</h4>
      </div>

      {/* ===== SIDEBAR (Desktop + Mobile overlay) ===== */}
      <div
        className={`bg-light border-end vh-100 p-3 shadow-sm position-fixed top-0 start-0 
          ${isMobileOpen ? "d-block" : "d-none"} d-lg-block`}
        style={{
          width: collapsed ? "70px" : "220px",
          transition: "all 0.3s ease",
          zIndex: 1050,
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          {!collapsed && <h4 className="m-0">📚 Bookify</h4>}

          {/* Desktop collapse button */}
          <button
            className="btn btn-sm btn-light border d-none d-lg-inline"
            onClick={toggleCollapse}
          >
            <i
              className={`bi ${collapsed ? "bi-arrow-right-square" : "bi-arrow-left-square"
                }`}
            ></i>
          </button>

          {/* Mobile close button */}
          <button
            className="btn btn-sm btn-light border d-lg-none"
            onClick={toggleMobile}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {renderSidebarContent()}
      </div>

      {/* ===== MOBILE OVERLAY BACKDROP ===== */}
      {isMobileOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
          style={{ zIndex: 1040 }}
          onClick={toggleMobile}
        ></div>
      )}
    </>
  );
}

export default LeftNav;
