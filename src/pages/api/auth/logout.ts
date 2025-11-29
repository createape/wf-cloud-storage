import type { APIRoute } from 'astro'
import { AUTH_CONFIG } from '../../../lib/auth/config'

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Clear the session cookie
  cookies.delete(AUTH_CONFIG.SESSION_COOKIE, { path: '/ca' })

  // Redirect to login page
  return redirect('/ca/login')
}

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // Clear the session cookie
  cookies.delete(AUTH_CONFIG.SESSION_COOKIE, { path: '/ca' })

  // Redirect to login page
  return redirect('/ca/login')
}
