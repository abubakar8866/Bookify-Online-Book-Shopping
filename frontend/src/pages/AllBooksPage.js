import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserBooks, addToWishlist, addToCart } from '../api';
import '../../src/style/ReviewsStyle.css';
import ReactStars from 'react-stars';
import AlertModal from '../components/AlertModal';
import '../../src/style/DescriptionScroll.css';
import '../../src/style/All.css';

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedBook, setSelectedBook] = useState(null); // for modal
  const [alertModal, setAlertModal] = useState({ show: false, title: "", message: "", type: "info" });
  const nav = useNavigate();

  useEffect(() => {
    fetchBooks(page);
  }, [page]);

  async function fetchBooks(page = 0) {
    try {
      const res = await getUserBooks(page, 6);
      const data = res.data;
      const booksData = data.content || data;
      const booksWithImage = booksData.map(b => ({
        ...b,
        imageUrl: b.imageUrl || '/placeholder.jpg'
      }));
      setBooks(booksWithImage);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      if (e.response?.status === 401) nav('/login');
      console.error("Failed to fetch books", e);
    }
  }

  const showAlert = (title, message, type = "info") => {
    setAlertModal({ show: true, title, message, type });
  };

  const handleAddToCart = async (bookId) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        nav("/login");
        return;
      }
      const res = await addToCart(userId, bookId);
      showAlert("Cart Updated", `"${res.data.book.name}" added to cart!`, "success");
    } catch (err) {
      console.error("Failed to add to cart:", err);
      if (err.response && err.response.status === 409) {
        showAlert("Already in Cart", "This book is already in your cart.", "warning");
      } else {
        showAlert("Error", "Could not add to cart. Please try again.", "error");
      }
    }
  };

  const handleAddToWishlist = async (bookId) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        nav("/login");
        return;
      }
      const res = await addToWishlist(userId, bookId);
      showAlert("Wishlist Updated", `"${res.data.book.name}" added to wishlist!`, "success");
    } catch (err) {
      console.error("Failed to add to wishlist:", err);
      if (err.response && err.response.status === 409) {
        showAlert("Already in Wishlist", "This book is already in your wishlist.", "warning");
      } else {
        showAlert("Error", "Could not add to wishlist. Please try again.", "error");
      }
    }
  };


  const renderPagination = () => {
    const pages = [];
    const windowSize = 5;
    let start = Math.max(0, page - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize);

    if (end - start < windowSize) start = Math.max(0, end - windowSize);

    for (let i = start; i < end; i++) {
      pages.push(
        <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => setPage(i)}>{i + 1}</button>
        </li>
      );
    }

    return (
      <nav className="mt-4">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(0)}>First</button>
          </li>
          <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(Math.max(0, page - 1))}>Previous</button>
          </li>
          {pages}
          <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(Math.min(totalPages - 1, page + 1))}>Next</button>
          </li>
          <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(totalPages - 1)}>Last</button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="container mt-4 mb-5">
      <h3 className="mb-4 text-center fw-bold text-primary">Books</h3>

      {books.length === 0 ? (
        <p className="text-center text-muted">No books found.</p>
      ) : (
        <div className="row">
          {books.map(b => (
            <div key={b.id} className="col-md-4 mb-3">
              <div className="card shadow-sm p-3">
                {/* Top: Image + Main Info */}
                <div className="d-flex">
                  <div style={{ flex: '0 0 150px' }}>
                    <img
                      src={b.imageUrl}
                      alt={b.name}
                      className="img-fluid rounded"
                      style={{ objectFit: 'cover', width: '100%', height: '150px' }}
                    />
                  </div>
                  <div className="ms-3 flex-grow-1 d-flex flex-column justify-content-center">
                    <h5 className="card-title mb-1">{b.name}</h5>
                    <p className="mb-1">💵 ₹{b.price}</p>
                    <p className="mb-1">📦 {b.quantity} in stock</p>
                    <p className="mb-1">⭐ {b.averageRating ? b.averageRating.toFixed(1) : 'N/A'} / 5</p>
                    {b.author && (
                      <div className="d-flex align-items-center mt-1">
                        <img
                          src={b.author.imageUrl || '/placeholder.jpg'}
                          alt={b.author.name}
                          style={{ width: '35px', height: '35px', borderRadius: '50%', marginRight: '10px', objectFit: 'cover' }}
                        />
                        <strong>{b.author.name}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom: Buttons */}
                <div className="mt-0 pt-2">

                  <div className="d-flex justify-content-between mt-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedBook(b)} // open modal
                    >
                      View Details
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleAddToCart(b.id)}
                      disabled={!b.quantity || b.quantity < 1}
                    >
                      {b.quantity < 1 ? "Out of Stock" : "Add to Cart"}
                    </button>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleAddToWishlist(b.id)}
                    >
                      Wishlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && renderPagination()}

      {/* Modal for Book Details */}
      {selectedBook && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg ">
            <div className="modal-content shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{selectedBook.name}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedBook(null)}
                ></button>
              </div>

              <div className="modal-body">
                {/* Top Section: Image Left, Info Right */}
                <div className="row mb-0">
                  <div className="col-md-6">
                    <img
                      src={selectedBook.imageUrl}
                      alt={selectedBook.name}
                      className="img-fluid rounded"
                      style={{ width: '100%', height: '250px' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <p><strong>Price:</strong> ₹{selectedBook.price}</p>
                    <p><strong>Quantity:</strong> {selectedBook.quantity}</p>
                    <p><strong>Author:</strong> {selectedBook.author?.name}</p>

                    {/* Scrollable description */}
                    <p
                      className="card-text custom-scroll"
                      style={{
                        maxHeight: "45px",
                        overflowY: "auto",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {selectedBook.description}
                    </p>

                    <p><strong>Rating:</strong> {selectedBook.averageRating?.toFixed(1) || 'N/A'} / 5</p>
                    <p><small className="text-muted">📅 Published: {selectedBook.createdAt ? new Date(selectedBook.createdAt).toLocaleString() : 'N/A'}</small></p>
                    <p><small className="text-muted">🔄 Updated: {selectedBook.updatedAt ? new Date(selectedBook.updatedAt).toLocaleString() : 'N/A'}</small></p>
                  </div>
                </div>

                {/* Bottom Section: Reviews */}
                {selectedBook.reviews && selectedBook.reviews.length > 0 && (
                  <div>
                    <strong>Reviews:</strong>
                    <ul className="review-list">
                      {selectedBook.reviews
                        .slice()
                        .reverse()
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // latest first
                        .map((r, i) => (
                          <li key={i} className="review-item" style={{ marginBottom: '15px' }}>
                            {/* Star rating */}
                            <ReactStars
                              count={5}
                              value={r.rating || 0}
                              size={20}
                              isHalf={true}
                              edit={false} // read-only
                              activeColor="#f39c12"
                            />
                            {/* Comment */}
                            <p style={{ margin: '5px 0 0 0' }}>{r.comment || "No comment"}</p>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal for actions */}
      <AlertModal
        show={alertModal.show}
        onHide={() => setAlertModal({ ...alertModal, show: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

    </div>
  );
}
