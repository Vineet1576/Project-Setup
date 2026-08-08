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
  { key: 'facebook', label: 'Facebook' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'github', label: 'GitHub' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isInvalidEmail = (v) => !!(v && v.trim() && !EMAIL_RE.test(v.trim()));
const isInvalidPhone = (v) => !!(v && (v.replace(/\D/g, '').length < 7 || v.replace(/\D/g, '').length > 15));
const SITE_SUB_TABS = [
  {
    id: 'general',
    label: 'General',
    icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21v-6h6v6" /></svg>,
  },
  {
    id: 'contact',
    label: 'Contact details',
    icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  },
  {
    id: 'social',
    label: 'Social links',
    icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>,
  },
];

const EMAIL_SUB_TABS = [
  {
    id: 'email',
    label: 'Email configuration',
    icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>,
  },
  {
    id: 'stripe',
    label: 'Stripe configuration',
    icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20" /><path d="M6 20V8l6-4 6 4v12" /><path d="M10 20v-5h4v5" /></svg>,
  },
];

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
    } catch {
      showToast('Failed to load settings', 'error');
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const buildPayload = () => {
    if (activeTab === 'site') return { site };
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
      showToast(activeTab === 'site' ? 'Site settings saved' : 'Email & payment settings saved', 'success');
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save settings', 'error');
    } finally { setSaving(false); }
  };

  const tabs = [
    { id: 'site', label: 'Site & General', icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18M12 3a9 9 0 0 0-9 9h18a9 9 0 0 0-9-9Z" /></svg> },
    { id: 'email', label: 'Email & Payments', icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg> },
  ];

  return (
    <div>
      <PageHeader eyebrow="Configuration" title="Settings">
        <button className="button-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </PageHeader>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="panel-card animate-pulse" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 16, width: i % 2 ? '70%' : '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
          ))}
        </div>
      ) : activeTab === 'site' ? (
        <div>
          <TabBar tabs={SITE_SUB_TABS} active={siteSubTab} onChange={setSiteSubTab} compact />
          <div className="panel-card" style={{ padding: 26 }}>
            {siteSubTab === 'general' && (
              <>
                <SectionTitle title="General" subtitle="Core site identity and branding information." />
                <Field label="Site name" value={site.siteName} onChange={(v) => setSite({ ...site, siteName: v })} placeholder="e.g. Acme Inc" />
                <Field label="Tagline" value={site.tagline} onChange={(v) => setSite({ ...site, tagline: v })} placeholder="Short description of your brand" />
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>Logo</span>
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    disabled={uploadingLogo}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px',
                      border: '1px solid var(--hairline)', borderRadius: 12, background: 'var(--surface-card)',
                      cursor: uploadingLogo ? 'default' : 'pointer', color: 'rgba(255,255,255,0.85)', fontSize: 14,
                      textAlign: 'left', transition: 'border-color 0.2s ease',
                    }}
                  >
                    <span style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {site.logoUrl ? (
                        <img src={toFullImage(site.logoUrl)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                      )}
                    </span>
                    <span style={{ flex: 1 }}>
                      {uploadingLogo ? 'Uploading...' : (site.logoUrl ? 'Change logo' : 'Upload logo')}
                    </span>
                    {site.logoUrl && (
                      <>
                        <span
                          role="button"
                          aria-label="View logo full size"
                          title="Open full image"
                          onClick={(e) => { e.stopPropagation(); window.open(toFullImage(site.logoUrl), '_blank', 'noopener,noreferrer'); }}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
                        </span>
                        <span
                          role="button"
                          aria-label="Remove logo"
                          title="Remove logo"
                          onClick={(e) => { e.stopPropagation(); setSite({ ...site, logoUrl: '' }); }}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, color: '#f87171', cursor: 'pointer' }}
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </span>
                      </>
                    )}
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>PNG, JPG or WebP up to 5MB.</span>
                </label>
                <input ref={logoFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                <Field label="Address" value={site.address} onChange={(v) => setSite({ ...site, address: v })} placeholder="Street address, apartment, city" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0 18px' }}>
                  <Field label="State" value={site.state} onChange={(v) => setSite({ ...site, state: v })} placeholder="State / Province" />
                  <Field label="Country" value={site.country} onChange={(v) => setSite({ ...site, country: v })} placeholder="Country" />
                  <Field label="Pin code" value={site.pinCode} onChange={(v) => setSite({ ...site, pinCode: v })} placeholder="Postal code" />
                </div>
              </>
            )}
            {siteSubTab === 'contact' && (
              <>
                <SectionTitle title="Contact details" subtitle="Public contact information for support." />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0 18px' }}>
                  <Field label="Support email" type="email" value={site.supportEmail} onChange={(v) => setSite({ ...site, supportEmail: v })} placeholder="support@example.com" error={isInvalidEmail(site.supportEmail)} errorText={isInvalidEmail(site.supportEmail) ? 'Enter a valid email address' : undefined} />
                  <Field label="Contact email" type="email" value={site.contactEmail} onChange={(v) => setSite({ ...site, contactEmail: v })} placeholder="hello@example.com" error={isInvalidEmail(site.contactEmail)} errorText={isInvalidEmail(site.contactEmail) ? 'Enter a valid email address' : undefined} />
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0 14px', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>Country code</span>
                      <CountryCodeDropdown value={site.contactPhoneCode} onChange={(code) => setSite({ ...site, contactPhoneCode: code })} />
                    </div>
                    <Field label="Contact phone" value={site.contactPhone} onChange={(v) => setSite({ ...site, contactPhone: v.replace(/\D/g, '') })} placeholder="123 456 7890" maxLength={15} error={isInvalidPhone(site.contactPhone)} errorText={isInvalidPhone(site.contactPhone) ? 'Enter 7-15 digits' : undefined} />
                  </div>
                                  </div>
              </>
            )}
            {siteSubTab === 'social' && (
              <>
                <SectionTitle title="Social links" subtitle="Links shown in site footers and profiles." />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 18px' }}>
                  {SOCIAL_FIELDS.map(({ key: k, label }) => (
                    <Field
                      key={k}
                      label={label}
                      value={site.socialLinks[k]}
                      onChange={(v) => setSite({ ...site, socialLinks: { ...site.socialLinks, [k]: v } })}
                      placeholder={`https://${k.toLowerCase()}.com/...`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div>
          <TabBar tabs={EMAIL_SUB_TABS} active={emailSubTab} onChange={setEmailSubTab} compact />
          <div className="panel-card" style={{ padding: 26 }}>
            {emailSubTab === 'email' && (
              <>
                <SectionTitle title="Email configuration" subtitle="SMTP credentials used for transactional emails." />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>
                  <Field label="From name" value={email.fromName} onChange={(v) => setEmail({ ...email, fromName: v })} placeholder="Acme Support" />
                  <Field label="From email" type="email" value={email.fromEmail} onChange={(v) => setEmail({ ...email, fromEmail: v })} placeholder="no-reply@example.com" />
                </div>
                <Field label="SMTP host" value={email.smtpHost} onChange={(v) => setEmail({ ...email, smtpHost: v })} placeholder="smtp.example.com" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>
                  <Field label="SMTP port" type="text" inputMode="numeric" maxLength={5} value={email.smtpPort} onChange={handleSmtpPort} placeholder="587" />
                  <Field label="SMTP user" value={email.smtpUser} onChange={(v) => setEmail({ ...email, smtpUser: v })} placeholder="user@example.com" />
                </div>
                <Field label="SMTP password" type="password" value={email.smtpPassword} onChange={(v) => setEmail({ ...email, smtpPassword: v })} placeholder="Leave blank to keep current" />
                {String(email.smtpPort || '').trim() === '465' && (
                  <div style={{ marginTop: 8, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(34,197,94,0.22)', background: 'rgba(34,197,94,0.07)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}>
                      <input type="checkbox" checked={email.smtpSecure} disabled onChange={(e) => setEmail({ ...email, smtpSecure: e.target.checked })} style={{ width: 17, height: 17, accentColor: '#3b82f6' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#4ade80' }}>Use secure connection (TLS / SSL)</span>
                    </label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(34,197,94,0.15)' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, margin: 0 }}>
                        Port 465 uses implicit TLS — the SMTP connection is encrypted from the very start, before any login or message data is sent. This option is required for port 465 and is enabled automatically. For ports like 587, TLS is negotiated via STARTTLS instead, so the option is hidden there.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            {emailSubTab === 'stripe' && (
              <>
                <SectionTitle title="Stripe configuration" subtitle="Payment credentials for subscriptions and checkout." />
                <div style={{ display: 'inline-flex', gap: 6, padding: 4, borderRadius: 10, border: '1px solid var(--hairline)', background: 'var(--surface-dark)', marginBottom: 16 }}>
                  {['test', 'live'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setStripe({ ...stripe, mode: m })}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 24px', borderRadius: 8, border: 'none',
                        background: stripe.mode === m ? 'rgba(59,130,246,0.16)' : 'transparent',
                        color: stripe.mode === m ? '#93c5fd' : 'rgba(255,255,255,0.55)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s ease',
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: m === 'live' ? '#22c55e' : '#eab308' }} />
                      {m === 'live' ? 'Live mode' : 'Test mode'}
                    </button>
                  ))}
                </div>
                <SecretField label="Publishable key" value={stripe[stripe.mode].publishableKey} onChange={(v) => updateStripeEnv('publishableKey', v)} placeholder={stripe.mode === 'live' ? 'pk_live_...' : 'pk_test_...'} />
                <SecretField label="Secret key" value={stripe[stripe.mode].secretKey} onChange={(v) => updateStripeEnv('secretKey', v)} placeholder={stripe.mode === 'live' ? 'sk_live_...' : 'sk_test_...'} />
                <SecretField label="Webhook secret" value={stripe[stripe.mode].webhookSecret} onChange={(v) => updateStripeEnv('webhookSecret', v)} placeholder="whsec_..." />
                <Field label="Currency" value={stripe.currency} onChange={(v) => setStripe({ ...stripe, currency: v })} placeholder="usd" />
                <div style={{ marginTop: 6, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(34,197,94,0.22)', background: 'rgba(34,197,94,0.07)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>Keep your keys safe</span>
                    <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, margin: 0, marginTop: 3 }}>
                      Keys are hidden for security — use the eye icon to peek at just the first few characters. To change a key, type the new value. To keep the current one, leave the field blank and save.
                    </p>
                  </div>
                </div>
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
    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              flex: compact ? '0 0 auto' : '1 1 0%',
              padding: compact ? '8px 13px' : '11px 26px', borderRadius: 12,
              border: `1px solid ${isActive ? 'rgba(96,165,250,0.5)' : 'var(--hairline)'}`,
              background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.6)',
              fontSize: compact ? 13 : 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s ease',
            }}
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
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{subtitle}</p>
      <div style={{ height: 1, background: 'var(--hairline)', marginTop: 14 }} />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', maxLength, inputMode, error, errorText }) {
  const [focused, setFocused] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: focused ? '#60a5fa' : 'rgba(255,255,255,0.75)', transition: 'color 0.2s ease' }}>
        {label}
      </span>
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
          width: '100%', padding: '12px 14px', border: `1px solid ${error ? '#ef4444' : focused ? '#3b82f6' : 'var(--hairline)'}`,
          borderRadius: 12, background: 'var(--surface-card)', color: 'var(--body)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s ease',
        }}
      />
      {error && errorText && <span style={{ fontSize: 12, color: '#f87171', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5 }}><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>{errorText}</span>}
    </label>
  );
}

function SecretField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const hasValue = !!value;
  const displayValue = !hasValue
    ? ''
    : focused
      ? value
      : show
        ? value.slice(0, 10) + '.'.repeat(10)
        : '*'.repeat(20);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>{label}</span>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '12px 14px', paddingRight: 46, boxSizing: 'border-box',
            border: '1px solid var(--hairline)', borderRadius: 12, background: 'var(--surface-card)',
            color: show || focused ? 'var(--body)' : 'rgba(255,255,255,0.4)', fontSize: 14, outline: 'none',
          }}
        />
        {hasValue && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide secret' : 'Show secret'}
            title={show ? 'Hide secret' : 'Show secret'}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            }}
          >
            {show ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12A3 3 0 1 1 9.88 9.88" /><path d="M1 1l22 22" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            )}
          </button>
        )}
      </div>
    </label>
  );
}


