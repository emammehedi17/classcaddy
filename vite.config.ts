import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { globSync } from 'glob';

function copyStaticAssetsPlugin(): Plugin {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const copyRecursive = (srcDir: string, destDir: string) => {
        if (!fs.existsSync(srcDir)) return;
        const entries = fs.readdirSync(srcDir, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(srcDir, entry.name);
          const destPath = path.join(destDir, entry.name);

          // Skip build / git / node directories
          if (['node_modules', '.git', 'dist', '.next'].includes(entry.name)) continue;

          if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
            }
            copyRecursive(srcPath, destPath);
          } else {
            // Do not copy source developer scripts or build artifacts
            if (/\.(html|htm|ts|tsx|py|sh|toml|rules|example|lock)$/i.test(entry.name)) continue;
            if (['server.ts', 'server.js', 'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'metadata.json', 'vite.config.ts'].includes(entry.name)) continue;
            
            // Never overwrite files already compiled by Vite
            if (fs.existsSync(destPath)) continue;

            const destParent = path.dirname(destPath);
            if (!fs.existsSync(destParent)) {
              fs.mkdirSync(destParent, { recursive: true });
            }
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };

      copyRecursive(__dirname, path.resolve(__dirname, 'dist'));

      // Ensure Archives.html exists alongside archives.html for case-insensitive static hosting (Netlify/Linux)
      const distArchives = path.resolve(__dirname, 'dist', 'archives.html');
      const distArchivesCap = path.resolve(__dirname, 'dist', 'Archives.html');
      if (fs.existsSync(distArchives) && !fs.existsSync(distArchivesCap)) {
        try {
          fs.copyFileSync(distArchives, distArchivesCap);
        } catch (e) {
          console.warn('Failed to create dist/Archives.html copy:', e);
        }
      }
    },
  };
}

export default defineConfig(() => {
  // Automatically find all HTML files across all directories
  const htmlFiles = globSync('**/*.html', {
    ignore: ['node_modules/**', 'dist/**', '.git/**', '.next/**'],
  }).reduce((acc, file) => {
    // Generate a unique, normalized entry name matching relative path without .html
    const relativePath = path.relative(__dirname, path.resolve(__dirname, file));
    const entryName = relativePath.replace(/\\/g, '/').replace(/\.html$/, '');
    acc[entryName] = path.resolve(__dirname, file);
    return acc;
  }, {});

  return {
    plugins: [react(), tailwindcss(), copyStaticAssetsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      emptyOutDir: true,
      rollupOptions: {
        input: htmlFiles,
        output: {
          entryFileNames: (chunkInfo) => {
            return `${chunkInfo.name}.js`;
          },
          chunkFileNames: (chunkInfo) => {
            return `${chunkInfo.name}.js`;
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.originalFileName) {
              return assetInfo.originalFileName;
            }
            return '[name][extname]';
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

