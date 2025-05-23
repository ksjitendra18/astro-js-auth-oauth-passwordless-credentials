## Note: 
Main and other branches are not in sync with the blog post. I will be updating the branches and blog posts with the latest changes. Please consider main branch as the latest version.


# Astro Authentication Guide: Google Github OAuth Guide, Email Password

This repo is for the series of blog post covering Authentication in Astro.

Main branch contains the latest updated code. If you're following the blog post, please use the specific branch for the post.

## Security

If you find any security vulnerability, please contact me at jitendra@everythingcs.dev

## Technolgies Used

- Turso DB
- Drizzle ORM
- Redis for storing verification codes and rate limiting
- Resend for sending emails
- Solid.js
- Zod
- Database session strategy for auth persistence
- Argon2 for password hashing

I am not using any external auth library for this guide. At the moment of writing, Auth.js doesn't support Astro. In a separate blog post I will do all these authentication strategy through Arctic , Oslo and also Better Auth.

## Getting Started

To get started, clone the repo and run the following commands:

```bash
npm install
``` 

Now copy the `.env.example` file to `.env` and fill in the values.

Please refer to blog post for github and google oauth setup.

You will need Turso DB and Redis for it. You can use sqlite or choose other database but then you will have to make changes in the schema. For Redis, I am using Upstash Redis.

For emails you can use any email service which provides HTTP API.I am using Resend for sending emails. If you provider doesn't support HTTP API, you will have to make changes in the code (although single file) 

To run the project, run the following command:

```bash
npm run dev 
``` 

Here are the strategies with their starter code, finished code and also the related blog post.

## Deployment

This can be hosted anywhere like VM or serverless platforms like Vercel, Netlify except edge platforms like Cloudflare Pages because this project uses Argon2 for password hashing which is not supported on edge platforms. If you choose not to have password based authentication, you can host it on edge platforms (still you will need to make changes especially in aes implementation).

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
  
