import { persistReducer } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

import { blacklist, rootReducer, whitelist } from '@/store/reducers';

const createNoopStorage = () => {
    return {
        getItem(key: string) {
            void key;
            return Promise.resolve(null);
        },
        setItem(key: string, value: string) {
            void key;
            return Promise.resolve(value);
        },
        removeItem(key: string) {
            void key;
            return Promise.resolve();
        },
    };
};

const storage =
    typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage();

const persistConfig = {
    key: 'root',
    storage,
    whitelist,
    blacklist
}

export default persistReducer(persistConfig, rootReducer);
