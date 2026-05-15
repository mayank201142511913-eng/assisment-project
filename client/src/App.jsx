import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <div className="app-container">
        {user && (
          <aside className="glass-panel" style={{ width: '250px', padding: '2rem', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>Team Task Manager</h2>
            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Logged in as <br/> 
              <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>
              <span className={`badge badge-${user.role.toLowerCase()}`} style={{ marginLeft: '0.5rem' }}>{user.role}</span>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="/" style={{ padding: '0.5rem', background: 'var(--surface-color)', borderRadius: '4px' }}>Dashboard</a>
            </nav>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: 'auto', position: 'absolute', bottom: '2rem', left: '0', width: 'calc(100% - 4rem)', margin: '0 2rem' }}
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                window.location.href = '/login';
              }}
            >
              Logout
            </button>
          </aside>
        )}
        
        <main className="main-content">
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <Login setAuth={setUser} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/" 
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
