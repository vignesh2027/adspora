import axios from "axios";

const API = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Add token from localStorage as fallback
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adspora_token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;

export function formatApiError(detail) {
  if (detail == null) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).filter(Boolean).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
}
