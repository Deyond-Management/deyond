/**
 * ChatHomeScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ChatHomeScreen } from '../../screens/ChatHomeScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock useDeyondCrypt hook
jest.mock('../../hooks', () => ({
  ...jest.requireActual('../../hooks'),
  useDeyondCrypt: jest.fn(() => ({
    isInitialized: true,
    isLoading: false,
    hasIdentity: true,
    sessions: [],
    initialize: jest.fn(),
    contacts: [],
    groups: [],
    myAddress: '0x1234',
    myChainType: 'evm',
    error: null,
  })),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

// Mock sessions with all required ChatSession properties
const mockSessions = [
  {
    id: 'session-1',
    peerAddress: '0x1234567890123456789012345678901234567890',
    peerChainType: 'evm' as const,
    peerName: 'Alice',
    lastMessage: 'Hello there!',
    lastMessageTime: Date.now() - 1000 * 60 * 5,
    unreadCount: 2,
    isActive: true,
    messages: [],
  },
  {
    id: 'session-2',
    peerAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    peerChainType: 'evm' as const,
    peerName: 'Bob',
    lastMessage: 'See you later',
    lastMessageTime: Date.now() - 1000 * 60 * 60,
    unreadCount: 0,
    isActive: true,
    messages: [],
  },
];

describe('ChatHomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render chat home title', () => {
      const { getByText } = renderWithTheme(<ChatHomeScreen navigation={mockNavigation as any} />);

      expect(getByText('Messages')).toBeDefined();
    });

    it('should render new chat button', () => {
      const { getByTestId } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('new-chat-button')).toBeDefined();
    });

    it('should render session list', () => {
      const { getByTestId } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} initialSessions={mockSessions} />
      );

      expect(getByTestId('session-list')).toBeDefined();
    });
  });

  describe('Session Items', () => {
    it('should display session peer name', () => {
      const { getByText } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} initialSessions={mockSessions} />
      );

      expect(getByText('Alice')).toBeDefined();
      expect(getByText('Bob')).toBeDefined();
    });

    it('should display last message preview', () => {
      const { getByText } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} initialSessions={mockSessions} />
      );

      expect(getByText('Hello there!')).toBeDefined();
    });

    it('should display unread count badge', () => {
      const { getByTestId } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} initialSessions={mockSessions} />
      );

      expect(getByTestId('unread-badge-session-1')).toBeDefined();
    });

    it('should not display badge for zero unread', () => {
      const { queryByTestId } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} initialSessions={mockSessions} />
      );

      expect(queryByTestId('unread-badge-session-2')).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('should navigate to device discovery when new chat is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('new-chat-button'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('DeviceDiscovery');
    });

    it('should navigate to chat when session is pressed', () => {
      const { getAllByTestId } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} initialSessions={mockSessions} />
      );

      const sessionItems = getAllByTestId(/session-item-/);
      fireEvent.press(sessionItems[0]);

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'ChatConversation',
        expect.objectContaining({ sessionId: 'session-1' })
      );
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no sessions', () => {
      const { getByTestId } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} initialSessions={[]} />
      );

      expect(getByTestId('empty-state')).toBeDefined();
    });

    it('should show appropriate message for empty state', () => {
      const { getByText } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} initialSessions={[]} />
      );

      expect(getByText(/No conversations/i)).toBeDefined();
    });
  });

  describe('Session Status', () => {
    it('should show active indicator for active sessions', () => {
      const { getByTestId } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} initialSessions={mockSessions} />
      );

      expect(getByTestId('active-indicator-session-1')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible new chat button', () => {
      const { getAllByLabelText } = renderWithTheme(
        <ChatHomeScreen navigation={mockNavigation as any} />
      );

      // Multiple "new chat" elements (header button + empty state action)
      const newChatElements = getAllByLabelText(/new chat/i);
      expect(newChatElements.length).toBeGreaterThan(0);
    });
  });
});
