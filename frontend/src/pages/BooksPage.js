import { useEffect, useState } from "react";
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getAuthorNames,
} from "../api";
import { useDropzone } from "react-dropzone";
import '../../src/style/ReviewsStyle.css';
import ReactStars from 'react-stars';
import AlertModal from '../components/AlertModal';
import '../../src/style/DescriptionScroll.css';
import '../../src/style/All.css';

export default function AllBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    authorId: "",
    price: "",
    quantity: 5,
    file: null,
    preview: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadBooks(page);
    fetchAuthors();
  }, [page]);

  const loadBooks = async (pageNumber) => {
    try {
      const res = await getBooks(pageNumber, 8);
      setBooks(res.data.content);
      setTotalPages(res.data.totalPages);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch books", err);
      setLoading(false);
      setAlert({
        show: true,
        title: "Error",
        message: "Failed to fetch books.",
        type: "error",
      });
    }
  };

  const fetchAuthors = async () => {
    try {
      const data = await getAuthorNames();
      setAuthors(data);
    } catch (err) {
      console.error("Failed to fetch authors", err);
      setAlert({
        show: true,
        title: "Error",
        message: "Failed to fetch authors.",
        type: "error",
      });
    }
  };

  const handleOpenModal = (book = null) => {
    setErrors({});
    setEditing(book);

    if (book) {
      setForm({
        name: book.name || "",
        description: book.description || "",
        authorId: book.author?.id || "",
        price: book.price || "",
        quantity: book.quantity || 5,
        file: null,
        preview: book.imageUrl || "",
      });
    } else {
      setForm({
        name: "",
        description: "",
        authorId: "",
        price: "",
        quantity: 5,
        file: null,
        preview: null,
      });
    }


    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name || form.name.length < 3 || form.name.length > 20) {
      newErrors.name = "Name must be 3–20 characters.";
    }
    if (!form.description || form.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters.";
    }
    if (!form.authorId) {
      newErrors.authorId = "Author is required.";
    }
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) {
      newErrors.price = "Price must be a number greater than 0.";
    }
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) < 1) {
      newErrors.quantity = "Quantity must be at least 1.";
    }
    if (!form.preview && !form.file) {
      newErrors.file = "File is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dto = {
      name: form.name,
      description: form.description,
      authorId: Number(form.authorId),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };

    try {
      if (editing) {
        // Update existing book
        await updateBook(editing.id, dto, form.file);
        setAlert({
          show: true,
          title: "Success",
          message: "Book updated successfully!",
          type: "success",
        });
      } else {
        // Create new book
        await createBook(dto, form.file);
        setAlert({
          show: true,
          title: "Success",
          message: "Book created successfully!",
          type: "success",
        });
      }

      // Close modal and reload books
      setModalOpen(false);
      loadBooks(page);

      // Reset form
      setForm({
        name: "",
        description: "",
        authorId: "",
        price: "",
        quantity: 5,
        file: null,
        preview: null,
      });
      setEditing(null);
      setErrors({});
    } catch (err) {
      console.error("Error saving book", err);
      setAlert({
        show: true,
        title: "Error",
        message: "Failed to save book.",
        type: "error",
      });
    }
  };

  const handleDelete = (id) => {
    setAlert({
      show: true,
      title: "Confirm Delete",
      message: "Are you sure you want to delete this book?",
      type: "warning",
      onConfirm: async () => {
        try {
          await deleteBook(id);
          setAlert({
            show: true,
            title: "Deleted",
            message: "Book deleted successfully!",
            type: "success",
          });

          const res = await getBooks(page, 6);
          if (res.data.content.length === 0 && page > 0) {
            setPage(page - 1);
          } else {
            setBooks(res.data.content);
            setTotalPages(res.data.totalPages);
          }
        } catch (err) {
          console.error("Error deleting book", err);
          setAlert({
            show: true,
            title: "Error",
            message: "Failed to delete book.",
            type: "error",
          });
        }
      },
    });
  };


  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setForm((prev) => ({
        ...prev,
        file,
        preview: URL.createObjectURL(file),
      }));
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop,
  });

  if (loading) return <p>Loading all books...</p>;

  return (
    <div className="container mt-3 mb-2" style={{ maxWidth: "90vw" }}>
      <div className="d-flex justify-content-between mb-3 align-items-center">
        <h2 className="fw-bold text-primary">Books</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          Add
        </button>
      </div>

      {books.length === 0 ? (
        <p className="text-center text-muted">No books found.</p>
      ) : (
        <>
          <div className="row g-4">
            {books.map((book) => (
              <div key={book.id} className="col-sm-6 col-md-3">
                <div className="card h-100 shadow-sm border-0">
                  {/* Image Section */}
                  <div className="position-relative">
                    <img
                      src={book.imageUrl}
                      alt={book.name}
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
                      ⭐ {book.averageRating ? book.averageRating.toFixed(1) : "N/A"}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title text-truncate">{book.name}</h5>

                    <p className="card-text mb-1">
                      💵 <strong>₹{book.price}</strong>
                    </p>

                    {book.author && (
                      <div className="d-flex align-items-center mt-2">
                        <img
                          src={book.author.imageUrl || "/placeholder.jpg"}
                          alt={book.author.name}
                          className="rounded-circle me-2"
                          style={{
                            width: "32px",
                            height: "32px",
                            objectFit: "cover",
                          }}
                        />
                        <small className="fw-semibold">{book.author.name}</small>
                      </div>
                    )}

                    {/* Spacer to push buttons to bottom */}
                    <div className="mt-auto pt-2">
                      <div className="d-flex justify-content-between gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                          onClick={() => handleOpenModal(book)}
                        >
                          <i className="bi bi-pencil "></i>
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
                          onClick={() => handleDelete(book.id)}
                        >
                          <i className="bi bi-trash "></i>

                        </button>

                        <button
                          className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center"
                          onClick={() => setSelectedBook(book)}
                        >
                          <i className="bi bi-eye "></i>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal for Book Details */}
          {selectedBook && (
            <div className="modal show d-flex justify-content-center align-items-center" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-lg" style={{ paddingBottom: "20px", paddingTop: "20px" }} >
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
                      <div className="col-md-6 mt-3">
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



          {/* Pagination */}
          {totalPages > 1 && (
            <nav style={{ paddingTop: '10px' }}>
              <ul className="pagination justify-content-center align-items-center flex-wrap gap-1"
                style={{
                  flexWrap: "wrap",
                  rowGap: "0.5rem",
                  columnGap: "0.3rem",
                }}
              >
                <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
                  <button className="page-link px-3 py-2 text-nowrap rounded-3" onClick={() => setPage(0)}>
                    First
                  </button>
                </li>
                <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
                  <button
                    className="page-link px-3 py-2 text-nowrap rounded-3"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  >
                    Previous
                  </button>
                </li>
                {/* Window of page numbers */}
                {(() => {
                  const pages = [];
                  const windowSize = 5; // show 5 pages max
                  let start = Math.max(0, page - Math.floor(windowSize / 2));
                  let end = Math.min(totalPages, start + windowSize);

                  if (end - start < windowSize) {
                    start = Math.max(0, end - windowSize);
                  }

                  for (let i = start; i < end; i++) {
                    pages.push(
                      <li key={i} className={`page-item ${page === i ? "active" : ""}`}>
                        <button className="page-link px-3 py-2 rounded-5" onClick={() => setPage(i)}>
                          {i + 1}
                        </button>
                      </li>
                    );
                  }
                  return pages;
                })()}

                <li
                  className={`page-item ${page === totalPages - 1 ? "disabled" : ""
                    }`}
                >
                  <button
                    className="page-link px-3 py-2 text-nowrap rounded-3"
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages - 1))
                    }
                  >
                    Next
                  </button>
                </li>
                <li
                  className={`page-item ${page === totalPages - 1 ? "disabled" : ""
                    }`}
                >
                  <button
                    className="page-link px-3 py-2 text-nowrap rounded-3"
                    onClick={() => setPage(totalPages - 1)}
                  >
                    Last
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal d-flex justify-content-center align-items-center" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} >
          <div className="modal-dialog modal-lg" role="document" style={{ paddingBottom: "20px", paddingTop: "20px" }}>
            <div className="modal-content shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white rounded-3">
                <h5 className="modal-title">
                  {editing ? "Edit" : "Add"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit} noValidate>
                  {/* Name */}
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? "is-invalid" : ""
                        }`}
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className={`form-control ${errors.description ? "is-invalid" : ""
                        }`}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                    {errors.description && (
                      <div className="invalid-feedback">{errors.description}</div>
                    )}
                  </div>

                  {/* Author */}
                  <div className="mb-3">
                    <label className="form-label">Author</label>
                    <select
                      className={`form-select ${errors.authorId ? "is-invalid" : ""
                        }`}
                      value={form.authorId}
                      onChange={(e) =>
                        setForm({ ...form, authorId: Number(e.target.value) })
                      }
                    >
                      <option value="">-- Select Author --</option>
                      {authors.map((author) => (
                        <option key={author.id} value={author.id}>
                          {author.name}
                        </option>
                      ))}
                    </select>
                    {errors.authorId && (
                      <div className="invalid-feedback">{errors.authorId}</div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`form-control ${errors.price ? "is-invalid" : ""}`}
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                    {errors.price && (
                      <div className="invalid-feedback">{errors.price}</div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="mb-3">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className={`form-control ${errors.quantity ? "is-invalid" : ""}`}
                      value={form.quantity}
                      onChange={(e) =>
                        setForm({ ...form, quantity: e.target.value })
                      }
                    />
                    {errors.quantity && (
                      <div className="invalid-feedback">{errors.quantity}</div>
                    )}
                  </div>

                  {/* File Upload */}
                  <div className="mb-3">
                    <label className="form-label">Upload Image</label>
                    <div
                      {...getRootProps()}
                      className={`border p-4 text-center rounded ${errors.file ? "border-danger" : "border-secondary"
                        }`}
                      style={{ cursor: "pointer" }}
                    >
                      <input {...getInputProps()} />
                      <p>Drag & drop or click to upload</p>
                    </div>
                    {form.preview && (
                      <div className="mt-2">
                        <img
                          src={form.preview}
                          alt="Preview"
                          style={{ width: "120px", height: "120px", objectFit: "cover" }}
                        />
                      </div>
                    )}
                    {errors.file && (
                      <div className="text-danger mt-1">{errors.file}</div>
                    )}
                  </div>

                  <div className="modal-footer d-flex justify-content-center align-items-center flex-wrap gap-1">
                    <button type="submit" className="btn btn-success w-100">
                      {editing ? "Update" : "Create"}
                    </button>
                    <button className="btn btn-secondary w-100" onClick={() => setModalOpen(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Alert Modal */}
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
