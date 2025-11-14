import axios from 'axios';

export const http = axios.create({
  baseURL: '/api',
  withCredentials: true
});

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await http.post('/auth/refresh');
        return http(original);
      } catch {
        // fallthrough
      }
    }
    return Promise.reject(error);
  }
);


