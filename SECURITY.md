# Security Notes

## Secrets

- keep Firebase credentials in local environment files only
- never commit service account keys into this repository
- rotate credentials if a local `.env` file is shared accidentally

## Access Control

- admin access depends on both authentication and role metadata
- Firestore rules should always be reviewed alongside auth-flow changes
- test agent and admin permissions after any rules update
