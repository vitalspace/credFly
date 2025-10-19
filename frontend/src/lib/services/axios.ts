import axios, { type AxiosInstance } from 'axios';

const axiosInstace: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
	headers: {
		'Content-Type': 'application/json'
	},
	withCredentials: true
});

export default axiosInstace;
