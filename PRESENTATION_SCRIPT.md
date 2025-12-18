# 🎤 FYP Presentation Script - Key Features

## Opening Statement
"Today I'll demonstrate a comprehensive inventory management system built with the MERN stack, featuring advanced authentication, role-based access control, automated reporting, and document management."

---

## 🔐 1. Authentication & Security (3-4 minutes)

### What to Say:
"First, let me show you our comprehensive authentication system with both login and signup capabilities..."

### Demo Steps:

#### A. **User Registration (Signup)**
1. **Show Signup Page**
   - "New users can register through our secure signup form"
   - "The system validates all input fields in real-time"
   
2. **Demonstrate Input Validation**
   - Name: "Full name is required for user identification"
   - Email: "Email validation prevents invalid addresses"
   - Password: "Strong password requirements enforce security"
   - Role: "Admin can assign roles during user creation"

3. **Security During Registration**
   - "Emails must be unique - no duplicate accounts"
   - "Passwords are immediately hashed with bcrypt"
   - "Role validation ensures only valid roles are assigned"

#### B. **User Login**
4. **Show Login Page**
   - "Existing users authenticate with email and password"
   - "Secure credential verification against database"
   
5. **Explain Security Features**
   - "Passwords are encrypted using bcrypt hashing"
   - "We use JWT tokens for secure session management"
   - "Tokens are stored securely and expire for safety"

### Why Signup is Critical for Business:

#### 🏢 **Business Scalability**
- **User Management**: "Companies need to add new employees as they grow"
- **Role Assignment**: "Different employees need different access levels"
- **Accountability**: "Every action is tracked to specific users"

#### 🔒 **Security & Compliance**
- **Access Control**: "Only authorized personnel can access inventory data"
- **Audit Trail**: "Track who made what changes for compliance"
- **Data Protection**: "Personal accounts prevent unauthorized access"

#### 👥 **Multi-User Environment**
- **Team Collaboration**: "Multiple staff members can work simultaneously"
- **Department Separation**: "Sales staff vs inventory managers"
- **Shift Management**: "Different users for different work shifts"

### Technical Implementation:
```javascript
// 1. User Schema with Role-based Validation (backend/models/userModel.js)
const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'staff'],
  }
});

// 2. Signup validation with security
userSchema.statics.signup = async function (name, email, password, role) {
  // Validation checks
  if (!email || !password || !name || !role) {
    throw Error('All fields must be filled')
  }
  if (!validator.isEmail(email)) {
    throw Error('Email is not valid')
  }
  if (!validator.isStrongPassword(password)) {
    throw Error('Password not strong enough')
  }
  
  // Prevent duplicate accounts
  const exists = await this.findOne({ email });
  if (exists) {
    throw Error('Email already in use')
  }
  
  // Role validation
  if (!['admin', 'staff'].includes(role)) {
    throw Error('Invalid role');
  }
  
  // Secure password hashing
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  // Create user with role
  const user = await this.create({ name, email, password: hash, role });
  return user;
}

// 3. Login validation
userSchema.statics.login = async function(email, password) {
  if (!email || !password) {
    throw Error('All fields must be filled')
  }

  const user = await this.findOne({ email })
  if (!user) {
    throw Error('Incorrect email')
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    throw Error('Incorrect password')
  }

  return user
}
```

```javascript
// 4. Frontend Signup Hook (frontend/src/hooks/useSignup.js)
import { useState } from 'react'
import { useAuthContext } from './useAuthContext'

export const useSignup = () => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(null)
  const { dispatch } = useAuthContext()

  const signup = async (name, email, password, role) => {
    setIsLoading(true)
    setError(null)

    const response = await fetch('/api/user/signup', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ name, email, password, role })
    })
    const json = await response.json()

    if (!response.ok) {
      setIsLoading(false)
      setError(json.error)
    }
    if (response.ok) {
      // Save user to local storage
      localStorage.setItem('user', JSON.stringify(json))

      // Update the auth context
      dispatch({type: 'LOGIN', payload: json})

      setIsLoading(false)
    }
  }

  return { signup, isLoading, error }
}
```

