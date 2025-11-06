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

// Step 3: complete profile — requires user_id and profile data
export const completeProfile = (userId, profileData) =>
  api.post(`/api/complete-profile/${userId}`, profileData);

// List view API calls (for design1 users)
export const getUsersList = (cursor = null, limit = 20) => {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', limit);
  return api.get(`/api/list/users?${params.toString()}`);
};

export const selectStudyBuddy = (selectedUserId) =>
  api.post("/api/list/select", { selected_user_id: selectedUserId });

// Optional protected calls
export const me = () => api.get("/api/me");

// Reach out to another user
export const reachOut = (recipientUserId, personalMessage) =>
  api.post("/api/reach-out", {
    recipient_user_id: recipientUserId,
    personal_message: personalMessage || null,
  });

// Report a user
export const reportUser = (reportedUserId, reason = null, context = null) =>
  api.post("/api/report", {
    reported_user_id: reportedUserId,
    reason: reason || null,
    context: context || null,
  });

// Get reach out status
export const getReachOutStatus = () => api.get("/api/reach-out/status");

// Reputation system API calls
export const getConnections = () => api.get("/api/connections");

export const markConnectionMet = (reachOutId, met) =>
  api.post("/api/connections/mark-met", {
    reach_out_id: reachOutId,
    met: met,
  });

export const getRatingCriteria = (reachOutId) =>
  api.get(`/api/connections/${reachOutId}/rating-criteria`);

export const submitRating = (reachOutId, criteria, ratings, reflectionNote = null) =>
  api.post("/api/connections/rate", {
    reach_out_id: reachOutId,
    criterion_1: criteria[0],
    rating_1: ratings[0],
    criterion_2: criteria[1],
    rating_2: ratings[1],
    criterion_3: criteria[2],
    rating_3: ratings[2],
    reflection_note: reflectionNote || null,
  });

export const getUserNotes = () => api.get("/api/notes");
