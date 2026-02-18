import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'Admin' | 'Student' | 'Club';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  rollNo?: string;
  department?: string;
  clubId?: string;
  clubName?: string;
  year?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const TOKEN_KEY = 'clubsync_token';

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem(TOKEN_KEY, action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem(TOKEN_KEY);
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
