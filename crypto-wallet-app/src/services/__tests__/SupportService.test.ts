import AsyncStorage from '@react-native-async-storage/async-storage';
import SupportService from '../SupportService';

// Mock fetch
global.fetch = jest.fn();

describe('SupportService', () => {
  let service: SupportService;

  beforeEach(() => {
    service = new SupportService({
      provider: 'zendesk',
      apiKey: 'test-api-key',
      baseUrl: 'https://support.deyond.io',
    });
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('constructor', () => {
    it('should create service with zendesk config', () => {
      expect(service).toBeDefined();
    });

    it('should create service with intercom config', () => {
      const intercomService = new SupportService({
        provider: 'intercom',
        apiKey: 'intercom-key',
      });
      expect(intercomService).toBeDefined();
    });

    it('should create service with freshdesk config', () => {
      const freshdeskService = new SupportService({
        provider: 'freshdesk',
        apiKey: 'freshdesk-key',
        baseUrl: 'https://deyond.freshdesk.com',
      });
      expect(freshdeskService).toBeDefined();
    });
  });

  describe('createTicket', () => {
    it('should create zendesk ticket', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ticket: { id: '12345' } }),
      });

      const result = await service.createTicket({
        subject: 'Test Ticket',
        description: 'This is a test',
        priority: 'normal',
        category: 'support',
        userEmail: 'user@test.com',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://support.deyond.io/api/v2/tickets',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.id).toBe('12345');
    });

    it('should create intercom ticket', async () => {
      const intercomService = new SupportService({
        provider: 'intercom',
        apiKey: 'intercom-key',
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'conv-123' }),
      });

      const result = await intercomService.createTicket({
        subject: 'Intercom Ticket',
        description: 'Test',
        priority: 'high',
        category: 'billing',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.intercom.io/conversations',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Intercom-Version': '2.9',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.id).toBe('conv-123');
    });

    it('should handle ticket creation failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      const result = await service.createTicket({
        subject: 'Test',
        description: 'Test',
        priority: 'low',
        category: 'other',
      });

      expect(result.success).toBe(false);
      expect(result.id).toBe('');
    });

    it('should cache ticket locally', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ticket: { id: '12345' } }),
      });

      await service.createTicket({
        subject: 'Cached Ticket',
        description: 'Test',
        priority: 'normal',
        category: 'support',
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@support_tickets_cache',
        expect.stringContaining('12345')
      );
    });
  });

  describe('getTicket', () => {
    it('should get ticket by id', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ticket: {
            id: '12345',
            subject: 'Test',
            description: 'Description',
            priority: 'normal',
            status: 'open',
          },
        }),
      });

      const ticket = await service.getTicket('12345');

      expect(fetch).toHaveBeenCalledWith(
        'https://support.deyond.io/api/v2/tickets/12345',
        expect.anything()
      );
      expect(ticket?.id).toBe('12345');
      expect(ticket?.status).toBe('open');
    });

    it('should return null on failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const ticket = await service.getTicket('99999');
      expect(ticket).toBeNull();
    });
  });

  describe('getUserTickets', () => {
    it('should return empty array when no cached tickets', async () => {
      const tickets = await service.getUserTickets();
      expect(tickets).toEqual([]);
    });

    it('should return cached tickets', async () => {
      const cachedTickets = [
        { id: '1', subject: 'Ticket 1' },
        { id: '2', subject: 'Ticket 2' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cachedTickets)
      );

      const tickets = await service.getUserTickets();
      expect(tickets).toHaveLength(2);
    });
  });

  describe('addMessage', () => {
    it('should add message to zendesk ticket', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const result = await service.addMessage('12345', 'New message');

      expect(fetch).toHaveBeenCalledWith(
        'https://support.deyond.io/api/v2/tickets/12345',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('New message'),
        })
      );
      expect(result).toBe(true);
    });

    it('should add reply to intercom conversation', async () => {
      const intercomService = new SupportService({
        provider: 'intercom',
        apiKey: 'key',
      });

      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const result = await intercomService.addMessage('conv-123', 'Reply');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.intercom.io/conversations/conv-123/reply',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toBe(true);
    });
  });

  describe('getFAQArticles', () => {
    it('should return default FAQs', async () => {
      const articles = await service.getFAQArticles();

      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0]).toHaveProperty('id');
      expect(articles[0]).toHaveProperty('title');
      expect(articles[0]).toHaveProperty('content');
    });

    it('should filter by category', async () => {
      const articles = await service.getFAQArticles('security');

      expect(articles.length).toBeGreaterThan(0);
      articles.forEach(article => {
        expect(article.category).toBe('security');
      });
    });

    it('should return cached FAQs', async () => {
      const cachedArticles = [
        { id: '1', title: 'Custom FAQ', content: 'Content', category: 'custom', views: 100 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cachedArticles)
      );

      const articles = await service.getFAQArticles();
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Custom FAQ');
    });
  });

  describe('searchFAQs', () => {
    it('should search in titles', async () => {
      const results = await service.searchFAQs('backup');

      expect(results.length).toBeGreaterThan(0);
      results.forEach(article => {
        const matchesTitle = article.title.toLowerCase().includes('backup');
        const matchesContent = article.content.toLowerCase().includes('backup');
        expect(matchesTitle || matchesContent).toBe(true);
      });
    });

    it('should return empty for no matches', async () => {
      const results = await service.searchFAQs('xyznonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('getFAQCategories', () => {
    it('should return unique categories', async () => {
      const categories = await service.getFAQCategories();

      expect(categories).toContain('security');
      expect(categories).toContain('transactions');
      expect(new Set(categories).size).toBe(categories.length);
    });
  });

  describe('getContactOptions', () => {
    it('should return contact options', () => {
      const options = service.getContactOptions();

      expect(options.length).toBeGreaterThan(0);
      expect(options.find(o => o.type === 'email')).toBeDefined();
      expect(options.find(o => o.type === 'discord')).toBeDefined();
    });
  });

  describe('submitFeedback', () => {
    it('should create ticket for feedback', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ticket: { id: 'feedback-123' } }),
      });

      const result = await service.submitFeedback(5, 'Great app!', 'general');

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('Rating: 5/5'),
        })
      );
      expect(result).toBe(true);
    });
  });
});
