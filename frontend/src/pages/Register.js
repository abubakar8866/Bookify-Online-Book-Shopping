import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import '../../src/style/Register.css';

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const nav = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    else if (name.length <= 2 || name.length > 20)
      newErrors.name = "Name must be between 3 and 20 characters";

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email format";

    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    return newErrors;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErrors({});
    const frontendErrors = validate();
    if (Object.keys(frontendErrors).length > 0) {
      setErrors(frontendErrors);
      return;
    }
    try {
      await API.post("/auth/register", { name, email, password });
      setMsg("Registered. Please login.");
      setTimeout(() => nav("/login"), 1000);
    } catch (err) {
      if (err.response?.data?.errors) {
        const backendErrors = {};
        err.response.data.errors.forEach((error) => {
          backendErrors[error.field] = error.defaultMessage;
        });
        setErrors(backendErrors);
      } else if (err.response?.data) {
        setMsg(err.response.data);
      } else {
        setMsg("Something went wrong.");
      }
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center reg" style={{height:"90vh"}}>
      <div className="card shadow-lg p-4" style={{ width: "100%", maxWidth: 450 }}>
        <div className="text-center mb-4">
          <i className="bi bi-person-plus-fill text-success" style={{ fontSize: 50 }}></i>
          <h3 className="fw-bold mt-2">Create Account</h3>
          <p className="text-muted">Register to get started</p>
        </div>

        {msg && <div className="alert alert-info">{msg}</div>}

        <form onSubmit={submit}>
          {/* Name */}
          <div className="mb-3 position-relative">
            <input
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          {/* Email */}
          <div className="mb-3 position-relative">
            <input
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          {/* Password */}
          <div className="mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control pe-5 ${errors.password ? "is-invalid no-invalid-icon" : ""
                }`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ backgroundImage: "none" }}
            />
            <span
              className={`position-absolute end-0 top-0 bottom-0 d-flex align-items-center pe-3 ${errors.password ? 'pb-4' : 'pb-0'}`}
              role="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
            </span>
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>

          <button className="btn btn-success mt-2 w-100">Register</button>
          <button
            type="button"
            className="btn btn-outline-secondary mt-2 w-100"
            onClick={() => {
              setName("");
              setEmail("");
              setPassword("");
              setErrors({});
              setMsg("");
            }}
          >
            Reset
          </button>
        </form>
      </div>
    </div>
  );
}
