import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getErrorMessage(error) {
  return error?.response?.data?.detail || error?.message || "Something went wrong.";
}

export default api;
