import api from './axiosInstance';

export const getPortfolio = async () => {
    const response = await api.get('/api/portfolio');
    return response.data;
}
