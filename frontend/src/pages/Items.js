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

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) {
        setError('You must be logged in to view inventory.');
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching inventory items, user token:', user.token);
        const response = await fetchWithAuth('/api/inventory');

        console.log('Inventory response status:', response.status);
        const data = await response.json();
        console.log('Raw inventory data:', data);

        if (!response.ok) {
          setError(data.error || 'Failed to fetch inventory.');
          setItems([]);
        } else {
          // Handle both direct array and {items: []} response, normalize ids
          const itemsArray = Array.isArray(data) ? data : (data.items || []);
          const normalized = itemsArray.map((item) => ({
            ...item,
            id: item.id || item._id,
            _id: item._id || item.id,
          }));
          console.log('Items array:', normalized);
          setItems(normalized);
          setError(null);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Something went wrong while fetching inventory.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [user]);

  const handleAddItem = () => {
    navigate('/inventory/add-item');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setShowOptionsDropdown(false);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,SKU,Type,Description,Rate,Quantity\n" +
      filteredAndSortedItems.map(item => 
        `"${item.name}","${item.sku}","${item.type}","${item.description || ''}","${item.rate}","${item.quantity}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_items.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowOptionsDropdown(false);
  };

  const filteredItems = items.filter(item =>
    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAndSortedItems = [...filteredItems].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '16px' 
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #e5e7eb', 
              borderTop: '4px solid #3b82f6', 
              borderRadius: '50%',
              animation: 'spin 1s linear infinite' 
            }} />
            <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading inventory items...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
              Inventory Items
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

        {/* Debug: show count and raw JSON for troubleshooting */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ padding: 8, borderRadius: 6, background: '#fff', border: '1px solid #e6e6e6' }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>Debug: {filteredAndSortedItems.length} items</div>
            <pre style={{ maxHeight: 120, overflow: 'auto', fontSize: 12, color: '#0b3b2a', margin: 0 }}>{JSON.stringify(filteredAndSortedItems, null, 2)}</pre>
          </div>
        </div>

        {/* Items Table */}
        <InventoryDetails
          items={filteredAndSortedItems}
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
    </main>
  );
};

export default Item;
