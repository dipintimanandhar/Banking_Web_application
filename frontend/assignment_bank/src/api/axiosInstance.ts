// src/api/axiosInstance.ts
import axios from 'axios';

// Access the environment variable provided by Vite
// It falls back to localhost if the variable is somehow not set
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Log the base URL being used (useful for debugging)
console.log(`API Base URL determined as: ${apiBaseUrl}`);

// Create a new Axios instance with default configuration
const apiClient = axios.create({
  baseURL: apiBaseUrl, // Set the base URL for all requests using this instance
  timeout: 15000, // Example: Set a request timeout (milliseconds)
  headers: {
      'Content-Type': 'application/json',
      // You can add other default headers here if needed
  }
});

/*
// Optional: Add interceptors later if needed (e.g., for adding auth tokens)
apiClient.interceptors.request.use(config => {
    // const token = getAuthToken(); // Example
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
});
*/

export default apiClient;