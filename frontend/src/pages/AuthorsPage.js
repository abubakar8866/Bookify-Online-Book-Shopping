import React, { useEffect, useState } from "react";
import {
  getAuthors,
  createAuthor,
  updateAuthor,
  deleteAuthor
} from "../api";
import { useDropzone } from "react-dropzone";
import AlertModal from '../components/AlertModal';
import '../../src/style/DescriptionScroll.css';
import '../../src/style/All.css';

export default function AuthorsPage() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [form, setForm] = useState(initialFormState());
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null
  });

  const pageSize = 3;
  const languageOptions = ["Java", "Python", "JavaScript", "C++", "Go"];

  function initialFormState() {
    return {
      name: "",
      description: "",
      gender: "",
      programmingLanguages: [],
      imageFile: null
    };
  }

  useEffect(() => {
    fetchAuthors(page);
  }, [page]);

  async function fetchAuthors(pageNumber = 0) {
    setLoading(true);
    try {
      const res = await getAuthors(pageNumber, pageSize);
      setAuthors(res.data.content || []);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching authors:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(author = null) {
    setErrors({});
    if (author) {
      setEditingAuthor(author);
      setForm({
        name: author.name,
        description: author.description,
        gender: author.gender || "",
        programmingLanguages: author.programmingLanguages || [],
        imageFile: null
      });
      setPreviewUrl(author.imageUrl);
    } else {
      setEditingAuthor(null);
      setForm(initialFormState());
      setPreviewUrl(null);
    }
    setModalOpen(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  }

  function toggleLanguage(lang) {
    setForm(prev => {
      const exists = prev.programmingLanguages.includes(lang);
      return {
        ...prev,
        programmingLanguages: exists
          ? prev.programmingLanguages.filter(l => l !== lang)
          : [...prev.programmingLanguages, lang]
      };
    });
    setErrors(prev => ({ ...prev, programmingLanguages: null }));
  }

  function handleFileDrop(acceptedFiles) {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setForm(prev => ({ ...prev, imageFile: file }));
      setPreviewUrl(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, imageFile: null }));
    }
  }

  function validateForm() {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.length < 2 || form.name.length > 50) {
      newErrors.name = "Name must be between 2 and 50 characters";
    }
    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.length < 10 || form.description.length > 500) {
      newErrors.description = "Description must be between 10 and 500 characters";
    }
    if (!form.gender) {
      newErrors.gender = "Please select a gender";
    }
    if (form.programmingLanguages.length === 0) {
      newErrors.programmingLanguages = "Please select at least one language";
    }
    if (!editingAuthor && !form.imageFile) {
      newErrors.imageFile = "Please upload an image";
    }
    return newErrors;
  }

  async function handleSave() {
    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    try {
      setErrors({});
      const formData = new FormData();
      const jsonValue = JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim(),
        gender: form.gender,
        programmingLanguages: form.programmingLanguages
      });
      formData.append("value", new Blob([jsonValue], { type: "application/json" }));
      if (form.imageFile) {
        formData.append("file", form.imageFile);
      }
      if (editingAuthor) {
        await updateAuthor(editingAuthor.id, formData);
      } else {
        await createAuthor(formData);
      }
      await fetchAuthors(page);

      setAlertConfig({
        show: true,
        title: "Success",
        message: editingAuthor ? "Author updated successfully!" : "Author created successfully!",
        type: "success"
      });

      setModalOpen(false);
      setForm(initialFormState());
      setPreviewUrl(null);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const data = err.response.data;
        if (data.errors) {
          const fieldErrors = {};
          data.errors.forEach(e => {
            fieldErrors[e.field] = e.defaultMessage;
          });
          setErrors(fieldErrors);
        } else if (typeof data === "string") {
          setErrors({ global: data });
        }
      } else {
        console.error("Error saving author:", err);
        setAlertConfig({
          show: true,
          title: "Error",
          message: "Failed to save author.",
          type: "error"
        });
      }
    }
  }

  const handleDelete = (id) => {
    setAlertConfig({
      show: true,
      title: "Confirm Delete",
      message: "Are you sure you want to delete this Author?",
      type: "warning",
      onConfirm: async () => {
        try {
          await deleteAuthor(id);
          setAlertConfig({
            show: true,
            title: "Deleted",
            message: "Author deleted successfully!",
            type: "success"
          });

          // Reload authors
          const res = await getAuthors(page, 4);
          if (res.data.content.length === 0 && page > 0) {
            setPage(page - 1);
          } else {
            setAuthors(res.data.content);
            setTotalPages(res.data.totalPages);
          }
        } catch (err) {
          console.error("Error deleting author", err);
          setAlertConfig({
            show: true,
            title: "Error",
            message: "Failed to delete author.",
            type: "error"
          });
        }
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: { "image/*": [] }
  });

  return (
    <div className="container mt-4 mb-0">
      {/* Header */}
      <div className="d-flex justify-content-between mb-2 mt-2 align-items-center">
        <h3 className="fw-bold text-primary">Authors</h3>
        <div>
          <button className="btn btn-primary shadow-sm rounded" onClick={() => handleOpenModal()}>
            Add
          </button>
        </div>
      </div>

      {/* Author List */}
      {authors.length === 0 ? (
        <p className="text-center text-muted">No Authors found...</p>
      ) : (
        <>
          <div className="row g-4">
            {authors.map(author => (
              <div key={author.id} className="col-sm-12 col-md-4 mb-0">
                <div className="card h-100 shadow-sm">
                  <img
                    src={author.imageUrl}
                    alt={author.name}
                    className="card-img-top"
                    style={{ height: "270px", objectFit: "fill", backgroundColor: "#f0f0f0" }}
                    onError={e => (e.target.src = "/default-avatar.png")}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{author.name}</h5>

                    {/* Scrollable description */}
                    <p
                      className="card-text custom-scroll"
                      style={{
                        maxHeight: "45px",
                        overflowY: "auto",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {author.description}
                    </p>

                    <p className="mb-1"><strong>Gender:</strong> {author.gender || "N/A"}</p>
                    {author.programmingLanguages?.length > 0 && (
                      <p className="mb-1">
                        <strong>Programming:</strong> {author.programmingLanguages.join(", ")}
                      </p>
                    )}
                    <p className="mb-1"><strong>Books:</strong> {author.bookCount}</p>
                  </div>

                  <div className="card-footer d-flex justify-content-between">
                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal(author)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(author.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination (only show if more than one page exists) */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">

                {/* First */}
                <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(0)}>
                    First
                  </button>
                </li>

                {/* Previous */}
                <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                </li>

                {/* Sliding Window */}
                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter(i => {
                    // Show first page, last page, current ±2 window
                    return (
                      i === 0 ||
                      i === totalPages - 1 ||
                      (i >= page - 2 && i <= page + 2)
                    );
                  })
                  .map((i, idx, arr) => (
                    <React.Fragment key={i}>
                      {/* Dots if there's a gap */}
                      {idx > 0 && arr[idx] - arr[idx - 1] > 1 && (
                        <li className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      )}
                      <li
                        className={`page-item ${i === page ? "active" : ""}`}
                      >
                        <button className="page-link" onClick={() => setPage(i)}>
                          {i + 1}
                        </button>
                      </li>
                    </React.Fragment>
                  ))}

                {/* Next */}
                <li
                  className={`page-item ${page === totalPages - 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </li>

                {/* Last */}
                <li className={`page-item ${page === totalPages - 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(totalPages - 1)}>
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
        <div className="modal fade show d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg" style={{paddingBottom:"20px",paddingTop:"20px"}}>
            <div className="modal-content shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white rounded-3">
                <h5 className="modal-title">{editingAuthor ? "Edit Author" : "Add Author"}</h5>
                <button className="btn-close btn-close-white" onClick={() => setModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                {errors.global && <div className="alert alert-danger">{errors.global}</div>}

                {/* Form Fields */}
                <div className="mb-2">
                  <label>Name</label>
                  <input
                    name="name"
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>
                <div className="mb-2">
                  <label>Description</label>
                  <textarea
                    name="description"
                    className={`form-control ${errors.description ? "is-invalid" : ""}`}
                    value={form.description}
                    onChange={handleChange}
                    rows="1"
                  />
                  {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                </div>
                <div className="mb-2">
                  <label className="d-block mb-1"><strong>Gender</strong></label>
                  {["Male", "Female", "Other"].map(g => (
                    <div className="form-check form-check-inline" key={g}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="gender"
                        value={g}
                        checked={form.gender === g}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">{g}</label>
                    </div>
                  ))}
                  {errors.gender && <div className="text-danger small">{errors.gender}</div>}
                </div>
                <div className="mb-2">
                  <label>Programming Languages</label>
                  <div className="d-flex flex-wrap">
                    {languageOptions.map(lang => (
                      <div key={lang} className="form-check me-3">
                        <input
                          type="checkbox"
                          id={lang}
                          className="form-check-input"
                          checked={form.programmingLanguages.includes(lang)}
                          onChange={() => toggleLanguage(lang)}
                        />
                        <label htmlFor={lang} className="form-check-label">{lang}</label>
                      </div>
                    ))}
                  </div>
                  {errors.programmingLanguages && <div className="text-danger small">{errors.programmingLanguages}</div>}
                </div>
                <div className="mb-2">
                  <label>Image</label>
                  <div {...getRootProps()} className={`border p-3 text-center rounded ${isDragActive ? "bg-light" : ""}`} style={{ cursor: "pointer" }}>
                    <input {...getInputProps()} />
                    {isDragActive ? "Drop the image here..." : "Drag & drop an image here, or click to select"}
                  </div>
                  {errors.imageFile && <div className="text-danger small">{errors.imageFile}</div>}
                  {previewUrl && (
                    <div className="mt-2">
                      <img src={previewUrl} alt="Preview" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "5px" }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ AlertModal */}
      <AlertModal
        show={alertConfig.show}
        onHide={() => setAlertConfig(prev => ({ ...prev, show: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
      />

    </div>
  );
}
