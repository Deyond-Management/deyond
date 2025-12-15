/**
 * Add/Edit Contact Screen
 * Add or edit saved wallet addresses
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Card } from '../components/atoms/Card';
import { QRScanner } from '../components/QRScanner';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addContact, updateContact, selectAllContacts } from '../store/slices/addressBookSlice';
import type { Contact } from '../store/slices/addressBookSlice';
import i18n from '../i18n';

interface AddContactScreenProps {
  navigation: any;
  route: {
    params?: {
      contact?: Contact;
    };
  };
}

export const AddContactScreen: React.FC<AddContactScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const contacts = useAppSelector(selectAllContacts);

  const editingContact = route.params?.contact;
  const isEditing = !!editingContact;

  // Form state
  const [name, setName] = useState(editingContact?.name || '');
  const [address, setAddress] = useState(editingContact?.address || '');
  const [label, setLabel] = useState(editingContact?.label || '');

  // Error state
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');

  // QR Scanner state
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Validate Ethereum address format
  const validateAddress = useCallback((addr: string): boolean => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(addr);
  }, []);

  // Check if address already exists (except for editing same contact)
  const isAddressDuplicate = useCallback(
    (addr: string): boolean => {
      return contacts.some(
        (contact: Contact) =>
          contact.address.toLowerCase() === addr.toLowerCase() && contact.id !== editingContact?.id
      );
    },
    [contacts, editingContact]
  );

  // Handle name change
  const handleNameChange = useCallback((value: string) => {
    setName(value);
    setNameError('');
  }, []);

  // Handle address change
  const handleAddressChange = useCallback(
    (value: string) => {
      setAddress(value);
      if (value.length > 0) {
        if (!validateAddress(value)) {
          setAddressError(i18n.t('addressBook.invalidAddress'));
        } else if (isAddressDuplicate(value)) {
          setAddressError(i18n.t('addressBook.duplicateAddress'));
        } else {
          setAddressError('');
        }
      } else {
        setAddressError('');
      }
    },
    [validateAddress, isAddressDuplicate]
  );

  // Handle label change
  const handleLabelChange = useCallback((value: string) => {
    setLabel(value);
  }, []);

  // Handle QR scan
  const handleQRScan = useCallback(
    (data: string) => {
      handleAddressChange(data);
      setShowQRScanner(false);
    },
    [handleAddressChange]
  );

  // Check if form is valid
  const isFormValid =
    name.trim().length > 0 &&
    address.length > 0 &&
    validateAddress(address) &&
    !isAddressDuplicate(address);

  // Handle save
  const handleSave = useCallback(() => {
    if (!isFormValid) return;

    const contactData = {
      name: name.trim(),
      address: address.trim(),
      label: label.trim(),
    };

    if (isEditing && editingContact) {
      dispatch(
        updateContact({
          ...editingContact,
          ...contactData,
        })
      );
    } else {
      dispatch(addContact(contactData));
    }

    Alert.alert(i18n.t('common.success'), i18n.t('addressBook.saveSuccess'), [
      {
        text: i18n.t('common.ok'),
        onPress: () => navigation.goBack(),
      },
    ]);
  }, [isFormValid, name, address, label, isEditing, editingContact, dispatch, navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Form Card */}
        <Card style={styles.card} elevation={1}>
          {/* Name Input */}
          <Input
            testID="contact-name-input"
            label={i18n.t('addressBook.name')}
            placeholder={i18n.t('addressBook.namePlaceholder')}
            value={name}
            onChangeText={handleNameChange}
            error={nameError}
            accessibilityLabel={i18n.t('addressBook.name')}
            containerStyle={styles.input}
          />

          {/* Address Input */}
          <Input
            testID="contact-address-input"
            label={i18n.t('addressBook.address')}
            placeholder={i18n.t('addressBook.addressPlaceholder')}
            value={address}
            onChangeText={handleAddressChange}
            error={addressError}
            accessibilityLabel={i18n.t('addressBook.address')}
            containerStyle={styles.input}
          />

          {/* QR Scan Button */}
          <Button
            testID="scan-qr-button"
            onPress={() => setShowQRScanner(true)}
            variant="outlined"
            size="medium"
            style={styles.scanButton}
          >
            📷 Scan QR Code
          </Button>

          {/* Label Input */}
          <Input
            testID="contact-label-input"
            label={i18n.t('addressBook.label')}
            placeholder={i18n.t('addressBook.labelPlaceholder')}
            value={label}
            onChangeText={handleLabelChange}
            accessibilityLabel={i18n.t('addressBook.label')}
            containerStyle={styles.input}
          />
        </Card>

        {/* Info Card */}
        <Card
          style={styles.infoCard}
          backgroundColor={theme.isDark ? '#1A237E' : '#E8EAF6'}
          elevation={0}
        >
          <Text style={[styles.infoIcon]}>ℹ️</Text>
          <Text style={[styles.infoText, { color: theme.isDark ? '#9FA8DA' : '#3F51B5' }]}>
            Tap and hold a contact in the address book to edit it. Make sure to verify addresses
            before saving.
          </Text>
        </Card>

        {/* Save Button */}
        <Button
          testID="save-contact-button"
          onPress={handleSave}
          variant="primary"
          size="large"
          fullWidth
          disabled={!isFormValid}
          style={styles.saveButton}
          accessibilityLabel={i18n.t('common.save')}
        >
          {i18n.t('common.save')}
        </Button>
      </ScrollView>

      {/* QR Scanner Modal */}
      <QRScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    marginBottom: 16,
  },
  safeArea: {
    flex: 1,
  },
  saveButton: {
    marginTop: 8,
  },
  scanButton: {
    marginBottom: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
});

export default AddContactScreen;
