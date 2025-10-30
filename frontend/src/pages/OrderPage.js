import { useEffect, useState } from 'react';
import { getOrdersByUserId, removeOrder, removeOrderItem, editOrdersByUserId, addReviewAndRating, fetchingRazorpayInfo, createReturnReplacementRequest, printOrder } from '../api';
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
  const [returnModal, setReturnModal] = useState({
    visible: false,
    order: null,
    item: null
  });

  const [returnForm, setReturnForm] = useState({
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    quantity: 1,
    type: 'RETURN',
    reason: '',
    deliveryDate: '', // auto-set to 3 days later
    images: [] // array of File objects
  });

  const [previewImages, setPreviewImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [rerrors, rsetErrors] = useState({});
  const MAX_FILE_SIZE = 50 * 1024 * 1024;  //50MB - converted into bytes
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    // Autofill only when modal opens
    if (returnModal.visible && returnModal.order) {
      setReturnForm((prev) => ({
        ...prev,
        customerName: returnModal.order.userName || "",
        customerAddress: returnModal.order.address || "",
        customerPhone: returnModal.order.phoneNumber || "",
      }));
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
  }, [userId, navigate, returnModal.visible, returnModal.order?.id]);

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
      .catch(err => handleError(err, "Failed to submit review and rating."));

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
          .catch(err => handleError(err, "Failed to cancel the order."));
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
          .catch(err => handleError(err, "Failed to delete order product."));
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
      .catch(err => {
        handleError(err, "Failed to update the order.");
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

  // Handle image input change
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      if (!ALLOWED_TYPES.includes(fileType) && !/\.(jpg|jpeg|png)$/i.test(fileName)) {
        errors.push(`${file.name} is not a valid image file (allowed: JPG, JPEG, PNG).`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds 50MB limit.`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      // 🔴 show errors under dropzone
      rsetErrors((prev) => ({ ...prev, images: errors.join(" ") }));
    } else {
      // ✅ clear previous error if all valid
      rsetErrors((prev) => ({ ...prev, images: "" }));
    }

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setPreviewImages((prev) => [...prev, ...newPreviews]);
      setReturnForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...validFiles],
      }));
    }

    e.target.value = ""; // reset input so reselecting works
  };

  // Handle drag & drop upload
  const handleImageDrop = (e) => {
    e.preventDefault();

    const files = Array.from(e.dataTransfer.files);
    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      if (!ALLOWED_TYPES.includes(fileType) && !/\.(jpg|jpeg|png)$/i.test(fileName)) {
        errors.push(`${file.name} is not a valid image file (allowed: JPG, JPEG, PNG).`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds 50MB limit.`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      rsetErrors((prev) => ({ ...prev, images: errors.join(" ") }));
    } else {
      rsetErrors((prev) => ({ ...prev, images: "" }));
    }

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setPreviewImages((prev) => [...prev, ...newPreviews]);
      setReturnForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...validFiles],
      }));
    }
  };

  // Remove single image
  const handleRemoveImage = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setReturnForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const openReturnModal = (order, item) => {
    const today = new Date();
    const threeDaysLater = new Date(today.setDate(today.getDate() + 3))
      .toISOString().split("T")[0];

    setReturnForm({
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      quantity: item.quantity,
      type: 'RETURN',
      reason: '',
      deliveryDate: threeDaysLater,
      images: []
    });

    setReturnModal({ visible: true, order, item });
  };

  const validateAndSubmit = () => {
    const newErrors = {};

    if (!returnForm.customerName || returnForm.customerName.length < 3 || returnForm.customerName.length > 20)
      newErrors.customerName = "Name must be between 3 and 20 characters.";

    if (!returnForm.customerAddress || returnForm.customerAddress.length < 3 || returnForm.customerAddress.length > 50)
      newErrors.customerAddress = "Address must be between 3 and 50 characters.";

    if (!/^\d{10}$/.test(returnForm.customerPhone))
      newErrors.customerPhone = "Phone number must be exactly 10 digits.";

    if (!returnForm.quantity || returnForm.quantity < 1)
      newErrors.quantity = "Quantity is required.";

    if (!returnForm.type)
      newErrors.type = "Please select Return or Replacement.";

    if (!returnForm.reason || returnForm.reason.length < 3 || returnForm.reason.length > 200)
      newErrors.reason = "Reason must be between 3 and 200 characters.";

    if (previewImages.length === 0)
      newErrors.images = "At least one image is required.";

    if (!returnForm.deliveryDate)
      newErrors.deliveryDate = "Delivery date is required.";

    rsetErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      submitReturnRequest();
    }
  };

  const submitReturnRequest = async () => {
    try {
      const requestData = {
        userId: localStorage.getItem("userId"),
        orderId: returnModal.order.id,
        bookId: returnModal.item.bookId,
        bookTitle: returnModal.item.bookName,
        bookAuthor: returnModal.item.authorName,
        quantity: returnForm.quantity,
        customerName: returnForm.customerName,
        customerAddress: returnForm.customerAddress,
        customerPhone: returnForm.customerPhone,
        type: returnForm.type,
        reason: returnForm.reason,
        deliveryDate: new Date(returnForm.deliveryDate).toISOString(),
        paymentId: returnModal.order.orderMode === "UPI" ? razorpayInfoMap[returnModal.order.id].razorpayPaymentId : "",
        refundedAmount: parseFloat(
          (parseFloat(returnModal.item.unitPrice) * returnForm.quantity).toFixed(2)
        ),
      };

      const formDataToSend = new FormData();
      formDataToSend.append("value", JSON.stringify(requestData));
      returnForm.images.forEach((file) => formDataToSend.append("images", file));

      await createReturnReplacementRequest(formDataToSend);

      rsetErrors((prev) => ({ ...prev, images: "" }));

      setModal({
        show: true,
        title: "Request Submitted",
        message: "Your return/replacement request has been submitted successfully!",
        type: "success",
      });
      setReturnModal({ visible: false, order: null, item: null });
    } catch (err) {
      handleError(err, "Failed to submit your request.");
    }
  };

  const closeReturnModal = () => {
    // Clean up preview URLs
    previewImages.forEach((url) => URL.revokeObjectURL(url));

    // Reset all form states
    setPreviewImages([]);
    setReturnForm({
      customerName: "",
      customerAddress: "",
      customerPhone: "",
      quantity: "",
      type: "RETURN",
      reason: "",
      deliveryDate: "",
      images: [],
    });
    rsetErrors({});
    setReturnModal({ visible: false, order: null, item: null });
  };

  const handlePrint = async (batch, time, batchIndex) => {
    const { userName, orderMode, orderStatus, address, phoneNumber, deliveryDate, id } = batch[0];

    try {
      // ✅ Call backend validation
      await printOrder(id, orderStatus);

      // ✅ If backend allows, continue local print
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
            ${batch
          .flatMap((order, oi) =>
            order.items.map(
              (item, ii) => `
                <tr>
                  <td style="border:1px solid #ddd; padding:8px;">${ii + 1}</td>
                  <td style="border:1px solid #ddd; padding:8px;">${item.bookName}</td>
                  <td style="border:1px solid #ddd; padding:8px;">${item.authorName}</td>
                  <td style="border:1px solid #ddd; padding:8px;">${item.quantity}</td>
                  <td style="border:1px solid #ddd; padding:8px;">₹${item.unitPrice.toFixed(2)}</td>
                  <td style="border:1px solid #ddd; padding:8px;">₹${item.subtotal.toFixed(2)}</td>
                </tr>
              `
            )
          )
          .join("")}
          </tbody>
        </table>

        ${batch.some(order => order.orderMode === "UPI" && razorpayInfoMap[order.id])
          ? batch
            .map(order => {
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
              return "";
            })
            .join("")
          : ""
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
    } catch (err) {
      handleError(err,"Failed to print order.");
    }
  };

  return (
    <div className="container mt-4 mb-0">
      <h2 className="mb-4 text-primary fw-bold">Your Orders</h2>

      {orders.length === 0 ? (
        <p className="text-muted text-center">No orders found.</p>
      ) : (
        <div style={{ maxHeight: '100vh', overflowY: 'auto', maxWidth: '90vw' }}>
          {Object.entries(groupedOrders).map(([time, batch], batchIndex) => {
            const { id, userName, orderMode, orderStatus, address, phoneNumber, deliveryDate } = batch[0];

            return (
              <div key={time} className="mb-4 p-3 shadow-sm rounded bg-light">
                <h5 className="text-primary">
                  Order Batch {batchIndex + 1} (Placed at: {time})
                </h5>

                <div className="mb-2 d-flex flex-wrap gap-1 align-items-center">
                  <strong>Name:</strong> {userName} |{" "}
                  <strong>Address:</strong> {address} |{" "}
                  <strong>Phone:</strong> {phoneNumber} |{" "}
                  <strong>Delivery Date:</strong> {new Date(deliveryDate).toLocaleDateString()} |{" "}

                  {/*Edit button */}
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
                        return;
                      }
                      handleEdit(batch[0]);
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

                  {/*Cancel button */}
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      if (orderMode === "UPI") {
                        setModal({
                          show: true,
                          title: "Not Allowed",
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

                  {/*Print button */}
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

                              {/*Cancel product button */}
                              <button
                                className="btn btn-sm"
                                onClick={() => {
                                  if (order.orderMode === "UPI") {
                                    setModal({
                                      show: true,
                                      title: "Not Allowed",
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

                              {/*Review/Rating button */}
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

                              {/*Return/Replacement button */}
                              <button
                                className="btn btn-sm"
                                onClick={() => {
                                  if (order.orderStatus !== "Delivered") {
                                    setModal({
                                      show: true,
                                      title: "Return & Replacement Restricted",
                                      message: "Return & Replacement is allowed only for delivered products.",
                                      type: "info",
                                      onConfirm: null
                                    });
                                    return;
                                  } else if (item.quantity <= 0) {
                                    setModal({
                                      show: true,
                                      title: "Return & Replacement Restricted",
                                      message: "Return & Replacement is allowed only for products whose quantity is greater than zero.",
                                      type: "info",
                                      onConfirm: null
                                    });
                                    return;
                                  } openReturnModal(order, item)
                                }}
                                style={{
                                  cursor: (order.orderStatus !== "Delivered" || item.quantity <= 0) ? "not-allowed" : "pointer",
                                  opacity: (order.orderStatus !== "Delivered" || item.quantity <= 0) ? 0.5 : 1
                                }}
                              >
                                <i className="bi bi-arrow-counterclockwise"></i>
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

      {/* Editing Modal */}
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
              <div className="modal-footer d-flex justify-content-center align-items-center flex-wrap gap-1">
                <button className="btn btn-primary w-100" onClick={handleSave}>Edit</button>
                <button className="btn btn-secondary w-100" onClick={() => setEditingOrder(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.visible && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-lg modal-custom">
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
              <div className="modal-footer d-flex justify-content-center align-items-center flex-wrap gap-1">
                <button className="btn btn-primary w-100" onClick={handleReviewSubmit}>Submit</button>
                <button className="btn btn-secondary w-100" onClick={() => setReviewModal({ visible: false, orderId: null, bookId: null })}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return/Replacement */}
      {returnModal.visible && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-lg modal-custom">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ wordBreak: 'break-word' }}>
                  {returnForm.type === "RETURN" ? "Return of " : "Replacement of "}
                  {returnModal.item.bookName}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeReturnModal}
                ></button>
              </div>

              <div className="modal-body">
                <form>
                  {/* NAME */}
                  <div className="mb-3 position-relative">
                    <label className="form-label">Name</label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className={`form-control ${rerrors.customerName ? "is-invalid-custom" : ""
                          }`}
                        value={returnForm.customerName}
                        onChange={(e) =>
                          setReturnForm({ ...returnForm, customerName: e.target.value })
                        }
                      />
                      {rerrors.customerName && (
                        <i className="bi bi-exclamation-circle text-danger position-absolute top-50 end-0 translate-middle-y me-2"></i>
                      )}
                    </div>
                    {rerrors.customerName && (
                      <div className="text-danger small mt-1">{rerrors.customerName}</div>
                    )}
                  </div>

                  {/* ADDRESS */}
                  <div className="mb-3 position-relative">
                    <label className="form-label">Address</label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className={`form-control ${rerrors.customerAddress ? "is-invalid-custom" : ""
                          }`}
                        value={returnForm.customerAddress}
                        onChange={(e) =>
                          setReturnForm({ ...returnForm, customerAddress: e.target.value })
                        }
                      />
                      {rerrors.customerAddress && (
                        <i className="bi bi-exclamation-circle text-danger position-absolute top-50 end-0 translate-middle-y me-2"></i>
                      )}
                    </div>
                    {rerrors.customerAddress && (
                      <div className="text-danger small mt-1">{rerrors.customerAddress}</div>
                    )}
                  </div>

                  {/* PHONE */}
                  <div className="mb-3 position-relative">
                    <label className="form-label">Phone</label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className={`form-control ${rerrors.customerPhone ? "is-invalid-custom" : ""
                          }`}
                        value={returnForm.customerPhone}
                        onChange={(e) =>
                          setReturnForm({ ...returnForm, customerPhone: e.target.value })
                        }
                      />
                      {rerrors.customerPhone && (
                        <i className="bi bi-exclamation-circle text-danger position-absolute top-50 end-0 translate-middle-y me-2"></i>
                      )}
                    </div>
                    {rerrors.customerPhone && (
                      <div className="text-danger small mt-1">{rerrors.customerPhone}</div>
                    )}
                  </div>

                  {/* QUANTITY */}
                  <div className="mb-3 position-relative">
                    <label className="form-label">Quantity</label>
                    <div className="position-relative">
                      <input
                        type="number"
                        className={`form-control ${rerrors.quantity ? "is-invalid-custom" : ""
                          }`}
                        min={1}
                        max={returnModal.item.quantity}
                        value={returnForm.quantity}
                        onChange={(e) =>
                          setReturnForm({ ...returnForm, quantity: parseInt(e.target.value) })
                        }
                      />
                      {rerrors.quantity && (
                        <i className="bi bi-exclamation-circle text-danger position-absolute top-50 end-0 translate-middle-y me-2"></i>
                      )}
                    </div>
                    {rerrors.quantity && (
                      <div className="text-danger small mt-1">{rerrors.quantity}</div>
                    )}
                  </div>

                  {/* TYPE */}
                  <div className="mb-3">
                    <label className="form-label">Type</label><br />
                    <input
                      type="radio"
                      id="return"
                      name="type"
                      value="RETURN"
                      checked={returnForm.type === "RETURN"}
                      onChange={(e) =>
                        setReturnForm({ ...returnForm, type: e.target.value })
                      }
                    />
                    <label htmlFor="return" className="me-3">Return</label>

                    <input
                      type="radio"
                      id="replacement"
                      name="type"
                      value="REPLACEMENT"
                      checked={returnForm.type === "REPLACEMENT"}
                      onChange={(e) =>
                        setReturnForm({ ...returnForm, type: e.target.value })
                      }
                    />
                    <label htmlFor="replacement">Replacement</label>

                    {rerrors.type && (
                      <div className="text-danger small mt-1">{rerrors.type}</div>
                    )}
                  </div>

                  {/* REASON */}
                  <div className="mb-3 position-relative">
                    <label className="form-label">Reason</label>
                    <div className="position-relative">
                      <textarea
                        className={`form-control ${rerrors.reason ? "is-invalid-custom" : ""
                          }`}
                        rows={3}
                        value={returnForm.reason}
                        onChange={(e) =>
                          setReturnForm({ ...returnForm, reason: e.target.value })
                        }
                      />
                      {rerrors.reason && (
                        <i className="bi bi-exclamation-circle text-danger position-absolute top-0 end-0 me-2 mt-2"></i>
                      )}
                    </div>
                    {rerrors.reason && (
                      <div className="text-danger small mt-1">{rerrors.reason}</div>
                    )}
                  </div>

                  {/* IMAGE UPLOAD */}
                  <div
                    className={`border rounded p-4 text-center mb-3 ${isDragging ? "bg-light border-primary" : "border-secondary"
                      } ${rerrors.images ? "border-danger" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleImageDrop(e);
                    }}
                  >
                    <p className="mb-2">
                      <i className="bi bi-cloud-arrow-up fs-3 text-primary"></i>
                    </p>
                    <p className="text-muted mb-1">
                      Drag & drop images here, or click below to browse
                    </p>
                    <input
                      type="file"
                      className="form-control mt-2"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                    />
                    {rerrors.images && (
                      <div className="text-danger small mt-2">{rerrors.images}</div>
                    )}
                  </div>

                  {/* IMAGE PREVIEW */}
                  {previewImages.length > 0 && (
                    <div className="d-flex flex-wrap gap-3 mb-3 justify-content-center align-items-center">
                      {previewImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="position-relative border rounded"
                          style={{ width: "120px", height: "120px", overflow: "hidden" }}
                        >
                          <img
                            src={img}
                            alt={`preview-${idx}`}
                            className="img-fluid w-100 h-100 object-fit-cover"
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                            style={{ borderRadius: "50%" }}
                            onClick={() => handleRemoveImage(idx)}
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* DELIVERY DATE */}
                  <div className="mb-3 position-relative">
                    <label className="form-label">Delivery Date</label>
                    <div className="position-relative">
                      <input
                        type="date"
                        className={`form-control ${rerrors.deliveryDate ? "is-invalid-custom" : ""
                          }`}
                        value={returnForm.deliveryDate}
                        onChange={(e) =>
                          setReturnForm({ ...returnForm, deliveryDate: e.target.value })
                        }
                      />
                      {rerrors.deliveryDate && (
                        <i className="bi bi-exclamation-circle text-danger position-absolute top-50 end-0 translate-middle-y me-2"></i>
                      )}
                    </div>
                    {rerrors.deliveryDate && (
                      <div className="text-danger small mt-1">{rerrors.deliveryDate}</div>
                    )}
                  </div>
                </form>
              </div>

              <div className="modal-footer d-flex justify-content-center gap-1">
                <button className="btn btn-primary w-100" onClick={validateAndSubmit}>
                  Submit
                </button>
                <button
                  className="btn btn-secondary w-100"
                  onClick={closeReturnModal}
                >
                  Cancel
                </button>
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
