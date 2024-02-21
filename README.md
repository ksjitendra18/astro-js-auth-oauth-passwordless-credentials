# Astro Authentication Guide: Google Github OAuth Guide, Email Password

This repo is for the series of blog post covering Authentication in Astro.

## Technolgies Used

- Turso DB
- Drizzle ORM
- Redis for storing verification codes
- Resend for sending emails
- Solid.js
- Zod
- Database session strategy for auth persistence
- Bcrypt for password encryption

I am not using any external auth library for this guide. At the moment of writing Auth.js doesn't support Astro. In a separate blog I will do all these authentication strategy through Lucia Auth.

Here are the strategies with their starter code, finished code and also the related blog post.

## 1. Oauth (Google and Github)

- Blog post: [Google and Github Authentication OAuth2 Setup in Astro.js](https://everythingcs.dev/blog/astro-js-auth-oauth-github-google-auth-guide/)
- Starter: [oauth-starter](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/oauth-starter)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/oauth-starter.zip)
- Final: [oauth-final](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/oauth-final)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/oauth-final.zip)

## 2. Email Password Credential Based

- Blog post: [Google and Github Authentication OAuth2 Setup in Astro.js](https://everythingcs.dev/blog/astro-js-email-password-credential-authentication/)
- Starter: [credentials-starter](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/credentials-starter)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/credentials-starter.zip)
- Final: [credentials-final](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/credentials-final)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/credentials-final.zip)

## 3. Passwordless (Magic Link) Auth

PLANNED

## 4. Integrating 2-Factor Auth

PLANNED
