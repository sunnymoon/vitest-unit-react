import { defineConfig } from './vitest-cucumber-plugin'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'html']
    },
    reporters: [
      'verbose',
      ['junit', { outputFile: 'dist/junit.xml', suiteName: 'JUnit Suite for project X' }],
    ],
    runner: './cucumber-vitest-runner.ts',
    include: [
      'features/**/*.feature'
    ],
    fileParallelism: false,
    cucumber: {
      glueCode: [
        'features/step_definitions/*.(test|spec).ts'
      ]
    }
  }
})
