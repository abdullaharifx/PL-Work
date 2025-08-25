import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMyInfoApiCall } from "../../api/auth.api";

// Async thunk for Reddit OAuth authentication
export const authenticateUser = createAsyncThunk(
  "auth/authenticateUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyInfoApiCall();
      // For now, we'll simulate a successful authentication
      const user = {
        ...response.data,
        avatar:
          "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png",
      };

      return user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateAuth: (state, action) => {
      state = {
        ...state,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authenticateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authenticateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          username: action.payload.username,
          avatar: action.payload.avatar,
        };
        state.isAuthenticated = true;

        // set flag in local storage
        localStorage.setItem("isAuthenticated", true);
      })
      .addCase(authenticateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Authentication failed";
      });
  },
});

export const { logout, clearError, updateAuth } = authSlice.actions;
export default authSlice.reducer;
