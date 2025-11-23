/**
 * SupportService
 * Customer support integration (Zendesk, Intercom, etc.)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface SupportConfig {
  provider: 'zendesk' | 'intercom' | 'freshdesk';
  apiKey: string;
  baseUrl?: string;
  appId?: string;
}

interface SupportTicket {
  id?: string;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  userEmail?: string;
  deviceInfo?: DeviceInfo;
  attachments?: string[];
  status?: 'new' | 'open' | 'pending' | 'solved' | 'closed';
  createdAt?: number;
}

interface DeviceInfo {
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceModel: string;
  locale: string;
}

interface FAQArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  views: number;
}

interface SupportMessage {
  id: string;
  ticketId: string;
  message: string;
  sender: 'user' | 'agent';
  timestamp: number;
  attachments?: string[];
}

const TICKETS_CACHE_KEY = '@support_tickets_cache';
const FAQ_CACHE_KEY = '@support_faq_cache';

export class SupportService {
  private config: SupportConfig;

  constructor(config: SupportConfig) {
    this.config = config;
  }

  /**
   * Create a support ticket
   */
  async createTicket(ticket: SupportTicket): Promise<{ id: string; success: boolean }> {
    try {
      const endpoint = this.getTicketEndpoint();
      const body = this.formatTicketPayload(ticket);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ticket: ${response.statusText}`);
      }

      const data = await response.json();
      const ticketId = this.extractTicketId(data);

      // Cache locally
      await this.cacheTicket({ ...ticket, id: ticketId, status: 'new', createdAt: Date.now() });

      return { id: ticketId, success: true };
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      return { id: '', success: false };
    }
  }

  /**
   * Get ticket endpoint based on provider
   */
  private getTicketEndpoint(): string {
    switch (this.config.provider) {
      case 'zendesk':
        return `${this.config.baseUrl}/api/v2/tickets`;
      case 'intercom':
        return 'https://api.intercom.io/conversations';
      case 'freshdesk':
        return `${this.config.baseUrl}/api/v2/tickets`;
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (this.config.provider) {
      case 'zendesk':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
      case 'intercom':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        headers['Intercom-Version'] = '2.9';
        break;
      case 'freshdesk':
        headers['Authorization'] =
          `Basic ${Buffer.from(`${this.config.apiKey}:X`).toString('base64')}`;
        break;
    }

    return headers;
  }

  /**
   * Format ticket payload for provider
   */
  private formatTicketPayload(ticket: SupportTicket): unknown {
    switch (this.config.provider) {
      case 'zendesk':
        return {
          ticket: {
            subject: ticket.subject,
            description: ticket.description,
            priority: ticket.priority,
            tags: [ticket.category],
            requester: ticket.userEmail ? { email: ticket.userEmail } : undefined,
            custom_fields: ticket.deviceInfo
              ? [{ id: 'device_info', value: JSON.stringify(ticket.deviceInfo) }]
              : undefined,
          },
        };
      case 'intercom':
        return {
          type: 'user',
          body: `${ticket.subject}\n\n${ticket.description}`,
          user: ticket.userEmail ? { email: ticket.userEmail } : undefined,
        };
      case 'freshdesk':
        return {
          subject: ticket.subject,
          description: ticket.description,
          priority: this.mapPriorityToFreshdesk(ticket.priority),
          email: ticket.userEmail,
          tags: [ticket.category],
        };
      default:
        return ticket;
    }
  }

  /**
   * Map priority to Freshdesk format
   */
  private mapPriorityToFreshdesk(priority: string): number {
    const mapping: Record<string, number> = {
      low: 1,
      normal: 2,
      high: 3,
      urgent: 4,
    };
    return mapping[priority] || 2;
  }

  /**
   * Extract ticket ID from response
   */
  private extractTicketId(data: unknown): string {
    const obj = data as Record<string, unknown>;
    switch (this.config.provider) {
      case 'zendesk':
        return String((obj.ticket as Record<string, unknown>)?.id || '');
      case 'intercom':
        return String(obj.id || '');
      case 'freshdesk':
        return String(obj.id || '');
      default:
        return '';
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    try {
      const endpoint = `${this.getTicketEndpoint()}/${ticketId}`;

      const response = await fetch(endpoint, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.parseTicketResponse(data);
    } catch {
      return null;
    }
  }

  /**
   * Parse ticket response
   */
  private parseTicketResponse(data: unknown): SupportTicket {
    const obj = data as Record<string, unknown>;
    const ticket = (obj.ticket || obj) as Record<string, unknown>;

    return {
      id: String(ticket.id || ''),
      subject: String(ticket.subject || ''),
      description: String(ticket.description || ''),
      priority: (ticket.priority as SupportTicket['priority']) || 'normal',
      category: String(ticket.category || ''),
      status: (ticket.status as SupportTicket['status']) || 'new',
      createdAt: ticket.created_at ? new Date(ticket.created_at as string).getTime() : Date.now(),
    };
  }

  /**
   * Get user's tickets
   */
  async getUserTickets(): Promise<SupportTicket[]> {
    const cached = await AsyncStorage.getItem(TICKETS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  /**
   * Cache ticket locally
   */
  private async cacheTicket(ticket: SupportTicket): Promise<void> {
    const tickets = await this.getUserTickets();
    tickets.unshift(ticket);
    await AsyncStorage.setItem(TICKETS_CACHE_KEY, JSON.stringify(tickets.slice(0, 50)));
  }

  /**
   * Add message to ticket
   */
  async addMessage(ticketId: string, message: string): Promise<boolean> {
    try {
      let endpoint: string;
      let body: unknown;

      switch (this.config.provider) {
        case 'zendesk':
          endpoint = `${this.config.baseUrl}/api/v2/tickets/${ticketId}`;
          body = { ticket: { comment: { body: message } } };
          break;
        case 'intercom':
          endpoint = `https://api.intercom.io/conversations/${ticketId}/reply`;
          body = { type: 'user', body: message };
          break;
        default:
          return false;
      }

      const response = await fetch(endpoint, {
        method: this.config.provider === 'zendesk' ? 'PUT' : 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get FAQ articles
   */
  async getFAQArticles(category?: string): Promise<FAQArticle[]> {
    // Check cache first
    const cached = await AsyncStorage.getItem(FAQ_CACHE_KEY);
    let articles: FAQArticle[];

    if (cached) {
      articles = JSON.parse(cached) as FAQArticle[];
    } else {
      // Default FAQ articles
      articles = this.getDefaultFAQs();
    }

    if (category) {
      return articles.filter(a => a.category === category);
    }
    return articles;
  }

  /**
   * Get default FAQ articles
   */
  private getDefaultFAQs(): FAQArticle[] {
    return [
      {
        id: '1',
        title: 'How do I backup my wallet?',
        content:
          'Your recovery phrase is the backup for your wallet. Write down the 12/24 words in order and store them safely offline.',
        category: 'security',
        views: 1500,
      },
      {
        id: '2',
        title: 'What happens if I lose my recovery phrase?',
        content:
          'If you lose your recovery phrase, you will not be able to recover your wallet. There is no way to retrieve lost phrases.',
        category: 'security',
        views: 2200,
      },
      {
        id: '3',
        title: 'How do I send crypto?',
        content:
          'Go to the Send screen, enter the recipient address, amount, and confirm the transaction. Make sure to verify the address.',
        category: 'transactions',
        views: 1800,
      },
      {
        id: '4',
        title: 'Why is my transaction pending?',
        content:
          'Transactions can be pending due to network congestion or low gas fees. You may need to wait or speed up the transaction.',
        category: 'transactions',
        views: 900,
      },
      {
        id: '5',
        title: 'How do I add a new token?',
        content:
          'Go to Settings > Manage Tokens > Add Custom Token and enter the contract address, symbol, and decimals.',
        category: 'tokens',
        views: 750,
      },
      {
        id: '6',
        title: 'Is my wallet secure?',
        content:
          'Yes, your private keys are encrypted and stored locally on your device. We never have access to your funds.',
        category: 'security',
        views: 2500,
      },
    ];
  }

  /**
   * Search FAQs
   */
  async searchFAQs(query: string): Promise<FAQArticle[]> {
    const articles = await this.getFAQArticles();
    const lowerQuery = query.toLowerCase();

    return articles.filter(
      article =>
        article.title.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get FAQ categories
   */
  async getFAQCategories(): Promise<string[]> {
    const articles = await this.getFAQArticles();
    const categories = new Set(articles.map(a => a.category));
    return Array.from(categories);
  }

  /**
   * Track article view
   */
  async trackArticleView(articleId: string): Promise<void> {
    // Analytics tracking would go here
    console.log(`Article viewed: ${articleId}`);
  }

  /**
   * Get contact options
   */
  getContactOptions(): Array<{
    type: string;
    label: string;
    value: string;
  }> {
    return [
      { type: 'email', label: 'Email Support', value: 'support@deyond.io' },
      { type: 'twitter', label: 'Twitter', value: '@deyond_wallet' },
      { type: 'discord', label: 'Discord', value: 'discord.gg/deyond' },
      { type: 'telegram', label: 'Telegram', value: 't.me/deyondwallet' },
    ];
  }

  /**
   * Submit feedback
   */
  async submitFeedback(rating: number, feedback: string, category: string): Promise<boolean> {
    return this.createTicket({
      subject: `User Feedback - ${category}`,
      description: `Rating: ${rating}/5\n\n${feedback}`,
      priority: 'low',
      category: 'feedback',
    }).then(result => result.success);
  }
}

export default SupportService;
