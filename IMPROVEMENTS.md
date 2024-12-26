# Improvements

These are some improvements that can be made to the project.

## Logs for admin

- Create table and store logs which can only be accessed by admin. It should contain all the actions performed by the user.

## Mails
- Use webhooks to check if the mail has been sent or not.
- Add retry logic for mail sending.
  

## Rate Limiting
- Use other rate limiting algo instead of fixed time limit

## Sessions

- Encrypt the session. This will eliminate the need to create long string session_id and could be the same 24 length cuid2 string. AES encryption is already implemented. So it can be extended.
- Store session info in redis with a shorter ttl to prevent db calls.
