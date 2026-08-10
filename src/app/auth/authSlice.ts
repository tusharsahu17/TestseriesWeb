import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { postData } from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/apiEndpoints';

interface User {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk('auth/login', async (credentials: any, { rejectWithValue }) => {
  try {
    const data = await postData(ENDPOINTS.AUTH_LOGIN, credentials);
    return data; // Expected to contain { token, user }
  } catch (err: any) {
    const errorData = err.response?.data;
    const errorMessage = typeof errorData === 'string' ? errorData : errorData?.message || 'Login failed';
    return rejectWithValue(errorMessage);
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData: any, { rejectWithValue }) => {
  try {
    const data = await postData(ENDPOINTS.AUTH_REGISTER, userData);
    return data;
  } catch (err: any) {
    const errorData = err.response?.data;
    const errorMessage = typeof errorData === 'string' ? errorData : errorData?.message || 'Registration failed';
    return rejectWithValue(errorMessage);
  }
});

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
      }
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = !!action.payload.token;
        if (typeof window !== 'undefined' && action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = !!action.payload.token;
        if (typeof window !== 'undefined' && action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;

export const selectIsAuthenticated = (state: any) => state.auth.isAuthenticated;
export const selectToken = (state: any) => state.auth.token;
export const selectAuthUser = (state: any) => state.auth.user;
export const selectAuthLoading = (state: any) => state.auth.isLoading;
export const selectAuthError = (state: any) => state.auth.error;

export default authSlice.reducer;
