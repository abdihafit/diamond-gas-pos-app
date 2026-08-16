# Troubleshooting

## App Does Not Start

- run `npm install` if dependencies are missing
- confirm `.env` exists and includes all Firebase variables
- check that the selected Node.js version supports Vite 7

## Login Fails

- verify the account exists in Firebase Authentication
- confirm the password is correct
- wait and retry if Firebase reports too many attempts

## Sales Do Not Load

- confirm the signed-in user has a matching Firestore `users` document
- verify Firestore rules allow the expected reads
- check browser console and Firebase project logs for permission errors

## Totals Look Wrong

- make sure each sale includes valid numeric `kg` and `rate` values
- verify `buyingPrice` is stored consistently with the app's current calculations
- inspect sale dates when filters are active
