// ============================================
// UI Slice - UI State Management
// ============================================

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  activeModule: string;
  modalOpen: boolean;
  modalType: string | null;
  modalData: unknown;
  toasts: Toast[];
}

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: "light",
  activeModule: "dashboard",
  modalOpen: false,
  modalType: null,
  modalData: null,
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapse: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },
    setActiveModule: (state, action: PayloadAction<string>) => {
      state.activeModule = action.payload;
    },
    openModal: (state, action: PayloadAction<{ type: string; data?: unknown }>) => {
      state.modalOpen = true;
      state.modalType = action.payload.type;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalType = null;
      state.modalData = null;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, "id">>) => {
      state.toasts.push({
        ...action.payload,
        id: Date.now().toString(),
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapse,
  setTheme,
  setActiveModule,
  openModal,
  closeModal,
  addToast,
  removeToast,
} = uiSlice.actions;

export default uiSlice.reducer;
