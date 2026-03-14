import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { blacklist, rootReducer, whitelist } from '@/store/reducers';

const persistConfig = {
    key: 'root',
    storage,
    whitelist,
    blacklist
}

export default persistReducer(persistConfig, rootReducer);
