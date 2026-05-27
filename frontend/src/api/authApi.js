import api from './axiosInstance';

export const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
}

export const signup = async (email, password, nickname) => {
    const response = await api.post('/api/auth/signup', { email, password, nickname });
    return response.data;
}
