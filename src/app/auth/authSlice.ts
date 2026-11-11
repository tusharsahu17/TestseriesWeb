import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { postData } from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/apiEndpoints';

export interface User {
  id: string | number;
  email?: string;
  username?: string;
  name?: string;
  fullName?: string;
  role?: string;
  [key: string]: unknown;
}

interface AuthResponse {
  token?: string;
  user?: User;
  data?: {
    token?: string;
    user?: User;
  };
  message?: string;
}

interface Credentials {
  username?: string;
  email?: string;
  password: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: getStoredUser(),
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
  isLoading: false,
  error: null,
};

const extractErrorMessage = (err: unknown, fallback: string): string => {
  const axiosErr = err as AxiosError<{ message?: string; error?: string } | string>;
  const errorData = axiosErr.response?.data;
  if (typeof errorData === 'string') return errorData;
  return errorData?.message || errorData?.error || fallback;
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: Credentials, { rejectWithValue }) => {
    try {
      const res = await postData<AuthResponse>(ENDPOINTS.AUTH_LOGIN, credentials);
      const token = res.token ?? res.data?.token ?? null;
      const user = res.user ?? res.data?.user ?? null;
      return { token, user };
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err, 'Login failed'));
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: Credentials, { rejectWithValue }) => {
    try {
      const res = await postData<AuthResponse>(ENDPOINTS.AUTH_REGISTER, userData);
      const token = res.token ?? res.data?.token ?? null;
      const user = res.user ?? res.data?.user ?? null;
      return { token, user };
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err, 'Registration failed'));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
    setAuthUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('user', JSON.stringify(action.payload));
        } else {
          localStorage.removeItem('user');
        }
      }
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = !!action.payload.token;
        if (typeof window !== 'undefined') {
          if (action.payload.token) {
            localStorage.setItem('token', action.payload.token);
          }
          if (action.payload.user) {
            localStorage.setItem('user', JSON.stringify(action.payload.user));
          }
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = !!action.payload.token;
        if (typeof window !== 'undefined') {
          if (action.payload.token) {
            localStorage.setItem('token', action.payload.token);
          }
          if (action.payload.user) {
            localStorage.setItem('user', JSON.stringify(action.payload.user));
          }
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, setAuthUser, clearError } = authSlice.actions;

interface RootStateLike {
  auth: AuthState;
}

export const selectIsAuthenticated = (state: RootStateLike) => state.auth.isAuthenticated;
export const selectToken = (state: RootStateLike) => state.auth.token;
export const selectAuthUser = (state: RootStateLike) => state.auth.user;
export const selectAuthLoading = (state: RootStateLike) => state.auth.isLoading;
export const selectAuthError = (state: RootStateLike) => state.auth.error;

export default authSlice.reducer;
