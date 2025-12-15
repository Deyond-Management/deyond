/**
 * Web3 Provider Injection
 * JavaScript code to inject Web3 provider into DApp WebView
 */

/**
 * Generate Web3 provider injection JavaScript
 * This will be injected into the WebView to provide window.ethereum
 */
export const getWeb3ProviderScript = (chainId: number, address?: string): string => {
  return `
(function() {
  // Prevent double injection
  if (window.ethereum) {
    return;
  }

  const CHAIN_ID = ${chainId};
  const SELECTED_ADDRESS = ${address ? `"${address}"` : 'null'};

  class Web3Provider {
    constructor() {
      this.isMetaMask = true;
      this.isConnected_ = true;
      this.chainId = '0x' + CHAIN_ID.toString(16);
      this.networkVersion = CHAIN_ID.toString();
      this.selectedAddress = SELECTED_ADDRESS;
      this._events = {};
      this._nextId = 1;
      this._promises = {};
    }

    // EIP-1102: Request accounts
    enable() {
      return this.request({ method: 'eth_requestAccounts' });
    }

    // EIP-1193: Request method
    request(args) {
      return new Promise((resolve, reject) => {
        const id = this._nextId++;

        this._promises[id] = { resolve, reject };

        // Send message to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'web3-request',
          id: id,
          method: args.method,
          params: args.params || []
        }));

        // Timeout after 60 seconds
        setTimeout(() => {
          if (this._promises[id]) {
            delete this._promises[id];
            reject(new Error('Request timeout'));
          }
        }, 60000);
      });
    }

    // Legacy sendAsync
    sendAsync(payload, callback) {
      this.request({
        method: payload.method,
        params: payload.params
      })
        .then(result => callback(null, { id: payload.id, jsonrpc: '2.0', result }))
        .catch(error => callback(error, null));
    }

    // Legacy send
    send(methodOrPayload, paramsOrCallback) {
      if (typeof methodOrPayload === 'string') {
        return this.request({
          method: methodOrPayload,
          params: paramsOrCallback
        });
      }

      if (typeof paramsOrCallback === 'function') {
        return this.sendAsync(methodOrPayload, paramsOrCallback);
      }

      return this.request(methodOrPayload);
    }

    // Handle response from React Native
    _handleResponse(response) {
      const promise = this._promises[response.id];
      if (!promise) return;

      delete this._promises[response.id];

      if (response.error) {
        promise.reject(new Error(response.error.message));
      } else {
        promise.resolve(response.result);
      }
    }

    // Handle chain change
    _handleChainChanged(chainId) {
      this.chainId = chainId;
      this.networkVersion = parseInt(chainId, 16).toString();
      this.emit('chainChanged', chainId);
      this.emit('networkChanged', this.networkVersion);
    }

    // Handle account change
    _handleAccountsChanged(accounts) {
      this.selectedAddress = accounts[0] || null;
      this.emit('accountsChanged', accounts);
    }

    // Event emitter
    on(event, callback) {
      if (!this._events[event]) {
        this._events[event] = [];
      }
      this._events[event].push(callback);
    }

    removeListener(event, callback) {
      if (!this._events[event]) return;
      this._events[event] = this._events[event].filter(cb => cb !== callback);
    }

    emit(event, ...args) {
      if (!this._events[event]) return;
      this._events[event].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }

    isConnected() {
      return this.isConnected_;
    }
  }

  // Create provider instance
  const provider = new Web3Provider();

  // Listen for messages from React Native
  window.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'web3-response':
          provider._handleResponse(data);
          break;
        case 'web3-chainChanged':
          provider._handleChainChanged(data.chainId);
          break;
        case 'web3-accountsChanged':
          provider._handleAccountsChanged(data.accounts);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Inject provider
  window.ethereum = provider;
  window.web3 = {
    currentProvider: provider
  };

  // Announce to DApp that provider is ready
  window.dispatchEvent(new Event('ethereum#initialized'));
})();

true; // Return value to prevent errors
`;
};

/**
 * Quick responses for common read-only requests
 */
export const getQuickResponseScript = (chainId: number, address?: string): string => {
  return `
(function() {
  // Override some methods for quick responses
  const originalRequest = window.ethereum.request.bind(window.ethereum);

  window.ethereum.request = function(args) {
    // Handle eth_accounts immediately
    if (args.method === 'eth_accounts') {
      return Promise.resolve(${address ? `["${address}"]` : '[]'});
    }

    // Handle eth_chainId immediately
    if (args.method === 'eth_chainId') {
      return Promise.resolve('0x' + ${chainId}.toString(16));
    }

    // Handle net_version immediately
    if (args.method === 'net_version') {
      return Promise.resolve(${chainId}.toString());
    }

    // Other requests go through normal flow
    return originalRequest(args);
  };
})();

true;
`;
};
