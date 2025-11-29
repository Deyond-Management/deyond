# Address Book Feature

## Overview

The Address Book feature allows users to save, manage, and quickly access frequently used wallet addresses. It consists of two main screens and a Redux state management slice.

## Components

### 1. AddressBookScreen

Main screen for viewing and managing saved contacts.

**Location**: `src/screens/AddressBookScreen.tsx`

#### Features

- Display all saved contacts in a scrollable list
- Real-time search functionality (searches name, address, and label)
- Select contact to use in Send screen
- Edit existing contacts
- Delete contacts with confirmation
- Empty state when no contacts saved
- Floating Action Button (FAB) to add new contacts

#### UI Elements

```typescript
- Search Bar: Filter contacts by name, address, or label
- Contact List: Scrollable list of saved contacts
  - Contact Item:
    - Name (primary)
    - Label/Network (secondary)
    - Address (truncated, e.g., 0x742d...5f0bEb)
    - Action buttons (Edit, Delete)
- FAB: + button to add new contact
- Empty State: Shows when no contacts or no search results
```

#### Navigation

```typescript
// From other screens
navigation.navigate('AddressBook');

// To Add Contact screen
navigation.navigate('AddContact');

// To Send screen with selected address
navigation.navigate('Send', { selectedAddress: contact.address });

// To Edit Contact screen
navigation.navigate('AddContact', { contact });
```

### 2. AddContactScreen

Screen for adding new contacts or editing existing ones.

**Location**: `src/screens/AddContactScreen.tsx`

#### Features

- Add new contact with name, address, and optional label
- Edit existing contact information
- QR code scanner integration for address input
- Ethereum address validation
- Duplicate address detection
- Form validation with error messages
- Auto-focus on name input

#### Form Fields

```typescript
interface ContactForm {
  name: string; // Required, min 1 character
  address: string; // Required, valid Ethereum address
  label?: string; // Optional, e.g., "Friend", "Exchange"
  network?: string; // Optional, e.g., "Ethereum", "Polygon"
}
```

#### Validation Rules

- **Name**: Required, at least 1 character
- **Address**: Required, valid Ethereum address (0x... format)
- **Duplicate Check**: Prevents saving duplicate addresses
- **Address Format**: Must start with "0x" and be 42 characters long

#### QR Scanner Integration

```typescript
const handleScan = (data: string) => {
  setAddress(data);
  setShowScanner(false);
};

<Button onPress={() => setShowScanner(true)}>
  Scan QR Code
</Button>
```

## Redux State Management

**Location**: `src/store/slices/addressBookSlice.ts`

### State Interface

```typescript
interface Contact {
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
```

### Actions

#### `addContact`

Add a new contact to the address book.

```typescript
dispatch(
  addContact({
    name: 'Alice',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    label: 'Friend',
    network: 'Ethereum',
  })
);
```

#### `updateContact`

Update an existing contact.

```typescript
dispatch(
  updateContact({
    id: '1234567890',
    name: 'Alice Smith',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    label: 'Best Friend',
  })
);
```

#### `deleteContact`

Delete a contact by ID.

```typescript
dispatch(deleteContact('1234567890'));
```

#### `setSearchQuery`

Set the search query for filtering contacts.

```typescript
dispatch(setSearchQuery('alice'));
```

#### `clearSearchQuery`

Clear the search query.

```typescript
dispatch(clearSearchQuery());
```

### Selectors

#### `selectContacts`

Get all contacts.

```typescript
const contacts = useAppSelector(selectContacts);
```

#### `selectFilteredContacts`

Get filtered contacts based on search query.

```typescript
const filteredContacts = useAppSelector(selectFilteredContacts);
```

#### `selectSearchQuery`

Get current search query.

```typescript
const searchQuery = useAppSelector(selectSearchQuery);
```

## Persistence

The address book state is persisted using Redux Persist with AsyncStorage:

```typescript
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['wallet', 'onboarding', 'addressBook'], // Address book is persisted
};
```

This ensures:

- Contacts survive app restarts
- Data is stored locally on device
- No cloud sync (privacy-first)

