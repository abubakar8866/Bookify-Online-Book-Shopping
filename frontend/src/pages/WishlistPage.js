import { useEffect, useState } from 'react';
import { getWishlist, removeFromWishlist } from '../api';
import { useNavigate } from 'react-router-dom';
import '../../src/style/Wishlist.css';
import AlertModal from '../components/AlertModal';
import '../../src/style/All.css';

function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info" });
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    getWishlist(userId)
      .then(response => {
        setWishlistItems(response.data);
      })
      .catch(error => {
        console.error(error);
        handleError(error, "No books in wishlist.");
      });
  }, [userId, navigate]);

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

  const handleRemove = (wishlistId) => {
    setModal({
      show: true,
      title: "Confirm Remove",
      message: "Are you sure you want to remove this item from your wishlist?",
      type: "warning",
      onConfirm: () => {
        removeFromWishlist(userId, wishlistId)
        .then(() => {
          setWishlistItems(wishlistItems.filter(item => item.id !== wishlistId));
          setModal({
            show: true,
            title: "Removed",
            message: "Item removed from your wishlist.",
            type: "success",
            onConfirm: null,
          });
        })
        .catch(error => {
          console.error('Failed to remove from wishlist:', error);
          handleError(error, "Could not remove item from wishlist.");
        });
      },
    });
  };

  return (
    <div className="container mt-4" style={{overflowX:'hidden'}}>
      <h2 className="mb-4 text-primary fw-bold">Your Wishlist</h2>

      {wishlistItems.length === 0 ? (
        <p className="text-muted text-center">No items in wishlist.</p>
      ) : (
        <div style={{ maxHeight: '80vh', overflowY: 'auto' }} className="row g-3">
          {wishlistItems.map(item => (
            <div key={item.id} className="col-md-6 col-lg-4">
              <div className="card shadow-sm h-100 hover-shadow border-1 d-flex p-2" style={{flexDirection:'column'}}>
                <div className="d-flex align-items-center justify-content-center p-3">
                  <img
                    src={item.book.imageUrl}
                    alt={item.book.name}
                    className="rounded me-3"
                    style={{ width: '60px', height: '60px', objectFit: 'cover', flexShrink: 0 }}
                    onError={e => e.target.src = '/placeholder.jpg'}
                  />
                  <div className="flex-grow-1">
                    <h6 className="mb-1 fw-semibold" style={{wordBreak:'break-all'}}>{item.book.name}</h6>
                    <p className="mb-0 text-muted">₹{item.book.price}</p>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-0 d-flex justify-content-end align-items-center">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemove(item.id)}
                  >
                    <i className="bi bi-trash me-1"></i> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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

export default WishlistPage;
