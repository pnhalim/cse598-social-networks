import api from "./api";

export const requestVerification = (email) =>
    api.post("/api/request-verification", { school_email: email.trim() });  

export const verifyEmail = (token) =>
  api.get(`/api/verify-email/${token}`);

export const setPassword = (token, password) =>
  api.post("/api/setup-password", { token, password });

export const login = (email, password) =>
  api.post("/api/login", { email, password });
