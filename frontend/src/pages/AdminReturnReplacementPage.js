import { useEffect, useState } from "react";
import {
    getAllReturnRequests,
    getReturnRequestsByStatus,
    updateReturnRequestStatus,
    refundReturnRequest,
} from "../api";
import AlertModal from "../components/AlertModal";

export default function AdminReturnReplacementPage() {
    const [requests, setRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [alert, setAlert] = useState({
        show: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null,
    });
    const [detailModal, setDetailModal] = useState({ show: false, rr: null });
    const [imagesModal, setImagesModal] = useState({ show: false, images: [], idx: 0 });

    useEffect(() => {
        fetchRequests(statusFilter);
    }, [statusFilter]);

    async function fetchRequests(status = statusFilter) {
        setLoading(true);
        setError(null);
        try {
            let res;
            if (status === "ALL") {
                res = await getAllReturnRequests();
            } else {
                res = await getReturnRequestsByStatus(status);
            }
            setRequests((res.data || []).slice().reverse());
        } catch (e) {
            console.error(e);
            setError("Failed to load requests.");
        } finally {
            setLoading(false);
        }
    }

    function openAlert(title, message, type, onConfirm) {
        setAlert({ show: true, title, message, type, onConfirm });
    }

    function openDetails(rr) {
        setDetailModal({ show: true, rr });
    }

    function closeDetails() {
        setDetailModal({ show: false, rr: null });
    }

    function openImages(images, idx = 0) {
        setImagesModal({ show: true, images: images || [], idx });
    }

    function closeImages() {
        setImagesModal({ show: false, images: [], idx: 0 });
    }

    async function handleStatusUpdate(rr, status) {
        openAlert(
            `${status} Request`,
            `Are you sure you want to set this request to ${status}?`,
            "warning",
            async () => {
                try {
                    await updateReturnRequestStatus(rr.id, status);
                    await fetchRequests();
                    setAlert({ show: true, title: "Success", message: `Request marked as ${status}.`, type: "success" });
                } catch (e) {
                    console.error(e);
                    setAlert({ show: true, title: "Error", message: "Failed to update status.", type: "danger" });
                }
            }
        );
    }

    async function handleRefund(rr) {
        openAlert(
            "Refund Request",
            `Refund ₹${(rr.refundedAmount || 0).toFixed(2)} for this request? (calculated from order)`,
            "warning",
            async () => {
                try {
                    await refundReturnRequest(rr.id);
                    await fetchRequests();
                    setAlert({ show: true, title: "Refunded", message: "Refund processed successfully done.", type: "success" });
                } catch (e) {
                    console.error(e);
                    // Extract backend message (Spring returns in err.response.data.error or message)
                    const backendMessage =
                        e.response?.data?.error ||
                        e.response?.data?.message ||
                        "Refund failed.";

                    setAlert({
                        show: true,
                        title: "Refund",
                        message: backendMessage,
                        type: "error",
                    });
                }
            }
        );
    }

    function statusBadge(status) {
        const s = (status || "").toUpperCase();
        const map = {
            PENDING: "secondary",
            APPROVED: "success",
            REJECTED: "danger",
            REFUNDED: "info",
            REPLACED: "primary",
            RETURNED: "primary"
        };
        const cls = map[s] || "light";
        return <span className={`badge bg-${cls}`}>{s}</span>;
    }

    return (
        <div className="container my-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-3 gap-2">
                <h3 className="mb-0">Returns &amp; Replacements</h3>
                <div className="d-flex gap-2 align-items-center">
                    <select
                        className="form-select form-select-sm"
                        style={{ minWidth: 160 }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REPLACED">Replaced</option>
                        <option value="RETURNED">Returned</option>
                        <option value="REFUNDED">Refunded</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : requests.length === 0 ? (
                <p className="text-muted text-center">No requests found.</p>
            ) : (
                requests.map((rr) => (
                    <div key={rr.id} className="card mb-4 shadow-sm">
                        <div className="card-body p-3">

                            {/* Header: Book info + Status */}
                            <div className="row align-items-start mb-2">
                                <div className="col-md-8 col-12">
                                    <h5 className="card-title mb-1">{rr.bookTitle || "Unknown Book"}</h5>
                                    <div className="text-muted small">
                                        <strong>Type:</strong> {rr.type} | <strong>Qty:</strong> {rr.quantity} | <strong>Order Id:</strong> {rr.orderId}
                                        {rr.deliveryDate && <> | <strong>Delivery:</strong> {new Date(rr.deliveryDate).toLocaleDateString()}</>}
                                    </div>
                                </div>

                                <div className="col-md-4 col-12 text-md-end mt-2 mt-md-0">
                                    {statusBadge(rr.status)}
                                    <div className="small text-muted">
                                        <strong>Requested:</strong> {new Date(rr.requestedDate).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="d-flex flex-wrap gap-2 align-items-center mt-3">
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => openDetails(rr)}>
                                    <i className="bi bi-eye"></i> Details
                                </button>

                                {rr.imageUrls?.length > 0 && (
                                    <button className="btn btn-sm btn-outline-info" onClick={() => openImages(rr.imageUrls, 0)}>
                                        <i className="bi bi-image"></i> Images ({rr.imageUrls.length})
                                    </button>
                                )}

                                {rr.status?.toUpperCase() === 'PENDING' && (
                                    <>
                                        <button className="btn btn-sm btn-success" onClick={() => handleStatusUpdate(rr, 'APPROVED')}>
                                            <i className="bi bi-check-circle"></i> Approve
                                        </button>

                                        <button className="btn btn-sm btn-danger" onClick={() => handleStatusUpdate(rr, 'REJECTED')}>
                                            <i className="bi bi-x-circle"></i> Reject
                                        </button>
                                    </>
                                )}

                                {rr.type?.toUpperCase() === 'REPLACEMENT' && rr.status?.toUpperCase() === 'APPROVED' && (
                                    <button className="btn btn-sm btn-primary" onClick={() => handleStatusUpdate(rr, 'REPLACED')}>
                                        <i className="bi bi-truck"></i> Mark Replaced
                                    </button>
                                )}

                                {rr.type?.toUpperCase() === 'RETURN' && rr.status?.toUpperCase() === 'APPROVED' && (
                                    rr.paymentId ? (
                                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleRefund(rr)}>
                                            <i className="bi bi-cash-stack"></i> Refund
                                        </button>
                                    ) : (
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleStatusUpdate(rr, 'RETURNED')}>
                                            <i className="bi bi-box-arrow-in-down"></i> Mark Returned
                                        </button>
                                    )
                                )}


                                <div className="ms-auto text-muted small">User: {rr.customerName}</div>
                            </div>
                        </div>
                    </div>
                ))
            )}

            {/* Details Modal */}
            {detailModal.show && (
                <div className="modal show d-flex justify-content-center align-items-center" tabIndex={-1} role="dialog">
                    <div className="modal-dialog modal-lg" style={{ paddingBottom: "20px", paddingTop: "20px" }}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Request Details</h5>
                                <button type="button" className="btn-close" onClick={closeDetails}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-2">
                                    <div className="col-sm-6 fw-bold">Book Title:</div>
                                    <div className="col-sm-6">{detailModal.rr.bookTitle || '—'}</div>
                                </div>
                                <div className="row mb-2">
                                    <div className="col-sm-6 fw-bold">Author:</div>
                                    <div className="col-sm-6">{detailModal.rr.bookAuthor || '—'}</div>
                                </div>
                                <div className="row mb-2">
                                    <div className="col-sm-6 fw-bold">Type:</div>
                                    <div className="col-sm-6">{detailModal.rr.type || '—'}</div>
                                </div>
                                <div className="row mb-2">
                                    <div className="col-sm-6 fw-bold">Quantity:</div>
                                    <div className="col-sm-6">{detailModal.rr.quantity || '—'}</div>
                                </div>
                                <div className="row mb-2">
                                    <div className="col-sm-6 fw-bold">Order ID:</div>
                                    <div className="col-sm-6">{detailModal.rr.orderId || '—'}</div>
                                </div>
                                <div className="row mb-2">
                                    <div className="col-sm-6 fw-bold">Customer Name:</div>
                                    <div className="col-sm-6">{detailModal.rr.customerName || '—'}</div>
                                </div>
                                <div className="row mb-2">
                                    <div className="col-sm-6 fw-bold">Customer Phone:</div>
                                    <div className="col-sm-6">{detailModal.rr.customerPhone || '—'}</div>
                                </div>
                                <div className="row mb-2">
                                    <div className="col-sm-6 fw-bold">Customer Address:</div>
                                    <div className="col-sm-6">{detailModal.rr.customerAddress || '—'}</div>
                                </div>
                                <div className="row mb-2">
                                    <div className="col-sm-6 fw-bold">Reason:</div>
                                    <div className="col-sm-6">{detailModal.rr.reason || '—'}</div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeDetails}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Images Modal */}
            {imagesModal.show && (
                <div className="modal show d-block" tabIndex={-1} role="dialog">
                    <div className="modal-dialog modal-md modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Images</h5>
                                <button type="button" className="btn-close" onClick={closeImages}></button>
                            </div>
                            <div className="modal-body text-center">
                                {imagesModal.images.length === 0 ? (
                                    <div className="text-muted">No images</div>
                                ) : (
                                    <img
                                        src={imagesModal.images[imagesModal.idx]}
                                        alt={`img-${imagesModal.idx}`}
                                        style={{ maxWidth: '100%', maxHeight: '60vh' }}
                                    />
                                )}
                            </div>
                            <div className="modal-footer">
                                <div className="d-flex w-100 justify-content-between align-items-center flex-wrap gap-2">
                                    <div>
                                        <button
                                            className="btn btn-sm btn-outline-secondary me-2"
                                            onClick={() => setImagesModal((s) => ({ ...s, idx: Math.max(0, s.idx - 1) }))}
                                            disabled={imagesModal.idx === 0}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() =>
                                                setImagesModal((s) => ({ ...s, idx: Math.min(s.images.length - 1, s.idx + 1) }))
                                            }
                                            disabled={imagesModal.idx >= imagesModal.images.length - 1}
                                        >
                                            Next
                                        </button>
                                    </div>

                                    <button className="btn btn-secondary" onClick={closeImages}>Close</button>
                                </div>
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
}
