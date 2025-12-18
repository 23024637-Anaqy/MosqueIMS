Prototype Mode

To run the backend in prototype (in-memory) mode for demos without a database, set the environment variable `PROTOTYPE=true`.

Example (PowerShell):

```powershell
cd backend
$env:PROTOTYPE = "true"
$env:PORT = "4000"
node server.js
```

Prototype endpoints:
- Signup / Login: POST /api/proto/user/signup, POST /api/proto/user/login
  - signup returns a `token` equal to the created user id
- Protected endpoints (use header `Authorization: Bearer <token>`):
  - Inventory: GET/POST/PATCH /api/inventory
  - Reports: GET /api/reports?startDate=&endDate=
  - Documents: GET /api/documents, POST /api/documents, GET /api/documents/:id/download

Notes:
- This is temporary in-memory storage for demo/prototype purposes only. Data will be lost when the server restarts.
- When you're ready to migrate to PostgreSQL or MongoDB, set `PROTOTYPE=false` and use the real DB-backed routes.

Seeding demo data

Prototype server now auto-seeds demo data on start.

You can still run the seeder manually to re-seed during a session:

```powershell
cd backend
node prototypeSeed.js
```

When the server starts with `PROTOTYPE=true` it will automatically run the seeder and print created user tokens. Use those tokens as the `Authorization: Bearer <token>` header for protected requests.
