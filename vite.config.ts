import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'JSGGLRules',
      fileName: 'jsg_gl_rules',
      formats: ['es'],
    },
    rollupOptions: {
      // Externalize peer dependencies to avoid bundling them
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        'react/jsx-runtime',
      ],
      output: {
        // Global variables for UMD build (not used in ESM, but required by Vite)
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
        },
        // Ensure CSS is extracted to a separate file
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return assetInfo.name || '';
        },
      },
    },
    // Generate sourcemaps for debugging
    sourcemap: true,
    // Don't minify during development for easier debugging
    minify: 'esbuild',
  },
});
