const UrlService = require('../../src/services/urlService');
const Url = require('../../src/models/Url');

jest.mock('../../src/models/Url');

describe('UrlService', () => {
  describe('createShortUrl', () => {
    test('should create URL with generated short code', async () => {
      const mockUrl = {
        short_code: 'abc123',
        original_url: 'https://example.com',
        created_at: new Date()
      };
      
      Url.findByShortCode.mockResolvedValue(null);
      Url.create.mockResolvedValue(mockUrl);
      
      const result = await UrlService.createShortUrl({
        url: 'https://example.com'
      });
      
      expect(result.shortCode).toBe('abc123');
      expect(result.originalUrl).toBe('https://example.com');
    });
  });
});