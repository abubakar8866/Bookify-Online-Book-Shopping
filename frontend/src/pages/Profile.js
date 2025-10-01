import { useEffect, useState, useRef } from "react";
import {
  getProfile,
  updateProfile,
  fetchAllBooks,
  fetchAllAuthors,
} from "../api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import '../../src/style/All.css';

function Profile() {
  const userId = localStorage.getItem("userId");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    password: null,
    gender: "male",
    address: "",
    favouriteBook: "",
    favouriteAuthor: "",
    imageUrl: "",
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [touched, setTouched] = useState({});
  const fileInputRef = useRef();
  const dummyImage = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  useEffect(() => {
    if (userId) {
      Promise.all([getProfile(userId), fetchAllBooks(), fetchAllAuthors()])
        .then(([profileRes, booksRes, authorsRes]) => {
          const data = profileRes.data;
          setProfile({
            ...data,
            password: null,
            imageUrl: data.imageUrl || dummyImage,
          });
          setBooks(booksRes.data.sort((a, b) => a.localeCompare(b)));
          setAuthors(authorsRes.data.sort((a, b) => a.localeCompare(b)));
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setIsEdited(true);
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setProfile((prev) => ({ ...prev, imageUrl: reader.result }));
        setIsEdited(true);
        setTouched((prev) => ({ ...prev, imageUrl: true }));
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let errors = [];

    if (touched.name) {
      if (!profile.name) errors.push("Name is required");
      else if (profile.name.length < 3 || profile.name.length > 20)
        errors.push("Name must be between 3 and 20 characters");
    }

    if (touched.gender && !profile.gender) errors.push("Gender is required");

    if (touched.address) {
      if (!profile.address) errors.push("Address is required");
      else if (profile.address.length < 3 || profile.address.length > 50)
        errors.push("Address must be between 3 and 50 characters");
    }

    if (touched.favouriteBook && !profile.favouriteBook)
      errors.push("Favourite Book cannot be none");

    if (touched.favouriteAuthor && !profile.favouriteAuthor)
      errors.push("Favourite Author cannot be none");

    if (touched.password && profile.password) {
      if (profile.password.length < 7 || profile.password.length > 19)
        errors.push("Password must be between 7 and 19 characters");
    }

    if (errors.length > 0) {
      setMessage({ text: errors.join(". "), type: "danger" });
      return;
    }

    const dto = {
      name: profile.name,
      password: profile.password || null,
      gender: profile.gender,
      address: profile.address,
      favouriteBook: profile.favouriteBook,
      favouriteAuthor: profile.favouriteAuthor,
    };

    updateProfile(userId, dto, file)
      .then((res) => {
        setProfile({
          ...res.data,
          password: null,
          imageUrl: res.data.imageUrl || dummyImage,
        });
        setMessage({ text: "Profile updated successfully", type: "success" });
        setIsEdited(false);
        setTouched({});

        if (dto.password) {
          setTimeout(() => {
            localStorage.clear();
            window.location.href = "/login";
          }, 1000);
        }
      })
      .catch((err) => {
        console.error(err);
        setMessage({ text: "Failed to update profile", type: "danger" });
      });
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "95vh" }}>
      <div
        className="card shadow-lg p-4 rounded-4"
        style={{ maxWidth: "900px", margin: "auto" }}
      >
        <h2 className="mb-3 fw-bold text-center">My Profile</h2>

        <div
          style={{ minHeight: "40px" }}
          className={message.text ? `alert alert-${message.type} text-center` : ""}
        >
          {message.text}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Left Column: Profile Image */}
            <div className="col-md-4 d-flex flex-column align-items-center">
              <div className="position-relative mb-3">
                <img
                  src={
                    profile.imageUrl &&
                    profile.imageUrl.startsWith("http://localhost:8080")
                      ? `${profile.imageUrl}`
                      : profile.imageUrl || dummyImage
                  }
                  alt="profile"
                  className="rounded-circle border"
                  style={{ width: "150px", height: "150px", objectFit: "cover" }}
                />
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center rounded-circle"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.4)",
                    color: "#fff",
                    opacity: 0,
                    transition: "0.3s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                  onClick={() => fileInputRef.current.click()}
                >
                  <i className="bi bi-pencil"></i>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </div>
            </div>

            {/* Right Column: Form Fields */}
            <div className="col-md-8">
              <div className="row g-3">
                {/* Name */}
                <div className="col-md-6">
                  <label className="form-label">Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <label className="form-label">Email (cannot edit):</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className="form-control"
                  />
                </div>

                {/* Password */}
                <div className="col-md-6">
                  <label className="form-label">Password:</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={profile.password || ""}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i
                        className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}
                      ></i>
                    </button>
                  </div>
                </div>

                {/* Gender */}
                <div className="col-md-6">
                  <label className="form-label d-block">Gender:</label>
                  <div className="form-check form-check-inline">
                    <input
                      type="radio"
                      id="male"
                      name="gender"
                      value="male"
                      checked={profile.gender === "male"}
                      onChange={handleChange}
                      className="form-check-input"
                    />
                    <label htmlFor="male" className="form-check-label">
                      Male
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      type="radio"
                      id="female"
                      name="gender"
                      value="female"
                      checked={profile.gender === "female"}
                      onChange={handleChange}
                      className="form-check-input"
                    />
                    <label htmlFor="female" className="form-check-label">
                      Female
                    </label>
                  </div>
                </div>

                {/* Address */}
                <div className="col-md-12">
                  <label className="form-label">Address:</label>
                  <input
                    type="text"
                    name="address"
                    value={profile.address || ""}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>

                {/* Favourite Book */}
                <div className="col-md-6">
                  <label className="form-label">Favourite Book:</label>
                  <select
                    name="favouriteBook"
                    value={profile.favouriteBook || ""}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">-- None --</option>
                    {books.map((book, idx) => (
                      <option key={idx} value={book}>
                        {book}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Favourite Author */}
                <div className="col-md-6">
                  <label className="form-label">Favourite Author:</label>
                  <select
                    name="favouriteAuthor"
                    value={profile.favouriteAuthor || ""}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">-- None --</option>
                    {authors.map((author, idx) => (
                      <option key={idx} value={author}>
                        {author}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center mt-4">
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  disabled={!isEdited}
                >
                  <i className="bi bi-save me-2"></i>
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
