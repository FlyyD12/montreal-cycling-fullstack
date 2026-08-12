const request = require('supertest');
const app = require('./server');
const { closePool } = require('./config/database');

describe('API metadata', () => {
  afterAll(async () => {
    await closePool();
  });

  it('returns the API description from the root endpoint', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: 'API Vélo Montréal - Livrable 3',
      version: '1.0.0'
    });
  });
});
