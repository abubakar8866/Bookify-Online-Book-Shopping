import { useEffect, useState } from "react";
import { getUserReturnRequests } from "../api";
import "bootstrap-icons/font/bootstrap-icons.css";

const ReturnReplacementTable = () => {
  const [requests, setRequests] = useState([]);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await getUserReturnRequests(userId);
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch return/replacement requests:", err);
    }
  };

  return (
    <div className="container my-4">
      <h3 className="fw-bold text-primary mb-3">
        Your Return / Replacement Requests
      </h3>

      {requests.length === 0 ? (
        <div className="alert alert-secondary text-center">
          No return/replacement requests found.
        </div>
      ) : (
        
        requests.map((req, idx) => (
          <div
            key={req.id}
            className="card shadow-sm border-0 mb-4"
            style={{ backgroundColor: "#f8f9fa"}}
          >
            <div className="card-body">
              {/* ---------------- CUSTOMER INFO ---------------- */}
              <h5 className="card-title text-secondary mb-3">
                <i className="bi bi-person-circle me-2 text-primary"></i>
                Customer Information #{idx + 1}
              </h5>

              <div className="row mb-2">
                <div className="col-md-4 mb-2">
                  <strong>Name:</strong> <span>{req.customerName}</span>
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Address:</strong> <span>{req.customerAddress}</span>
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Phone:</strong> <span>{req.customerPhone}</span>
                </div>
              </div>

              <div className="row mb-2">
                <div className="col-md-4 mb-2">
                  <strong>Reason:</strong>{" "}
                  <span>{req.reason || "—"}</span>
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Delivery Date:</strong>{" "}
                  <span>
                    {req.deliveryDate
                      ? new Date(req.deliveryDate).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Images:</strong>{" "}
                  {req.imageUrls && req.imageUrls.length > 0 ? (
                    req.imageUrls.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`return-img-${i}`}
                        style={{
                          width: "45px",
                          height: "45px",
                          objectFit: "cover",
                          marginRight: "5px",
                          borderRadius: "5px",
                          border: "1px solid #ddd",
                        }}
                      />
                    ))
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>

              <div className="d-flex justify-content-end mt-2">
                <button className="btn btn-outline-primary btn-sm me-2">
                  <i className="bi bi-pencil-square me-1"></i>Edit Info
                </button>
                <button className="btn btn-outline-success btn-sm">
                  <i className="bi bi-printer me-1"></i>Print
                </button>
              </div>

              <hr className="mt-4 mb-3" />

              {/* ---------------- TABLE INFO ---------------- */}
              <div className="my-table-wrapper">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Book Title</th>
                      <th>Author</th>
                      <th>Quantity</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th>Processed</th>
                      <th>Refund</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{idx + 1}</td>
                      <td>{req.bookTitle}</td>
                      <td>{req.bookAuthor}</td>
                      <td>{req.quantity}</td>
                      <td>{req.type}</td>
                      <td>
                        <span
                          className={`badge ${
                            req.status === "APPROVED"
                              ? "bg-success"
                              : req.status === "PENDING"
                              ? "bg-warning text-dark"
                              : req.status === "REJECTED"
                              ? "bg-danger"
                              : "bg-secondary"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td>{new Date(req.requestedDate).toLocaleString()}</td>
                      <td>
                        {req.processedDate
                          ? new Date(req.processedDate).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        {req.refundedAmount
                          ? `₹${req.refundedAmount.toFixed(2)}`
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm text-danger"
                          title="Delete Request"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                        <button
                          className="btn btn-sm text-warning ms-1"
                          title="Refresh Status"
                        >
                          <i className="bi bi-arrow-clockwise"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
        
      )}
    </div>
  );
};

export default ReturnReplacementTable;
