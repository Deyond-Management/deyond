/**
 * ChatConversationScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ChatConversationScreen } from '../../screens/ChatConversationScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock navigation and route
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const mockRoute = {
  params: {
    sessionId: 'session-1',
    peerName: 'Alice',
    peerAddress: '0x1234567890123456789012345678901234567890',
  },
};

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return renderWithProviders(component);
};

// Mock messages
const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hello!',
    timestamp: Date.now() - 1000 * 60 * 10,
    isOwn: false,
    status: 'delivered' as const,
  },
  {
    id: 'msg-2',
    content: 'Hi there! How are you?',
    timestamp: Date.now() - 1000 * 60 * 5,
    isOwn: true,
    status: 'read' as const,
  },
  {
    id: 'msg-3',
    content: 'I am doing great, thanks for asking!',
    timestamp: Date.now() - 1000 * 60 * 2,
    isOwn: false,
    status: 'delivered' as const,
  },
];

describe('ChatConversationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render peer name in header', () => {
      const { getByText } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByText('Alice')).toBeDefined();
    });

    it('should render message list', () => {
      const { getByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialMessages={mockMessages}
        />
      );

      expect(getByTestId('message-list')).toBeDefined();
    });

    it('should render text input', () => {
      const { getByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByTestId('message-input')).toBeDefined();
    });

    it('should render send button', () => {
      const { getByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByTestId('send-button')).toBeDefined();
    });
  });

  describe('Messages', () => {
    it('should display message content', () => {
      const { getByText } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialMessages={mockMessages}
        />
      );

      expect(getByText('Hello!')).toBeDefined();
      expect(getByText('Hi there! How are you?')).toBeDefined();
    });

    it('should style own messages differently', () => {
      const { getAllByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialMessages={mockMessages}
        />
      );

      const messageBubbles = getAllByTestId(/message-bubble-/);
      expect(messageBubbles.length).toBe(3);
    });

    it('should show message timestamps', () => {
      const { getAllByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialMessages={mockMessages}
        />
      );

      const timestamps = getAllByTestId(/message-time-/);
      expect(timestamps.length).toBe(3);
    });

    it('should show message status for own messages', () => {
      const { getByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialMessages={mockMessages}
        />
      );

      expect(getByTestId('message-status-msg-2')).toBeDefined();
    });
  });

  describe('Input', () => {
    it('should allow typing message', () => {
      const { getByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      const input = getByTestId('message-input');
      fireEvent.changeText(input, 'Test message');

      expect(input.props.value).toBe('Test message');
    });

    it('should disable send button when input is empty', () => {
      const { getByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      const sendButton = getByTestId('send-button');
      expect(sendButton.props.accessibilityState.disabled).toBe(true);
    });

    it('should enable send button when input has text', () => {
      const { getByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      const input = getByTestId('message-input');
      fireEvent.changeText(input, 'Test message');

      const sendButton = getByTestId('send-button');
      expect(sendButton.props.accessibilityState.disabled).toBe(false);
    });

    it('should clear input after sending', () => {
      const { getByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      const input = getByTestId('message-input');
      fireEvent.changeText(input, 'Test message');

      const sendButton = getByTestId('send-button');
      fireEvent.press(sendButton);

      expect(input.props.value).toBe('');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no messages', () => {
      const { getByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialMessages={[]}
        />
      );

      expect(getByTestId('empty-chat')).toBeDefined();
    });

    it('should show appropriate message for empty chat', () => {
      const { getByText } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          initialMessages={[]}
        />
      );

      expect(getByText(/Start a conversation/i)).toBeDefined();
    });
  });

  describe('Header Actions', () => {
    it('should have info button in header', () => {
      const { getByTestId } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByTestId('info-button')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible send button', () => {
      const { getByLabelText } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(getByLabelText(/send/i)).toBeDefined();
    });

    it('should have accessible message input', () => {
      const { getAllByLabelText } = renderWithTheme(
        <ChatConversationScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      const messageInputs = getAllByLabelText(/message/i);
      expect(messageInputs.length).toBeGreaterThan(0);
    });
  });
});
