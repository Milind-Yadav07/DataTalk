import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Dashboard } from '../../types/dashboard';

export interface DashboardState {
  dashboards: Dashboard[];
  activeDashboard: Dashboard | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  dashboards: [],
  activeDashboard: null,
  isLoading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboards: (state, action: PayloadAction<Dashboard[]>) => {
      state.dashboards = action.payload;
    },
    addDashboard: (state, action: PayloadAction<Dashboard>) => {
      state.dashboards.push(action.payload);
    },
    updateDashboard: (state, action: PayloadAction<Dashboard>) => {
      const index = state.dashboards.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.dashboards[index] = action.payload;
      }
      if (state.activeDashboard?.id === action.payload.id) {
        state.activeDashboard = action.payload;
      }
    },
    deleteDashboard: (state, action: PayloadAction<string>) => {
      state.dashboards = state.dashboards.filter(d => d.id !== action.payload);
      if (state.activeDashboard?.id === action.payload) {
        state.activeDashboard = null;
      }
    },
    setActiveDashboard: (state, action: PayloadAction<Dashboard | null>) => {
      state.activeDashboard = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setDashboards,
  addDashboard,
  updateDashboard,
  deleteDashboard,
  setActiveDashboard,
  setLoading,
  setError,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
