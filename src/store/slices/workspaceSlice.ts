import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { DatasetMeta } from '../../types/dataset';
import type { ChartConfig } from '../../types/chart';

export interface WorkspaceState {
  activeDataset: DatasetMeta | null;
  charts: ChartConfig[];
  queryHistory: string[];
  isQuerying: boolean;
  queryError: string | null;
}

const initialState: WorkspaceState = {
  activeDataset: null,
  charts: [],
  queryHistory: [],
  isQuerying: false,
  queryError: null,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveDataset: (state, action: PayloadAction<DatasetMeta | null>) => {
      state.activeDataset = action.payload;
    },
    addChart: (state, action: PayloadAction<ChartConfig>) => {
      state.charts.push(action.payload);
    },
    removeChart: (state, action: PayloadAction<string>) => {
      state.charts = state.charts.filter((chart) => chart.id !== action.payload);
    },
    addQueryToHistory: (state, action: PayloadAction<string>) => {
      state.queryHistory.push(action.payload);
    },
    setQuerying: (state, action: PayloadAction<boolean>) => {
      state.isQuerying = action.payload;
    },
    setQueryError: (state, action: PayloadAction<string | null>) => {
      state.queryError = action.payload;
    },
    clearWorkspace: (state) => {
      state.activeDataset = null;
      state.charts = [];
      state.queryHistory = [];
      state.isQuerying = false;
      state.queryError = null;
    },
  },
});

export const {
  setActiveDataset,
  addChart,
  removeChart,
  addQueryToHistory,
  setQuerying,
  setQueryError,
  clearWorkspace,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
