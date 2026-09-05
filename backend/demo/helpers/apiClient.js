const axios = require("axios");

const BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api";

class APIClient {
  constructor() {
    this.token = null;
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add token to requests automatically
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token) {
    this.token = token;
  }

  async post(endpoint, data) {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  async get(endpoint) {
    const response = await this.client.get(endpoint);
    return response.data;
  }

  async put(endpoint, data) {
    const response = await this.client.put(endpoint, data);
    return response.data;
  }

  async delete(endpoint) {
    const response = await this.client.delete(endpoint);
    return response.data;
  }
}

module.exports = APIClient;
