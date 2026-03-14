import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../api";
import '../../src/style/All.css';

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const location = useLocation();
  const nav = useNavigate();

  // Extract token from query string
  const query = new URLSearchParams(location.search);
  const token = query.get("token");

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 8 || password.length > 15) {
      newErrors.password = "Password must be between 8 and 15 characters";
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMsg("");

    if (!token) {
      setMsg("Invalid or missing reset token");
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await resetPassword(token, password);

      setMsg(res.data || "Password reset successfully");

      setTimeout(() => nav("/login"), 2000);

    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to reset password");
    }
  };

  const handleReset = () => {
    setPassword("");
    setConfirmPassword("");
    setErrors({});
    setMsg("");
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ height: "90vh" }}
    >
      <div className="card shadow-lg p-4" style={{ width: "100%", maxWidth: 450 }}>

        <div className="text-center mb-4">
          <i className="bi bi-shield-lock text-primary" style={{ fontSize: 50 }}></i>
          <h3 className="fw-bold mt-2">Reset Password</h3>
          <p className="text-muted">Enter your new password</p>
        </div>

        {msg && <div className="alert alert-info">{msg}</div>}

        <form onSubmit={handleSubmit}>

          {/* Password */}
          <div className="mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control ${errors.password ? "is-invalid no-invalid-icon" : ""}`}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ backgroundImage: "none" }}
            />

            <span
              className={`position-absolute end-0 top-0 bottom-0 d-flex align-items-center pe-3 ${errors.password ? 'pb-4' : ''}`}
              role="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
            </span>

            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-3 position-relative">
            <input
              type={showConfirm ? "text" : "password"}
              className={`form-control ${errors.confirmPassword ? "is-invalid no-invalid-icon" : ""}`}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ backgroundImage: "none" }}
            />

            <span
              className={`position-absolute end-0 top-0 bottom-0 d-flex align-items-center pe-3 ${errors.confirmPassword ? 'pb-4' : ''}`}
              role="button"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              <i className={`bi ${showConfirm ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
            </span>

            {errors.confirmPassword && (
              <div className="invalid-feedback">{errors.confirmPassword}</div>
            )}
          </div>

          <button className="btn btn-primary w-100 mt-2 mb-2">
            Reset Password
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary w-100"
            onClick={handleReset}
          >
            Clear
          </button>

          <div className="text-center mt-3">
            <span className="text-muted">Remember your password? </span>
            <span
              role="button"
              className="text-primary fw-semibold"
              style={{ cursor: "pointer" }}
              onClick={() => nav("/login")}
            >
              Login
            </span>
          </div>

        </form>
      </div>
    </div>
  );
}
