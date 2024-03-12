# Astro Authentication Guide: Google Github OAuth Guide, Email Password

This repo is for the series of blog post covering Authentication in Astro.

## Technolgies Used

- Turso DB
- Drizzle ORM
- Redis for storing verification codes and rate limiting
- Resend for sending emails
- Solid.js
- Zod
- Database session strategy for auth persistence
- Bcrypt for password encryption

I am not using any external auth library for this guide. At the moment of writing, Auth.js doesn't support Astro. In a separate blog post I will do all these authentication strategy through Lucia Auth.

Here are the strategies with their starter code, finished code and also the related blog post.

## 1. Oauth (Google and Github)

- Blog post: [Google and Github Authentication OAuth2 Setup in Astro.js](https://everythingcs.dev/blog/astro-js-auth-oauth-github-google-auth-guide/)
- Starter: [oauth-starter](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/oauth-starter)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/oauth-starter.zip)
- Final: [oauth-final](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/oauth-final)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/oauth-final.zip)

## 2. Email Password Credential Based

- Blog post: [Email Password Credential authentication Setup in Astro.js](https://everythingcs.dev/blog/astro-js-email-password-credential-authentication/)
- Starter: [credentials-starter](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/credentials-starter)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/credentials-starter.zip)
- Final: [credentials-final](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/credentials-final)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/credentials-final.zip)

## 3. Passwordless (Magic Link) Auth

- Blog post: [Passwordless Magic Link Authentication Setup in Astro.js](https://everythingcs.dev/blog/astro-js-passwordless-magic-link-authentication/)
- Starter: [magic-link-starter](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/credentials-starter)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/magic-link-starter.zip)
- Final: [magic-link-final](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/magic-link-final)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/magic-link-final.zip)

## 4. Integrating Two-Factor Auth

Integration of TOTP based verification along with recovery codes.

- Blog post: [Two-Factor Authentication and Recovery Code Setup in Astro.js](https://everythingcs.dev/blog/astro-js-two-multi-factor-authentication-totp-recovery-codes/)
- Starter: [two-factor-starter](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/credentials-starter)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/two-factor-starter.zip)
- Final: [two-factor-final](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/tree/two-factor-final)  [Direct Download](https://github.com/ksjitendra18/astro-js-auth-oauth-passwordless-credentials/archive/refs/heads/two-factor-final.zip)
  