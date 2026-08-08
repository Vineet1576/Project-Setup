import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InfoLayout from '../../components/common/InfoLayout';
import { contentApi } from '../../methods/api/content';
import { useToast } from '../../components/common/Toast';

const sections = [
  {
    id: 'acceptance',
    num: '01',
    title: 'Acceptance of terms',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="m9 11 3 3L22 4" />
      </svg>
    ),
    body: [
      'By creating an account or using the service, you agree to these terms. If you do not agree, please do not use the service.',
      'We may update these terms from time to time. Continued use of the service after changes take effect means you accept the updated terms.',
    ],
  },
  {
    id: 'use',
    num: '02',
    title: 'Use of the service',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m18 16 4-4-4-4" />
        <path d="m6 8-4 4 4 4" />
        <path d="m14.5 4-5 16" />
      </svg>
    ),
    body: [
      'The service is provided as a security-first full-stack starter kit — a foundation for building authenticated applications.',
      'You are responsible for securing your own credentials and for all activity that happens under your account.',
    ],
  },
  {
    id: 'accounts',
    num: '03',
    title: 'Accounts & authentication',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    body: [
      'You must provide accurate information when registering. One account per email address.',
      'Sessions are protected with JWT bearer tokens and optional end-to-end encryption. You must not attempt to circumvent authentication, rate limits or any security control.',
    ],
  },
  {
    id: 'acceptable-use',
    num: '04',
    title: 'Acceptable use',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    ),
    body: [
      'You may not use the service to distribute malware, phishing content, or anything unlawful, harmful or that infringes on the rights of others.',
      'You may not attempt to probe, scan or disrupt the service, its servers or connected infrastructure beyond normal use.',
    ],
  },
  {
    id: 'ip',
    num: '05',
    title: 'Intellectual property',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
      </svg>
    ),
    body: [
      'The code, design, branding and documentation provided with the service are licensed to you for building your own applications.',
      'You may not resell, redistribute or claim authorship of the starter kit itself.',
    ],
  },
  {
    id: 'liability',
    num: '06',
    title: 'Limitation of liability',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z" />
        <path d="M9 10h6" />
      </svg>
    ),
    body: [
      'The service is provided "as is" and "as available" without warranties of any kind, express or implied.',
      'To the maximum extent permitted by law, we are not liable for indirect, incidental or consequential damages arising from your use of the service.',
    ],
  },
  {
    id: 'termination',
    num: '07',
    title: 'Termination',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </svg>
    ),
    body: [
      'You may stop using the service at any time. We may suspend or terminate access if we detect abuse, violations of these terms, or behaviour that endangers the service or other users.',
      'Upon termination, your right to use the service ends immediately.',
    ],
  },
  {
    id: 'contact',
    num: '08',
     title: 'Feedback',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
    body: [
      'For questions about these terms, reach out through the Feedback page. We aim to respond within a reasonable time.',
    ],
  },
];

export default function TermsOfService() {
  const updated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const [cms, setCms] = useState(null);
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    contentApi
      .getContent('term condition')
      .then((res) => {
        const content = res.data?.data;
        if (mounted && content?.description) setCms(content);
      })
      .catch((err) => {
        if (mounted) {
          toast.showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load content. Please try again.', 'error');
        }
      });
    return () => { mounted = false; };
  }, []);

  return (
    <InfoLayout>
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.2),transparent_55%)]" />
        <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12 pt-14 pb-14">
          <nav className="flex items-center gap-2 text-[13px] text-white/40">
            <Link to="/" className="hover:text-[#3b82f6] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/60">Terms of Service</span>
          </nav>
          <div className="mt-6 max-w-[640px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-[12px] font-semibold text-blue-300">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Legal
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Clear terms, fair to everyone
            </h1>
            <p className="mt-4 text-white/60 leading-relaxed">
              The rules of the road for using Raksha — readable, reasonable, and
              built around a secure, respectful service.
            </p>
            <p className="mt-4 text-[13px] text-white/35">Last updated: {updated}</p>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <aside className="lg:col-span-3 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-white/10 bg-[#0e0d15]/80 p-6">
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-white/40">On this page</h2>
            {cms ? (
              <p className="mt-4 text-[14px] leading-relaxed text-white/50">
                Content managed by the admin and published from the content management system.
              </p>
            ) : (
              <ul className="mt-4 space-y-1">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="text-[11px] font-bold text-[#3b82f6]">{s.num}</span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0e0d15]/60 px-5 py-4">
            <p className="text-[12px] text-white/40">
              Last updated: <span className="text-white/60">{updated}</span>
            </p>
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-6">
          {cms ? (
            <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#14141c] to-[#101018] p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-xl text-blue-400 bg-gradient-to-br from-[#60a5fa]/20 to-[#3b82f6]/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </span>
                <div>
                  <p className="text-[11px] font-bold tracking-widest text-[#3b82f6]">TERMS OF SERVICE</p>
                  <h2 className="mt-1 text-lg font-semibold text-white/95">{cms.heading || cms.title}</h2>
                </div>
              </div>
              <div className="mt-5 h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
              <div className="mt-5 space-y-4">
                {cms.description.split(/\n+/).filter(Boolean).map((line) => (
                  <p key={line} className="text-[15px] leading-relaxed text-white/60">
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ) : (
            sections.map((s) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-28 rounded-2xl border border-white/10 bg-gradient-to-b from-[#14141c] to-[#101018] p-6 sm:p-8 hover:border-blue-400/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-xl text-blue-400 bg-gradient-to-br from-[#60a5fa]/20 to-[#3b82f6]/20">
                    {s.icon}
                  </span>
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-[#3b82f6]">SECTION {s.num}</p>
                    <h2 className="mt-1 text-lg font-semibold text-white/95">{s.title}</h2>
                  </div>
                </div>
                <div className="mt-5 h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                <div className="mt-5 space-y-3">
                  {s.body.map((line) => (
                    <p key={line} className="text-[15px] leading-relaxed text-white/60">
                      {line}
                    </p>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-blue-400/25 bg-gradient-to-br from-[#0c1a3f] via-[#10142e] to-[#0a1025] p-8 sm:p-12 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[280px] rounded-full bg-[#3b82f6]/25 blur-[110px]" />
          <h3 className="relative text-xl sm:text-2xl font-bold tracking-tight">Something unclear?</h3>
          <p className="relative mt-3 max-w-[460px] mx-auto text-[14px] text-white/60">
            Ask us anything — we'll explain how the terms apply to you.
          </p>
          <div className="relative mt-7 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/feedback"
              className="inline-flex items-center justify-center h-11 rounded-xl px-7 font-semibold text-white bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity"
            >
              Feedback
            </Link>
            <Link
              to="/help"
              className="inline-flex items-center justify-center h-11 rounded-xl px-7 font-semibold text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </InfoLayout>
  );
}
