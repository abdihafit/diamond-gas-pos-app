# Contributing

## Before You Change Code

- pull the latest changes from the main branch
- confirm your Firebase environment variables are configured locally
- run the app and reproduce the behavior you plan to change

## Preferred Workflow

1. Create a focused branch.
2. Keep changes small and logically grouped.
3. Verify the affected admin and agent flows.
4. Update docs when behavior or setup steps change.

## Review Checklist

- no secrets committed to the repository
- Firestore reads and writes still respect role boundaries
- filters, totals, and exports still work as expected
- copy changes remain clear for both admin and agent users
