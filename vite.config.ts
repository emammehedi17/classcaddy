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

      // Ensure study-plan-styles.css is in dist
      const srcStudyCss = path.resolve(__dirname, 'study-plan-styles.css');
      const distStudyCss = path.resolve(__dirname, 'dist', 'study-plan-styles.css');
      if (fs.existsSync(srcStudyCss) && !fs.existsSync(distStudyCss)) {
        try {
          fs.copyFileSync(srcStudyCss, distStudyCss);
        } catch (e) {
          console.warn('Failed to copy study-plan-styles.css to dist:', e);
        }
      }

      // Final integrity check: Verify all dist/**/*.html files are actual HTML, not accidentally overwritten with CSS
      const distHtmlFiles = globSync('dist/**/*.html');
      for (const distHtmlPath of distHtmlFiles) {
        try {
          const content = fs.readFileSync(distHtmlPath, 'utf-8').trim();
          if (!content.startsWith('<!') && !content.startsWith('<html')) {
            console.warn(`WARNING: ${distHtmlPath} was not valid HTML! Restoring from source...`);
            const relFromDist = path.relative(path.resolve(__dirname, 'dist'), distHtmlPath);
            const srcHtmlPath = path.resolve(__dirname, relFromDist);
            if (fs.existsSync(srcHtmlPath)) {
              fs.copyFileSync(srcHtmlPath, distHtmlPath);
            }
          }
        } catch (e) {
          console.warn(`Could not verify HTML integrity for ${distHtmlPath}:`, e);
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
            // Extracted or bundled CSS assets must never take an .html originalFileName or overwrite HTML files
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return '[name][extname]';
            }
            if (
              assetInfo.originalFileName &&
              !assetInfo.originalFileName.endsWith('.html') &&
              !assetInfo.originalFileName.endsWith('.htm') &&
              path.extname(assetInfo.originalFileName) === path.extname(assetInfo.name || '')
            ) {
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

