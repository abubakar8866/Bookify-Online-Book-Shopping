import { useEffect, useState } from 'react';
import { getOrdersByUserId, removeOrder, removeOrderItem, editOrdersByUserId, addReviewAndRating, fetchingRazorpayInfo } from '../api';
import { useNavigate } from 'react-router-dom';
import '../../src/style/OrderTable.css';
import '../../src/style/printWindow.css';
import ReactStars from 'react-stars';
import AlertModal from '../components/AlertModal';
import '../../src/style/All.css';

function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [reviewModal, setReviewModal] = useState({ visible: false, orderId: null, bookId: null });
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: '' });
  const [reviewErrors, setReviewErrors] = useState({});
  const [formData, setFormData] = useState({
    userName: '',
    address: '',
    phoneNumber: '',
    deliveryDate: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null
  });
  const [razorpayInfoMap, setRazorpayInfoMap] = useState({});

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    getOrdersByUserId(userId)
      .then(res => {
        const sorted = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sorted);

        // Fetch Razorpay info for UPI orders only
        sorted.forEach(order => {
          if (order.orderMode === "UPI") {
            fetchingRazorpayInfo(order.id)
              .then(infoRes => {
                setRazorpayInfoMap(prev => ({ ...prev, [order.id]: infoRes.data }));
              })
              .catch(err => {
                console.error(`Failed to fetch Razorpay info for order ${order.id}:`, err);
              });
          }
        });
      })
      .catch(err => console.error("Failed to load orders:", err));
  }, [userId, navigate]);


  const openReviewModal = (orderId, bookId) => {
    setReviewModal({ visible: true, orderId, bookId });
    setReviewForm({ rating: 5, review: '' });
    setReviewErrors({});
  };

  const handleReviewSubmit = () => {
    const errors = {};
    if (!reviewForm.rating) errors.rating = "Rating is required.";
    if (!reviewForm.review || reviewForm.review.length < 4 || reviewForm.review.length > 50)
      errors.review = "Review must be 4-50 characters.";
    setReviewErrors(errors);
    if (Object.keys(errors).length > 0) return;

    addReviewAndRating(reviewModal.orderId, reviewModal.bookId, reviewForm)
      .then(() => {
        setReviewModal({ visible: false, orderId: null, bookId: null });
        setOrders(prev => prev.map(order => {
          if (order.id === reviewModal.orderId) {
            return {
              ...order,
              items: order.items.map(item =>
                item.bookId === reviewModal.bookId ? { ...item, reviewed: true } : item
              )
            };
          }
          return order;
        }));

        setModal({
          show: true,
          title: "Review Submitted",
          message: "Your review has been submitted successfully!",
          type: "success",
          onConfirm: null
        });
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Error",
          message: "Failed to submit review. Please try again.",
          type: "error",
          onConfirm: null
        });
      });

  };

  const handleCancel = (orderId) => {
    setModal({
      show: true,
      title: "Cancel Order",
      message: "Are you sure you want to cancel this order?",
      type: "warning",
      onConfirm: () => {
        removeOrder(orderId)
          .then(() => setOrders(orders.filter(o => o.id !== orderId)))
          .catch(err => console.error("Failed to cancel order:", err));
      }
    });
  };


  const handleCancelProduct = (orderId, bookId) => {
    setModal({
      show: true,
      title: "Remove Product",
      message: "Are you sure you want to remove this product from the order?",
      type: "warning",
      onConfirm: () => {
        removeOrderItem(orderId, bookId)
          .then(() => getOrdersByUserId(userId))
          .then(res => {
            const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(sorted);
          })
          .catch(err => console.error("Failed to remove product from order:", err));
      }
    });
  };



  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      userName: order.userName,
      address: order.address,
      phoneNumber: order.phoneNumber,
      deliveryDate: new Date(order.deliveryDate).toISOString().split("T")[0]
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.userName || formData.userName.length < 3 || formData.userName.length > 20) {
      newErrors.userName = "Name must be between 3 and 20 characters.";
    }
    if (!formData.address) {
      newErrors.address = "Address is required.";
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required.";
    }

    const createdAt = new Date(editingOrder.createdAt);
    const minDate = createdAt.toISOString().split("T")[0];
    const maxDate = new Date(createdAt.getTime() + 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (!formData.deliveryDate || formData.deliveryDate < minDate || formData.deliveryDate > maxDate) {
      newErrors.deliveryDate = `Delivery date must be between ${minDate} and ${maxDate}.`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    editOrdersByUserId(editingOrder.id, formData)
      .then(res => {
        setOrders(orders.map(o => o.id === editingOrder.id ? res.data : o));
        setEditingOrder(null);

        setModal({
          show: true,
          title: "Order Updated",
          message: "Your order has been updated successfully!",
          type: "success",
          onConfirm: null
        });
      })
      .catch(() => {
        setModal({
          show: true,
          title: "Error",
          message: "Failed to update order. Please try again.",
          type: "error",
          onConfirm: null
        });
      });
  };


  const groupOrdersByTime = (orders) => {
    return orders.reduce((groups, order) => {
      const timeKey = new Date(order.createdAt).toLocaleString();
      if (!groups[timeKey]) groups[timeKey] = [];
      groups[timeKey].push(order);
      return groups;
    }, {});
  };

  const getBatchTotal = (batch) =>
    batch.reduce((sum, order) => sum + order.total, 0);

  const groupedOrders = groupOrdersByTime(orders);

  const handlePrint = (batch, time, batchIndex) => {
    const { userName, orderMode, orderStatus, address, phoneNumber, deliveryDate } = batch[0];
    const grandTotal = getBatchTotal(batch);
    const subtotal = grandTotal / 1.05;
    const gstAmount = grandTotal - subtotal;

    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(batchIndex + 1).padStart(4, "0")}`;

    const printContent = `
    <div id="printableArea" style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="text-align: center;">Invoice - 📚Bookify</h2>
      <p style="text-align: center; font-size: 20px; color: gray;">${invoiceNumber}</p>
      <div style="margin-top: 10px;">
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Phone:</strong> ${phoneNumber}</p>
        <p><strong>Order Mode:</strong> ${orderMode}</p>
        <p><strong>Status:</strong> ${orderStatus}</p>
        <p><strong>Delivery Date:</strong> ${new Date(deliveryDate).toLocaleDateString()}</p>
        <p><strong>Placed At:</strong> ${time}</p>
        <p><strong>Generated At:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding:8px;">Sr No</th>
            <th style="border:1px solid #ddd; padding:8px;">Book</th>
            <th style="border:1px solid #ddd; padding:8px;">Author</th>
            <th style="border:1px solid #ddd; padding:8px;">Qty</th>
            <th style="border:1px solid #ddd; padding:8px;">Price</th>
            <th style="border:1px solid #ddd; padding:8px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${batch.flatMap((order, oi) =>
      order.items.map((item, ii) => `
              <tr>
                <td style="border:1px solid #ddd; padding:8px;">${ii + 1}</td>
                <td style="border:1px solid #ddd; padding:8px;">${item.bookName}</td>
                <td style="border:1px solid #ddd; padding:8px;">${item.authorName}</td>
                <td style="border:1px solid #ddd; padding:8px;">${item.quantity}</td>
                <td style="border:1px solid #ddd; padding:8px;">₹${item.unitPrice.toFixed(2)}</td>
                <td style="border:1px solid #ddd; padding:8px;">₹${item.subtotal.toFixed(2)}</td>
              </tr>
            `)
    ).join('')}
        </tbody>
      </table>

      ${batch.some(order => order.orderMode === "UPI" && razorpayInfoMap[order.id])
        ? batch.map(order => {
          if (order.orderMode === "UPI" && razorpayInfoMap[order.id]) {
            const info = razorpayInfoMap[order.id];
            return `
                  <div style="margin-top: 10px; background: #f8f9fa; padding: 10px; border: 1px solid #ddd; font-size: 0.9rem;">
                    <strong>Razorpay Details:</strong><br/>
                    Order ID: ${info.razorpayOrderId}<br/>
                    Payment ID: ${info.razorpayPaymentId}<br/>
                    Signature: ${info.razorpaySignature}
                  </div>
                `;
          }
          return '';
        }).join('')
        : ''
      }

      <div style="margin-top: 20px; font-size: 1rem;">
        <p>Subtotal (excl. GST): ₹${subtotal.toFixed(2)}</p>
        <p>GST (5%): ₹${gstAmount.toFixed(2)}</p>
        <p style="font-weight:bold; font-size:1.2rem; margin-top:10px;">
          Grand Total: ₹${grandTotal.toFixed(2)}
        </p>
      </div>

      <p style="margin-top: 40px; text-align: center; font-size: 20px; color: gray;">
        Thank you for shopping with 📚Bookify!
      </p>
    </div>
  `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printContent);
    doc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    iframe.onload = () => {
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };


  return (
    <div className="container mt-4 mb-0">
      <h2 className="mb-4 text-primary fw-bold">Your Orders</h2>

      {orders.length === 0 ? (
        <p className="text-muted text-center">No orders found.</p>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: '85vh', overflowY: 'auto' }}>
          {Object.entries(groupedOrders).map(([time, batch], batchIndex) => {
            const { id, userName, orderMode, orderStatus, address, phoneNumber, deliveryDate } = batch[0];

            return (
              <div key={time} className="mb-4 p-3 shadow-sm rounded bg-light">
                <h5 className="text-primary">
                  Order Batch {batchIndex + 1} (Placed at: {time})
                </h5>

                <div className="mb-2 d-flex flex-wrap gap-3 align-items-center">
                  <strong>Name:</strong> {userName} |{" "}
                  <strong>Address:</strong> {address} |{" "}
                  <strong>Phone:</strong> {phoneNumber} |{" "}
                  <strong>Delivery Date:</strong> {new Date(deliveryDate).toLocaleDateString()} |{" "}

                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      if (orderStatus === "Delivered" || orderStatus === "Cancelled") {
                        setModal({
                          show: true,
                          title: "Edit Not Allowed",
                          message: "You cannot edit this order.",
                          type: "info",
                          onConfirm: null
                        });
                      } else {
                        handleEdit(batch[0]);
                      }
                    }}
                    style={{
                      cursor: (orderStatus === "Delivered" || orderStatus === "Cancelled") ? "not-allowed" : "pointer",
                      opacity: (orderStatus === "Delivered" || orderStatus === "Cancelled") ? 0.5 : 1
                    }}
                  >
                    <i
                      className="bi bi-pencil-square"
                      style={{
                        color: (orderStatus === "Delivered" || orderStatus === "Cancelled") ? "grey" : "orange",
                        fontSize: "1.2rem"
                      }}
                    ></i>
                  </button>
                  |{" "}

                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      if (orderMode === "UPI") {
                        setModal({
                          show: true,
                          title: "Cancellation Not Allowed",
                          message: "You cannot cancel orders placed via UPI.",
                          type: "info",
                          onConfirm: null
                        });
                        return;
                      }
                      if (orderStatus === "Delivered") {
                        setModal({
                          show: true,
                          title: "Delete Not Allowed",
                          message: "You cannot delete a delivered order.",
                          type: "warning",
                          onConfirm: null
                        });
                        return;
                      }
                      handleCancel(id);
                    }}
                    style={{
                      cursor: orderMode === "UPI" || orderStatus === "Delivered" ? "not-allowed" : "pointer",
                      opacity: orderMode === "UPI" || orderStatus === "Delivered" ? 0.5 : 1
                    }}
                  >

                    <i
                      className="bi bi-trash"
                      style={{
                        color: (orderStatus === "Delivered" || orderMode === "UPI") ? "grey" : "red",
                        fontSize: "1.2rem"
                      }}
                    ></i>
                  </button> |{" "}

                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      if (orderStatus !== "Delivered") {
                        setModal({
                          show: true,
                          title: "Printing Restricted",
                          message: "Printing is allowed only for delivered orders.",
                          type: "info",
                          onConfirm: null
                        });
                        return;
                      }
                      handlePrint(batch, time, batchIndex);
                    }}
                    style={{
                      cursor: orderStatus === "Delivered" ? "pointer" : "not-allowed",
                      opacity: orderStatus === "Delivered" ? 1 : 0.5
                    }}
                  >
                    <i
                      className="bi bi-printer"
                      style={{
                        color: orderStatus === "Delivered" ? "green" : "grey",
                        fontSize: "1.2rem"
                      }}
                    ></i>
                  </button>


                </div>

                <div className="mb-2">
                  <strong>Order Mode:</strong> {orderMode} |{" "}
                  <strong>Status:</strong> {orderStatus} |{" "}
                  <strong>Total:</strong> {getBatchTotal(batch).toFixed(2)} |{" "}
                  <strong>Updated at:</strong> {new Date(batch[0].updatedAt).toLocaleString()}
                </div>

                <div className="my-table-wrapper table-responsive shadow-sm rounded">
                  <table className="table table-striped table-hover text-center mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Order</th>
                        <th>Name</th>
                        <th>Author</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.flatMap((order) => {
                        // Collect rows for this order
                        const rows = order.items.map((item, itemIndex) => (
                          <tr key={item.id}>
                            <td>{itemIndex + 1}</td>
                            <td>{item.bookName}</td>
                            <td>{item.authorName}</td>
                            <td>{item.quantity}</td>
                            <td>{item.unitPrice}</td>
                            <td>{item.subtotal}</td>
                            <td>
                              <button
                                className="btn btn-sm"
                                onClick={() => {
                                  if (order.orderMode === "UPI") {
                                    setModal({
                                      show: true,
                                      title: "Cancellation Not Allowed",
                                      message: "You cannot cancel products from a UPI order.",
                                      type: "info",
                                      onConfirm: null
                                    });
                                    return;
                                  }
                                  if (order.orderStatus === "Delivered" || order.orderStatus === "Cancelled") {
                                    setModal({
                                      show: true,
                                      title: "Action Not Allowed",
                                      message: `This action is not allowed because the order is ${order.orderStatus.toLowerCase()}.`,
                                      type: "warning",
                                      onConfirm: null
                                    });
                                    return;
                                  }
                                  handleCancelProduct(order.id, item.bookId);
                                }}
                                style={{
                                  cursor: order.orderMode === "UPI" || order.orderStatus === "Delivered" || order.orderStatus === "Cancelled" ? "not-allowed" : "pointer",
                                  opacity: order.orderMode === "UPI" || order.orderStatus === "Delivered" || order.orderStatus === "Cancelled" ? 0.5 : 1
                                }}
                              >
                                <i
                                  className="bi bi-trash"
                                  style={{
                                    color: (order.orderStatus === "Delivered" || order.orderStatus === "Cancelled" || order.orderMode === "UPI") ? "grey" : "red",
                                    fontSize: "1.2rem"
                                  }}
                                ></i>
                              </button>

                              <button
                                className="btn btn-sm"
                                onClick={() => {
                                  if (order.orderStatus !== "Delivered") {
                                    setModal({
                                      show: true,
                                      title: "Review & Rating Restricted",
                                      message: "Review & Rating is allowed only for delivered products.",
                                      type: "info",
                                      onConfirm: null
                                    });
                                    return;
                                  }
                                  openReviewModal(order.id, item.bookId)
                                }}
                                style={{
                                  cursor: order.orderStatus !== "Delivered" ? 'not-allowed' : 'pointer',
                                  opacity: order.orderStatus !== "Delivered" ? 0.5 : 1
                                }}
                              >
                                <i className="bi bi-star"></i>
                              </button>

                            </td>
                          </tr>
                        ));

                        // Add Razorpay info row for UPI orders
                        if (order.orderMode === "UPI" && razorpayInfoMap[order.id]) {
                          rows.push(
                            <tr key={`razorpay-${order.id}`}>
                              <td colSpan={7} style={{ backgroundColor: "#f8f9fa", padding: "2px" }}>
                                <strong>Razorpay Details:</strong>
                                <table className="table table-sm table-bordered mt-2 mb-0" style={{ fontSize: "0.85rem" }}>
                                  <tbody>
                                    <tr>
                                      <td><strong>Order ID</strong></td>
                                      <td>{razorpayInfoMap[order.id].razorpayOrderId}</td>
                                    </tr>
                                    <tr>
                                      <td><strong>Payment ID</strong></td>
                                      <td>{razorpayInfoMap[order.id].razorpayPaymentId}</td>
                                    </tr>
                                    <tr>
                                      <td><strong>Signature</strong></td>
                                      <td>{razorpayInfoMap[order.id].razorpaySignature}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          );
                        }


                        return rows; // Return all rows for this order
                      })}
                    </tbody>

                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingOrder && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-lg modal-custom">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Order</h5>
                <button type="button" className="btn-close" onClick={() => setEditingOrder(null)}></button>
              </div>
              <div className="modal-body">
                <form noValidate>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className={`form-control ${errors.userName ? 'is-invalid' : ''}`}
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    />
                    {errors.userName && <div className="invalid-feedback">{errors.userName}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                    {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Delivery Date</label>
                    <input
                      type="date"
                      className={`form-control ${errors.deliveryDate ? 'is-invalid' : ''}`}
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    />
                    {errors.deliveryDate && <div className="invalid-feedback">{errors.deliveryDate}</div>}
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary mx-2" onClick={() => setEditingOrder(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.visible && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-md modal-custom">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Review & Rating</h5>
                <button type="button" className="btn-close" onClick={() => setReviewModal({ visible: false, orderId: null, bookId: null })}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Rating</label>
                  <ReactStars
                    count={5}
                    value={reviewForm.rating}
                    onChange={(newRating) => setReviewForm({ ...reviewForm, rating: newRating })}
                    size={30}
                    half={true}
                    color2={'#f39c12'}
                  />
                  {reviewErrors.rating && <div className="text-danger">{reviewErrors.rating}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Review</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={reviewForm.review}
                    onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                  ></textarea>
                  {reviewErrors.review && <div className="text-danger">{reviewErrors.review}</div>}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary me-2" onClick={() => setReviewModal({ visible: false, orderId: null, bookId: null })}>Cancel</button>
                <button className="btn btn-primary" onClick={handleReviewSubmit}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
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

export default OrderPage;
