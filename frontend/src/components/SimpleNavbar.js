import { useLogout } from '../hooks/useLogout';
import { useAuthContext } from '../hooks/useAuthContext';
import { NavLink, Link } from 'react-router-dom';

const SimpleNavbar = () => {
  const { logout } = useLogout();
  const { user } = useAuthContext();

  return (
    <header className="simple-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
        <img src="/FYPLOGO_3.png" alt="Logo" style={{ width: 40, height: 40, marginRight: 10, objectFit: 'contain' }} />
        <span style={{ fontSize: 20, fontWeight: 700, color: '#000000' }}>Sultan Mosque Inventory</span>
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <NavLink to="/inventory/items" style={({isActive}) => ({ marginRight: 8, padding: '8px 12px', borderRadius: 6, textDecoration: 'none', color: isActive ? '#072017' : '#f8f1e0', background: isActive ? '#d4af37' : 'transparent', fontWeight: 700 })}>
          Inventory
        </NavLink>
        <NavLink to="/documents" style={({isActive}) => ({ marginRight: 8, padding: '8px 12px', borderRadius: 6, textDecoration: 'none', color: isActive ? '#072017' : '#f8f1e0', background: isActive ? '#d4af37' : 'transparent', fontWeight: 700 })}>
          Documents
        </NavLink>
        {user && user.role === 'admin' && (
          <NavLink to="/reports" style={({isActive}) => ({ marginRight: 8, padding: '8px 12px', borderRadius: 6, textDecoration: 'none', color: isActive ? '#072017' : '#f8f1e0', background: isActive ? '#d4af37' : 'transparent', fontWeight: 700 })}>
            Reports
          </NavLink>
        )}

        {user ? (
          <button onClick={logout} style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, background: '#d4af37', border: 'none', color: '#072017', fontWeight: 700 }}>Log out</button>
        ) : (
          <NavLink to="/login" style={({isActive}) => ({ marginLeft: 8, padding: '8px 12px', borderRadius: 6, textDecoration: 'none', color: isActive ? '#072017' : '#f8f1e0', background: isActive ? '#d4af37' : 'transparent', fontWeight: 700 })}>
            Log in
          </NavLink>
        )}
      </nav>
    </header>
  );
};

export default SimpleNavbar;
