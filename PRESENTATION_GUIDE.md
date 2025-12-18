# 🎯 FYP Inventory Management System - Presentation Guide

## System Architecture Overview

This MERN stack application provides a comprehensive inventory management solution with role-based access control, advanced reporting, and document management capabilities.

---

## 🔐 1. Authentication & Login System

### How Login Works

#### Frontend Login Process
```javascript
// User enters credentials → Frontend validates → Sends to backend
POST /api/user/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Backend Authentication Flow
1. **Email Validation**: Checks if user exists in database
2. **Password Verification**: Uses bcrypt to compare hashed passwords
3. **JWT Token Generation**: Creates secure token with user data
4. **Response**: Returns user object + JWT token

```javascript
// Backend response
{
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Security Features
- ✅ **Password Hashing**: Bcrypt with salt rounds for security
- ✅ **Strong Password Validation**: Enforces complex passwords
- ✅ **Email Validation**: Prevents invalid email formats
- ✅ **JWT Tokens**: Secure, stateless authentication
- ✅ **Token Persistence**: Stored in localStorage for session management

---

## 👥 2. Role-Based Access Control (RBAC)

### User Roles Defined

#### 🔴 Admin Role
- **Full System Access**: Can access all features and data
- **User Management**: Can create/manage staff accounts
- **Reports Access**: Can generate and view all reports
- **Documents Access**: Can view all documents from all users
- **Inventory Control**: Full CRUD operations on inventory

#### 🔵 Staff Role
- **Limited Access**: Restricted to operational tasks
- **No User Management**: Cannot create/manage accounts
- **No Reports**: Cannot access reporting features
- **Own Documents Only**: Can only see documents they created
- **Inventory Operations**: Can add/update inventory items

### How RBAC is Implemented

#### Frontend Protection
```javascript
// Protected Route Component
{user?.role === 'admin' && (
  <Route path="/reports" element={<Reports />} />
)}

// Navbar Role-based Display
{user?.role === 'admin' && (
  <Link to="/reports">📊 Reports</Link>
)}
```

#### Backend Authorization
```javascript
// Middleware checks user role
const requireAuth = (req, res, next) => {
  const { authorization } = req.headers;
  const token = authorization.split(' ')[1];
  const { _id, role } = jwt.verify(token, process.env.SECRET);
  req.user = { _id, role };
  next();
};

// Route-level protection
router.get('/reports', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  // Generate report...
});
```

#### Database-Level Security
```javascript
// Documents access control
let query = {};
if (role !== 'admin') {
  query.generatedBy = userId; // Staff only see their documents
}
const documents = await Document.find(query);
```

---

## 📊 3. Reports System

### Report Generation Process

#### 1. Data Collection
The system aggregates data from multiple sources:

```javascript
// Inventory additions within date range
const inventoryAdditions = await Inventory.find({
  createdAt: { $gte: startDate, $lte: endDate }
});

// Purchase records
const purchases = await Purchase.find({
  purchasedDate: { $gte: startDate, $lte: endDate }
});

// Sales orders
const sales = await Sale.find({
  createdAt: { $gte: startDate, $lte: endDate }
});
```

#### 2. Data Processing & Analytics
```javascript
// Calculate key metrics
const summary = {
  totalStockAdded: inventoryTotal + purchaseTotal,
  totalSalesAmount: salesTotal,
  totalItemsSold: soldQuantity,
  numberOfOrders: sales.length
};
```

#### 3. Report Structure
```json
{
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "inventory": {
    "items": [...],
    "totalQuantity": 100
  },
  "purchases": {
    "items": [...],
    "totalQuantity": 50
  },
  "sales": {
    "orders": [...],
    "totalAmount": 5000.00,
    "totalQuantity": 75
  },
  "summary": {
    "totalStockAdded": 150,
    "totalSalesAmount": 5000.00,
    "totalItemsSold": 75,
    "numberOfOrders": 10
  }
}
```

### PDF Generation Features

#### Professional PDF Output
- **Company Branding**: Logo and header information
- **Executive Summary**: Key metrics in cards format
- **Detailed Tables**: Formatted data with borders and styling
- **Date Range**: Clear reporting period indication

#### Technical Implementation
```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const downloadPDF = async () => {
  const doc = new jsPDF();
  
  // Add header and branding
  doc.setFontSize(20);
  doc.text('Inventory Management Report', 20, 20);
  
  // Add summary statistics
  doc.autoTable({
    startY: 40,
    head: [['Metric', 'Value']],
    body: [
      ['Total Stock Added', summary.totalStockAdded],
      ['Total Sales Amount', `RM ${summary.totalSalesAmount}`],
      // ...more metrics
    ]
  });
  
  // Save and auto-save to Documents
  doc.save(`report_${dateRange}.pdf`);
  await saveToDocuments(pdfData);
};
```

---

## 📁 4. Document Management System

### Automatic Document Saving

#### When Reports are Generated
1. **PDF Creation**: User generates report → PDF created
2. **Base64 Conversion**: PDF converted to base64 string
3. **Metadata Extraction**: File size, creation date, user info captured
4. **Database Storage**: Document saved to MongoDB

```javascript
// Automatic save process
const saveToDocuments = async (pdfBlob, reportData) => {
  const base64Data = await blobToBase64(pdfBlob);
  
  const documentData = {
    title: `Report - ${dateRange}`,
    fileName: `report_${startDate}_to_${endDate}.pdf`,
    fileData: base64Data,
    fileSize: base64Data.length,
    type: 'report',
    metadata: {
      reportType: 'inventory_sales',
      dateRange: { startDate, endDate },
      summary: reportData.summary
    }
  };
  
  await fetch('/api/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(documentData)
  });
};
```

### Document Management Features

#### 1. Document Storage Schema
```javascript
const documentSchema = new Schema({
  title: String,
  fileName: String,
  fileData: String, // Base64 encoded PDF
  fileSize: Number,
  type: { type: String, enum: ['report', 'invoice', 'other'] },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: {
    reportType: String,
    dateRange: { startDate: Date, endDate: Date },
    summary: Object
  },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });
```

#### 2. Search & Filter Capabilities
```javascript
// Advanced filtering
const filters = {
  type: 'report',           // Filter by document type
  search: 'inventory',      // Text search in title/description
  startDate: '2024-01-01',  // Date range filtering
  endDate: '2024-01-31'
};

// Database query with role-based access
let query = {};
if (userRole !== 'admin') {
  query.generatedBy = userId; // Staff see only their documents
}
if (filters.type !== 'all') {
  query.type = filters.type;
}
if (filters.search) {
  query.$or = [
    { title: { $regex: filters.search, $options: 'i' } },
    { fileName: { $regex: filters.search, $options: 'i' } }
  ];
}
```

#### 3. Statistics Dashboard
```javascript
// Real-time statistics calculation
const stats = {
  totalDocuments: await Document.countDocuments(userQuery),
  totalSize: await Document.aggregate([
    { $match: userQuery },
    { $group: { _id: null, total: { $sum: '$fileSize' } } }
  ]),
  recentDocuments: await Document.find(userQuery)
    .sort({ createdAt: -1 })
    .limit(5),
  typeBreakdown: await Document.aggregate([
    { $match: userQuery },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ])
};
```

---

## 🔄 System Integration Flow

### Complete Workflow Example

#### 1. User Login
```
User → Login Form → Backend Validation → JWT Token → Frontend State
```

#### 2. Role-Based Navigation
```
User Role Check → Show/Hide Menu Items → Route Protection → Component Access
```

#### 3. Report Generation
```
Admin Access → Date Selection → API Call → Data Aggregation → PDF Creation → Auto-Save
```

#### 4. Document Management
```
Auto-Save → Database Storage → Role-Based Retrieval → Search/Filter → Download
```

---

## 🎯 Key Presentation Points

### 1. Security Highlights
- **JWT Authentication**: Industry-standard token-based security
- **Password Encryption**: Bcrypt hashing with salt
- **Role-Based Access**: Granular permission control
- **Input Validation**: Comprehensive data validation

### 2. User Experience Features
- **Responsive Design**: Works on all devices
- **Real-time Updates**: Dynamic data loading
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during operations

### 3. Technical Excellence
- **MERN Stack**: Modern, scalable architecture
- **RESTful APIs**: Clean, standardized endpoints
- **Database Optimization**: Indexed queries for performance
- **Code Organization**: Modular, maintainable structure

### 4. Business Value
- **Automated Reporting**: Reduces manual work
- **Document Management**: Centralized file storage
- **Audit Trail**: Complete user activity tracking
- **Scalable Architecture**: Ready for business growth

---

## 🚀 Demo Flow for Presentation

### 1. Authentication Demo
1. Show login page with validation
2. Login as admin → Show full navigation
3. Logout → Login as staff → Show limited navigation

### 2. Reports Demo
1. Navigate to Reports (admin only)
2. Select date range
3. Generate report → Show data aggregation
4. Download PDF → Show professional formatting
5. Check Documents page → Show auto-saved document

### 3. Document Management Demo
1. Show Documents page with saved reports
2. Demonstrate search functionality
3. Show filtering by type and date
4. Display statistics dashboard
5. Download a saved document

### 4. Role-Based Security Demo
1. Show admin accessing all features
2. Show staff limited access
3. Demonstrate document visibility differences
4. Show API security in action

This comprehensive system demonstrates modern web development practices, security implementation, and user-centric design in a real-world business application.
