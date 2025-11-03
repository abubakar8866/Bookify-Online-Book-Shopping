import { useEffect, useState } from "react";
import {
  getAdminOrderStats,
  getWeeklyOrderStats,
  getMonthlyOrderStats,
  getAdminOrderStatsByRange,
} from "../api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import '../../src/style/All.css';
import AlertModal from '../components/AlertModal';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [rangeStats, setRangeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customRange, setCustomRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info" });

  useEffect(() => {
    loadDashboardStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleError = (error, fallbackMessage = "Something went wrong. Please try again.") => {
    let message = fallbackMessage;

    if (error.response && error.response.data) {
      if (typeof error.response.data === "string") {
        message = error.response.data;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      }
    } else if (error.message) {
      message = error.message;
    }

    setModal({
      show: true,
      title: "Error",
      message,
      type: "danger",
      onConfirm: null
    });
  };

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrderStats();
      setStats(res.data);
    } catch (error) {
      console.error(error);
      handleError(error,"Failed to load stats.");
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyStats = async () => {
    try {
      const res = await getWeeklyOrderStats();
      setRangeStats(res.data);
    } catch (error) {
      console.error(error);
      handleError(error,"Failed to load weekly stats.");
    }
  };

  const loadMonthlyStats = async () => {
    try {
      const res = await getMonthlyOrderStats();
      setRangeStats(res.data);
    } catch (error) {
      console.error(error);
      handleError(error,"Failed to load monthly stats.");
    }
  };

  const loadCustomRangeStats = async () => {
    if (!customRange.startDate || !customRange.endDate) return;
    try {
      const res = await getAdminOrderStatsByRange({
        startDate: customRange.startDate + "T00:00:00",
        endDate: customRange.endDate + "T23:59:59",
      });
      setRangeStats(res.data);
    } catch (error) {
      console.error(error);
      handleError(error,"Failed to load range stats.");
    }
  };

  // Utility function to safely format numbers
  const safeToFixed = (value) => {
    if (value === undefined || value === null) return "0.00";
    return Number(value).toFixed(2);
  };

  return (
    <div className="container py-3" style={{ overflow: "hidden", maxWidth: "90vw" }}>
      <h2 className="mb-4 fw-bold text-primary" >
        <i className="bi bi-speedometer2 me-2"></i> Admin Dashboard
      </h2>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Loading stats...</p>
        </div>
      ) : stats ? (
        <>

          {/* Dashboard Cards */}
          <div className="row mb-4 g-3">
            <div className="col-md-3">
              <div className="card shadow-sm border-0 text-white bg-primary h-100">
                <div className="card-body text-center">
                  <i className="bi bi-basket2-fill fs-3"></i>
                  <h6 className="mt-2">Today’s Orders</h6>
                  <h4>{stats.todayCount ?? 0}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 text-white bg-success h-100">
                <div className="card-body text-center">
                  <i className="bi bi-currency-rupee fs-3"></i>
                  <h6 className="mt-2">Today’s Sales</h6>
                  <h4>₹{safeToFixed(stats.todayTotal)}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 text-white bg-warning h-100">
                <div className="card-body text-center">
                  <i className="bi bi-list-check fs-3"></i>
                  <h6 className="mt-2">Total Orders</h6>
                  <h4>{stats.totalCount ?? 0}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 text-white bg-danger h-100">
                <div className="card-body text-center">
                  <i className="bi bi-cash-coin fs-3"></i>
                  <h6 className="mt-2">Total Sales</h6>
                  <h4>₹{safeToFixed(stats.totalAmount)}</h4>
                </div>
              </div>
            </div>
          </div>

          {/* Range Stats */}
          <div className="mb-4">
            <h4 className="mb-3">
              <i className="bi bi-calendar3 me-2"></i> Range Analytics
            </h4>
            <div className="d-flex gap-2 flex-wrap mb-3">
              <button className="btn btn-outline-primary" onClick={loadWeeklyStats}>
                <i className="bi bi-calendar-week me-1"></i> Weekly
              </button>
              <button className="btn btn-outline-success" onClick={loadMonthlyStats}>
                <i className="bi bi-calendar-month me-1"></i> Monthly
              </button>
            </div>

            <div className="d-flex gap-2 flex-wrap mb-3">
              <input
                type="date"
                className="form-control"
                value={customRange.startDate}
                onChange={(e) => setCustomRange({ ...customRange, startDate: e.target.value })}
              />
              <input
                type="date"
                className="form-control"
                value={customRange.endDate}
                onChange={(e) => setCustomRange({ ...customRange, endDate: e.target.value })}
              />
              <button className="btn btn-outline-dark" onClick={loadCustomRangeStats}>
                <i className="bi bi-funnel me-1"></i> Apply
              </button>
            </div>

            {rangeStats && (
              <div className="alert alert-info shadow-sm">
                <i className="bi bi-graph-up-arrow me-2"></i>
                <strong>Orders:</strong> {rangeStats.orderCount ?? 0} |{" "}
                <strong>Total:</strong> ₹{safeToFixed(rangeStats.orderTotal)}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div>
            <h4 className="mb-3">
              <i className="bi bi-cart-check me-2"></i> Recent Orders
            </h4>
            <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table className="table table-striped table-hover align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders && stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((order, index) => (
                      <tr key={order.id}>
                        <td>{index + 1}</td>
                        <td className="text-truncate" style={{ maxWidth: "150px" }}>{order.user?.email ?? "N/A"}</td>
                        <td>{order.user?.name ?? "N/A"}</td>
                        <td>₹{safeToFixed(order.total ?? order.totalAmount)}</td>
                        <td>
                          <span
                            className={`badge ${order.orderStatus === "Delivered"
                              ? "bg-success"
                              : order.orderStatus === "Cancelled"
                                ? "bg-danger"
                                : "bg-warning text-dark"
                              }`}
                          >
                            {order.orderStatus ?? "N/A"}
                          </span>
                        </td>
                        <td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">
                        No recent orders
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      ) : (
        <div className="text-center">No stats available</div>
      )}

      {/* Modal with confirm support */}
      <AlertModal
        show={modal.show}
        onHide={() => setModal({ ...modal, show: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
      />

    </div>
  );
}

export default AdminDashboard;
