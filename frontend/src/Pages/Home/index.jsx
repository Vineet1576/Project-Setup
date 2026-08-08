import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import SiteFooter from '../../components/common/SiteFooter';
import { useAuth } from '../../context/AuthContext';

const stack = [
  'React 18',
  'Vite',
  'Express',
  'MongoDB · Mongoose',
  'Tailwind CSS',
  'axios',
  'JWT',
  'crypto-secure',
  'node-forge',
  'Helmet',
];

const features = [
  {
    title: 'Login & Signup',
    desc: 'JWT bearer auth with register, login, auto-login and logout flows wired end-to-end.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'Email verification',
    desc: 'Single-use encrypted “verify & login” links with 24h expiry. No plaintext tokens in emails.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="m22 6-10 7L2 6" />
      </svg>
    ),
  },
  {
    title: 'Forgot / Reset password',
    desc: 'OTP-based forgot + reset flow with single-use verification and token decoding built in.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2 3 20" />
        <path d="M6.5 5.5 4 8l4 4 2.5-2.5" />
        <path d="m14.5 7.5 3-3 2.5 2.5-3 3" />
        <path d="m8.5 15.5-3 3L9 22l3-3" />
        <path d="m15.5 12.5 2.5 2.5 3-3-2.5-2.5" />
      </svg>
    ),
  },
  {
    title: 'Profile management',
    desc: 'Edit personal details with a ready Profile page, protected behind an authenticated route.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    title: 'JWT + role management',
    desc: 'User/admin auth with role model, seeded roles and admin user management on the API side.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Transparent encryption',
    desc: 'Axios interceptors auto-detect crypto-secure or legacy mode and encrypt every request for you.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

const pipeline = [
  {
    step: '01',
    title: 'Fetch the public key',
    desc: 'On boot the client requests GET /.well-known/encryption-key and receives the server RSA-2048 public key.',
  },
  {
    step: '02',
    title: 'Generate ephemeral keys',
    desc: 'A fresh client RSA keypair is generated in-browser via Web Crypto. The private key never leaves memory.',
  },
  {
    step: '03',
    title: 'Encrypt the payload',
    desc: 'The request body is encrypted with AES-256-GCM and the session key is wrapped with the server RSA key (OAEP).',
  },
  {
    step: '04',
    title: 'Decrypt server-side',
    desc: 'The server unwraps the key and decrypts transparently. Responses flow back through the same pipeline.',
  },
];

const securityCards = [
  {
    title: 'Zero key files on disk',
    desc: 'The RSA keypair is generated on first run and written directly to .env. There is no keys/ directory to leak.',
  },
  {
    title: 'CORS deny-by-default',
    desc: 'No wildcard fallback. If CORS_ORIGIN is not set, every cross-origin request is rejected.',
  },
  {
    title: 'Rate limiting',
    desc: 'Per-IP limits — 15 req/min on auth routes, 100 on the rest. Auto-disabled in development.',
  },
  {
    title: 'Hardened headers',
    desc: 'Helmet security headers, strict payload size limits, and combined-format logging in production.',
  },
  {
    title: 'Stateless JWT',
    desc: 'Bearer-only auth. No cookies and no CSRF surface by design.',
  },
];

const repoFlow = ['Client', 'Middleware', 'Controller', 'Service', 'Repository', 'MongoDB'];

const fileTree = [
  { d: 0, t: 'my-app/', f: false },
  { d: 1, t: 'src/', f: false },
  { d: 2, t: 'config/', f: true, c: 'db.config.js' },
  { d: 2, t: 'controllers/', f: true, c: 'route handlers' },
  { d: 2, t: 'middleware/', f: true, c: 'auth · decrypt' },
  { d: 2, t: 'models/', f: true, c: 'mongoose schemas' },
  { d: 2, t: 'repositories/', f: true, c: '★ database layer' },
  { d: 2, t: 'services/', f: true, c: 'business logic' },
  { d: 2, t: 'routes/', f: true, c: 'express routers' },
  { d: 2, t: 'validations/', f: true, c: 'joi schemas' },
  { d: 1, t: '.env', f: false },
  { d: 1, t: 'seed.js', f: false },
];

export default function Home() {
  const { auth } = useAuth();
  return (
    <div className="min-h-screen text-white bg-[linear-gradient(180deg,#0a0e22_0%,#0b0b10_30%,#0b0b10_70%,#0a0e22_100%)]">
      <Navbar />
      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.22),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(37,99,235,0.14),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-[13px] font-semibold text-blue-300">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <rect x="4.2" y="2.5" width="4" height="19" rx="2" fill="currentColor" />
                  <path d="M8.2 2.5 L15.8 2.5 C18.8 2.5 20 5.6 20 8 C20 10.4 18.8 13.5 15.8 13.5 L8.2 13.5 Z" fill="currentColor" />
                  <path d="M12.6 13.5 L18.6 21.5" stroke="currentColor" strokeWidth="4.4" strokeLinecap="round" />
                  <circle cx="12" cy="8.4" r="2.3" fill="#0b0b10" />
                  <rect x="11.1" y="10.2" width="1.8" height="3.2" rx="0.9" fill="#0b0b10" />
                </svg>
                Security-first full-stack starter kit
              </span>
              <h1 className="mt-6 text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.08] tracking-tight">
                Full-stack auth with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] to-[#3b82f6]">
                  end-to-end encryption
                </span>{' '}
                out of the box
              </h1>
              <p className="mt-6 text-[16px] sm:text-lg text-white/60 leading-relaxed">
                A React + Express + MongoDB starter with JWT auth, email
                verification, password recovery, role management — and hybrid
                RSA+AES-GCM encryption on every request via{' '}
                <code className="text-blue-300 font-mono text-[0.9em]">crypto-secure</code>.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center h-12 rounded-xl px-8 font-semibold text-white bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity"
                >
                  Create your account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center h-12 rounded-xl px-8 font-semibold text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Sign in
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#131318] px-3 py-2 font-mono text-[12px] text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#7ee2a8]" />
                  VITE_CRYPTO_SECURE_ENCRYPTION=true
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#131318] px-3 py-2 font-mono text-[12px] text-white/70">
                  RSA-2048 · AES-256-GCM
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 rounded-3xl bg-[#3b82f6]/10 blur-[80px] pointer-events-none" />
              <div className="relative rounded-2xl border border-white/10 bg-[#0e0d15] shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#131318]">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                  <span className="ml-3 font-mono text-[12px] text-white/50">create-project — zsh</span>
                </div>
                <div className="p-5 font-mono text-[13px] leading-relaxed">
                  <p className="text-white/60"><span className="text-white/35">$</span> npx @vineet1576/create-project my-app</p>
                  <p className="mt-2 text-[#7ee2a8]">✔ platform · full-stack</p>
                  <p className="text-[#7ee2a8]">✔ encryption · crypto-secure</p>
                  <p className="text-[#7ee2a8]">✔ repo pattern · mongodb</p>
                  <p className="text-[#7ee2a8]">✔ keys written to .env</p>
                  <p className="mt-4 text-white/35"># request payload (encrypted)</p>
                  <pre className="mt-1 text-[13px] leading-relaxed">
                    <span className="text-[#3b82f6]">{"{"}</span>
                    <br />
                    {'  '}<span className="text-white/45">"encryptedAESKey"</span>: <span className="text-[#7ee2a8]">"uXnQ…4kFw=="</span>,
                    <br />
                    {'  '}<span className="text-white/45">"data"</span>: <span className="text-[#7ee2a8]">"7KxMqNn…b2Q=="</span>
                    <br />
                    <span className="text-[#3b82f6]">{"}"}</span>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="stack" className="border-y border-white/10 bg-[linear-gradient(90deg,#0a0a0f,#0c1222,#0a0a0f)]">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
            <p className="text-center text-[12px] font-semibold uppercase tracking-widest text-white/40 mb-6">Powered by</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {stack.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-lg border border-white/10 bg-[#131318] px-4 py-2 text-[13px] font-medium text-white/70 hover:border-blue-400/40 hover:text-white transition-colors"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="max-w-[1440px] mx-auto px-6 lg:px-12 py-20">
          <div className="text-center max-w-[640px] mx-auto">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-[#60a5fa]">What you get</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              A complete auth foundation, not just a login form
            </h2>
            <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent" />
            <p className="mt-5 text-white/60">
              Every screen, route, interceptor and API call you need to ship
              authenticated apps — styled, wired and ready to extend.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#14141c] to-[#101018] p-6 hover:border-blue-400/40 hover:from-[#18233f] hover:to-[#11111a] hover:shadow-[0_16px_40px_-16px_rgba(59,130,246,0.35)] transition-all"
              >
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-blue-400 bg-gradient-to-br from-[#60a5fa]/20 to-[#3b82f6]/20">
                  {f.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/55">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="relative overflow-hidden border-y border-white/10 bg-[linear-gradient(180deg,#0a0a0f,#0b1120,#0a0a0f)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.18),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.12),transparent_50%)]" />
          <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12 py-20">
            <div className="text-center max-w-[640px] mx-auto">
              <span className="text-[12px] font-semibold uppercase tracking-widest text-[#60a5fa]">Security</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                Hybrid encryption, zero config
              </h2>
              <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent" />
              <p className="mt-4 text-white/60">
                Toggle <code className="text-blue-300 font-mono text-[0.9em]">CRYPTO_SECURE_ENCRYPTION=true</code> and
                every request is encrypted end-to-end. Keys auto-generate on first run.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pipeline.map((p) => (
                <div key={p.step} className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#151525] to-[#101019] p-6 hover:border-blue-400/30 hover:shadow-[0_16px_40px_-16px_rgba(59,130,246,0.3)] transition-all">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold tracking-widest text-[#60a5fa]">{p.step}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                      <polyline points="5 12 19 12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-[16px] font-semibold">{p.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/55">{p.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {securityCards.map((c) => (
                <div
                  key={c.title}
                  className="rounded-2xl border border-white/10 bg-[#131318]/80 p-6 hover:border-blue-400/40 hover:bg-[#151525]/80 hover:shadow-[0_12px_32px_-12px_rgba(59,130,246,0.25)] transition-all"
                >
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-blue-400 bg-gradient-to-br from-[#60a5fa]/20 to-[#3b82f6]/20">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2 L20 5 V11 C20 16 16.6 19.6 12 21 C7.4 19.6 4 16 4 11 V5 Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold">{c.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/55">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="architecture" className="max-w-[1440px] mx-auto px-6 lg:px-12 py-20">
          <div className="text-center max-w-[640px] mx-auto">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-[#60a5fa]">Architecture</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Repository pattern, database-agnostic
            </h2>
            <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent" />
            <p className="mt-5 text-white/60">
              All database logic lives behind a repository layer. Services never
              touch queries — swap MongoDB for PostgreSQL without touching them.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#14141c] to-[#101018] p-6 sm:p-8">
              <h3 className="text-[15px] font-semibold text-white/80 mb-6 inline-flex items-center gap-2">
                Request flow
                <span className="w-8 h-px bg-gradient-to-r from-[#3b82f6] to-transparent" />
              </h3>
              <div className="flex flex-wrap items-center gap-y-4">
                {repoFlow.map((node, i) => (
                  <span key={node} className="flex items-center">
                    <span className={`px-3 py-2 rounded-lg border text-[13px] font-medium ${
                      node === 'Repository'
                        ? 'border-blue-400/40 bg-blue-400/10 text-blue-300'
                        : 'border-white/10 bg-[#0e0d15] text-white/70'
                    }`}>
                      {node}
                    </span>
                    {i < repoFlow.length - 1 && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-1.5 text-blue-400/60">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    )}
                  </span>
                ))}
              </div>
              <pre className="mt-6 font-mono text-[13px] leading-relaxed rounded-xl border border-white/10 bg-[#0e0d15] p-4 overflow-x-auto text-white/55">
                <code>
                  <span className="text-white/35">// Repository output — always a plain object</span>
                  {'\n'}{' '}
                  <span className="text-[#3b82f6]">{"{"}</span>{' '}
                  <span className="text-white/45">id</span>: <span className="text-[#7ee2a8]">"abc123"</span>,{' '}
                  <span className="text-white/45">name</span>: <span className="text-[#7ee2a8]">"admin"</span>,{' '}
                  <span className="text-white/45">status</span>: <span className="text-[#7ee2a8]">"active"</span>{' '}
                  <span className="text-[#3b82f6]">{"}"}</span>
                </code>
              </pre>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#14141c] to-[#101018] p-6 sm:p-8">
              <h3 className="text-[15px] font-semibold text-white/80 mb-6 inline-flex items-center gap-2">
                Generated structure
                <span className="w-8 h-px bg-gradient-to-r from-[#3b82f6] to-transparent" />
              </h3>
              <pre className="font-mono text-[13px] leading-[1.9] overflow-x-auto">
                <code>
                  {fileTree.map((n, i) => (
                    <span key={i} className="block">
                      <span className="text-white/30">{n.d > 0 ? '│ '.repeat(n.d - 1) + (i === fileTree.length - 1 || (fileTree[i + 1] && fileTree[i + 1].d < n.d) ? '└── ' : '├── ') : ''}</span>
                      <span className={n.f ? 'text-[#7ee2a8]' : 'text-white/80 font-bold'}>{n.t}</span>
                      {n.c && <span className="text-white/35">  # {n.c}</span>}
                    </span>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </section>

        {!auth && (
          <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-blue-400/25 bg-gradient-to-br from-[#0c1a3f] via-[#10142e] to-[#0a1025] p-8 sm:p-14 text-center">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[640px] h-[320px] rounded-full bg-[#3b82f6]/25 blur-[110px]" />
            <div className="pointer-events-none absolute -bottom-32 -right-16 w-[420px] h-[280px] rounded-full bg-[#60a5fa]/15 blur-[110px]" />
            <h2 className="relative text-2xl sm:text-4xl font-bold tracking-tight">
              Ship encrypted by default
            </h2>
            <p className="relative mt-4 max-w-[480px] mx-auto text-white/60">
              Create your account, explore the flows, and see the whole stack in
              action — keys included.
            </p>
            <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center h-12 rounded-xl px-8 font-semibold text-white bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center h-12 rounded-xl px-8 font-semibold text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
            </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
