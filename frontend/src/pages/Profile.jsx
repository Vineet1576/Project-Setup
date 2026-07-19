import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';

export default function Profile() {
  const { auth, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', mobileno: '', address: '', city: '', state: '', country: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getProfile()
      .then((res) => {
        const data = res.data?.data || res.data;
        setProfile(data);
        setForm({ firstName: data.firstName || '', lastName: data.lastName || '', mobileno: data.mobileno || '', address: data.address || '', city: data.city || '', state: data.state || '', country: data.country || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await authApi.updateProfile(form);
      setProfile(res.data?.data || res.data);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setMessage(err.response?.data?.error?.message || 'Update failed');
    }
  };

  if (loading) return <div className="auth-page"><div className="auth-card"><p className="auth-subtitle">Loading your profile...</p></div></div>;

  return (
    <div className="auth-page">
      <div className="page-card">
        <div className="profile-summary">
          <div>
            <span className="eyebrow">My profile</span>
            <h1 className="page-title">Keep your details up to date</h1>
            <p className="page-subtitle">{profile?.email || auth?.user?.email || 'Personal information'}</p>
          </div>
          <span className="profile-pill">{profile?.status || 'active'}</span>
        </div>
        {message && <div className={`status-message ${message.includes('failed') ? 'status-error' : 'status-success'}`}>{message}</div>}
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input type="text" placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-field" />
            <input type="text" placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-field" />
          </div>
          <input type="tel" placeholder="Mobile" value={form.mobileno} onChange={(e) => setForm({ ...form, mobileno: e.target.value })} className="input-field" />
          <input type="text" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
          <div className="form-row">
            <input type="text" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" />
            <input type="text" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input-field" />
          </div>
          <input type="text" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="input-field" />
          <div className="helper-row">
            <button type="submit" className="button-primary">Update Profile</button>
            <button type="button" onClick={logout} className="button-danger">Logout</button>
          </div>
        </form>
      </div>
    </div>
  );
}
