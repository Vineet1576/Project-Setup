import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users';

export default function Dashboard() {
  const { auth } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, verified: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.list({ limit: 1 })
      .then(() => {
        Promise.all([
          usersApi.list({ limit: 1 }),
          usersApi.list({ limit: 1, status: 'active' }),
          usersApi.list({ limit: 1, isVerified: 'Y' }),
        ]).then(([total, active, verified]) => {
          setStats({
            total: total.data?.data?.totalDocs || total.data?.totalDocs || 0,
            active: active.data?.data?.totalDocs || active.data?.totalDocs || 0,
            verified: verified.data?.data?.totalDocs || verified.data?.totalDocs || 0,
          });
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.total, color: '#3b82f6' },
    { label: 'Active Users', value: stats.active, color: '#10b981' },
    { label: 'Verified Users', value: stats.verified, color: '#f59e0b' },
  ];

  return (
    <div>
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <p className="admin-eyebrow">Overview</p>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: 'var(--body)' }}>Welcome back, {auth?.user?.email || 'Admin'}.</p>
      </div>
      {loading ? <div className="panel-card" style={{ textAlign: 'center', padding: 40 }}>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {cards.map((card) => (
            <div key={card.label} className="panel-card">
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{card.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
