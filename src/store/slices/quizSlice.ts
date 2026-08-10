import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getData } from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/apiEndpoints';

interface QuizState {
  quizzes: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: QuizState = {
  quizzes: [],
  isLoading: false,
  error: null,
};

export const fetchQuizzes = createAsyncThunk('quizzes/fetchQuizzes', async (_, { rejectWithValue }) => {
  try {
    const data = await getData(ENDPOINTS.QUIZZES);
    return data;
  } catch (err: any) {
    const errorData = err.response?.data;
    const errorMessage = typeof errorData === 'string' ? errorData : errorData?.message || 'Failed to fetch quizzes';
    return rejectWithValue(errorMessage);
  }
});

const quizSlice = createSlice({
  name: 'quizzes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizzes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizzes = action.payload;
      })
      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectQuizzes = (state: any) => state.quizzes.quizzes;
export const selectQuizzesLoading = (state: any) => state.quizzes.isLoading;
export const selectQuizzesError = (state: any) => state.quizzes.error;

export default quizSlice.reducer;
