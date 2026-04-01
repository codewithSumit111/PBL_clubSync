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
  clubs: [
    {
      id: '1',
      name: 'Robotics Club',
      description: 'Designing and building innovative robotic systems for national competitions.',
      facultyCoordinators: ['Dr. Sharma'],
      councilMembers: ['Rahul Singh', 'Ananya Roy'],
      category: 'Technical'
    },
    {
      id: '2',
      name: 'Cultural Club',
      description: 'Fostering creativity through dance, music, and drama performances.',
      facultyCoordinators: ['Prof. Verma'],
      councilMembers: ['Ishaan Gupta'],
      category: 'Arts'
    },
    {
      id: '3',
      name: 'Coding Ninjas',
      description: 'The competitive programming hub of our college.',
      facultyCoordinators: ['Dr. Patel'],
      councilMembers: ['Siddharth Jain'],
      category: 'Technical'
    }
  ],
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
