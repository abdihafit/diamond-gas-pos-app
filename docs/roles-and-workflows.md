# Roles And Workflows

## Agent Flow

1. Sign in with an agent account.
2. Capture a sale with customer name, KG, rate, and optional sale date.
3. Review the calculated amount before saving.
4. Edit previously created sales if corrections are needed.

## Admin Flow

1. Sign in with the admin account.
2. Review all recent sales in the realtime ledger.
3. Filter by month or date range.
4. Export the filtered view as CSV or PDF.
5. Mark payment status as paid or revert it back to unpaid.

## Role Rules

- the email `admin@diamondgas.com` is treated as admin in the current login flow
- all other authenticated users are treated as agents
- role metadata is stored in Firestore for downstream checks
