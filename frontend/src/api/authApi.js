import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
    'Content-Type': 'application/json',
    }
});

export const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
}