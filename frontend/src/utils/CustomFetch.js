// apiClient.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:10000` : "http://localhost:10000");

const apiClient = axios.create({
  baseURL: API_URL, // Your API base URL
  timeout: 60000, // Request timeout in milliseconds
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default apiClient;
