import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    retry: 3,
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.*'],
    },
  },
});
