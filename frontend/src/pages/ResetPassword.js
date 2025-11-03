import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {resetPassword} from "../api";
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
    } else if (password.length < 6 || password.length > 20) {
      newErrors.password = "Password must be between 6 and 20 characters";
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

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await resetPassword(token,password);
      setMsg(res.data);
      setTimeout(() => nav("/login"), 2000);
    } catch (err) {
      setMsg(err.response?.data || "Failed to reset password");
    }

  };

  const handleReset = () => {
    setPassword("");
    setConfirmPassword("");
    setErrors({});
    setMsg("");
  };

  return (
    <div className="container" style={{ maxWidth: 500 }}>
      <h3 className="mb-3">Reset Password</h3>

      {msg && <div className="alert alert-info">{msg}</div>}

      <form onSubmit={handleSubmit}>
        {/* Password */}
        <div className="mb-3 position-relative">
          <input
            type={showPassword ? "text" : "password"}
            className={`form-control ${errors.password ? "is-invalid" : ""}`}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="position-absolute top-50 end-0 translate-middle-y me-3"
            style={{ cursor: "pointer" }}
            onClick={() => setShowPassword(!showPassword)}
          >
            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
          </span>
          {errors.password && (
            <div className="invalid-feedback">{errors.password}</div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-3 position-relative">
          <input
            type={showConfirm ? "text" : "password"}
            className={`form-control ${
              errors.confirmPassword ? "is-invalid" : ""
            }`}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <span
            className="position-absolute top-50 end-0 translate-middle-y me-3"
            style={{ cursor: "pointer" }}
            onClick={() => setShowConfirm(!showConfirm)}
          >
            <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`}></i>
          </span>
          {errors.confirmPassword && (
            <div className="invalid-feedback">{errors.confirmPassword}</div>
          )}
        </div>

        <div className="d-flex justify-content-between mt-3">
          <button type="submit" className="btn btn-primary w-50">
            Reset Password
          </button>
          <button
            type="button"
            className="btn btn-warning"
            style={{ width: "40%" }}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </form>
      
    </div>
  );
}
