/**
 * Address Book Screen
 * Display and manage saved wallet addresses
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectFilteredContacts,
  selectSearchQuery,
  setSearchQuery,
  deleteContact,
  clearSearchQuery,
} from '../store/slices/addressBookSlice';
import type { Contact } from '../store/slices/addressBookSlice';
import i18n from '../i18n';

interface AddressBookScreenProps {
  navigation: any;
}

export const AddressBookScreen: React.FC<AddressBookScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const contacts = useAppSelector(selectFilteredContacts);
  const searchQuery = useAppSelector(selectSearchQuery);

  // Handle search input
  const handleSearch = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  // Handle add contact
  const handleAddContact = useCallback(() => {
    navigation.navigate('AddContact');
  }, [navigation]);

  // Handle edit contact
  const handleEditContact = useCallback(
    (contact: Contact) => {
      navigation.navigate('AddContact', { contact });
    },
    [navigation]
  );

  // Handle delete contact
  const handleDeleteContact = useCallback(
    (contact: Contact) => {
      Alert.alert(i18n.t('addressBook.deleteContact'), i18n.t('addressBook.confirmDelete'), [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => {
            dispatch(deleteContact(contact.id));
            Alert.alert(i18n.t('common.success'), i18n.t('addressBook.deleteSuccess'));
          },
        },
      ]);
    },
    [dispatch]
  );

  // Handle contact selection (for navigation from SendScreen)
  const handleSelectContact = useCallback(
    (contact: Contact) => {
      navigation.navigate('Send', { selectedAddress: contact.address });
    },
    [navigation]
  );

  // Render contact item
  const renderContactItem = useCallback(
    ({ item }: { item: Contact }) => (
      <Card style={styles.contactCard} elevation={1} testID={`contact-${item.id}`}>
        <TouchableOpacity
          onPress={() => handleSelectContact(item)}
          onLongPress={() => handleEditContact(item)}
          style={styles.contactContent}
        >
          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
            {item.label && (
              <View
                style={[
                  styles.labelBadge,
                  { backgroundColor: theme.isDark ? '#424242' : '#E0E0E0' },
                ]}
              >
                <Text style={[styles.labelText, { color: theme.colors.text.secondary }]}>
                  {item.label}
                </Text>
              </View>
            )}
            <Text
              style={[styles.contactAddress, { color: theme.colors.text.secondary }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {item.address}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteContact(item)}
            style={styles.deleteButton}
            testID={`delete-${item.id}`}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Card>
    ),
    [handleSelectContact, handleEditContact, handleDeleteContact, theme]
  );

  // Render empty state
  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyIcon]}>📒</Text>
        <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
          {i18n.t('addressBook.empty')}
        </Text>
        <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary }]}>
          {i18n.t('addressBook.emptyDescription')}
        </Text>
        <Button
          onPress={handleAddContact}
          variant="primary"
          size="medium"
          style={styles.emptyButton}
          testID="empty-add-button"
        >
          {i18n.t('addressBook.addContact')}
        </Button>
      </View>
    ),
    [theme, handleAddContact]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.isDark ? '#424242' : '#F5F5F5',
                color: theme.colors.text.primary,
              },
            ]}
            placeholder={i18n.t('addressBook.search')}
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={handleSearch}
            testID="search-input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => dispatch(clearSearchQuery())}
              style={styles.clearButton}
              testID="clear-search"
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contacts List */}
        {contacts.length > 0 ? (
          <FlatList
            data={contacts}
            renderItem={renderContactItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            testID="contacts-list"
          />
        ) : (
          renderEmptyState()
        )}

        {/* Add Button (Floating) */}
        {contacts.length > 0 && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddContact}
            testID="add-contact-fab"
          >
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 6,
    width: 40,
  },
  clearIcon: {
    color: '#999',
    fontSize: 18,
  },
  contactAddress: {
    fontSize: 12,
    marginTop: 4,
  },
  contactCard: {
    marginBottom: 12,
  },
  contactContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  deleteButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  deleteIcon: {
    fontSize: 20,
  },
  emptyButton: {
    marginTop: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyDescription: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fab: {
    alignItems: 'center',
    borderRadius: 28,
    bottom: 24,
    elevation: 4,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: 56,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
  },
  labelBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  labelText: {
    fontSize: 11,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  safeArea: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'relative',
  },
  searchInput: {
    borderRadius: 8,
    fontSize: 14,
    height: 48,
    paddingHorizontal: 16,
    paddingRight: 48,
  },
});

export default AddressBookScreen;
