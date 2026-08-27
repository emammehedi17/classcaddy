import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { globSync } from 'glob';

export default defineConfig(() => {
  // Automatically find all HTML files in the root directory
  const htmlFiles = globSync('*.html').reduce((acc, file) => {
    const name = path.basename(file, '.html');
    acc[name] = path.resolve(__dirname, file);
    return acc;
  }, {});

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: htmlFiles,
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
