import { useState } from "react";
import API, { setAuthToken } from "../api";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [errors, setErrors] = useState({});
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [sending, setSending] = useState(false);

  const nav = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length <= 6 || password.length >= 20) {
      newErrors.password = "Password must be between 7 and 19 characters";
    }
    return newErrors;
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setErrors({});

    const frontendErrors = validate();
    if (Object.keys(frontendErrors).length > 0) {
      setErrors(frontendErrors);
      return;
    }

    try {
      const res = await API.post("/auth/login", { email, password });
      const { token, role } = res.data;

      setAuthToken(token, role);

      if (role === "ROLE_ADMIN") {
        nav("/adminDashboard", { replace: true });
      } else {
        nav("/all-books", { replace: true });
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        const backendErrors = {};
        err.response.data.errors.forEach((error) => {
          backendErrors[error.field] = error.defaultMessage;
        });
        setErrors(backendErrors);
      } else if (err.response?.data) {
        setErr(err.response.data);
      } else {
        setErr("Login failed. Please try again.");
      }
    }
  };

  const sendForgotPassword = async () => {
    setForgotMsg("");
    setSending(true);
    try {
      const res = await API.post(`/auth/forgot-password?email=${forgotEmail}`);
      setForgotMsg(res.data);
    } catch (err) {
      setForgotMsg(err.response?.data || "Failed to send reset email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center" style={{ height: "90vh" }}
    >
      <div className="card shadow-lg p-4" style={{ width: "100%", maxWidth: 450 }}>
        <div className="text-center mb-4">
          <i className="bi bi-person-circle text-primary" style={{ fontSize: 50 }}></i>
          <h3 className="fw-bold mt-2">Welcome Back</h3>
          <p className="text-muted">Login to continue</p>
        </div>

        {err && <div className="alert alert-danger">{err}</div>}

        <form onSubmit={submit}>
          {/* Email */}
          <div className="mb-3 position-relative">
            <input
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>

          {/* Password */}
          <div className="mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control ${errors.password ? "is-invalid no-invalid-icon" : ""}`}
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



          <button className="btn btn-primary w-100 mt-2 mb-2">Login</button>

          <button
            type="button"
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setEmail("");
              setPassword("");
              setErrors({});
              setErr("");
            }}
          >
            Reset
          </button>

          {/* Forgot Password */}
          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => setShowForgot(true)}
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title">Reset Password</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotMsg("");
                    setForgotEmail("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {forgotMsg && (
                  <div className="alert alert-info">{forgotMsg}</div>
                )}
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <div className="modal-footer d-flex align-items-center justify-content-center" style={{flexDirection:"column-reverse"}}>
                <button
                  className="btn btn-secondary w-100"
                  onClick={() => setShowForgot(false)}
                >
                  Close
                </button>
                <button
                  className="btn btn-primary d-flex align-items-center justify-content-center w-100"
                  onClick={sendForgotPassword}
                  disabled={sending}
                >
                  {sending && (
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  )}
                  {sending ? "Sending Email..." : "Send Reset Link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
