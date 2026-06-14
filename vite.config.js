import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { transformSync } from 'esbuild'

// Pre-enforce plugin: transforms JSX in .js files before Vite's import analysis
function jsAsJsx() {
  return {
    name: 'js-as-jsx',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('.js') && id.includes('/src/')) {
        const result = transformSync(code, { loader: 'jsx', sourcemap: true, sourcefile: id })
        return { code: result.code, map: result.map }
      }
    },
  }
}

export default defineConfig({
  plugins: [jsAsJsx(), react({ include: /\.(js|jsx)$/ })],
  server: { port: 3000, open: false },
  build: { outDir: 'build' },
  esbuild: { loader: 'jsx', include: /\.js$/ },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  test: { globals: true, environment: 'jsdom', setupFiles: './src/setupTests.js' },
})
