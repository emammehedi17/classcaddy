import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { globSync } from 'glob';
import { CLASS_CADDY_LOGO_BASE64 } from './src/lib/logoData';

function ensureLogoAssets(baseDir: string) {
  try {
    // 1. Normalize any backslash-named files uploaded from Windows (e.g., "\images\logo.png")
    const rootEntries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isFile() && entry.name.includes('\\')) {
        const normalizedRel = entry.name.replace(/^\\+/, '').replace(/\\/g, '/');
        const targetPath = path.resolve(baseDir, normalizedRel);
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const srcFile = path.resolve(baseDir, entry.name);
        if (fs.statSync(srcFile).size > 0) {
          fs.copyFileSync(srcFile, targetPath);
        }
      }
    }

    // 2. Keep the Class Caddy mark available at the paths used by page headers and favicons.
    const logoBuffer = Buffer.from(CLASS_CADDY_LOGO_BASE64, 'base64');
    const logoTargets = [
      path.resolve(baseDir, 'images', 'logo.png'),
      path.resolve(baseDir, 'public', 'images', 'logo.png'),
      path.resolve(baseDir, 'public', 'favicon.png'),
    ];
    for (const target of logoTargets) {
      const dir = path.dirname(target);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(target, logoBuffer);
    }

    // 3. Ensure images/du-logo.png exists (copy from images/du_logo.png if missing)
    const duUnderscore = path.resolve(baseDir, 'images', 'du_logo.png');
    const duHyphen = path.resolve(baseDir, 'images', 'du-logo.png');
    if (fs.existsSync(duUnderscore) && (!fs.existsSync(duHyphen) || fs.statSync(duHyphen).size === 0)) {
      fs.copyFileSync(duUnderscore, duHyphen);
    }
  } catch (e) {
    console.warn('Notice while ensuring logo assets:', e);
  }
}

function copyStaticAssetsPlugin(): Plugin {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      ensureLogoAssets(__dirname);

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

      // Explicitly guarantee the Class Caddy logo and favicon in the build output.
      try {
        const logoBuffer = Buffer.from(CLASS_CADDY_LOGO_BASE64, 'base64');
        const distImagesDir = path.resolve(__dirname, 'dist', 'images');
        if (!fs.existsSync(distImagesDir)) {
          fs.mkdirSync(distImagesDir, { recursive: true });
        }
        fs.writeFileSync(path.join(distImagesDir, 'logo.png'), logoBuffer);
        fs.writeFileSync(path.resolve(__dirname, 'dist', 'favicon.png'), logoBuffer);
      } catch (e) {
        console.warn('Failed to write dist logo files:', e);
      }

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

      // Ensure Grammar/ (capital G) exists alongside grammar/ (lowercase g) for case-insensitive static hosting (Netlify/Linux)
      const distGrammar = path.resolve(__dirname, 'dist', 'grammar');
      const distGrammarCap = path.resolve(__dirname, 'dist', 'Grammar');
      if (fs.existsSync(distGrammar)) {
        const copyDirRecursive = (src: string, dest: string) => {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          const entries = fs.readdirSync(src, { withFileTypes: true });
          for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
              copyDirRecursive(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          }
        };
        copyDirRecursive(distGrammar, distGrammarCap);
      }

      // Ensure english_grammar_master_revision_note.html is available directly in dist/grammar and dist/Grammar
      const srcGrammarNote = path.resolve(__dirname, 'grammar', 'public', 'english_grammar_master_revision_note.html');
      if (fs.existsSync(srcGrammarNote)) {
        const destGrammarNote = path.resolve(__dirname, 'dist', 'grammar', 'english_grammar_master_revision_note.html');
        const destGrammarCapNote = path.resolve(__dirname, 'dist', 'Grammar', 'english_grammar_master_revision_note.html');
        try {
          if (!fs.existsSync(path.dirname(destGrammarNote))) fs.mkdirSync(path.dirname(destGrammarNote), { recursive: true });
          fs.copyFileSync(srcGrammarNote, destGrammarNote);
          if (!fs.existsSync(path.dirname(destGrammarCapNote))) fs.mkdirSync(path.dirname(destGrammarCapNote), { recursive: true });
          fs.copyFileSync(srcGrammarNote, destGrammarCapNote);
        } catch (e) {
          console.warn('Failed to copy english_grammar_master_revision_note.html:', e);
        }
      }

      // Final integrity check: Verify all dist/**/*.html files are actual HTML and enforce Class Caddy favicon on every page
      const distHtmlFiles = globSync('dist/**/*.html');
      for (const distHtmlPath of distHtmlFiles) {
        try {
          let content = fs.readFileSync(distHtmlPath, 'utf-8');
          const trimmed = content.trim();
          if (!trimmed.startsWith('<!') && !trimmed.startsWith('<html')) {
            console.warn(`WARNING: ${distHtmlPath} was not valid HTML! Restoring from source...`);
            const relFromDist = path.relative(path.resolve(__dirname, 'dist'), distHtmlPath);
            const srcHtmlPath = path.resolve(__dirname, relFromDist);
            if (fs.existsSync(srcHtmlPath)) {
              content = fs.readFileSync(srcHtmlPath, 'utf-8');
            }
          }

          let htmlModified = false;
          const distRoot = path.resolve(__dirname, 'dist');
          const faviconPath = `${path.relative(path.dirname(distHtmlPath), path.join(distRoot, 'images', 'logo.png')).replace(/\\/g, '/')}?v=class-caddy-2`;
          const iconRegex = /<link\b[^>]*\brel=["'](?:shortcut\s+)?icon["'][^>]*>/gi;
          if (iconRegex.test(content)) {
            const updated = content.replace(iconRegex, `<link rel="icon" type="image/png" href="${faviconPath}">`);
            if (updated !== content) {
              content = updated;
              htmlModified = true;
            }
          } else if (content.includes('</head>')) {
            content = content.replace('</head>', `    <link rel="icon" type="image/png" href="${faviconPath}">\n</head>`);
            htmlModified = true;
          }

          if (htmlModified) {
            fs.writeFileSync(distHtmlPath, content, 'utf-8');
          }
        } catch (e) {
          console.warn(`Could not verify HTML integrity for ${distHtmlPath}:`, e);
        }
      }
    },
  };
}

function universalSettingsBootstrapPlugin(): Plugin {
  return {
    name: 'universal-settings-bootstrap',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (html.includes('settings-bootstrap.js')) return html;
        return {
          html,
          tags: [{
            tag: 'script',
            attrs: { src: '/settings-bootstrap.js' },
            injectTo: 'head-prepend',
          }],
        };
      },
    },
  };
}

export default defineConfig(() => {
  ensureLogoAssets(__dirname);

  // Automatically find all HTML files across all directories
  const htmlFiles = globSync('**/*.html', {
    ignore: ['node_modules/**', 'dist/**', '.git/**', '.next/**', 'public/assets/aistudio/**'],
  }).reduce((acc, file) => {
    // Generate a unique, normalized entry name matching relative path without .html
    const relativePath = path.relative(__dirname, path.resolve(__dirname, file));
    const entryName = relativePath.replace(/\\/g, '/').replace(/\.html$/, '');
    acc[entryName] = path.resolve(__dirname, file);
    return acc;
  }, {});

  return {
    plugins: [universalSettingsBootstrapPlugin(), react(), tailwindcss(), copyStaticAssetsPlugin()],
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

