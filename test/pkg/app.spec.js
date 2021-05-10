const request = require('supertest');
const { app } = require('./app');

describe('package: http-proxy-middleware', () => {
  let agent;

  beforeEach(() => {
    agent = request(app);
  });

  it('should proxy /users', async () => {
    return agent.get(`/users`).expect(200);
  });
});
