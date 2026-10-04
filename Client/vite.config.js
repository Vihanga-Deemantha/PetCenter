import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vercel sets VERCEL=1 during its builds. A deploy build that's missing these
  // would otherwise succeed and ship a site that quietly talks to localhost
  // (axios falls back to it) or a placeholder Stripe key — fail the build with
  // a clear message instead. Scoped to Vercel so local builds and CI, which
  // don't have production values, are unaffected.
  if (process.env.VERCEL && mode === 'production') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const problems = []
    if (!env.VITE_API_URL) problems.push('VITE_API_URL is not set')
    else if (/^http:\/\//.test(env.VITE_API_URL)) {
      problems.push('VITE_API_URL must be https:// (browsers block http:// calls from an https:// site)')
    }
    if (!env.VITE_STRIPE_PUBLISHABLE_KEY) problems.push('VITE_STRIPE_PUBLISHABLE_KEY is not set')
    if (problems.length) {
      throw new Error(
        `Missing/invalid environment for production build:\n  - ${problems.join('\n  - ')}\n` +
        'Set them under Vercel -> Project -> Settings -> Environment Variables, then redeploy.'
      )
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
