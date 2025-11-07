import api from "./api";

// Step 1: request verification — requires { school_email }
export const requestVerification = (email) =>
  api.post("/request-verification", { school_email: email.trim() });

// Resend verification email for existing unverified users
export const resendVerification = (email) =>
  api.post("/resend-verification", { school_email: email.trim() });

// Step 2: set password — token is a PATH param, body must include confirm_password
export const setPassword = (token, password, confirm) =>
  api.post(`/setup-password/${token}`, {
    password,
    confirm_password: confirm,
  });
  
// Step 4: login — body must use school_email (not email)
export const login = (email, password) =>
  api.post("/login", { school_email: email.trim(), password });

// Step 3: complete profile — requires user_id and profile data
export const completeProfile = (userId, profileData) =>
  api.post(`/complete-profile/${userId}`, profileData);

// List view API calls (for design1 users)
export const getUsersList = (cursor = null, limit = 20) => {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', limit);
  return api.get(`/list/users?${params.toString()}`);
};

export const selectStudyBuddy = (selectedUserId) =>
  api.post("/list/select", { selected_user_id: selectedUserId });

// Optional protected calls
export const me = () => api.get("/me");

// Reach out to another user
export const reachOut = (recipientUserId, personalMessage) =>
  api.post("/reach-out", {
    recipient_user_id: recipientUserId,
    personal_message: personalMessage || null,
  });

// Report a user
export const reportUser = (reportedUserId, reason = null, context = null) =>
  api.post("/report", {
    reported_user_id: reportedUserId,
    reason: reason || null,
    context: context || null,
  });

// Get reach out status
export const getReachOutStatus = () => api.get("/reach-out/status");

// Reputation system API calls
export const getConnections = () => api.get("/connections");

export const markConnectionMet = (reachOutId, met) =>
  api.post("/connections/mark-met", {
    reach_out_id: reachOutId,
    met: met,
  });

export const getRatingCriteria = (reachOutId) =>
  api.get(`/connections/${reachOutId}/rating-criteria`);

export const submitRating = (reachOutId, criteria, ratings, reflectionNote = null) =>
  api.post("/connections/rate", {
    reach_out_id: reachOutId,
    criterion_1: criteria[0],
    rating_1: ratings[0],
    criterion_2: criteria[1],
    rating_2: ratings[1],
    criterion_3: criteria[2],
    rating_3: ratings[2],
    reflection_note: reflectionNote || null,
  });

export const getUserNotes = () => api.get("/notes");

// Update user profile
export const updateUserProfile = (userData) =>
  api.put("/user/update", userData);

export const requestPasswordReset = (email) =>
  api.post("/request-password-reset", { school_email: email.trim() });

export const resetPassword = (code, password, confirm) =>
  api.post(`/reset-password/${code}`, {
    password,
    confirm_password: confirm,
  });
