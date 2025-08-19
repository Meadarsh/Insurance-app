import axios from "axios";

const ApiInstance = axios.create({
    baseURL: "http://localhost:5002/api",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('accessToken')}`,
    },
});

// Add a request interceptor to update the token before each request
ApiInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
);

export default ApiInstance;
