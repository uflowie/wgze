import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { sign, verify } from 'hono/jwt';
import type { Bindings } from '../types';
import { LoginPage } from '../components/LoginPage';

const app = new Hono<{ Bindings: Bindings }>()

  // Login page
  .get('/', (c) => {
    return c.html(LoginPage());
  })

  // Login form submission
  .post('/', async (c) => {
    const body = await c.req.formData();
    const password = body.get('password')?.toString();

    if (password !== c.env.AUTH_PASSWORD) {
      return c.html(
        `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        ❌ Invalid password
      </div>`,
        401
      );
    }

    // Create JWT token (no expiration)
    const payload = {
      authenticated: true
    };
    const token = await sign(payload, c.env.JWT_SECRET);

    // Set HTTP-only cookie with signed JWT (maximum expiration)
    setCookie(c, 'auth', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 34560000 // Maximum possible value (~68 years)
    });

    // Redirect to home page
    c.header('HX-Redirect', '/');
    return c.html(
      `<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      ✅ Login successful! Redirecting...
    </div>`
    );
  });

// Authentication middleware factory
export const authMiddleware = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  // Skip auth for login routes
  if (c.req.path.startsWith('/login') || c.req.path.startsWith('/auth/')) {
    await next();
    return;
  }

  const authToken = getCookie(c, 'auth');

  if (!authToken) {
    return c.redirect('/login');
  }

  try {
    // Verify the JWT token
    const payload = await verify(authToken, c.env.JWT_SECRET);
    if (!payload || !payload.authenticated) {
      return c.redirect('/login');
    }
  } catch (error) {
    // Invalid token
    return c.redirect('/login');
  }

  await next();
});

export default app;