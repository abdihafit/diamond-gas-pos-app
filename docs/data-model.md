# Data Model

## `users`

Each signed-in user gets a Firestore document keyed by Firebase Auth UID.

Recommended fields:

- `name`: display name derived from the email prefix
- `email`: normalized email address
- `role`: `admin` or `agent`

## `sales`

Sales documents capture the core POS ledger entries.

Current fields used by the app:

- `customerName`
- `kg`
- `rate`
- `amount`
- `buyingPrice`
- `paymentMethod`
- `paymentStatus`
- `createdBy`
- `createdAt`

## Relationships

- one `users` document can own many `sales`
- `sales.createdBy` stores the owning user UID
- admins can read all sales
- agents can only read and edit their own sales
