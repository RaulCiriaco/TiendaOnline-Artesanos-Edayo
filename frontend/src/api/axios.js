import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export const getImageUrl = (image) => {
    if (!image) return '';
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    return `${API_URL}${image.startsWith('/') ? '' : '/'}${image}`;
};

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para añadir token JWT
api.interceptors.request.use(
    (config) => {
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;