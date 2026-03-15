import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Загружаем переменные из .env, а также системные переменные (для облачного хостинга)
    const env = loadEnv(mode, process.cwd(), '');
    
    const apiKeys = [
      process.env.GEMINI_API_KEY || env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY1 || env.GEMINI_API_KEY1,
      process.env.GEMINI_API_KEY2 || env.GEMINI_API_KEY2,
      process.env.GEMINI_API_KEY3 || env.GEMINI_API_KEY3,
      process.env.GEMINI_API_KEY4 || env.GEMINI_API_KEY4,
      process.env.GEMINI_API_KEY5 || env.GEMINI_API_KEY5
    ].filter(Boolean); // Оставляем только те ключи, которые заданы

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEYS': JSON.stringify(apiKeys),
        'process.env.API_KEY': JSON.stringify(apiKeys[0] || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKeys[0] || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
