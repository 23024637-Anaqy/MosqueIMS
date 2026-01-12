# Role-Based Permission Testing Guide

## Seeded User Credentials

From `seedUsers.js`, these accounts are available:

### Admin Account
- **Email:** admin@quantix.com
- **Password:** admin123

### Staff Accounts
- **Email:** john.smith@quantix.com | **Password:** staff123
- **Email:** sarah.johnson@quantix.com | **Password:** staff123
- **Email:** mike.davis@quantix.com | **Password:** staff123
- **Email:** emily.chen@quantix.com | **Password:** staff123
- **Email:** david.wilson@quantix.com | **Password:** staff123

---

## Testing Steps

### Step 1: Seed Users (if not already done)
```powershell
cd backend
node seedUsers.js
```

### Step 2: Create Test Data with Different Dates
```powershell
node testTimeframe.js
```

This creates:
- ✓ An item created TODAY
- ✓ An item backdated to YESTERDAY
- ✓ An item backdated to 2 DAYS AGO

### Step 3: Start Backend Server
```powershell
cd backend
npm start
```

### Step 4: Run Tests (in separate terminal)

#### Test Staff Permissions
```powershell
node backend/testStaffPermissions.js
```

**Expected Results:**
- ✓ Staff CAN login
- ✓ Staff CAN view all items
- ✓ Staff CAN edit quantity of TODAY's items
- ✗ Staff CANNOT edit quantity of OLD items (403)
- ✗ Staff CANNOT edit other fields (name, rate, etc.) (403)
- ✗ Staff CANNOT create items (403)
- ✗ Staff CANNOT delete items (403)

#### Test Admin Permissions
```powershell
node backend/testAdminPermissions.js
```

**Expected Results:**
- ✓ Admin CAN create items
- ✓ Admin CAN edit ALL fields of ANY item (old or new)
- ✓ Admin CAN delete items

---

## Manual Testing with Postman/Thunder Client

### Login as Staff
```http
POST http://localhost:4000/api/user/login
Content-Type: application/json

{
  "email": "john.smith@quantix.com",
  "password": "staff123"
}
```

Copy the `token` from response.

### Try to Edit Today's Item (Should Work)
```http
PATCH http://localhost:4000/api/inventory/items/{item_id}
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "quantity": 150
}
```

### Try to Edit Yesterday's Item (Should Fail)
```http
PATCH http://localhost:4000/api/inventory/items/{yesterday_item_id}
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "quantity": 150
}
```

**Expected:** 403 error - "Staff can only edit items on the same day they were created"

### Try to Edit Name Field (Should Fail)
```http
PATCH http://localhost:4000/api/inventory/items/{item_id}
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "name": "New Name",
  "quantity": 150
}
```

**Expected:** 403 error - "Staff can only edit the quantity field"

---

## Understanding the Time Logic

The code checks if the item was created on the **same calendar day**:

```javascript
// Both dates set to midnight for comparison
const itemCreatedDay = new Date(itemCreatedDate.getFullYear(), itemCreatedDate.getMonth(), itemCreatedDate.getDate());
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

// Compare timestamps
if (itemCreatedDay.getTime() !== today.getTime()) {
  // Item was NOT created today - block staff edit
}
```

**Example:**
- Item created: Jan 7, 2026 at 11:59 PM
- Edit attempt: Jan 7, 2026 at 11:59 PM ✓ (same day - allowed)
- Edit attempt: Jan 8, 2026 at 12:01 AM ✗ (next day - blocked)

---

## Troubleshooting

### Port Already in Use
If port 4000 is busy, update `API_URL` in test files:
```javascript
const API_URL = 'http://localhost:YOUR_PORT';
```

### MongoDB Connection Issues
Check your `.env` file has correct `MONGO_URI`:
```
MONGO_URI=mongodb://localhost:27017/quantix
```

### No Test Items Found
Run `testTimeframe.js` to create dated test items:
```powershell
node backend/testTimeframe.js
```
