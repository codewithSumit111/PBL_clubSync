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
const USER_KEY = 'clubsync_user';

const getInitialState = (): AuthState => {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  let user: User | null = null;
  
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      localStorage.removeItem(USER_KEY);
    }
  }

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem(TOKEN_KEY, action.payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
