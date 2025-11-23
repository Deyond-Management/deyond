/**
 * DeepLinkService
 * Handle deep links and universal links
 */

interface ParsedLink {
  action: string;
  params: Record<string, string>;
}

interface SendLinkParams {
  address: string;
  amount?: string;
  token?: string;
}

interface EIP681Result {
  address?: string;
  contractAddress?: string;
  function?: string;
  value?: string;
  gas?: string;
  params: Record<string, string>;
}

type LinkHandler = (link: ParsedLink) => void;

export class DeepLinkService {
  private handlers: Map<string, LinkHandler> = new Map();
  private defaultHandler: LinkHandler | null = null;
  private scheme: string = 'deyond';

  /**
   * Parse deep link URL
   */
  parse(url: string): ParsedLink {
    try {
      if (!url.startsWith(`${this.scheme}://`)) {
        return { action: 'invalid', params: {} };
      }

      const urlObj = new URL(url);
      const action = urlObj.hostname || 'unknown';
      const params: Record<string, string> = {};

      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return { action, params };
    } catch {
      return { action: 'invalid', params: {} };
    }
  }

  /**
   * Handle deep link
   */
  handle(url: string): void {
    const parsed = this.parse(url);
    const handler = this.handlers.get(parsed.action);

    if (handler) {
      handler(parsed);
    } else if (this.defaultHandler) {
      this.defaultHandler(parsed);
    }
  }

  /**
   * Register handler for action
   */
  registerHandler(action: string, handler: LinkHandler): void {
    this.handlers.set(action, handler);
  }

  /**
   * Unregister handler
   */
  unregisterHandler(action: string): void {
    this.handlers.delete(action);
  }

  /**
   * Set default handler
   */
  setDefaultHandler(handler: LinkHandler): void {
    this.defaultHandler = handler;
  }

  /**
   * Generate send link
   */
  generateSendLink(params: SendLinkParams): string {
    const searchParams = new URLSearchParams();
    searchParams.set('address', params.address);
    if (params.amount) searchParams.set('amount', params.amount);
    if (params.token) searchParams.set('token', params.token);

    return `${this.scheme}://send?${searchParams.toString()}`;
  }

  /**
   * Generate receive link
   */
  generateReceiveLink(address: string): string {
    return `${this.scheme}://receive?address=${address}`;
  }

  /**
   * Generate WalletConnect link
   */
  generateWCLink(uri: string): string {
    return `${this.scheme}://wc?uri=${encodeURIComponent(uri)}`;
  }

  /**
   * Parse EIP-681 payment link
   */
  parseEIP681(url: string): EIP681Result {
    const result: EIP681Result = { params: {} };

    try {
      // ethereum:0x123/transfer?address=0x456&uint256=1000
      const match = url.match(/^ethereum:([^/?]+)(?:\/([^?]+))?(?:\?(.+))?$/);

      if (!match) {
        return result;
      }

      const [, addressPart, functionName, queryString] = match;

      if (functionName) {
        result.contractAddress = addressPart;
        result.function = functionName;
      } else {
        result.address = addressPart;
      }

      if (queryString) {
        const params = new URLSearchParams(queryString);
        params.forEach((value, key) => {
          if (key === 'value') {
            result.value = value;
          } else if (key === 'gas') {
            result.gas = value;
          } else {
            result.params[key] = value;
          }
        });
      }

      return result;
    } catch {
      return result;
    }
  }
}

export const deepLink = new DeepLinkService();
export default DeepLinkService;
