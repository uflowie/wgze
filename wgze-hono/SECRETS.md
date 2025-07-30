# Secret Management

This project uses Cloudflare Workers secrets for sensitive configuration.

## Local Development

Secrets are stored in `.dev.vars` (already created and git-ignored):
```
AUTH_PASSWORD=your-password-here
JWT_SECRET=your-jwt-secret-here
```

## Production Deployment

For production, set secrets using Wrangler CLI:

```bash
# Set the authentication password
npx wrangler secret put AUTH_PASSWORD

# Set the JWT signing secret
npx wrangler secret put JWT_SECRET
```

When prompted, enter the secret values. These will be encrypted and stored securely in Cloudflare.

## Required Secrets

- `AUTH_PASSWORD`: The password users need to enter to log in
- `JWT_SECRET`: Secret key used to sign JWT authentication tokens (should be a long, random string)

## Security Notes

- Never commit secrets to version control
- Use strong, unique values for production
- JWT_SECRET should be at least 32 characters of random data
- Secrets are encrypted at rest in Cloudflare's infrastructure