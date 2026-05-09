import api from './axiosInstance';

export const getAssets = async () => {
    const response = await api.get('/api/assets');
    return response.data;
}

export const createAsset = async(data) => {
    const response = await api.post('/api/assets', data);
    return response;
}

export const  updateAsset = async(id, data) => {
    const response = await api.put(`/api/assets/${id}`, data);
    return response;
}

export const deleteAsset = async(id) => {
    const response = await api.delete(`/api/assets/${id}`);
    return response;
}