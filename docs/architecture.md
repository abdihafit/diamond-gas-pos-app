# Architecture Overview

## Frontend

- Vite provides the local dev server and production bundling
- React Router handles the admin, agent, and login routes
- Tailwind CSS styles the dashboards and forms

## Auth And Roles

- Firebase Authentication signs users in with email and password
- the login flow writes user metadata into the `users` collection
- route guards use the stored role to protect admin-only pages

## Data Flow

- agents create and edit their own sales
- admins subscribe to all sales in Firestore
- totals and filtered views are derived on the client from the live dataset

## Exports

- CSV export is generated directly in the browser
- PDF export currently relies on the browser print flow
