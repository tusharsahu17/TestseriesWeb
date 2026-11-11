import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../app/auth/authSlice';
import quizReducer from './slices/quizSlice';
import notificationsReducer from './slices/notificationsSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      quizzes: quizReducer,
      notifications: notificationsReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
