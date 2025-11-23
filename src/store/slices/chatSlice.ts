/**
 * Chat Redux Slice
 * State management for BLE P2P chat
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BLESession, ChatMessage } from '../../types/ble';

interface ChatState {
  sessions: BLESession[];
  messages: Record<string, ChatMessage[]>; // sessionId -> messages
  activeSessionId: string | null;
  isScanning: boolean;
}

const initialState: ChatState = {
  sessions: [],
  messages: {},
  activeSessionId: null,
  isScanning: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addSession: (state, action: PayloadAction<BLESession>) => {
      state.sessions.push(action.payload);
    },
    updateSession: (state, action: PayloadAction<BLESession>) => {
      const index = state.sessions.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.sessions[index] = action.payload;
      }
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(s => s.id !== action.payload);
      delete state.messages[action.payload];
    },
    setActiveSession: (state, action: PayloadAction<string | null>) => {
      state.activeSessionId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ sessionId: string; message: ChatMessage }>) => {
      const { sessionId, message } = action.payload;
      if (!state.messages[sessionId]) {
        state.messages[sessionId] = [];
      }
      state.messages[sessionId].push(message);
    },
    updateMessage: (
      state,
      action: PayloadAction<{ sessionId: string; messageId: string; message: ChatMessage }>
    ) => {
      const { sessionId, messageId, message } = action.payload;
      if (state.messages[sessionId]) {
        const index = state.messages[sessionId].findIndex(m => m.id === messageId);
        if (index !== -1) {
          state.messages[sessionId][index] = message;
        }
      }
    },
    deleteMessage: (state, action: PayloadAction<{ sessionId: string; messageId: string }>) => {
      const { sessionId, messageId } = action.payload;
      if (state.messages[sessionId]) {
        state.messages[sessionId] = state.messages[sessionId].filter(m => m.id !== messageId);
      }
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      delete state.messages[action.payload];
    },
    setScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
    },
  },
});

export const {
  addSession,
  updateSession,
  removeSession,
  setActiveSession,
  addMessage,
  updateMessage,
  deleteMessage,
  clearMessages,
  setScanning,
} = chatSlice.actions;

export default chatSlice.reducer;
