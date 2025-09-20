const request = require('supertest');
const app = require('../../src/app');

describe('API Endpoints', () => {
  test('POST /api/urls should create short URL', async () => {
    const response = await request(app)
      .post('/api/urls')
      .send({ url: 'https://microsoft.com' })
      .expect(201);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.shortCode).toBeDefined();
  });
  
  test('GET /:shortCode should redirect', async () => {
    const createResponse = await request(app)
      .post('/api/urls')
      .send({ url: 'https://microsoft.com' });
      
    const shortCode = createResponse.body.data.shortCode;
    
    await request(app)
      .get(`/${shortCode}`)
      .expect(301)
      .expect('Location', 'https://microsoft.com');
  });
});