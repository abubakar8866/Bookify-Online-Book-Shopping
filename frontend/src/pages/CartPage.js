import { useEffect, useState } from 'react';
import { getCart, removeFromCart, placeOrder, getUserNameByUserId, createRazorpayOrder, verifyRazorpayPayment, placeRazorpayOrder, fetchRazerpayKey } from '../api';
import { useNavigate } from 'react-router-dom';
import '../../src/style/OrderModal.css';
import AlertModal from '../components/AlertModal';
import '../../src/style/All.css';
import '../../src/style/cart.css';

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [userName, setUserName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderMode, setOrderMode] = useState('CASH');
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info", onConfirm: null });

  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    getUserNameByUserId(userId)
      .then(response => setUserName(response.data))
      .catch(error => console.error('Failed to load username:', error));

    getCart(userId)
      .then(response => {
        const itemsWithQuantity = response.data.map(item => ({
          ...item,
          quantity: 1
        }));
        setCartItems(itemsWithQuantity);
      })
      .catch(error => console.error('Failed to load cart:', error));
  }, [userId, navigate]);

  // Ask for confirmation before removing
  const confirmRemove = (cartId) => {
    setModal({
      show: true,
      title: "Confirm Remove",
      message: "Are you sure you want to remove this item from your cart?",
      type: "warning",
      onConfirm: () => handleRemove(cartId),
    });
  };

  const handleRemove = (cartId) => {
    removeFromCart(userId, cartId)
      .then(() => {
        setCartItems(cartItems.filter(item => item.id !== cartId));
        setModal({
          show: true,
          title: "Removed",
          message: "Item removed from your cart.",
          type: "success",
          onConfirm: null,
        });
      })
      .catch(error => {
        console.error('Failed to remove from cart:', error);
        setModal({
          show: true,
          title: "Error",
          message: "Could not remove item from cart.",
          type: "error",
          onConfirm: null,
        });
      });
  };

  const updateQuantity = (cartId, change) => {
    setCartItems(cartItems.map(item => {
      if (item.id === cartId) {
        const newQuantity = item.quantity + change;
        if (newQuantity < 1) return item;
        if (newQuantity > item.book.quantity) {
          setModal({
            show: true,
            title: "Stock Limit",
            message: "This product is out of stock.",
            type: "warning",
            onConfirm: null,
          });
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
  const gst = totalPrice * 0.05;
  const grandTotal = totalPrice + gst;

  const handleOrderClick = () => {
    if (cartItems.length === 0) {
      setModal({
        show: true,
        title: "Empty Cart",
        message: "Your cart is empty!",
        type: "warning",
        onConfirm: null,
      });
      return;
    }
    setShowOrderForm(true);
  };

  const submitOrder = async () => {
    if (!userName || !address || !phoneNumber || !/^\+?\d{10,15}$/.test(phoneNumber)) return;

    const orderData = {
      user: { id: userId },
      userName,
      address,
      phoneNumber,
      orderMode,
      items: cartItems.map(item => ({
        bookId: item.book.id,
        quantity: item.quantity
      }))
    };

    try {
      if (orderMode === 'UPI') {
        // Fetch Razorpay key
        const keyRes = await fetchRazerpayKey();
        const { key } = keyRes.data;

        const amount = grandTotal; // in paise
        const res = await createRazorpayOrder({ amount });
        const razorpayOrder = res.data;

        const options = {
          key,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Bookify",
          description: "Book Order Payment",
          order_id: razorpayOrder.id,
          handler: async function (response) {
            try {
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyRes.data.success) {
                await placeRazorpayOrder({ order: orderData, paymentData: response });
                setModal({
                  show: true,
                  title: "Order Placed",
                  message: "Your order has been placed successfully via UPI!",
                  type: "success",
                  onConfirm: null,
                });
                setCartItems([]);
                navigate('/order');
              } else {
                setModal({
                  show: true,
                  title: "Payment Failed",
                  message: "Razorpay payment verification failed!",
                  type: "error",
                  onConfirm: null,
                });
              }
            } catch (err) {
              console.error('Payment verification failed:', err);
              setModal({
                show: true,
                title: "Payment Error",
                message: "An error occurred during payment verification.",
                type: "error",
                onConfirm: null,
              });
            }
          },
          prefill: { name: userName, contact: phoneNumber },
          theme: { color: "#0d6efd" }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
      else {
        // CASH mode
        await placeOrder(orderData);

        setModal({
          show: true,
          title: "Order Placed",
          message: "Your order has been placed successfully!",
          type: "success",
          onConfirm: null,
        });
        setCartItems([]);
        navigate('/order');
      }

    } catch (error) {
      console.error('Order placement failed:', error);
      setModal({
        show: true,
        title: "Error",
        message: "Failed to place order. Please try again.",
        type: "error",
        onConfirm: null,
      });
    }
  };


  return (
    <div className="container mt-4 px-2 px-sm-3 px-md-4 overflow-x-hidden">
      <h2 className="mb-4 text-center text-primary fw-bold">Your Cart</h2>
      <div className="d-flex flex-column flex-lg-row gap-4 align-items-stretch">

        {/* Order Summary */}
        <div className="order-summary"
          style={{
            minWidth: "100%",
            maxWidth: "100%",
          }}
        >
          <div className="card p-4 shadow-sm rounded"
            style={{ position: "sticky", top: "20px" }}
          >
            <h5 className="fw-bold text-secondary">Order Summary</h5>
            <hr />
            <p><strong>Items:</strong> {cartItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
            <p><strong>Total Price:</strong> ₹{totalPrice.toFixed(2)}</p>
            <p><strong>GST (5%):</strong> ₹{gst.toFixed(2)}</p>
            <hr />
            <p className="fw-bold"><strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}</p>
            <button className="btn btn-primary w-100 mt-3" onClick={handleOrderClick}>
              Place Order
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-grow-1 p-2" style={{ maxHeight: '80vh', overflow: 'hidden auto' }}>
          {cartItems.length === 0 ? (
            <p className="text-muted text-center mt-4">No items in cart.</p>
          ) : (
            <div className="row g-3">
              {cartItems.map(item => (
                <div key={item.id} className="col-12 col-md-6 col-lg-12 ">
                  <div className="card shadow-sm p-3 d-flex flex-column flex-sm-row align-items-center justify-content-between rounded">

                    <div className="d-flex align-items-center w-100 w-sm-auto mb-3 mb-sm-0">
                      <img
                        src={item.book.imageUrl}
                        alt={item.book.name}
                        className="rounded me-3"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        onError={e => e.target.src = '/placeholder.jpg'}
                      />
                      <div>
                        <h6 className="mb-1 fw-semibold">{item.book.name}</h6>
                        <small className="text-muted">Price: ₹{item.book.price}</small><br />
                        <small className="text-muted">Stock: {item.book.quantity}</small>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 mb-2 mb-sm-0">

                      <button className="btn btn-outline-secondary btn-sm" onClick={() => updateQuantity(item.id, -1)}>
                        -
                      </button>

                      <span className="fw-bold">{item.quantity}</span>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => updateQuantity(item.id, 1)}>
                        +
                      </button>

                    </div>

                    <button className="btn btn-outline-danger btn-sm mt-2 mt-sm-0" 
                      onClick={() => confirmRemove(item.id)}
                    >
                      <i className="bi bi-trash"></i> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Place Order Modal */}
      {showOrderForm && (
        <div className="modal-backdrop d-flex justify-content-center align-items-center">
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable w-100 mx-3">
            <div className="modal-content shadow-lg rounded p-3 p-md-4">
              <h4 className="text-center text-primary mb-4">Place Order</h4>

              <div className="mb-3">
                <label className="form-label">User Name</label>
                <input
                  type="text"
                  className={`form-control ${(!userName || userName.length < 3 || userName.length > 15) ? 'is-invalid' : ''}`}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                />
                {(!userName || userName.length < 3 || userName.length > 15) && (
                  <small className="text-danger">Username is required (3-15 characters)</small>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Address</label>
                <textarea
                  className={`form-control ${!address ? 'is-invalid' : ''}`}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your delivery address"
                  rows="3"
                />
                {!address && <small className="text-danger">Address is required</small>}
              </div>

              <div className="mb-3">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className={`form-control ${!phoneNumber || (phoneNumber && !/^\+?\d{10,15}$/.test(phoneNumber)) ? 'is-invalid' : ''}`}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                />
                {!phoneNumber && <small className="text-danger">Phone number is required</small>}
                {phoneNumber && !/^\+?\d{10,15}$/.test(phoneNumber) && (
                  <small className="text-danger">Enter valid phone number (e.g., +919876543210)</small>
                )}
              </div>

              <div className="mb-4">
                <label className="form-label">Order Mode</label>
                <select
                  className="form-select"
                  value={orderMode}
                  onChange={(e) => setOrderMode(e.target.value)}
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div className="d-flex justify-content-between flex-wrap gap-2">
                <button
                  className="btn btn-secondary w-100 w-sm-auto"
                  onClick={() => setShowOrderForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success w-100 w-sm-auto"
                  onClick={submitOrder}
                  disabled={!userName || !address || !phoneNumber || !/^\+?\d{10,15}$/.test(phoneNumber)}
                >
                  Submit Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        show={modal.show}
        onHide={() => {
          setModal({ ...modal, show: false });
          if (modal.title === "Order Placed") {
            setCartItems([]);
            navigate('/order');
          }
        }}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
      />

    </div>
  );
}

export default CartPage;
