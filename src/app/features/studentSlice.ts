import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LogbookEntry {
  id: string;
  studentId: string;
  clubId: string;
  activityDescription: string;
  date: string;
  hours: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Achievement {
  id: string;
  studentId: string;
  clubId: string;
  title: string;
  description: string;
  level: string; // College, State, National
  date: string;
}

export interface StudentStats {
  participation: number; // 0-5
  leadership: number; // 0-5
  discipline: number; // 0-5
  skillDevelopment: number; // 0-5
  impact: number; // 0-5
}

interface StudentState {
  registrations: { [studentId: string]: string[] }; // studentId -> clubIds
  logbooks: LogbookEntry[];
  achievements: Achievement[];
  marks: { [studentId: string]: { [clubId: string]: StudentStats } };
}

const initialState: StudentState = {
  registrations: {},
  logbooks: [],
  achievements: [],
  marks: {}
};

const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    registerForClub: (state, action: PayloadAction<{ studentId: string; clubId: string }>) => {
      const { studentId, clubId } = action.payload;
      if (!state.registrations[studentId]) state.registrations[studentId] = [];
      if (!state.registrations[studentId].includes(clubId)) {
        state.registrations[studentId].push(clubId);
      }
    },
    setLogbooks: (state, action: PayloadAction<LogbookEntry[]>) => {
      state.logbooks = action.payload;
    },
    setAchievements: (state, action: PayloadAction<Achievement[]>) => {
      state.achievements = action.payload;
    },
    addLogEntry: (state, action: PayloadAction<LogbookEntry>) => {
      state.logbooks.push(action.payload);
    },
    updateLogStatus: (state, action: PayloadAction<{ logId: string; status: LogbookEntry['status'] }>) => {
      const log = state.logbooks.find(l => l.id === action.payload.logId);
      if (log) log.status = action.payload.status;
    },
    addAchievement: (state, action: PayloadAction<Achievement>) => {
      state.achievements.push(action.payload);
    },
    updateMarks: (state, action: PayloadAction<{ studentId: string; clubId: string; stats: StudentStats }>) => {
      const { studentId, clubId, stats } = action.payload;
      if (!state.marks[studentId]) state.marks[studentId] = {};
      state.marks[studentId][clubId] = stats;
    }
  },
});

export const { registerForClub, setLogbooks, setAchievements, addLogEntry, updateLogStatus, addAchievement, updateMarks } = studentSlice.actions;
export default studentSlice.reducer;
