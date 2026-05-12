import axios, { AxiosInstance } from 'axios';

const APIInstances: { [key: string]: AxiosInstance } = {};

type StoreLike = { getState: () => unknown };

/** Kept for compatibility; auth headers are not attached on this client. */
export const setStoreGetter = (_fn: () => StoreLike) => {};

const createAPIInstance = (key: string, baseURL: string, prefix?: string) => {
    const api = prefix ? `${baseURL}/${prefix}` : baseURL;

    if (!APIInstances[key]) {
        const instance = axios.create({
            baseURL: `${api}`,
        });

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
