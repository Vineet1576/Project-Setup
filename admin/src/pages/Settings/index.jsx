import { useState, useEffect, useCallback, useRef } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { settingsApi } from '../../methods/api/settings';
import { uploadApi } from '../../methods/api/upload';
import CountryCodeDropdown from './CountryCodeDropdown';
import { API_BASE } from '../../methods/api/apiClient';
import { useToast } from '../../components/common/Toast';

const toFullImage = (url) => (url && url.startsWith('http') ? url : `${API_BASE}/${url}`);

function resizeImage(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = reader.result;
  };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SOCIAL_FIELDS = [
  { key: 'facebook', label: 'Facebook', icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
  { key: 'twitter', label: 'Twitter / X', icon: <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /> },
  { key: 'instagram', label: 'Instagram', icon: <><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></> },
  { key: 'linkedin', label: 'LinkedIn', icon: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V9h4v1.5A6 6 0 0 1 16 8z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></> },
  { key: 'youtube', label: 'YouTube', icon: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></> },
  { key: 'github', label: 'GitHub', icon: <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /> },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isInvalidEmail = (v) => !!(v && v.trim() && !EMAIL_RE.test(v.trim()));
const isInvalidPhone = (v) => !!(v && (v.replace(/\D/g, '').length < 7 || v.replace(/\D/g, '').length > 15));

const SITE_SUB_TABS = [
  { id: 'general', label: 'General', icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21v-6h6v6" /></svg> },
  { id: 'contact', label: 'Contact details', icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
  { id: 'social', label: 'Social links', icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg> },
];

const EMAIL_SUB_TABS = [
  { id: 'email', label: 'Email configuration', icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg> },
  { id: 'stripe', label: 'Stripe configuration', icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20" /><path d="M6 20V8l6-4 6 4v12" /><path d="M10 20v-5h4v5" /></svg> },
];

const ENV_CONFIG_FIELDS = [
  {
    key: 'NODE_ENV',
    label: 'Node environment',
    hint: 'development or production',
    secret: false,
    toggle: true,
    options: [
      { value: 'development', label: 'Development' },
      { value: 'production', label: 'Production' },
    ],
  },
  { key: 'JWT_SECRET', label: 'JWT secret', placeholder: 'Change me to a random value', hint: 'Secret used to sign auth tokens', secret: true, generate: { length: 48 } },
  { key: 'JWT_EXPIRES_IN', label: 'JWT expires in', placeholder: '7d', hint: 'e.g. 7d, 24h, 60m', secret: false },
  {
    key: 'CRYPTO_SECURE_ENCRYPTION',
    label: 'Crypto-secure encryption',
    hint: 'true or false (ECDH P-256 + AES-256-GCM)',
    secret: false,
    toggle: true,
    options: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
  },
  { key: 'SECRET_KEY', label: 'AES secret key', placeholder: 'AES-CBC secret key', hint: 'AES-CBC fallback secret key', secret: true, generate: { length: 32, hex: true } },
  { key: 'ENCRYPTION_IV', label: 'AES encryption IV', placeholder: 'AES-CBC initialisation vector', hint: 'AES-CBC fallback IV', secret: true, generate: { length: 16, hex: true } },
  {
    key: 'RUN_SEED',
    label: 'Run seed',
    hint: 'Seed roles and admin on next startup',
    secret: false,
    toggle: true,
    options: [
      { value: 'true', label: 'On' },
      { value: 'false', label: 'Off' },
    ],
  },
  { key: 'SEED_ADMIN_EMAIL', label: 'Seed admin email', placeholder: 'admin@test.com', hint: 'Email of the seeded admin', secret: false },
  { key: 'SEED_ADMIN_PASSWORD', label: 'Seed admin password', placeholder: 'Admin@123', hint: 'Password of the seeded admin', secret: true },
  { key: 'CORS_ORIGIN', label: 'CORS origin', placeholder: 'http://localhost:5173,http://localhost:5174', hint: 'Comma-separated allowed origins', secret: false },
];

const ENV_GROUPS = [
  {
    title: 'Runtime',
    subtitle: 'How the API server behaves when it boots',
    icon: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
    keys: ['NODE_ENV', 'CRYPTO_SECURE_ENCRYPTION', 'RUN_SEED'],
    highlight: true,
  },
  {
    title: 'Security',
    subtitle: 'Keys and secrets that protect your application',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    keys: ['JWT_SECRET', 'JWT_EXPIRES_IN', 'SECRET_KEY', 'ENCRYPTION_IV'],
  },
  {
    title: 'Seeding & access',
    subtitle: 'Defaults used during first-time setup and allowed origins',
    icon: (
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    ),
    keys: ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD', 'CORS_ORIGIN'],
  },
];

const generateRandomValue = ({ length = 32, hex = false } = {}) => {
  if (hex) {
    const chars = '0123456789abcdef';
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
};

const FIELD_DEFS = Object.fromEntries(ENV_CONFIG_FIELDS.map((f) => [f.key, f]));

export default function Settings() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('site');
  const [siteSubTab, setSiteSubTab] = useState('general');
  const [emailSubTab, setEmailSubTab] = useState('email');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileRef = useRef(null);
  const [site, setSite] = useState({
    siteName: '', tagline: '', logoUrl: '', supportEmail: '', contactEmail: '',
    contactPhone: '', contactPhoneCode: '+1', address: '', state: '', country: '', pinCode: '',
    socialLinks: { facebook: '', twitter: '', instagram: '', linkedin: '', youtube: '' },
  });
  const [email, setEmail] = useState({
    fromName: '', fromEmail: '', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', smtpSecure: false,
  });
  const [stripe, setStripe] = useState({
    mode: 'test',
    test: { publishableKey: '', secretKey: '', webhookSecret: '' },
    live: { publishableKey: '', secretKey: '', webhookSecret: '' },
    currency: 'usd',
  });
  const [config, setConfig] = useState({
    NODE_ENV: '', JWT_SECRET: '', JWT_EXPIRES_IN: '', CRYPTO_SECURE_ENCRYPTION: '',
    SECRET_KEY: '', ENCRYPTION_IV: '', RUN_SEED: '', SEED_ADMIN_EMAIL: '', SEED_ADMIN_PASSWORD: '', CORS_ORIGIN: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await settingsApi.get();
      const data = res.data?.settings || {};
      if (data.site) setSite((prev) => ({ ...prev, ...data.site, socialLinks: { ...prev.socialLinks, ...(data.site.socialLinks || {}) } }));
      if (data.email) setEmail((prev) => ({ ...prev, ...data.email }));
      if (data.stripe) {
        setStripe((prev) => {
          const s = { ...prev, ...data.stripe };
          if (s.mode !== 'test' && s.mode !== 'live') s.mode = 'test';
          s.test = { ...prev.test, ...(s.test || {}) };
          s.live = { ...prev.live, ...(s.live || {}) };
          if (!data.stripe.test && !data.stripe.live) {
            s.live = { ...s.live, publishableKey: data.stripe.publishableKey || '', secretKey: data.stripe.secretKey || '', webhookSecret: data.stripe.webhookSecret || '' };
          }
          return s;
        });
      }
      if (data.config) setConfig((prev) => ({ ...prev, ...data.config }));
    } catch {
      showToast('Failed to load settings', 'error');
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const buildPayload = () => {
    if (activeTab === 'site') return { site };
    if (activeTab === 'config') {
      const configPayload = { ...config };
      return { config: configPayload };
    }
    const emailPayload = { ...email };
    if (!emailPayload.smtpPassword) delete emailPayload.smtpPassword;
    const stripePayload = { mode: stripe.mode, test: { ...stripe.test }, live: { ...stripe.live }, currency: stripe.currency };
    if (!stripePayload.test.secretKey) delete stripePayload.test.secretKey;
    if (!stripePayload.test.webhookSecret) delete stripePayload.test.webhookSecret;
    if (!stripePayload.live.secretKey) delete stripePayload.live.secretKey;
    if (!stripePayload.live.webhookSecret) delete stripePayload.live.webhookSecret;
    return { email: emailPayload, stripe: stripePayload };
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }
    setUploadingLogo(true);
    try {
      const imageBase64 = await resizeImage(file);
      const res = await uploadApi.imageBase64(imageBase64);
      const filePath = res.data?.filePath || res.data?.data?.filePath;
      if (!filePath) throw new Error('Upload failed');
      setSite({ ...site, logoUrl: toFullImage(filePath) });
      showToast('Logo uploaded', 'success');
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to upload logo', 'error');
    } finally { setUploadingLogo(false); }
  };

  const handleSmtpPort = (v) => {
    setEmail((prev) => ({ ...prev, smtpPort: String(v || '').replace(/\D/g, '') }));
  };

  useEffect(() => {
    setEmail((prev) => ({ ...prev, smtpSecure: String(prev.smtpPort || '').trim() === '465' }));
  }, [email.smtpPort]);

  const updateStripeEnv = (key, v) => setStripe((prev) => ({ ...prev, [prev.mode]: { ...prev[prev.mode], [key]: v } }));

  const handleSave = async () => {
    if (activeTab === 'site') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (site.supportEmail.trim() && !emailRegex.test(site.supportEmail.trim())) {
        showToast('Support email is not valid', 'error');
        return;
      }
      if (site.contactEmail.trim() && !emailRegex.test(site.contactEmail.trim())) {
        showToast('Contact email is not valid', 'error');
        return;
      }
      const phoneRaw = site.contactPhone || '';
      if (phoneRaw.trim()) {
        const phoneDigits = phoneRaw.replace(/\D/g, '');
        if (phoneDigits.length < 7 || phoneDigits.length > 15) {
          showToast('Contact phone must be between 7 and 15 digits', 'error');
          return;
        }
      }
    }
    setSaving(true);
    try {
      await settingsApi.update(buildPayload());
      showToast(activeTab === 'site' ? 'Site settings saved' : activeTab === 'config' ? 'Environment config saved' : 'Email & payment settings saved', 'success');
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save settings', 'error');
    } finally { setSaving(false); }
  };

  const tabs = [
    { id: 'site', label: 'Site & General', icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18M12 3a9 9 0 0 0-9 9h18a9 9 0 0 0-9-9Z" /></svg> },
    { id: 'email', label: 'Email & Payments', icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg> },
    { id: 'config', label: 'Environment', icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 9 9" /><path d="M3.5 9h17" /><path d="M3.5 15h17" /><path d="M12 3c2.5 3 2.5 15 0 18" /><path d="M12 3c-2.5 3-2.5 15 0 18" /><circle cx="18" cy="6" r="2.5" /></svg> },
  ];

  return (
    <div className="settings-page">
      <PageHeader eyebrow="Configuration" title="Settings">
        <button
          className="button-primary"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, opacity: saving ? 0.6 : 1,
            boxShadow: '0 10px 24px -10px rgba(59,130,246,0.55)',
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></svg>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </PageHeader>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="panel-card settings-panel">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ height: 20, width: '35%', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 16, width: i % 2 ? '70%' : '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
            ))}
          </div>
        </div>
      ) : activeTab === 'site' ? (
        <div>
          <TabBar tabs={SITE_SUB_TABS} active={siteSubTab} onChange={setSiteSubTab} compact />
          <div className="panel-card settings-panel">
            {siteSubTab === 'general' && (
              <>
                <SectionTitle title="General" subtitle="Core site identity and branding information." />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 22px' }}>
                  <Field label="Site name" value={site.siteName} onChange={(v) => setSite({ ...site, siteName: v })} placeholder="e.g. Acme Inc" icon={<path d="M4 20h16M4 20V4h8v16M4 20h8M14 20h6v-6h-6" />} />
                  <Field label="Tagline" value={site.tagline} onChange={(v) => setSite({ ...site, tagline: v })} placeholder="Short description of your brand" icon={<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>} />
                </div>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>Logo</span>
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    disabled={uploadingLogo}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                      border: '1px dashed rgba(96,165,250,0.35)', borderRadius: 14,
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)',
                      cursor: uploadingLogo ? 'default' : 'pointer', color: 'rgba(255,255,255,0.85)', fontSize: 14,
                      textAlign: 'left', transition: 'border-color 0.2s ease, background 0.2s ease',
                    }}
                    onMouseEnter={(e) => { if (!uploadingLogo) e.currentTarget.style.borderColor = 'rgba(96,165,250,0.7)'; }}
                    onMouseLeave={(e) => { if (!uploadingLogo) e.currentTarget.style.borderColor = 'rgba(96,165,250,0.35)'; }}
                  >
                    <span style={{ width: 46, height: 46, borderRadius: 12, border: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {site.logoUrl ? (
                        <img src={toFullImage(site.logoUrl)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                      )}
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontWeight: 600, color: '#93c5fd' }}>
                        {uploadingLogo ? 'Uploading...' : (site.logoUrl ? 'Change logo' : 'Upload logo')}
                      </span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>PNG, JPG or WebP up to 5MB</span>
                    </span>
                    {site.logoUrl && (
                      <>
                        <span
                          role="button"
                          aria-label="View logo full size"
                          title="Open full image"
                          onClick={(e) => { e.stopPropagation(); window.open(toFullImage(site.logoUrl), '_blank', 'noopener,noreferrer'); }}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, border: '1px solid var(--hairline)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', background: 'rgba(255,255,255,0.04)' }}
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
                        </span>
                        <span
                          role="button"
                          aria-label="Remove logo"
                          title="Remove logo"
                          onClick={(e) => { e.stopPropagation(); setSite({ ...site, logoUrl: '' }); }}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', cursor: 'pointer', background: 'rgba(239,68,68,0.08)' }}
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </span>
                      </>
                    )}
                  </button>
                </label>
                <input ref={logoFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                <Field label="Address" value={site.address} onChange={(v) => setSite({ ...site, address: v })} placeholder="Street address, apartment, city" icon={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0 22px' }}>
                  <Field label="State" value={site.state} onChange={(v) => setSite({ ...site, state: v })} placeholder="State / Province" icon={<><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14H3v8h3M18 14h3v8h-3" /></>} />
                  <Field label="Country" value={site.country} onChange={(v) => setSite({ ...site, country: v })} placeholder="Country" icon={<><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>} />
                  <Field label="Pin code" value={site.pinCode} onChange={(v) => setSite({ ...site, pinCode: v })} placeholder="Postal code" icon={<><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="8" y1="12" x2="16" y2="12" /></>} />
                </div>
              </>
            )}
            {siteSubTab === 'contact' && (
              <>
                <SectionTitle title="Contact details" subtitle="Public contact information for support." />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0 22px' }}>
                  <Field label="Support email" type="email" value={site.supportEmail} onChange={(v) => setSite({ ...site, supportEmail: v })} placeholder="support@example.com" icon={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="m22 6-10 7L2 6" /></>} error={isInvalidEmail(site.supportEmail)} errorText={isInvalidEmail(site.supportEmail) ? 'Enter a valid email address' : undefined} />
                  <Field label="Contact email" type="email" value={site.contactEmail} onChange={(v) => setSite({ ...site, contactEmail: v })} placeholder="hello@example.com" icon={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="m22 6-10 7L2 6" /></>} error={isInvalidEmail(site.contactEmail)} errorText={isInvalidEmail(site.contactEmail) ? 'Enter a valid email address' : undefined} />
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0 14px', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>Country code</span>
                      <CountryCodeDropdown value={site.contactPhoneCode} onChange={(code) => setSite({ ...site, contactPhoneCode: code })} />
                    </div>
                    <Field label="Contact phone" value={site.contactPhone} onChange={(v) => setSite({ ...site, contactPhone: v.replace(/\D/g, '') })} placeholder="123 456 7890" maxLength={15} icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />} error={isInvalidPhone(site.contactPhone)} errorText={isInvalidPhone(site.contactPhone) ? 'Enter 7-15 digits' : undefined} />
                  </div>
                </div>
              </>
            )}
            {siteSubTab === 'social' && (
              <>
                <SectionTitle title="Social links" subtitle="Links shown in site footers and profiles." />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0 22px' }}>
                  {SOCIAL_FIELDS.map(({ key: k, label, icon }) => (
                    <Field
                      key={k}
                      label={label}
                      value={site.socialLinks[k]}
                      onChange={(v) => setSite({ ...site, socialLinks: { ...site.socialLinks, [k]: v } })}
                      placeholder={`https://${k.toLowerCase()}.com/...`}
                      icon={icon}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : activeTab === 'config' ? (
        <div>
          <div className="panel-card settings-panel">
            <SectionTitle title="Environment config" subtitle="Runtime configuration applied at server startup. Values saved here override .env." />
              {ENV_GROUPS.map((group) => (
              <div
                key={group.title}
                className={`settings-card-group${group.highlight ? ' settings-card-highlight' : ''}`}
              >
                <GroupTitle title={group.title} subtitle={group.subtitle} icon={group.icon} />
                <div style={{ display: 'grid', gridTemplateColumns: group.highlight ? 'repeat(3, max-content)' : '1fr 1fr', gap: group.highlight ? '0 24px' : '16px 24px', justifyContent: 'start', width: group.highlight ? 'auto' : '100%' }}>
                  {group.keys.map((key) => {
                    const field = FIELD_DEFS[key];
                    const { label, placeholder, secret, toggle, options, generate, hint } = field;
                    if (toggle) {
                      return (
                        <ToggleField
                          key={key}
                          label={label}
                          hint={hint}
                          code={key}
                          value={config[key]}
                          options={options}
                          onChange={(v) => setConfig({ ...config, [key]: v })}
                        />
                      );
                    }
                    if (secret) {
                      return (
                        <SecretField
                          key={key}
                          label={label}
                          hint={hint}
                          code={key}
                          value={config[key]}
                          onChange={(v) => setConfig({ ...config, [key]: v })}
                          placeholder={placeholder}
                          onGenerate={generate ? () => setConfig({ ...config, [key]: generateRandomValue(generate) }) : undefined}
                        />
                      );
                    }
                    return (
                      <Field
                        key={key}
                        label={label}
                        hint={hint}
                        code={key}
                        value={config[key]}
                        onChange={(v) => setConfig({ ...config, [key]: v })}
                        placeholder={placeholder}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <InfoCallout
              tone="green"
              title="Applied on restart"
              icon={<><path d="M12 3a9 9 0 1 0 9 9" /><path d="M3.5 9h17" /><path d="M3.5 15h17" /><path d="M12 3c2.5 3 2.5 15 0 18" /><path d="M12 3c-2.5 3-2.5 15 0 18" /></>}
            >
              These values are read from the database when the API server starts and override the matching .env entries. Restart the API for changes to take effect.
            </InfoCallout>
          </div>
        </div>
      ) : (
        <div>
          <TabBar tabs={EMAIL_SUB_TABS} active={emailSubTab} onChange={setEmailSubTab} compact />
          <div className="panel-card settings-panel">
            {emailSubTab === 'email' && (
              <>
                <SectionTitle title="Email configuration" subtitle="SMTP credentials used for transactional emails." />
                <GroupTitle title="Sender identity" subtitle="The from-address your emails are sent as." icon={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="m22 6-10 7L2 6" /></>} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0 22px' }}>
                  <Field label="From name" value={email.fromName} onChange={(v) => setEmail({ ...email, fromName: v })} placeholder="Acme Support" icon={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />
                  <Field label="From email" type="email" value={email.fromEmail} onChange={(v) => setEmail({ ...email, fromEmail: v })} placeholder="no-reply@example.com" icon={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="m22 6-10 7L2 6" /></>} />
                </div>
                <GroupTitle title="SMTP server" subtitle="Connection settings for your mail server." icon={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M12 22V12" /><path d="m3.3 7 8.7 5 8.7-5" /></>} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0 22px' }}>
                  <Field label="SMTP host" value={email.smtpHost} onChange={(v) => setEmail({ ...email, smtpHost: v })} placeholder="smtp.example.com" icon={<><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>} />
                  <Field label="SMTP user" value={email.smtpUser} onChange={(v) => setEmail({ ...email, smtpUser: v })} placeholder="user@example.com" icon={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 22px' }}>
                  <Field label="SMTP port" type="text" inputMode="numeric" maxLength={5} value={email.smtpPort} onChange={handleSmtpPort} placeholder="587" icon={<path d="M9 4h6M10 4v6a3 3 0 0 0 3 3 3 3 0 0 0 3-3V4M12 13v7M8 20h8" />} />
                  <SecretField label="SMTP password" value={email.smtpPassword} onChange={(v) => setEmail({ ...email, smtpPassword: v })} placeholder="Leave blank to keep current" />
                </div>
                {String(email.smtpPort || '').trim() === '465' && (
                  <InfoCallout
                    tone="green"
                    title="Use secure connection (TLS / SSL) — enabled automatically"
                    icon={<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>}
                    checkbox
                    checked={email.smtpSecure}
                  >
                    Port 465 uses implicit TLS — the SMTP connection is encrypted from the very start, before any login or message data is sent. This option is required for port 465 and is enabled automatically. For ports like 587, TLS is negotiated via STARTTLS instead, so the option is hidden there.
                  </InfoCallout>
                )}
              </>
            )}
            {emailSubTab === 'stripe' && (
              <>
                <SectionTitle title="Stripe configuration" subtitle="Payment credentials for subscriptions and checkout." />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd' }}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20" /><path d="M6 20V8l6-4 6 4v12" /><path d="M10 20v-5h4v5" /></svg>
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--body)' }}>Payment mode</span>
                  </div>
                  <div style={{ display: 'inline-flex', gap: 6, padding: 5, borderRadius: 12, border: '1px solid var(--hairline)', background: 'var(--surface-dark)' }}>
                    {['test', 'live'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setStripe({ ...stripe, mode: m })}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 22px', borderRadius: 9, border: 'none',
                          background: stripe.mode === m ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.08))' : 'transparent',
                          color: stripe.mode === m ? '#93c5fd' : 'rgba(255,255,255,0.55)',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s ease',
                          boxShadow: stripe.mode === m ? '0 4px 14px -4px rgba(59,130,246,0.5)' : 'none',
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: m === 'live' ? '#22c55e' : '#eab308', boxShadow: m === 'live' ? '0 0 8px rgba(34,197,94,0.7)' : '0 0 8px rgba(234,179,8,0.7)' }} />
                        {m === 'live' ? 'Live mode' : 'Test mode'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0 22px' }}>
                  <SecretField label="Publishable key" value={stripe[stripe.mode].publishableKey} onChange={(v) => updateStripeEnv('publishableKey', v)} placeholder={stripe.mode === 'live' ? 'pk_live_...' : 'pk_test_...'} />
                  <SecretField label="Secret key" value={stripe[stripe.mode].secretKey} onChange={(v) => updateStripeEnv('secretKey', v)} placeholder={stripe.mode === 'live' ? 'sk_live_...' : 'sk_test_...'} />
                  <SecretField label="Webhook secret" value={stripe[stripe.mode].webhookSecret} onChange={(v) => updateStripeEnv('webhookSecret', v)} placeholder="whsec_..." />
                  <Field label="Currency" value={stripe.currency} onChange={(v) => setStripe({ ...stripe, currency: v })} placeholder="usd" icon={<><path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>} />
                </div>
                <InfoCallout
                  tone="green"
                  title="Keep your keys safe"
                  icon={<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>}
                >
                  Keys are hidden for security — use the eye icon to peek at just the first few characters. To change a key, type the new value. To keep the current one, leave the field blank and save.
                </InfoCallout>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabBar({ tabs, active, onChange, compact = false }) {
  return (
    <div className={`settings-tabs${compact ? ' settings-tabs-compact' : ''}`}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`settings-tab-button${isActive ? ' active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="settings-section-title">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}

function GroupTitle({ title, subtitle, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, marginTop: 4 }}>
      <span style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.04))',
        border: '1px solid rgba(96,165,250,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd',
      }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{subtitle}</div>
      </div>
    </div>
  );
}

function FieldLabel({ label, focused }) {
  return (
    <span style={{
      fontSize: 13, fontWeight: 500,
      color: focused ? '#60a5fa' : 'rgba(255,255,255,0.75)',
      transition: 'color 0.2s ease',
    }}>{label}</span>
  );
}

function Hint({ children }) {
  return children ? (
    <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.45, marginTop: 2 }}>{children}</span>
  ) : null;
}

function Field({ label, value, onChange, placeholder, type = 'text', maxLength, inputMode, error, errorText, icon, hint, code }) {
  const [focused, setFocused] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
      <FieldLabel label={label} code={code} focused={focused} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            display: 'inline-flex', color: focused ? '#93c5fd' : 'rgba(255,255,255,0.35)',
            transition: 'color 0.2s ease', pointerEvents: 'none',
          }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          style={{
            width: '100%', padding: icon ? '12px 14px 12px 36px' : '12px 14px',
            border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : focused ? 'rgba(96,165,250,0.7)' : 'var(--hairline)'}`,
            borderRadius: 12, background: focused
              ? 'linear-gradient(135deg, rgba(59,130,246,0.05), var(--surface-card) 80%)'
              : 'var(--surface-card)',
            color: 'var(--body)', fontSize: 14, outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
          }}
        />
      </div>
      {error && errorText && <span style={{ fontSize: 12, color: '#f87171', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5 }}><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>{errorText}</span>}
      <Hint>{hint}</Hint>
    </label>
  );
}

function ToggleField({ label, value, options = [], onChange }) {
  return (
    <label className="settings-toggle-group">
      <span className="settings-toggle-label">{label}</span>
      <div className="settings-toggle-buttons">
        {options.map((opt) => {
          const isActive = String(value) === String(opt.value);
          const green = String(opt.value) === 'true' || String(opt.value) === 'production';
          return (
            <button
              key={opt.value}
              type="button"
              className={`settings-toggle-pill${isActive ? ' active' : ''}${green ? ' success' : ''}`}
              onClick={() => onChange(opt.value)}
            >
              <span className="settings-toggle-pill-dot" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </label>
  );
}

function SecretField({ label, value, onChange, placeholder, onGenerate, hint, code }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const hasValue = !!value;
  const hasGenerate = !!onGenerate;
  const displayValue = !hasValue
    ? ''
    : focused
      ? value
      : show
        ? value.slice(0, 10) + '.'.repeat(10)
        : '*'.repeat(20);

  const genW = 98;
  const eyeW = 34;
  const rightPad = 14 + (hasGenerate ? genW : 0) + (hasValue ? eyeW : 0) + (hasGenerate && hasValue ? 6 : 0);

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
      <FieldLabel label={label} code={code} focused={focused} />
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '12px 14px', paddingRight: rightPad, boxSizing: 'border-box',
            border: `1px solid ${focused ? 'rgba(96,165,250,0.7)' : 'var(--hairline)'}`,
            borderRadius: 12, background: focused
              ? 'linear-gradient(135deg, rgba(59,130,246,0.05), var(--surface-card) 80%)'
              : 'var(--surface-card)',
            color: show || focused ? 'var(--body)' : 'rgba(255,255,255,0.4)', fontSize: 14, outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
          }}
        />
        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {hasGenerate && (
            <GenerateChip onClick={onGenerate} />
          )}
          {hasValue && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide secret' : 'Show secret'}
              title={show ? 'Hide secret' : 'Show secret'}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent',
                color: focused ? '#93c5fd' : 'rgba(255,255,255,0.45)', cursor: 'pointer',
                transition: 'color 0.18s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#93c5fd'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = focused ? '#93c5fd' : 'rgba(255,255,255,0.45)'; }}
            >
              {show ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12A3 3 0 1 1 9.88 9.88" /><path d="M1 1l22 22" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          )}
        </div>
      </div>
      <Hint>{hint}</Hint>
    </label>
  );
}

function GenerateChip({ onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title="Generate a secure random value"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 8,
        border: '1px solid rgba(129,140,248,0.35)',
        background: hover
          ? 'linear-gradient(135deg, rgba(99,102,241,0.32), rgba(59,130,246,0.18))'
          : 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.1))',
        color: hover ? '#c7d2fe' : '#a5b4fc',
        fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
        boxShadow: hover ? '0 4px 14px -4px rgba(99,102,241,0.6)' : 'none',
        transition: 'all 0.18s ease',
      }}
    >
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z" /></svg>
      Generate
    </button>
  );
}

function InfoCallout({ tone = 'green', title, icon, children, checkbox = false, checked = false }) {
  const color = tone === 'green' ? '#4ade80' : '#93c5fd';
  const border = tone === 'green' ? 'rgba(34,197,94,0.22)' : 'rgba(96,165,250,0.22)';
  const bg = tone === 'green' ? 'rgba(34,197,94,0.07)' : 'rgba(59,130,246,0.07)';
  return (
    <div style={{ marginTop: 6, padding: '14px 16px', borderRadius: 14, border: `1px solid ${border}`, background: bg, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        background: tone === 'green' ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </span>
      <div>
        <span style={{ fontSize: 13, fontWeight: 600, color, display: 'flex', alignItems: 'center', gap: 8 }}>
          {checkbox && (
            <input type="checkbox" checked={checked} disabled onChange={() => {}} style={{ width: 16, height: 16, accentColor: '#3b82f6' }} />
          )}
          {title}
        </span>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, margin: 0, marginTop: 4 }}>{children}</p>
      </div>
    </div>
  );
}
