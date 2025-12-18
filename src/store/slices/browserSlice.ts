/**
 * Browser Redux Slice
 * State management for DApp browser bookmarks and history
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface BrowserHistoryItem {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  visitedAt: number;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  createdAt: number;
}

export interface BrowserState {
  history: BrowserHistoryItem[];
  bookmarks: Bookmark[];
  maxHistoryItems: number;
}

// Initial state
const initialState: BrowserState = {
  history: [],
  bookmarks: [],
  maxHistoryItems: 100,
};

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Extract domain from URL for favicon
const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
};

// Slice
const browserSlice = createSlice({
  name: 'browser',
  initialState,
  reducers: {
    // Add history item
    addHistoryItem: (state, action: PayloadAction<{ url: string; title?: string }>) => {
      const { url, title } = action.payload;
      const domain = extractDomain(url);

      // Remove duplicate if exists
      state.history = state.history.filter(item => item.url.toLowerCase() !== url.toLowerCase());

      // Add new item at the beginning
      state.history.unshift({
        id: generateId(),
        url,
        title: title || domain || url,
        favicon: domain ? `https://${domain}/favicon.ico` : undefined,
        visitedAt: Date.now(),
      });

      // Limit history size
      if (state.history.length > state.maxHistoryItems) {
        state.history = state.history.slice(0, state.maxHistoryItems);
      }
    },

    // Remove history item
    removeHistoryItem: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(item => item.id !== action.payload);
    },

    // Clear all history
    clearHistory: state => {
      state.history = [];
    },

    // Add bookmark
    addBookmark: (state, action: PayloadAction<{ url: string; title?: string }>) => {
      const { url, title } = action.payload;
      const domain = extractDomain(url);

      // Check if already bookmarked
      const exists = state.bookmarks.some(
        bookmark => bookmark.url.toLowerCase() === url.toLowerCase()
      );

      if (!exists) {
        state.bookmarks.push({
          id: generateId(),
          url,
          title: title || domain || url,
          favicon: domain ? `https://${domain}/favicon.ico` : undefined,
          createdAt: Date.now(),
        });
      }
    },

    // Remove bookmark
    removeBookmark: (state, action: PayloadAction<string>) => {
      state.bookmarks = state.bookmarks.filter(bookmark => bookmark.id !== action.payload);
    },

    // Remove bookmark by URL
    removeBookmarkByUrl: (state, action: PayloadAction<string>) => {
      state.bookmarks = state.bookmarks.filter(
        bookmark => bookmark.url.toLowerCase() !== action.payload.toLowerCase()
      );
    },

    // Update bookmark title
    updateBookmarkTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const bookmark = state.bookmarks.find(b => b.id === action.payload.id);
      if (bookmark) {
        bookmark.title = action.payload.title;
      }
    },

    // Clear all bookmarks
    clearBookmarks: state => {
      state.bookmarks = [];
    },
  },
});

// Export actions
export const {
  addHistoryItem,
  removeHistoryItem,
  clearHistory,
  addBookmark,
  removeBookmark,
  removeBookmarkByUrl,
  updateBookmarkTitle,
  clearBookmarks,
} = browserSlice.actions;

// Selectors
export const selectBrowserHistory = (state: { browser: BrowserState }) => state.browser.history;

export const selectBookmarks = (state: { browser: BrowserState }) => state.browser.bookmarks;

export const selectIsBookmarked = (url: string) => (state: { browser: BrowserState }) =>
  state.browser.bookmarks.some(bookmark => bookmark.url.toLowerCase() === url.toLowerCase());

export const selectRecentHistory =
  (limit: number = 10) =>
  (state: { browser: BrowserState }) =>
    state.browser.history.slice(0, limit);

export default browserSlice.reducer;
