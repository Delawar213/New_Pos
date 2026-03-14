import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

const APIInstances: { [key: string]: AxiosInstance } = {};

// Function to get the store dynamically to avoid circular dependency
let getStore: (() => any) | null = null;

export const setStoreGetter = (fn: () => any) => {
    getStore = fn;
};

const createAPIInstance = (key: string, baseURL: string, prefix?: string) => {
    const api = prefix ? `${baseURL}/${prefix}` : baseURL;

    if (!APIInstances[key]) {
        const instance = axios.create({
            baseURL: `${api}`,
        });

        instance.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                if (getStore) {
                    const state = getStore().getState();
                    const token = state.auth?.token;

                    if (token && config.headers) {
                        config.headers['Authorization'] = `Bearer ${token}`;
                    }
                }

                return config;
            },
            (error: AxiosError) => Promise.reject(error)
        );

        APIInstances[key] = instance;
    }

    return APIInstances[key];
};

const API = (prefix?: string) =>
    createAPIInstance('API', process.env.NEXT_PUBLIC_API_BASE_URL || '', prefix);

const setContentType = (type: string, instanceKey: string) => {
    const APIInstance = APIInstances[instanceKey];
    if (!APIInstance) {
        throw new Error(`API instance with key ${instanceKey} does not exist.`);
    }

    APIInstance.defaults.headers.common['Content-Type'] =
        type || 'application/json';
};

export { API, setContentType };
