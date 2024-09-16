# Changelog

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