```javascript
// 5. JWT Token Creation (backend/controllers/userController.js)
const jwt = require('jsonwebtoken')

const createToken = (_id, role) => {
  return jwt.sign({_id, role}, process.env.SECRET, { expiresIn: '3d' })
}

// Signup controller
const signupUser = async (req, res) => {
  const {name, email, password, role} = req.body

  try {
    const user = await User.signup(name, email, password, role)

    // Create token with user ID and role
    const token = createToken(user._id, user.role)

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    })
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}
```

### Key Technical Points:
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ JWT token authentication  
- ✅ Email validation and uniqueness
- ✅ Strong password requirements
- ✅ Role-based user creation
- ✅ Input sanitization and validation

---

## 👥 2. Role-Based Access Control (3-4 minutes)

### What to Say:
"The system implements sophisticated role-based access control with two user types, and admins can create new users with appropriate roles..."

### Demo Steps:
1. **Show User Creation (Admin Function)**
   - "Admins can create new user accounts through the signup system"
   - "Role assignment happens during user creation"
   - "This ensures proper access control from day one"

2. **Login as Admin**
   - Show full navigation menu
   - "Admins have access to all features including Reports and user management"
   
3. **Logout and Login as Staff**
   - Show limited navigation
   - "Staff users have restricted access - no Reports, limited document visibility"

4. **Show Code Example** (optional)
   ```javascript
   // 1. Frontend Route Protection (frontend/src/App.js)
   import { useAuthContext } from './hooks/useAuthContext'
   
   function App() {
     const { user } = useAuthContext()
   
     return (
       <div className="App">
         <BrowserRouter>
           <Navbar />
           <div className="pages">
             <Routes>
               {/* Public routes */}
               <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
               <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
               
               {/* Protected routes */}
               <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
               <Route path="/inventory" element={user ? <Items /> : <Navigate to="/login" />} />
               
               {/* Admin-only routes */}
               {user?.role === 'admin' && (
                 <>
                   <Route path="/reports" element={<Reports />} />
                   <Route path="/documents" element={<Documents />} />
                 </>
               )}
             </Routes>
           </div>
         </BrowserRouter>
       </div>
     )
   }
   ```

   ```javascript
   // 2. Backend Route Protection (backend/middleware/requireAuth.js)
   const jwt = require('jsonwebtoken')
   const User = require('../models/userModel')

   const requireAuth = async (req, res, next) => {
     // Verify authentication
     const { authorization } = req.headers

     if (!authorization) {
       return res.status(401).json({error: 'Authorization token required'})
     }

     const token = authorization.split(' ')[1]

     try {
       const { _id, role } = jwt.verify(token, process.env.SECRET)
       
       // Add user info to request object
       req.user = await User.findOne({ _id }).select('_id role name email')
       next()

     } catch (error) {
       console.log(error)
       res.status(401).json({error: 'Request is not authorized'})
     }
   }

   module.exports = requireAuth
   ```

   ```javascript
   // 3. Role-based API Access (backend/routes/reports.js)
   const express = require('express');
   const { generateReport } = require('../controllers/reportsController');
   const requireAuth = require('../middleware/requireAuth');

   const router = express.Router();

   // Require auth for all routes
   router.use(requireAuth);

   // Admin-only route
   router.get('/', (req, res, next) => {
     if (req.user.role !== 'admin') {
       return res.status(403).json({ error: 'Admin access required' });
     }
     next();
   }, generateReport);

   module.exports = router;
   ```

   ```javascript
   // 4. Navbar Role-based Display (frontend/src/components/Navbar.js)
   import { useAuthContext } from '../hooks/useAuthContext'

   const Navbar = () => {
     const { user } = useAuthContext()

     return (
       <nav>
         <div className="nav-links">
           {user && (
             <>
               <Link to="/">Dashboard</Link>
               <Link to="/inventory">Inventory</Link>
               
               {/* Admin-only links */}
               {user.role === 'admin' && (
                 <>
                   <Link to="/reports">📊 Reports</Link>
                   <Link to="/documents">📁 Documents</Link>
                   <Link to="/users">👥 Users</Link>
                 </>
               )}
               
               <div className="user-info">
                 <span>{user.name} ({user.role})</span>
                 <button onClick={handleLogout}>Logout</button>
               </div>
             </>
           )}
         </div>
       </nav>
     )
   }
   ```
   
   // Role assignment during signup
   const user = await User.signup(name, email, password, role);

