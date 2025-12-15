/**
 * DAppBrowserScreen
 * WebView-based DApp browser with Web3 provider injection
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { useTheme } from '../contexts/ThemeContext';
import {
  getWeb3ProviderScript,
  getQuickResponseScript,
} from '../services/dapp/Web3ProviderInjection';
import Web3RequestHandler, {
  Web3RequestHandlerCallbacks,
} from '../services/dapp/Web3RequestHandler';
import { Web3Request, TransactionRequest } from '../types/dapp';
import { getChainManager } from '../services/blockchain/ChainManager';
import i18n from '../i18n';

interface DAppBrowserScreenProps {
  navigation: any;
  route?: {
    params?: {
      url?: string;
      address?: string;
    };
  };
}

export const DAppBrowserScreen: React.FC<DAppBrowserScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const chainManager = getChainManager();

  // Props
  const initialUrl = route?.params?.url || 'https://app.uniswap.org';
  const walletAddress = route?.params?.address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  // State
  const [url, setUrl] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Web3 Request Handler
  const requestHandlerRef = useRef<Web3RequestHandler | null>(null);

  // Initialize request handler
  useEffect(() => {
    const callbacks: Web3RequestHandlerCallbacks = {
      onTransactionRequest: async (tx: TransactionRequest) => {
        // TODO: Show transaction approval modal
        return new Promise((resolve, reject) => {
          Alert.alert(
            i18n.t('dappBrowser.transactionRequest'),
            `${i18n.t('send.to')}: ${tx.to}\n${i18n.t('send.amount')}: ${tx.value || '0'} ETH`,
            [
              {
                text: i18n.t('common.cancel'),
                onPress: () => reject(new Error('User rejected transaction')),
                style: 'cancel',
              },
              {
                text: i18n.t('common.confirm'),
                onPress: () => {
                  // TODO: Actually send transaction
                  resolve('0x' + '0'.repeat(64));
                },
              },
            ]
          );
        });
      },
      onSignRequest: async (message: string, address: string) => {
        // TODO: Show sign message modal
        return new Promise((resolve, reject) => {
          Alert.alert(i18n.t('dappBrowser.signRequest'), message, [
            {
              text: i18n.t('common.cancel'),
              onPress: () => reject(new Error('User rejected signing')),
              style: 'cancel',
            },
            {
              text: i18n.t('common.confirm'),
              onPress: () => {
                // TODO: Actually sign message
                resolve('0x' + '0'.repeat(130));
              },
            },
          ]);
        });
      },
      onSignTypedDataRequest: async (typedData: any, address: string) => {
        // TODO: Show sign typed data modal
        return new Promise((resolve, reject) => {
          Alert.alert(i18n.t('dappBrowser.signRequest'), 'Sign Typed Data', [
            {
              text: i18n.t('common.cancel'),
              onPress: () => reject(new Error('User rejected signing')),
              style: 'cancel',
            },
            {
              text: i18n.t('common.confirm'),
              onPress: () => {
                // TODO: Actually sign typed data
                resolve('0x' + '0'.repeat(130));
              },
            },
          ]);
        });
      },
      onChainSwitchRequest: async (chainId: number) => {
        await chainManager.switchChain(chainId);
        // Reload page to reflect new chain
        webViewRef.current?.reload();
      },
    };

    requestHandlerRef.current = new Web3RequestHandler(callbacks, walletAddress);
  }, [walletAddress]);

  // Inject Web3 provider
  const injectedJavaScript = `
    ${getWeb3ProviderScript(chainManager.getChainId(), walletAddress)}
    ${getQuickResponseScript(chainManager.getChainId(), walletAddress)}
  `;

  // Handle messages from WebView
  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'web3-request' && requestHandlerRef.current) {
        const request: Web3Request = {
          id: message.id,
          method: message.method,
          params: message.params,
        };

        const response = await requestHandlerRef.current.handleRequest(request);

        // Send response back to WebView
        webViewRef.current?.injectJavaScript(`
            window.ethereum._handleResponse(${JSON.stringify(response)});
            true;
          `);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  }, []);

  // Handle navigation state change
  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCurrentUrl(navState.url);
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setLoading(navState.loading);
  }, []);

  // Handle load progress
  const handleLoadProgress = useCallback(({ nativeEvent }: any) => {
    setProgress(nativeEvent.progress);
  }, []);

  // Navigation actions
  const goBack = useCallback(() => {
    webViewRef.current?.goBack();
  }, []);

  const goForward = useCallback(() => {
    webViewRef.current?.goForward();
  }, []);

  const reload = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

  const navigateToUrl = useCallback(() => {
    if (url) {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      setCurrentUrl(formattedUrl);
    }
  }, [url]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.divider },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: theme.colors.primary }]}>
            {i18n.t('common.close')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {i18n.t('dappBrowser.title')}
        </Text>

        <View style={styles.placeholder} />
      </View>

      {/* URL Bar */}
      <View
        style={[
          styles.urlBar,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.divider },
        ]}
      >
        <TextInput
          style={[
            styles.urlInput,
            { color: theme.colors.text.primary, backgroundColor: theme.colors.background },
          ]}
          value={url}
          onChangeText={setUrl}
          onSubmitEditing={navigateToUrl}
          placeholder="Enter URL"
          placeholderTextColor={theme.colors.text.secondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
        />
        <TouchableOpacity onPress={reload} style={styles.reloadButton}>
          <Text style={{ color: theme.colors.primary }}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {loading && progress < 1 && (
        <View style={[styles.progressBar, { backgroundColor: theme.colors.divider }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: theme.colors.primary },
            ]}
          />
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadProgress={handleLoadProgress}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      />

      {/* Navigation Bar */}
      <View
        style={[
          styles.navBar,
          { backgroundColor: theme.colors.card, borderTopColor: theme.colors.divider },
        ]}
      >
        <TouchableOpacity onPress={goBack} disabled={!canGoBack} style={styles.navButton}>
          <Text
            style={[
              styles.navButtonText,
              { color: canGoBack ? theme.colors.primary : theme.colors.text.secondary },
            ]}
          >
            ←
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goForward} disabled={!canGoForward} style={styles.navButton}>
          <Text
            style={[
              styles.navButtonText,
              { color: canGoForward ? theme.colors.primary : theme.colors.text.secondary },
            ]}
          >
            →
          </Text>
        </TouchableOpacity>

        <View style={styles.navSpacer} />

        <TouchableOpacity
          onPress={() => {
            // TODO: Open bookmarks
          }}
          style={styles.navButton}
        >
          <Text style={[styles.navButtonText, { color: theme.colors.primary }]}>★</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: 8,
    width: 60,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  navBar: {
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    width: 50,
  },
  navButtonText: {
    fontSize: 24,
  },
  navSpacer: {
    flex: 1,
  },
  placeholder: {
    width: 60,
  },
  progressBar: {
    height: 2,
  },
  progressFill: {
    height: '100%',
  },
  reloadButton: {
    fontSize: 20,
    marginLeft: 8,
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  urlBar: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  urlInput: {
    borderRadius: 8,
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  webview: {
    flex: 1,
  },
});

export default DAppBrowserScreen;
