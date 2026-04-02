import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Club {
  id: string;
  name: string;
  description: string;
  facultyCoordinators: string[];
  councilMembers: string[];
  category: string;
}

interface ClubState {
  clubs: Club[];
  loading: boolean;
}

const initialState: ClubState = {
  clubs: [],
  loading: false,
};

const clubSlice = createSlice({
  name: 'clubs',
  initialState,
  reducers: {
    addClub: (state, action: PayloadAction<Club>) => {
      state.clubs.push(action.payload);
    },
    updateClub: (state, action: PayloadAction<Club>) => {
      const index = state.clubs.findIndex(c => c.id === action.payload.id);
      if (index !== -1) state.clubs[index] = action.payload;
    },
    deleteClub: (state, action: PayloadAction<string>) => {
      state.clubs = state.clubs.filter(c => c.id !== action.payload);
    },
  },
});

export const { addClub, updateClub, deleteClub } = clubSlice.actions;
export default clubSlice.reducer;
