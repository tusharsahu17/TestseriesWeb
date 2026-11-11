import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dashboardService } from '../../services/dashboardService';
import type { NotificationsResponse, PaginationMeta, UserNotification } from '../../types/dashboard';

interface NotificationsState {
  items: UserNotification[];
  unreadCount: number;
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchDashboardNotifications = createAsyncThunk(
  'notifications/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      return await dashboardService.getDashboardNotifications();
    } catch {
      return rejectWithValue('Failed to load notifications');
    }
  },
);

export const fetchAllNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (
    params: { page?: number; limit?: number; type?: string; unreadOnly?: boolean } = {},
    { rejectWithValue },
  ) => {
    try {
      return await dashboardService.getNotifications(params);
    } catch {
      return rejectWithValue('Failed to load notifications');
    }
  },
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markRead',
  async (id: string, { rejectWithValue }) => {
    try {
      await dashboardService.markNotificationRead(id);
      return id;
    } catch {
      return rejectWithValue('Failed to mark notification as read');
    }
  },
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await dashboardService.markAllNotificationsRead();
      return true;
    } catch {
      return rejectWithValue('Failed to mark all notifications as read');
    }
  },
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotificationsSnapshot(state, action: PayloadAction<NotificationsResponse>) {
      state.items = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.pagination = action.payload.pagination ?? null;
      })
      .addCase(fetchDashboardNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAllNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.pagination = action.payload.pagination ?? null;
      })
      .addCase(fetchAllNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const target = state.items.find((item) => item.id === action.payload);
        if (target && !target.isRead) {
          target.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.items = state.items.map((item) => ({ ...item, isRead: true }));
        state.unreadCount = 0;
      });
  },
});

export const { setNotificationsSnapshot } = notificationsSlice.actions;

interface RootStateLike {
  notifications: NotificationsState;
}

export const selectNotifications = (state: RootStateLike) => state.notifications.items;
export const selectUnreadNotificationsCount = (state: RootStateLike) =>
  state.notifications.unreadCount;
export const selectNotificationsPagination = (state: RootStateLike) =>
  state.notifications.pagination;
export const selectNotificationsLoading = (state: RootStateLike) =>
  state.notifications.isLoading;

export default notificationsSlice.reducer;

