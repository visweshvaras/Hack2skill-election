const request = require('supertest');
const app = require('./server');

describe('NaagrikInfo API Endpoints', () => {

  it('should return a 200 OK for the health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('service', 'live-political-backend');
  });

  it('should list section statuses', async () => {
    const res = await request(app).get('/api/sections/status');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('should retrieve live news array', async () => {
    const res = await request(app).get('/api/news/live');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('should have security headers (helmet)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    expect(res.headers).toHaveProperty('x-frame-options');
  });

});