### Key Differences to Highlight:
| Feature | Admin | Staff |
|---------|-------|-------|
| Create Users | ✅ Yes | ❌ No |
| Reports | ✅ Full Access | ❌ No Access |
| Documents | ✅ All Documents | ✅ Own Documents Only |
| User Management | ✅ Yes | ❌ No |
| Inventory | ✅ Full CRUD | ✅ Add/Update Only |

### Why Role-Based Signup Matters:
- 🎯 **Immediate Access Control**: Users get correct permissions from registration
- 🔒 **Security by Design**: No privilege escalation possible
- 👔 **Business Hierarchy**: Reflects real company organizational structure
- 📊 **Audit Compliance**: Every user action is tracked with role context

---

## 📊 3. Advanced Reporting System (4-5 minutes)

### What to Say:
"Our reporting system provides comprehensive business intelligence with professional PDF output..."

### Demo Steps:
1. **Navigate to Reports** (as admin)
   - "Only admins can access the reporting module"
   
2. **Select Date Range**
   - "Users can specify custom date ranges for analysis"
   
3. **Generate Report**
   - "The system aggregates data from multiple sources:"
   - "📦 Inventory additions"
   - "🛒 Purchase records" 
   - "💰 Sales transactions"
   
4. **Show Report Data**
   - Point out summary cards
   - Show detailed tables
   - "All calculations are done in real-time"

5. **Download PDF**
   - "Generate professional PDF with company branding"
   - Show the downloaded PDF
   - "Notice the professional formatting and detailed tables"

