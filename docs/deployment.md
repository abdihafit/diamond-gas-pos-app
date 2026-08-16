# Deployment Notes

## Frontend Build

- install dependencies with `npm install`
- create production assets with `npm run build`
- deploy the generated `dist/` output to your preferred static host

## Firebase Requirements

- configure a Firebase web app and copy its credentials into `.env`
- enable Firebase Authentication for the intended sign-in method
- create the `users` and `sales` collections in Firestore
- publish the Firestore rules in `firestore.rules`

## Production Checklist

- confirm the admin email strategy still matches the business process
- verify Firestore indexes required by the sales queries
- validate export flows using realistic production-like data
- test both admin and agent permissions before launch
