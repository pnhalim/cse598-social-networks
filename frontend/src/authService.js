import api from "./api";

// Step 1: request verification — requires { school_email }
export const requestVerification = (email) =>
  api.post("/api/request-verification", { school_email: email.trim() });

// Resend verification email for existing unverified users
export const resendVerification = (email) =>
  api.post("/api/resend-verification", { school_email: email.trim() });

// Step 2: set password — token is a PATH param, body must include confirm_password
export const setPassword = (token, password, confirm) =>
  api.post(`/api/setup-password/${token}`, {
    password,
    confirm_password: confirm,
  });
  
// Step 4: login — body must use school_email (not email)
export const login = (email, password) =>
  api.post("/api/login", { school_email: email.trim(), password });

// Optional protected calls
export const me = () => api.get("/api/me");