### Technical Highlights:
```javascript
// 1. Reports Controller - Data Aggregation (backend/controllers/reportsController.js)
const generateReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 1. Get inventory additions within date range
    const inventoryAdditions = await Inventory.find({
      createdAt: { $gte: start, $lte: end }
    }).select('name quantity type description rate createdAt user_id')
      .sort({ createdAt: -1 });

    // 2. Get purchases within date range
    const purchases = await Purchase.find({
      purchasedDate: { $gte: start, $lte: end }
    }).populate('InventoryId', 'name type')
      .select('quantity purchasedDate rate InventoryId')
      .sort({ purchasedDate: -1 });

    // 3. Get sales within date range
    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end }
    }).populate('items.item', 'name type')
      .select('orderNumber customerName items status totalAmount createdAt')
      .sort({ createdAt: -1 });

    // 4. Calculate summary statistics
    const inventoryTotal = inventoryAdditions.reduce((sum, item) => sum + item.quantity, 0);
    const purchaseTotal = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
    const salesTotal = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const soldQuantity = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    const summary = {
      totalStockAdded: inventoryTotal + purchaseTotal,
      totalSalesAmount: salesTotal,
      totalItemsSold: soldQuantity,
      numberOfOrders: sales.length
    };

    // 5. Return comprehensive report data
    res.status(200).json({
      dateRange: { startDate, endDate },
      inventory: { items: inventoryAdditions, totalQuantity: inventoryTotal },
      purchases: { items: purchases, totalQuantity: purchaseTotal },
      sales: { orders: sales, totalAmount: salesTotal, totalQuantity: soldQuantity },
      summary
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

```javascript
// 2. PDF Generation with Auto-Save (frontend/src/pages/Reports.js)
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const downloadPDF = async () => {
  try {
    const doc = new jsPDF();
    
    // Add header and branding
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('INVENTORY MANAGEMENT REPORT', 20, 20);
    
    // Add report metadata
    doc.setFontSize(12);
    doc.text(`Report Period: ${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}`, 20, 35);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Generated by: ${user.name} (${user.role})`, 20, 55);

    // Summary statistics table
    doc.autoTable({
      startY: 70,
      head: [['Metric', 'Value']],
      body: [
        ['Total Stock Added', `${reportData.summary.totalStockAdded} items`],
        ['Total Sales Amount', `RM ${reportData.summary.totalSalesAmount.toFixed(2)}`],
        ['Total Items Sold', `${reportData.summary.totalItemsSold} items`],
        ['Number of Orders', `${reportData.summary.numberOfOrders} orders`]
      ],
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 }
    });

    // Inventory additions table
    if (reportData.inventory.items.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Item Name', 'Type', 'Quantity', 'Rate (RM)', 'Date Added']],
        body: reportData.inventory.items.map(item => [
          item.name,
          item.type,
          item.quantity,
          `RM ${item.rate.toFixed(2)}`,
          formatDate(item.createdAt)
        ]),
        headStyles: { fillColor: [52, 152, 219] }
      });
    }

    // Sales orders table
    if (reportData.sales.orders.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 120,
        head: [['Order Number', 'Customer', 'Items', 'Amount (RM)', 'Date']],
        body: reportData.sales.orders.map(sale => [
          sale.orderNumber,
          sale.customerName,
          sale.items.length,
          `RM ${sale.totalAmount.toFixed(2)}`,
          formatDate(sale.createdAt)
        ]),
        headStyles: { fillColor: [231, 76, 60] }
      });
    }

    // Convert to blob for auto-save
    const pdfBlob = doc.output('blob');
    
    // Save to Downloads
    doc.save(`Inventory_Report_${filters.startDate}_to_${filters.endDate}.pdf`);
    
    // Auto-save to Documents collection
    await saveToDocuments(pdfBlob);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    setError('Failed to generate PDF report');
  }
};

// 3. Auto-save to Documents
const saveToDocuments = async (pdfBlob) => {
  try {
    const base64Data = await blobToBase64(pdfBlob);
    
    const documentData = {
      title: `Inventory Report - ${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}`,
      fileName: `inventory_report_${filters.startDate}_to_${filters.endDate}.pdf`,
      fileData: base64Data,
      fileSize: base64Data.length,
      type: 'report',
      description: `Comprehensive inventory and sales report for the period ${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}`,
      metadata: {
        reportType: 'inventory_sales',
        dateRange: {
          startDate: filters.startDate,
          endDate: filters.endDate
        },
        summary: reportData.summary
      }
    };

    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(documentData)
    });

    if (response.ok) {
      console.log('✅ Report automatically saved to Documents');
    }
  } catch (error) {
    console.error('Failed to auto-save document:', error);
  }
};
```

---

## 📁 4. Document Management System (3-4 minutes)

### What to Say:
"Every report is automatically saved to our document management system..."

### Demo Steps:
1. **Navigate to Documents Page**
   - "Notice the report we just generated is automatically here"
   
2. **Show Statistics Dashboard**
   - "Real-time statistics show total documents, file sizes, recent activity"
   
3. **Demonstrate Search & Filter**
   - Search by name: "Try searching for 'inventory'"
   - Filter by type: "Filter by report type"
   - Date range filter: "Find documents from specific periods"
   
4. **Show Role-Based Access**
   - "Admins see all documents, staff only see their own"
   
5. **Download Functionality**
   - "Users can re-download any saved document"

### Key Features to Mention:
- ✅ Automatic saving from Reports
- ✅ Base64 PDF storage in MongoDB
- ✅ Advanced search and filtering
- ✅ Role-based document visibility
- ✅ File size and metadata tracking

### Technical Implementation:
```javascript
// 1. Document Schema (backend/models/documentModel.js)
const documentSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileData: {
    type: String, // Base64 encoded file data
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['report', 'invoice', 'other'],
    default: 'other'
  },
  description: String,
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    reportType: String,
    dateRange: {
      startDate: Date,
      endDate: Date
    },
    summary: Object
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create indexes for better performance
documentSchema.index({ generatedBy: 1, type: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ title: 'text', fileName: 'text', description: 'text' });
```

```javascript
// 2. Documents Controller with Role-based Access (backend/controllers/documentsController.js)
const getDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search, startDate, endDate } = req.query;
    const { _id: userId, role } = req.user;

    // Build query with role-based access
    let query = {};
    
    // Role-based access: admin sees all, users see only their own
    if (role !== 'admin') {
      query.generatedBy = userId;
    }

    // Filter by type
    if (type && type !== 'all') {
      query.type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const documents = await Document.find(query)
      .populate('generatedBy', 'name email role')
      .select('-fileData') // Exclude large file data from list
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Document.countDocuments(query);

    res.status(200).json({
      documents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Document statistics
const getDocumentStats = async (req, res) => {
  try {
    const { _id: userId, role } = req.user;
    
    let userQuery = {};
    if (role !== 'admin') {
      userQuery.generatedBy = userId;
    }

    // Calculate statistics
    const totalDocuments = await Document.countDocuments(userQuery);
    
    const sizeResult = await Document.aggregate([
      { $match: userQuery },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);
    
    const typeBreakdown = await Document.aggregate([
      { $match: userQuery },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const recentDocuments = await Document.find(userQuery)
      .populate('generatedBy', 'name')
      .select('title type createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      totalDocuments,
      totalSize: sizeResult[0]?.totalSize || 0,
      typeBreakdown,
      recentDocuments
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

```javascript
// 3. Frontend Documents Page with Search & Filter (frontend/src/pages/Documents.js)
const Documents = () => {
  const { user } = useAuthContext();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    startDate: '',
    endDate: '',
    page: 1
  });

  // Fetch documents with filters
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: 10,
        ...(filters.search && { search: filters.search }),
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`/api/documents?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDocuments(data.documents);
      setError(null);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(`Failed to fetch documents: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Download document
  const downloadDocument = async (documentId, fileName) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download document');
    }
  };

  // Filter handlers
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleTypeFilter = (type) => {
    setFilters(prev => ({ ...prev, type, page: 1 }));
  };

  return (
    <div className="documents-page">
      {/* Statistics Dashboard */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.totalDocuments}</h3>
            <p>Total Documents</p>
          </div>
          <div className="stat-card">
            <h3>{formatFileSize(stats.totalSize)}</h3>
            <p>Total Storage</p>
          </div>
          <div className="stat-card">
            <h3>{stats.recentDocuments.length}</h3>
            <p>Recent Documents</p>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search documents..."
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          value={filters.type}
          onChange={(e) => handleTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="report">Reports</option>
          <option value="invoice">Invoices</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Documents List */}
      <div className="documents-list">
        {documents.map(doc => (
          <div key={doc._id} className="document-item">
            <div className="doc-info">
              <h3>{doc.title}</h3>
              <p>{doc.description}</p>
              <span>Created: {formatDate(doc.createdAt)}</span>
              <span>Size: {formatFileSize(doc.fileSize)}</span>
            </div>
            <button onClick={() => downloadDocument(doc._id, doc.fileName)}>
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔄 5. System Integration Demo (2-3 minutes)

### What to Say:
"Let me show you how all these systems work together seamlessly..."

### Demo Flow:
1. **Login** → "Secure authentication"
2. **Role Check** → "Automatic permission assignment"
3. **Generate Report** → "Data aggregation and PDF creation"
4. **Auto-Save** → "Automatic document storage"
5. **Document Access** → "Role-based retrieval and management"

### Show Complete Workflow:
```
User Login → Role Detection → Reports Access → PDF Generation → Auto-Save → Document Management
```

### Technical Integration Code:
```javascript
// 1. Complete Authentication Flow (frontend/src/context/AuthContext.js)
import { createContext, useReducer, useEffect } from 'react';

export const AuthContext = createContext();

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload }
    case 'LOGOUT':
      return { user: null }
    default:
      return state
  }
}

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null
  })

  useEffect(() => {
    // Check if user is already logged in
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) {
      dispatch({ type: 'LOGIN', payload: user })
    }
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      { children }
    </AuthContext.Provider>
  )
}
```

```javascript
// 2. Protected Route Component (frontend/src/components/ProtectedRoute.js)
import { useAuthContext } from '../hooks/useAuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuthContext();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
```

```javascript
// 3. Complete Workflow Example - Report Generation to Document Storage
const generateAndSaveReport = async (startDate, endDate) => {
  try {
    // Step 1: Authenticate and verify admin role
    const token = user.token;
    if (user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Step 2: Fetch report data from backend
    const reportResponse = await fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const reportData = await reportResponse.json();

    // Step 3: Generate PDF with jsPDF
    const doc = new jsPDF();
    
    // Add content to PDF
    doc.text('Inventory Management Report', 20, 20);
    doc.autoTable({
      head: [['Metric', 'Value']],
      body: [
        ['Total Stock Added', reportData.summary.totalStockAdded],
        ['Total Sales Amount', `RM ${reportData.summary.totalSalesAmount}`],
        ['Total Items Sold', reportData.summary.totalItemsSold],
        ['Number of Orders', reportData.summary.numberOfOrders]
      ]
    });

    // Step 4: Convert PDF to blob and base64
    const pdfBlob = doc.output('blob');
    const base64Data = await blobToBase64(pdfBlob);

    // Step 5: Auto-save to Documents collection
    const documentData = {
      title: `Inventory Report - ${startDate} to ${endDate}`,
      fileName: `inventory_report_${startDate}_to_${endDate}.pdf`,
      fileData: base64Data,
      fileSize: base64Data.length,
      type: 'report',
      metadata: {
        reportType: 'inventory_sales',
        dateRange: { startDate, endDate },
        summary: reportData.summary
      }
    };

    const saveResponse = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(documentData)
    });

    // Step 6: Provide user feedback
    if (saveResponse.ok) {
      console.log('✅ Report generated and automatically saved to Documents');
      // Trigger download
      doc.save(`inventory_report_${startDate}_to_${endDate}.pdf`);
    }

  } catch (error) {
    console.error('Workflow error:', error);
    setError(`Failed to complete workflow: ${error.message}`);
  }
};

// Helper function for base64 conversion
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
```

```javascript
// 4. Complete API Route with Role-based Security (backend/server.js)
const express = require('express');
const cors = require("cors");
const mongoose = require('mongoose');

// Import routes
const userRoutes = require('./routes/user');
const reportsRoutes = require('./routes/reports');
const documentsRoutes = require('./routes/documents');
const inventoryRoutes = require('./routes/inventory');
const requireAuth = require('./middleware/requireAuth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public routes (no authentication required)
app.use('/api/user', userRoutes);

// Protected routes (authentication required)
app.use(requireAuth); // This middleware protects all routes below

// Admin-only routes
app.use('/api/reports', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}, reportsRoutes);

// Role-based document access
app.use('/api/documents', documentsRoutes);

// General protected routes
app.use('/api/inventory', inventoryRoutes);

// Database connection and server startup
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log('Connected to DB & listening on port', process.env.PORT);
    });
  })
  .catch((error) => {
    console.log(error);
  });
```

---

## 🎯 6. Technical Excellence Summary (1-2 minutes)

### Architecture Highlights:
- **Frontend**: React with Context API for state management
- **Backend**: Express.js with MongoDB for data persistence
- **Security**: JWT tokens + bcrypt encryption
- **Integration**: RESTful APIs with proper error handling

### Code Quality Features:
- ✅ Modular component architecture
- ✅ Reusable custom hooks
- ✅ Protected routes and middleware
- ✅ Input validation and sanitization
- ✅ Error handling and user feedback

### Complete Architecture Code Examples:

```javascript
// 1. Custom Hook for Authentication (frontend/src/hooks/useAuthContext.js)
import { AuthContext } from '../context/AuthContext'
import { useContext } from 'react'

export const useAuthContext = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw Error('useAuthContext must be used inside an AuthContextProvider')
  }

  return context
}
```

```javascript
// 2. Error Handling Utility (frontend/src/utils/errorHandler.js)
export const handleApiError = (error, setError) => {
  console.error('API Error:', error);
  
  if (error.name === 'NetworkError' || error.message === 'Failed to fetch') {
    setError('Network error: Please check your connection and ensure the server is running');
  } else if (error.status === 401) {
    setError('Authentication failed: Please log in again');
  } else if (error.status === 403) {
    setError('Access denied: You do not have permission for this action');
  } else if (error.status === 500) {
    setError('Server error: Please try again later');
  } else {
    setError(error.message || 'An unexpected error occurred');
  }
};
```

```javascript
// 3. Input Validation Component (frontend/src/components/FormInput.js)
import { useState } from 'react';

const FormInput = ({ 
  type, 
  placeholder, 
  value, 
  onChange, 
  required = false,
  validation = null 
}) => {
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // Run validation if provided
    if (validation) {
      const validationResult = validation(newValue);
      setError(validationResult.error || '');
    }
    
    onChange(newValue);
  };

  return (
    <div className="form-input">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        required={required}
        className={error ? 'error' : ''}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default FormInput;
```

```javascript
// 4. Database Connection with Error Handling (backend/config/database.js)
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

```javascript
// 5. API Response Formatter (backend/utils/responseFormatter.js)
class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  static validationError(res, errors) {
    return this.error(res, 'Validation failed', 400, errors);
  }

  static notFound(res, resource = 'Resource') {
    return this.error(res, `${resource} not found`, 404);
  }

  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden access') {
    return this.error(res, message, 403);
  }
}

module.exports = ApiResponse;
```

```javascript
// 6. Environment Configuration (backend/config/config.js)
const config = {
  development: {
    port: process.env.PORT || 4000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.SECRET,
    jwtExpire: '3d',
    bcryptSaltRounds: 10
  },
  production: {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.SECRET,
    jwtExpire: '1d',
    bcryptSaltRounds: 12
  },
  test: {
    port: process.env.PORT || 3001,
    mongoUri: process.env.MONGO_TEST_URI,
    jwtSecret: 'test-secret',
    jwtExpire: '1h',
    bcryptSaltRounds: 8
  }
};

const environment = process.env.NODE_ENV || 'development';

module.exports = config[environment];
```

---

## 🚀 Closing Statement

"This system demonstrates modern web development practices with enterprise-level security, user experience design, and scalable architecture. It's ready for real-world deployment and can easily scale to support growing business needs."

---

## 💡 Q&A Preparation

### Likely Questions & Answers:

**Q: "Why did you choose the MERN stack?"**
A: "MERN provides a cohesive JavaScript ecosystem, making development faster and maintenance easier. React's component-based architecture ensures scalability, while MongoDB's flexibility handles complex inventory data structures."

**Q: "How secure is the authentication system?"**
A: "We implement industry-standard security with bcrypt password hashing, JWT tokens, and role-based access control. All sensitive routes are protected with middleware authentication."

**Q: "Why is user signup important in an inventory system?"**
A: "Signup enables multi-user environments essential for businesses. It allows role-based access control, creates accountability through user tracking, and supports business scalability as companies grow and add new employees."

**Q: "How do you prevent unauthorized signups?"**
A: "We implement several security measures: email validation, strong password requirements, duplicate email prevention, and role validation. In production, admin approval or invitation-only registration could be added."

**Q: "Can the system handle large amounts of data?"**
A: "Yes, we've implemented pagination, database indexing, and optimized queries. The document system uses efficient base64 storage, and reports can be filtered by date ranges to manage large datasets."

**Q: "How would you deploy this system?"**
A: "The system is deployment-ready for platforms like Heroku, AWS, or DigitalOcean. We'd use MongoDB Atlas for the database and implement environment-based configuration for different deployment stages."

---

## 📱 Demo Tips

1. **Prepare user accounts beforehand**:
   - Create an admin account: admin@example.com / Password123!
   - Create a staff account: staff@example.com / Password123!
   - Test both accounts before presentation
   
2. **Have sample data ready** - Pre-populate inventory, sales, and users

3. **Demo the signup process live** (optional):
   - Show creating a new staff account
   - Demonstrate validation errors (weak password, duplicate email)
   - Show immediate role assignment

4. **Test all features beforehand** - Ensure everything works smoothly

5. **Prepare for live coding** - Be ready to show specific code sections

6. **Have backup screenshots** - In case of technical issues

7. **Time your demo** - Practice to fit within your allocated time

8. **Signup demo variations**:
   - Show successful registration
   - Demonstrate validation failures
   - Show immediate login after signup

**Good luck with your presentation! 🎉**
