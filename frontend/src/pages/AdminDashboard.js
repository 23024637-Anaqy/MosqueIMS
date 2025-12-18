import { useAuthContext } from '../hooks/useAuthContext';
import { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const { user } = useAuthContext();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Fetching admin dashboard, user token:', user.token);
      const response = await fetch('/api/dashboard/admin', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Dashboard response status:', response.status);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch dashboard data');
      } else {
        setDashboardData(data.summary || data);
        setError(null);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Something went wrong while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#dc2626' }}>
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} style={{
          background: '#065f46',
          color: '#f8f1e0',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#065f46', marginBottom: '20px' }}>Welcome back, {user?.name}! 👋</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Total Items Card */}
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Inventory Items</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#065f46' }}>
            {dashboardData?.totalItems || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>📦 Items in stock</div>
        </div>

        {/* Total Documents Card */}
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Documents</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#d4af37' }}>
            {dashboardData?.totalDocuments || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>📄 Documents</div>
        </div>
      </div>

      {/* Recent Items Section */}
      {dashboardData?.recentItems && dashboardData.recentItems.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>Recent Items</h2>
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentItems.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', color: '#1f2937' }}>{item.name}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{item.type}</td>
                    <td style={{ padding: '12px', color: '#1f2937', fontWeight: '500' }}>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Documents Section */}
      {dashboardData?.recentDocuments && dashboardData.recentDocuments.length > 0 && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>Recent Documents</h2>
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentDocuments.map(doc => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', color: '#1f2937' }}>{doc.title || doc.fileName}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{doc.type || 'Document'}</td>
                    <td style={{ padding: '12px', color: '#6b7280', fontSize: '12px' }}>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminDashboard;
