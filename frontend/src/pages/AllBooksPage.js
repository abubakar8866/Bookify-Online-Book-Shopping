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
      const res = await getUserBooks(page, 8);
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
    <div className="container mt-4 mb-5" style={{maxWidth:"90vw"}}>
      <h3 className="mb-4 text-center fw-bold text-primary">Books</h3>

      {books.length === 0 ? (
        <p className="text-center text-muted">No books found.</p>
      ) : (
        <div className="row g-4">
          {books.map((b) => (
            <div key={b.id} className="col-sm-6 col-md-3">
              <div className="card h-100 shadow-sm border-0">
                {/* Image Section */}
                <div className="position-relative">
                  <img
                    src={b.imageUrl}
                    alt={b.name}
                    className="card-img-top"
                    style={{
                      height: "220px",
                      objectFit: "cover",
                      borderTopLeftRadius: "0.5rem",
                      borderTopRightRadius: "0.5rem",
                    }}
                  />
                  {/* Rating Badge */}
                  <span
                    className="badge bg-warning text-dark position-absolute top-0 end-0 m-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    ⭐ {b.averageRating ? b.averageRating.toFixed(1) : "N/A"}
                  </span>
                </div>

                {/* Card Body */}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-truncate">{b.name}</h5>

                  <p className="card-text mb-1">
                    💵 <strong>₹{b.price}</strong>
                  </p>

                  {b.author && (
                    <div className="d-flex align-items-center mt-2">
                      <img
                        src={b.author.imageUrl || "/placeholder.jpg"}
                        alt={b.author.name}
                        className="rounded-circle me-2"
                        style={{
                          width: "32px",
                          height: "32px",
                          objectFit: "cover",
                        }}
                      />
                      <small className="fw-semibold">{b.author.name}</small>
                    </div>
                  )}

                  {/* Spacer to push buttons to bottom */}
                  <div className="mt-auto pt-2">
                    <div className="d-flex justify-content-between gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                        onClick={() => setSelectedBook(b)}
                      >
                        <i className="bi bi-eye "></i>
                      </button>

                      <button
                        className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center"
                        onClick={() => handleAddToCart(b.id)}
                        disabled={!b.quantity || b.quantity < 1}
                      >
                        <i className="bi bi-cart-plus "></i>
                        
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
                        onClick={() => handleAddToWishlist(b.id)}
                      >
                        <i className="bi bi-heart "></i>
                      </button>
                    </div>
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
        <div className="modal show d-flex justify-content-center align-items-center" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg" style={{paddingBottom:"20px",paddingTop:"20px"}} >
            <div className="modal-content shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white rounded-3">
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
