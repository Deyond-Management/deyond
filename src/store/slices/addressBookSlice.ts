/**
 * Address Book Slice
 * Redux state management for saved wallet addresses
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface Contact {
  id: string;
  name: string;
  address: string;
  label?: string;
  network?: string;
  createdAt: number;
  updatedAt: number;
}

interface AddressBookState {
  contacts: Contact[];
  searchQuery: string;
}

const initialState: AddressBookState = {
  contacts: [],
  searchQuery: '',
};

const addressBookSlice = createSlice({
  name: 'addressBook',
  initialState,
  reducers: {
    addContact: (state, action: PayloadAction<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newContact: Contact = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.contacts.push(newContact);
    },
    updateContact: (state, action: PayloadAction<Contact>) => {
      const index = state.contacts.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.contacts[index] = {
          ...action.payload,
          updatedAt: Date.now(),
        };
      }
    },
    deleteContact: (state, action: PayloadAction<string>) => {
      state.contacts = state.contacts.filter(c => c.id !== action.payload);
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSearchQuery: state => {
      state.searchQuery = '';
    },
  },
});

export const { addContact, updateContact, deleteContact, setSearchQuery, clearSearchQuery } =
  addressBookSlice.actions;

// Selectors
export const selectAllContacts = (state: RootState) => state.addressBook.contacts;

export const selectFilteredContacts = (state: RootState) => {
  const { contacts, searchQuery } = state.addressBook;
  if (!searchQuery) return contacts;

  const query = searchQuery.toLowerCase();
  return contacts.filter(
    contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.address.toLowerCase().includes(query) ||
      contact.label?.toLowerCase().includes(query)
  );
};

export const selectContactById = (id: string) => (state: RootState) =>
  state.addressBook.contacts.find(c => c.id === id);

export const selectSearchQuery = (state: RootState) => state.addressBook.searchQuery;

export default addressBookSlice.reducer;
