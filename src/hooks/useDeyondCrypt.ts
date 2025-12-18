/**
 * useDeyondCrypt Hook
 * React hook for DeyondCrypt encrypted messaging service
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DeyondCryptService,
  getDeyondCryptService,
  DeyondCryptContact,
  DecryptedMessage,
  DeyondCryptGroupInfo,
} from '../services';
import { PreKeyBundle, ChainType } from '../crypto/deyondcrypt';

// =============================================================================
// Types
// =============================================================================

export interface ChatMessage {
  id: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'transaction';
  timestamp: number;
  isOwn: boolean;
  senderAddress: string;
  senderChainType: ChainType;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  peerAddress: string;
  peerChainType: ChainType;
  peerName: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  isActive: boolean;
  messages: ChatMessage[];
}

export interface DeyondCryptState {
  isInitialized: boolean;
  isLoading: boolean;
  hasIdentity: boolean;
  myAddress: string | null;
  myChainType: ChainType | null;
  contacts: DeyondCryptContact[];
  sessions: ChatSession[];
  groups: DeyondCryptGroupInfo[];
  error: Error | null;
}

// =============================================================================
// Hook
// =============================================================================

export function useDeyondCrypt() {
  const serviceRef = useRef<DeyondCryptService>(getDeyondCryptService());

  const [state, setState] = useState<DeyondCryptState>({
    isInitialized: false,
    isLoading: true,
    hasIdentity: false,
    myAddress: null,
    myChainType: null,
    contacts: [],
    sessions: [],
    groups: [],
    error: null,
  });

  // Initialize service
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      await serviceRef.current.initialize();

      const hasIdentity = serviceRef.current.hasIdentityKey();
      const myAddress = serviceRef.current.getMyAddress();
      const myChainType = serviceRef.current.getMyChainType();
      const contacts = serviceRef.current.getAllContacts();
      const groups = await serviceRef.current.listGroups();

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        hasIdentity,
        myAddress,
        myChainType,
        contacts,
        groups,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, []);

  // Setup messaging (create identity)
  const setupMessaging = useCallback(
    async (walletPrivateKey: Uint8Array, chainType: ChainType = 'evm') => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const preKeyBundle = await serviceRef.current.setupMessaging(walletPrivateKey, chainType);

        setState(prev => ({
          ...prev,
          isLoading: false,
          hasIdentity: true,
          myAddress: serviceRef.current.getMyAddress(),
          myChainType: serviceRef.current.getMyChainType(),
        }));

        return preKeyBundle;
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
        throw error;
      }
    },
    []
  );

  // Get my pre-key bundle
  const getMyPreKeyBundle = useCallback(async () => {
    return await serviceRef.current.getMyPreKeyBundle();
  }, []);

  // Add or update contact
  const addContact = useCallback(async (contact: DeyondCryptContact) => {
    await serviceRef.current.addOrUpdateContact(contact);

    setState(prev => ({
      ...prev,
      contacts: serviceRef.current.getAllContacts(),
    }));
  }, []);

  // Remove contact
  const removeContact = useCallback(async (address: string) => {
    await serviceRef.current.removeContact(address);

    setState(prev => ({
      ...prev,
      contacts: serviceRef.current.getAllContacts(),
    }));
  }, []);

  // Establish session with contact
  const establishSession = useCallback(async (preKeyBundle: PreKeyBundle) => {
    const { sessionId } = await serviceRef.current.establishSession(preKeyBundle);

    // Create local session object
    const newSession: ChatSession = {
      id: sessionId,
      peerAddress: preKeyBundle.address,
      peerChainType: preKeyBundle.chainType,
      peerName: preKeyBundle.address.slice(0, 8) + '...',
      lastMessage: '',
      lastMessageTime: Date.now(),
      unreadCount: 0,
      isActive: true,
      messages: [],
    };

    setState(prev => ({
      ...prev,
      sessions: [...prev.sessions, newSession],
      contacts: serviceRef.current.getAllContacts(),
    }));

    return sessionId;
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (
      sessionId: string,
      recipientAddress: string,
      recipientChainType: ChainType,
      content: string,
      contentType: 'text' | 'image' | 'file' = 'text'
    ) => {
      // Create pending message
      const pendingMessage: ChatMessage = {
        id: `pending-${Date.now()}`,
        content,
        contentType,
        timestamp: Date.now(),
        isOwn: true,
        senderAddress: state.myAddress || '',
        senderChainType: state.myChainType || 'evm',
        status: 'sending',
      };

      // Add to session immediately for UI feedback
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.id === sessionId
            ? {
                ...session,
                messages: [...session.messages, pendingMessage],
                lastMessage: content,
                lastMessageTime: pendingMessage.timestamp,
              }
            : session
        ),
      }));

      try {
        const result = await serviceRef.current.sendMessage(
          recipientAddress,
          recipientChainType,
          content,
          contentType
        );

        // Update message status
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.map(session =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map(msg =>
                    msg.id === pendingMessage.id
                      ? { ...msg, id: result.messageId, status: 'sent' as const }
                      : msg
                  ),
                }
              : session
          ),
        }));

        return result;
      } catch (error) {
        // Update message status to failed
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.map(session =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map(msg =>
                    msg.id === pendingMessage.id ? { ...msg, status: 'failed' as const } : msg
                  ),
                }
              : session
          ),
          error: error as Error,
        }));
        throw error;
      }
    },
    [state.myAddress, state.myChainType]
  );

  // Receive message (call this when receiving from network)
  const receiveMessage = useCallback(
    async (envelope: Parameters<DeyondCryptService['receiveMessage']>[0]) => {
      try {
        const decrypted = await serviceRef.current.receiveMessage(envelope);

        const newMessage: ChatMessage = {
          id: decrypted.messageId,
          content: decrypted.content,
          contentType: decrypted.contentType,
          timestamp: decrypted.timestamp,
          isOwn: false,
          senderAddress: decrypted.senderAddress,
          senderChainType: decrypted.senderChainType,
          status: 'delivered',
          metadata: decrypted.metadata,
        };

        // Find or create session
        setState(prev => {
          const existingSession = prev.sessions.find(
            s => s.peerAddress.toLowerCase() === decrypted.senderAddress.toLowerCase()
          );

          if (existingSession) {
            return {
              ...prev,
              sessions: prev.sessions.map(session =>
                session.id === existingSession.id
                  ? {
                      ...session,
                      messages: [...session.messages, newMessage],
                      lastMessage: decrypted.content,
                      lastMessageTime: decrypted.timestamp,
                      unreadCount: session.unreadCount + 1,
                    }
                  : session
              ),
            };
          } else {
            // Create new session
            const newSession: ChatSession = {
              id: `session-${Date.now()}`,
              peerAddress: decrypted.senderAddress,
              peerChainType: decrypted.senderChainType,
              peerName: decrypted.senderAddress.slice(0, 8) + '...',
              lastMessage: decrypted.content,
              lastMessageTime: decrypted.timestamp,
              unreadCount: 1,
              isActive: true,
              messages: [newMessage],
            };

            return {
              ...prev,
              sessions: [...prev.sessions, newSession],
            };
          }
        });

        return decrypted;
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error as Error,
        }));
        throw error;
      }
    },
    []
  );

  // Mark session as read
  const markSessionRead = useCallback((sessionId: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.id === sessionId ? { ...session, unreadCount: 0 } : session
      ),
    }));
  }, []);

  // Create group
  const createGroup = useCallback(async (groupName: string, memberAddresses: string[] = []) => {
    const result = await serviceRef.current.createGroup(groupName, memberAddresses);
    const groups = await serviceRef.current.listGroups();

    setState(prev => ({
      ...prev,
      groups,
    }));

    return result;
  }, []);

  // Send group message
  const sendGroupMessage = useCallback(async (groupId: string, content: string) => {
    return await serviceRef.current.sendGroupMessage(groupId, content);
  }, []);

  // Get group messages (stub - to be implemented)
  const getGroupMessages = useCallback(async (groupId: string) => {
    // TODO: Implement in service
    return [] as Array<{
      id: string;
      content: string;
      senderAddress: string;
      senderName?: string;
      timestamp: number;
      status: 'sending' | 'sent' | 'delivered' | 'read';
    }>;
  }, []);

  // Mark group as read (stub - to be implemented)
  const markGroupRead = useCallback(async (groupId: string) => {
    // TODO: Implement in service
  }, []);

  // Leave group (stub - to be implemented)
  const leaveGroup = useCallback(async (groupId: string) => {
    // TODO: Implement in service
    const groups = await serviceRef.current.listGroups();
    setState(prev => ({ ...prev, groups }));
  }, []);

  // Process pre-key bundle from another user
  const processPreKeyBundle = useCallback(async (bundle: any) => {
    // TODO: Implement proper processing
    return true;
  }, []);

  // Clear all data
  const clearAllData = useCallback(async () => {
    await serviceRef.current.clearAllData();

    setState({
      isInitialized: false,
      isLoading: false,
      hasIdentity: false,
      myAddress: null,
      myChainType: null,
      contacts: [],
      sessions: [],
      groups: [],
      error: null,
    });
  }, []);

  // Get session by ID
  const getSession = useCallback(
    (sessionId: string) => {
      return state.sessions.find(s => s.id === sessionId);
    },
    [state.sessions]
  );

  // Get session by peer address
  const getSessionByAddress = useCallback(
    (address: string) => {
      return state.sessions.find(s => s.peerAddress.toLowerCase() === address.toLowerCase());
    },
    [state.sessions]
  );

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // State
    ...state,

    // Actions
    initialize,
    setupMessaging,
    getMyPreKeyBundle,
    addContact,
    removeContact,
    establishSession,
    sendMessage,
    receiveMessage,
    markSessionRead,
    createGroup,
    sendGroupMessage,
    getGroupMessages,
    markGroupRead,
    leaveGroup,
    processPreKeyBundle,
    clearAllData,

    // Helpers
    getSession,
    getSessionByAddress,
  };
}

export default useDeyondCrypt;
