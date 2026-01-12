const { randomUUID } = require('crypto');

// Simple in-memory data store for prototype mode
const db = {
  users: [],
  inventory: [],
  documents: []
};

// Users
const createUser = ({ name, email, password, role }) => {
  const user = { id: randomUUID(), name, email, password, role };
  db.users.push(user);
  return user;
};

const findUserByEmail = (email) => db.users.find(u => u.email === email);
const findUserById = (id) => db.users.find(u => u.id === id);

// Inventory
const listInventory = (filters = {}) => {
  // simple filtering can be added later
  return db.inventory;
};

const getInventoryById = (id) => db.inventory.find(i => i.id === id);
const createInventory = (item) => {
  const record = { id: randomUUID(), ...item, createdAt: new Date() };
  db.inventory.push(record);
  return record;
};

const updateInventory = (id, updates) => {
  const item = getInventoryById(id);
  if (!item) return null;
  Object.assign(item, updates);
  return item;
};

const deleteInventory = (id) => {
  const key = String(id);
  const idx = db.inventory.findIndex(i => String(i.id) === key || String(i._id) === key);
  if (idx === -1) return false;
  db.inventory.splice(idx, 1);
  return true;
};

// Documents
const listDocuments = (query = {}) => db.documents;
const getDocumentById = (id) => db.documents.find(d => d.id === id);
const createDocument = (doc) => {
  const record = { id: randomUUID(), ...doc, createdAt: new Date(), isArchived: false };
  db.documents.push(record);
  return record;
};

const updateDocument = (id, updates) => {
  const doc = getDocumentById(id);
  if (!doc) return null;
  Object.assign(doc, updates);
  return doc;
};

const deleteDocument = (id) => {
  const key = String(id);
  const idx = db.documents.findIndex(d => String(d.id) === key || String(d._id) === key);
  if (idx === -1) return false;
  db.documents.splice(idx, 1);
  return true;
};

// Testing helper: Backdate an item's createdAt timestamp
const backdateInventoryItem = (id, daysAgo) => {
  const item = getInventoryById(id);
  if (!item) return null;
  
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  item.createdAt = date;
  
  console.log(`✓ Backdated item ${id} to ${daysAgo} days ago (${date.toLocaleString()})`);
  return item;
};

module.exports = {
  db,
  createUser,
  findUserByEmail,
  findUserById,
  listInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  listDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  backdateInventoryItem
};
