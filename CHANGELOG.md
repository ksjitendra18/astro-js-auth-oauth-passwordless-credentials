# Changelog

## 22th April 2025

Added schema for `PostgreSQL` and `MySQL`
Updated to tailwind v4

### Changes

Removed login_method table

## 17th March 2025

### Changes

Schema Changes: setup `casing` to `snake_case` in Drizzle ORM.

Removed `query-string` package and replaced it with `URLSearchParams`.

Fixed types.

Added redirect to page after login. redirectURL is sanitized to prevent open redirect vulnerability.

## 28th February 2025

Added try catch in `getSessionInfo` to prevent server from crashing or throwing error while decrypting data

Removed ratelimit from email templates as api endpoints are already rate limited

## 21st January 2025

### Changes

Schema Changes: changed isBlocked to isBanned

## 17th January 2025

### Changes

Sessions IDs are now encrypted using AES-256-GCM. Also sessions are cached in redis. 

## 26th December 2024

### Changes

Major changes in terms of database schema, folder structure and code structure.

- Introduced a new folder structure (feature folder)
- Replaced @upstash/redis with ioredis
- better rate limiting (more changes to come)
- New functionality: Change Email,Update Password, Delete Account

#### Schema Changes

- new table: login_methods

#### Passwords

- replaced bcrypt with argon2

## 16th September 2024

### Changes

#### Oauth
- Removed oauth_tokens table
- New Table: oauth_providers
- Removed offline mode for google oauth

#### Sessions
- login_logs table now has a column for strategy
- Account page will show what strategy was used to login

#### Passwords

- Passwords now have a column for when it was created and updated
  

### Misc Changes

- Select only required columns in queries
- Export validation schema type from validation files 