const request = require('supertest');
const app = require('../../src/app');

describe('Health Check API', () => {
  it('should return 200 OK and server status', async () => {
    const res = await request(app).get('/health');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'Server is running');
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.statusCode).toBe(404);
  });
});
