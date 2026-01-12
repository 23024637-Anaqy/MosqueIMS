import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InventoryDetails from '../components/InventoryDetails';
import { useAuthContext } from '../hooks/useAuthContext';
import fetchWithAuth from '../utils/fetchWithAuth';

const Item = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    sku: '',
    type: '',
    description: '',
    rate: '',
    quantity: ''
  });
  const [editError, setEditError] = useState(null);

  // Fetch inventory on component mount
  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) {
        setError('You must be logged in to view inventory.');
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        // Try DB-style route first
        let res = await fetchWithAuth('/api/inventory/items');
        
        // If not ok, try prototype-style route
        if (!res.ok) {
          res = await fetchWithAuth('/api/inventory');
        }

        if (res.ok) {
          const data = await res.json();
          const itemsArray = data.items || data || [];
          setItems(itemsArray);
          setError(null);
        } else {
          setItems([]);
          setError(`Failed to load inventory (status ${res.status})`);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setItems([]);
        setError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [user]);

  const handleAddItem = () => {
    navigate('/inventory/add-item');
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || '',
      sku: item.sku || '',
      type: item.type || '',
      description: item.description || '',
      rate: item.rate || '',
      quantity: item.quantity || ''
    });
    setEditError(null);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm({
      name: '',
      sku: '',
      type: '',
      description: '',
      rate: '',
      quantity: ''
    });
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    try {
      const itemId = editingItem.id || editingItem._id;
      
      // Staff can only edit quantity for same-day items
      if (user.role === 'staff') {
        const itemCreatedDate = new Date(editingItem.created_at).toDateString();
        const today = new Date().toDateString();
        
        if (itemCreatedDate !== today) {
          setEditError('You can only edit quantity for today\'s items');
          return;
        }
        
        // Staff can only edit quantity
        const payload = { quantity: parseInt(editForm.quantity) || 0 };
        let res = await fetchWithAuth(`/api/inventory/items/${encodeURIComponent(itemId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          res = await fetchWithAuth(`/api/inventory/${encodeURIComponent(itemId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        if (res.ok) {
          const updatedItem = await res.json();
          setItems(prev => prev.map(i => (i.id || i._id) === itemId ? updatedItem : i));
          handleCancelEdit();
        } else {
          const data = await res.json().catch(() => ({}));
          setEditError(data.error || 'Failed to update item');
        }
      } else {
        // Admin can edit all fields
        const payload = {
          name: editForm.name,
          sku: editForm.sku,
          type: editForm.type,
          description: editForm.description,
          rate: parseFloat(editForm.rate) || 0,
          quantity: parseInt(editForm.quantity) || 0
        };

        let res = await fetchWithAuth(`/api/inventory/items/${encodeURIComponent(itemId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          res = await fetchWithAuth(`/api/inventory/${encodeURIComponent(itemId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        if (res.ok) {
          const updatedItem = await res.json();
          setItems(prev => prev.map(i => (i.id || i._id) === itemId ? updatedItem : i));
          handleCancelEdit();
        } else {
          const data = await res.json().catch(() => ({}));
          setEditError(data.error || 'Failed to update item');
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      setEditError('Something went wrong while saving');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'SKU', 'Type', 'Description', 'Rate', 'Quantity', 'Total Value', 'Created Date'];
    const rows = filteredAndSortedItems.map(item => [
      item.name || '',
      item.sku || '',
      item.type || '',
      item.description || '',
      item.rate || 0,
      item.quantity || 0,
      ((item.rate || 0) * (item.quantity || 0)).toFixed(2),
      new Date(item.created_at).toLocaleDateString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredItems = items.filter(item =>
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAndSortedItems = [...filteredItems].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';

    // Convert to numbers for numeric fields
    if (sortBy === 'quantity' || sortBy === 'rate') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Loading inventory...
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px 0',
            color: '#000000',
            marginBottom: '16px'
          }}
        >
          ← Back to Dashboard
        </button>

        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: '0 0 8px 0'
            }}>
              📦 Inventory
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              margin: '0'
            }}>
              Manage your inventory items and stock levels
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {user.role === 'admin' && (
              <button
                onClick={handleAddItem}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s'
                }}
              >
                <span style={{ fontSize: '16px' }}>+</span>
                Add Item
              </button>
            )}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
                }}
              >
                ⋯
              </button>
              {showOptionsDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  minWidth: '180px',
                  marginTop: '4px'
                }}>
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ 
                      padding: '8px 16px', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      Sort by
                    </div>
                    <button
                      onClick={() => handleSort('name')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: sortBy === 'name' ? '#f3f4f6' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    >
                      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => handleSort('sku')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: sortBy === 'sku' ? '#f3f4f6' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    >
                      SKU {sortBy === 'sku' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => handleSort('quantity')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: sortBy === 'quantity' ? '#f3f4f6' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    >
                      Quantity {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => handleSort('rate')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: sortBy === 'rate' ? '#f3f4f6' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    >
                      Rate {sortBy === 'rate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #f3f4f6' }} />
                    <button
                      onClick={handleExportCSV}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>📊</span>
                      Export to CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ 
          background: 'white', 
          padding: '16px 20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1, maxWidth: '300px' }}>
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {filteredAndSortedItems.length} items found
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Items Table */}
        <InventoryDetails
          items={filteredAndSortedItems}
          onEdit={handleEditItem}
          onDelete={async (id) => {
            if (!id) return;
            const confirmed = window.confirm('Delete this item?');
            if (!confirmed) return;

            try {
              // Try DB-style route first
              let res = await fetchWithAuth(`/api/inventory/items/${encodeURIComponent(id)}`, { method: 'DELETE' });

              // If not ok, try prototype-style route
              if (!res.ok) {
                res = await fetchWithAuth(`/api/inventory/${encodeURIComponent(id)}`, { method: 'DELETE' });
              }

              if (res.ok) {
                setItems(prev => prev.filter(i => (i.id || i._id) !== id));
                setError(null);
              } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || `Failed to delete item (id ${id}, status ${res.status})`);
              }
            } catch (err) {
              console.error('Delete failed', err);
              setError('Something went wrong while deleting the item');
            }
          }}
        />
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={handleCancelEdit}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                padding: '20px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  margin: 0 
                }}>
                  Edit Item
                </h2>
                {user.role === 'staff' && (
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#f59e0b',
                    margin: '8px 0 0 0',
                    padding: '8px 12px',
                    background: '#fef3c7',
                    borderRadius: '4px',
                    border: '1px solid #fde68a'
                  }}>
                    ⚠️ As staff, you can only edit quantity for today's items
                  </p>
                )}
              </div>

              <div style={{ padding: '20px' }}>
                {/* Error Message */}
                {editError && (
                  <div style={{ 
                    background: '#fef2f2', 
                    border: '1px solid #fecaca', 
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    ❌ {editError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Name */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Name {user.role === 'staff' && <span style={{ color: '#9ca3af' }}>(read-only)</span>}
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleEditFormChange('name', e.target.value)}
                      disabled={user.role === 'staff'}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        background: user.role === 'staff' ? '#f3f4f6' : 'white',
                        cursor: user.role === 'staff' ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      SKU {user.role === 'staff' && <span style={{ color: '#9ca3af' }}>(read-only)</span>}
                    </label>
                    <input
                      type="text"
                      value={editForm.sku}
                      onChange={(e) => handleEditFormChange('sku', e.target.value)}
                      disabled={user.role === 'staff'}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        background: user.role === 'staff' ? '#f3f4f6' : 'white',
                        cursor: user.role === 'staff' ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Type {user.role === 'staff' && <span style={{ color: '#9ca3af' }}>(read-only)</span>}
                    </label>
                    <input
                      type="text"
                      value={editForm.type}
                      onChange={(e) => handleEditFormChange('type', e.target.value)}
                      disabled={user.role === 'staff'}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        background: user.role === 'staff' ? '#f3f4f6' : 'white',
                        cursor: user.role === 'staff' ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Description {user.role === 'staff' && <span style={{ color: '#9ca3af' }}>(read-only)</span>}
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => handleEditFormChange('description', e.target.value)}
                      disabled={user.role === 'staff'}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical',
                        background: user.role === 'staff' ? '#f3f4f6' : 'white',
                        cursor: user.role === 'staff' ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>

                  {/* Rate */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Rate {user.role === 'staff' && <span style={{ color: '#9ca3af' }}>(read-only)</span>}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.rate}
                      onChange={(e) => handleEditFormChange('rate', e.target.value)}
                      disabled={user.role === 'staff'}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        background: user.role === 'staff' ? '#f3f4f6' : 'white',
                        cursor: user.role === 'staff' ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>

                  {/* Quantity - Editable for both */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Quantity {user.role === 'staff' && (() => {
                        const itemCreatedDate = new Date(editingItem.created_at);
                        const now = new Date();
                        const itemDay = new Date(itemCreatedDate.getFullYear(), itemCreatedDate.getMonth(), itemCreatedDate.getDate());
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const isToday = itemDay.getTime() === today.getTime();
                        
                        return isToday 
                          ? <span style={{ color: '#10b981' }}>✓ Editable</span>
                          : <span style={{ color: '#ef4444' }}>✗ Uneditable</span>;
                      })()}
                    </label>
                    <input
                      type="number"
                      value={editForm.quantity}
                      onChange={(e) => handleEditFormChange('quantity', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ 
                padding: '16px 20px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Overlay for dropdown */}
      {showOptionsDropdown && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5
          }}
          onClick={() => setShowOptionsDropdown(false)}
        />
      )}
    </>
  );
};

export default Item;