## Integration with Send Screen

The Send screen integrates with Address Book:

```typescript
// In SendScreen
const route = useRoute<SendScreenRouteProp>();
const selectedAddress = route.params?.selectedAddress;

useEffect(() => {
  if (selectedAddress) {
    setRecipient(selectedAddress);
  }
}, [selectedAddress]);

// Address Book button
<Button onPress={() => navigation.navigate('AddressBook')}>
  Select from Address Book
</Button>
```

## Usage Examples

### Adding a Contact

```typescript
import { useAppDispatch } from '../store/hooks';
import { addContact } from '../store/slices/addressBookSlice';

const handleAddContact = () => {
  dispatch(
    addContact({
      name: 'Bob',
      address: '0x1234567890123456789012345678901234567890',
      label: 'Work',
      network: 'Ethereum',
    })
  );
};
```

### Searching Contacts

```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSearchQuery, selectFilteredContacts } from '../store/slices/addressBookSlice';

const SearchContacts = () => {
  const dispatch = useAppDispatch();
  const filteredContacts = useAppSelector(selectFilteredContacts);

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  return (
    <View>
      <TextInput
        onChangeText={handleSearch}
        placeholder="Search contacts..."
      />
      {filteredContacts.map(contact => (
        <ContactItem key={contact.id} contact={contact} />
      ))}
    </View>
  );
};
```

### Deleting a Contact

```typescript
import { Alert } from 'react-native';
import { useAppDispatch } from '../store/hooks';
import { deleteContact } from '../store/slices/addressBookSlice';

const handleDelete = (contact: Contact) => {
  Alert.alert('Delete Contact', `Are you sure you want to delete ${contact.name}?`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        dispatch(deleteContact(contact.id));
        Alert.alert('Success', 'Contact deleted successfully');
      },
    },
  ]);
};
```

## Localization

The Address Book feature supports English and Korean:

```typescript
addressBook: {
  title: 'Address Book',
  addContact: 'Add Contact',
  editContact: 'Edit Contact',
  searchPlaceholder: 'Search contacts...',
  emptyState: {
    title: 'No contacts yet',
    description: 'Add contacts to quickly send transactions',
  },
  deleteContact: 'Delete Contact',
  confirmDelete: 'Are you sure you want to delete this contact?',
  deleteSuccess: 'Contact deleted successfully',
  form: {
    name: 'Name',
    namePlaceholder: 'Enter contact name',
    address: 'Address',
    addressPlaceholder: 'Enter wallet address',
    label: 'Label (Optional)',
    labelPlaceholder: 'e.g., Friend, Exchange',
    network: 'Network (Optional)',
    networkPlaceholder: 'e.g., Ethereum, Polygon',
    scanQR: 'Scan QR Code',
    save: 'Save Contact',
  },
  errors: {
    nameRequired: 'Name is required',
    addressRequired: 'Address is required',
    invalidAddress: 'Invalid Ethereum address',
    duplicateAddress: 'This address is already saved',
  }
}
```

## Testing

Comprehensive tests are available in:

- `src/__tests__/screens/AddressBookScreen.test.tsx`
- `src/__tests__/screens/AddContactScreen.test.tsx`
- `src/__tests__/store/slices/addressBookSlice.test.ts`

Test coverage includes:

- CRUD operations
- Search functionality
- Address validation
- Duplicate detection
- Navigation flows
- Error handling
- Empty states

## Security Considerations

- All data stored locally on device
- No cloud sync or external storage
- Addresses are validated before saving
- User confirmation required for deletions
- No automatic transaction execution

## Best Practices

1. **Always validate addresses** before saving
2. **Use labels** to organize contacts (e.g., "Personal", "Exchange", "Work")
3. **Double-check addresses** when adding new contacts
4. **Use QR scanner** when available to avoid typos
5. **Regularly review** and clean up unused contacts
6. **Test with small amounts** before sending large transactions

## Known Limitations

- No contact import/export functionality
- No contact grouping or categories
- No contact notes or additional fields
- No contact photos or avatars
- No multi-network address support per contact
