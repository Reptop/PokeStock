// src/routes/login/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  // if already logged in via locals.user, redirect
  // if (locals.user)
  // throw redirect(302, '/');

  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = (data.get('email') as string)?.trim().toLowerCase();
    const password = data.get('password') as string;
    const remember = data.get('remember') === 'on';

    // TODO: Replace with your real auth (DB lookup / OAuth)
    const validEmail = 'demo@example.com';
    const validPw = 'password123';

    if (email !== validEmail || password !== validPw) {
      return fail(400, { error: 'Invalid email or password' });
    }

    // Issue a dummy session cookie (replace with JWT or session ID)
    cookies.set('session', 'fake-session-token', {
      httpOnly: true,
      path: '/',
      secure: false,      // true in production
      sameSite: 'lax',
      maxAge: remember ? 60 * 60 * 24 * 30 : undefined // 30 days
    });

    return { success: 'Logged in! Redirecting…' };
  }
};
