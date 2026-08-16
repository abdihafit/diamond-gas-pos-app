# Testing Checklist

## Login

- admin account routes to `/admin`
- agent account routes to `/agent`
- invalid credentials show a helpful error

## Agent Sales Flow

- creating a sale stores the right amount and buy total
- editing an existing sale keeps the selected date intact
- empty states remain readable with no sales

## Admin Ledger

- month and date filters narrow the ledger correctly
- totals respond to the filtered data set
- mark paid and mark unpaid both update status cleanly
- CSV export reflects the active filtered view
