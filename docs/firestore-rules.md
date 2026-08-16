# Firestore Rules Notes

## Users Collection

- signed-in users can only read and write their own user document

## Sales Collection

- admins can read, update, and delete all sales
- agents can only read, update, and delete their own sales
- sale creation requires `createdBy` to match the authenticated user UID

## Operational Reminder

- rules changes should be deployed together with any role or ownership logic changes in the frontend
