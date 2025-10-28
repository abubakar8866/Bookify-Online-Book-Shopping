import { useEffect, useState } from "react";
import { getUserReturnRequests, editReturnReplacementRequest, deleteReturnReplacementRequest } from "../api";
import { useDropzone } from "react-dropzone";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import AlertModal from "../components/AlertModal";

const ReturnReplacementTable = () => {
  const [requests, setRequests] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    customerName: "",
    customerAddress: "",
    customerPhone: "",
    reason: "",
    deliveryDate: "",
    existingImages: [],
    newImages: [],
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const userId = localStorage.getItem("userId");

  // Fetch Requests
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await getUserReturnRequests(userId);
      setRequests((res.data || []).slice().reverse());
    } catch (err) {
      console.error("Failed to fetch return/replacement requests:", err);
    }
  };

  // ---------------- Edit Modal Handlers ----------------
  const handleEditClick = (req) => {
    setEditing(req);
    setForm({
      customerName: req.customerName || "",
      customerAddress: req.customerAddress || "",
      customerPhone: req.customerPhone || "",
      reason: req.reason || "",
      deliveryDate: req.deliveryDate
        ? req.deliveryDate.split("T")[0]
        : "",
      existingImages: req.imageUrls || [],
      newImages: [],
    });
    setErrors({});
  };

  const handleCloseModal = () => {
    setEditing(null);
    setForm({
      customerName: "",
      customerAddress: "",
      customerPhone: "",
      reason: "",
      deliveryDate: "",
      existingImages: [],
      newImages: [],
    });
    setErrors({});
  };

  const handleRemoveExistingImage = (url) => {
    setForm((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((img) => img !== url),
    }));
  };

  const handleRemoveNewImage = (file) => {
    setForm((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((f) => f !== file),
    }));
  };

  const onDrop = (acceptedFiles) => {
    setForm((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...acceptedFiles],
    }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop,
  });

  // ---------------- Validation ----------------
  const validateForm = () => {
    const newErrors = {};
    if (!form.customerName || form.customerName.length < 3)
      newErrors.customerName = "Name must be 3–20 characters.";
    if (!form.customerAddress || form.customerAddress.length < 3)
      newErrors.customerAddress = "Address must be 3–50 characters.";
    if (!/^\d{10}$/.test(form.customerPhone))
      newErrors.customerPhone = "Phone must be exactly 10 digits.";
    if (!form.reason || form.reason.length < 3)
      newErrors.reason = "Reason must be 3–200 characters.";
    if (!form.deliveryDate) newErrors.deliveryDate = "Delivery date is required.";
    else if (new Date(form.deliveryDate) <= new Date())
      newErrors.deliveryDate = "Delivery date must be after today.";
    if (form.existingImages.length + form.newImages.length === 0)
      newErrors.images = "At least one image is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- Submit ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dto = {
      customerName: form.customerName,
      customerAddress: form.customerAddress,
      customerPhone: form.customerPhone,
      reason: form.reason,
      deliveryDate: form.deliveryDate ? form.deliveryDate + "T00:00:00" : null,
      imageUrls: form.existingImages,
    };

    const data = new FormData();
    data.append("value", JSON.stringify(dto));
    form.newImages.forEach((img) => data.append("images", img));

    try {
      await editReturnReplacementRequest(editing.id, data);
      setAlert({
        show: true,
        title: "Success",
        message: "Request updated successfully!",
        type: "success",
      });
      handleCloseModal();
      fetchRequests(); // refresh table
    } catch (err) {
      console.error(err);

      // Extract backend message (Spring returns in err.response.data.error or message)
      const backendMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to delete request.";

      setAlert({
        show: true,
        title: "Error",
        message: backendMessage,
        type: "error",
      });

    }
  };

  // ---------------- Delete Handler ----------------
  const handleDeleteRequest = (requestId) => {
    setAlert({
      show: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this request?",
      type: "warning",
      onConfirm: async () => {
        try {
          await deleteReturnReplacementRequest(requestId);

          setAlert({
            show: true,
            title: "Deleted",
            message: "Your request was deleted successfully.",
            type: "success",
          });

          fetchRequests(); // refresh table
        } catch (err) {
          console.error("Delete error:", err);

          // Extract backend message (Spring returns in err.response.data.error or message)
          const backendMessage =
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to delete request.";

          setAlert({
            show: true,
            title: "Error",
            message: backendMessage,
            type: "error",
          });
        }
      },
    });
  };



  return (
    <div className="container my-4">
      <h3 className="fw-bold text-primary mb-3">Your Return / Replacement Requests</h3>

      {requests.length === 0 ? (
        <div className="alert alert-secondary text-center">
          No return/replacement requests found.
        </div>
      ) : (
        requests.map((req, idx) => (
          <div
            key={req.id}
            className="card shadow-sm border-0 mb-4"
            style={{ backgroundColor: "#f8f9fa" }}
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
                  <strong>Reason:</strong> <span>{req.reason || "—"}</span>
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
                  {req.imageUrls?.length ? (
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
                {(() => {
                  const lockedStatuses = ["APPROVED", "RETURNED", "REPLACED", "REFUNDED" , "REJECTED"];
                  const isLocked = lockedStatuses.includes(req.status?.toUpperCase());

                  const handleLockedAction = (action) => {
                    setAlert({
                      show: true,
                      title: "Action Not Allowed",
                      message: `You cannot ${action} a request that is already ${req.status.toLowerCase()}.`,
                      type: "warning",
                    });
                  };

                  return (
                    <>
                      {/* -------- Edit Button -------- */}
                      <button
                        className={`btn btn-outline-primary btn-sm me-2 ${isLocked ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        onClick={() => {
                          if (isLocked) {
                            handleLockedAction("edit");
                          } else {
                            handleEditClick(req);
                          }
                        }}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>

                      {/* -------- Delete Button -------- */}
                      <button
                        className={`btn btn-outline-danger btn-sm ${isLocked ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        onClick={() => {
                          if (isLocked) {
                            handleLockedAction("delete");
                          } else {
                            handleDeleteRequest(req.id);
                          }
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </>
                  );
                })()}
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
                          className={`badge ${req.status === "APPROVED"
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
                        {req.type?.toUpperCase() === "REPLACEMENT"
                          ? "₹0.00"
                          : req.refundedAmount
                            ? `₹${req.refundedAmount.toFixed(2)}`
                            : "—"}
                      </td>

                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}

      {/* ---------------- EDIT MODAL ---------------- */}
      {editing && (
        <div
          className="modal d-flex justify-content-center align-items-center"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg" role="document" style={{ paddingBottom: "20px", paddingTop: "20px" }}>
            <div className="modal-content shadow-lg rounded-3" style={{ maxWidth: '80vw' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title w-40">Edit</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white w-40"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  {/* Customer Fields */}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Name</label>
                      <input
                        type="text"
                        className={`form-control ${errors.customerName ? "is-invalid" : ""}`}
                        value={form.customerName}
                        onChange={(e) =>
                          setForm({ ...form, customerName: e.target.value })
                        }
                      />
                      {errors.customerName && (
                        <div className="invalid-feedback">{errors.customerName}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Address</label>
                      <input
                        type="text"
                        className={`form-control ${errors.customerAddress ? "is-invalid" : ""}`}
                        value={form.customerAddress}
                        onChange={(e) =>
                          setForm({ ...form, customerAddress: e.target.value })
                        }
                      />
                      {errors.customerAddress && (
                        <div className="invalid-feedback">{errors.customerAddress}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phone</label>
                      <input
                        type="text"
                        className={`form-control ${errors.customerPhone ? "is-invalid" : ""}`}
                        value={form.customerPhone}
                        onChange={(e) =>
                          setForm({ ...form, customerPhone: e.target.value })
                        }
                      />
                      {errors.customerPhone && (
                        <div className="invalid-feedback">{errors.customerPhone}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Reason</label>
                      <textarea
                        rows="2"
                        className={`form-control ${errors.reason ? "is-invalid" : ""}`}
                        value={form.reason}
                        onChange={(e) =>
                          setForm({ ...form, reason: e.target.value })
                        }
                      ></textarea>
                      {errors.reason && (
                        <div className="invalid-feedback">{errors.reason}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Delivery Date</label>
                      <input
                        type="date"
                        className={`form-control ${errors.deliveryDate ? "is-invalid" : ""}`}
                        value={form.deliveryDate}
                        onChange={(e) =>
                          setForm({ ...form, deliveryDate: e.target.value })
                        }
                      />
                      {errors.deliveryDate && (
                        <div className="invalid-feedback">{errors.deliveryDate}</div>
                      )}
                    </div>
                  </div>

                  {/* Images */}
                  <div className="mt-3">
                    <label className="form-label fw-semibold">Manage Images</label>
                    <div
                      {...getRootProps()}
                      className={`border rounded p-3 text-center ${isDragActive ? "bg-light" : ""}`}
                      style={{ cursor: "pointer", borderColor: "#aaa" }}
                    >
                      <input {...getInputProps()} />
                      {isDragActive ? (
                        <p>Drop the files here ...</p>
                      ) : (
                        <p className="text-muted mb-0">
                          Drag & drop new images here, or click to select
                        </p>
                      )}
                    </div>
                    {errors.images && <div className="text-danger small mt-1">{errors.images}</div>}

                    <div className="d-flex flex-wrap justify-content-center align-items-center mt-3 gap-2">
                      {form.existingImages.map((url, i) => (
                        <div key={i} className="position-relative" style={{ width: "100px", height: "100px" }}>
                          <img src={url} alt="existing" className="rounded" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0"
                            style={{ borderRadius: "50%", padding: "2px 5px" }}
                            onClick={() => handleRemoveExistingImage(url)}
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      ))}
                      {form.newImages.map((file, i) => (
                        <div key={i} className="position-relative" style={{ width: "100px", height: "100px" }}>
                          <img src={URL.createObjectURL(file)} alt="new" className="rounded" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0"
                            style={{ borderRadius: "50%", padding: "2px 5px" }}
                            onClick={() => handleRemoveNewImage(file)}
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="modal-footer d-flex justify-content-center align-items-center flex-wrap gap-1 mt-3">
                    <button type="submit" className="btn btn-success" style={{ width: '80vw' }}>Update</button>
                    <button type="button" className="btn btn-secondary" style={{ width: '80vw' }} onClick={handleCloseModal}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        show={alert.show}
        onHide={() => setAlert({ ...alert, show: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={alert.onConfirm}
      />

    </div>
  );
};

export default ReturnReplacementTable;
