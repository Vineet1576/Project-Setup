import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaEnvelope,
  FaGithub,
  FaTwitter,
  FaLinkedinIn,
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaHeart,
  FaStar,
} from 'react-icons/fa';
import InfoLayout from '../../components/common/InfoLayout';
import ContactTopicDropdown from '../../components/common/ContactTopicDropdown';
import { contentApi } from '../../methods/api/content';
import { settingsApi } from '../../methods/api/settings';
import { useToast } from '../../components/common/Toast';

const topics = [
  'Account help',
  'Security & encryption',
  'Bug report',
  'Feature request',
  'Something else',
];

const successMessages = [
  'Your feedback helps us build something better!',
  'We appreciate you taking the time to share your thoughts.',
  'Every piece of feedback makes a difference.',
  'Thanks for helping us improve!',
  'Your voice matters to us.',
];

export default function Feedback() {
  const [form, setForm] = useState({ name: '', email: '', topic: topics[0], message: '' });
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [thankYouIndex, setThankYouIndex] = useState(0);
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    settingsApi
      .getPublic()
      .then((res) => {
        if (mounted) setSite(res.data?.settings?.site || null);
      })
      .catch(() => {
        if (mounted) setSite(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const social = site?.socialLinks || {};

  const toUrl = (value) => {
    if (!value) return null;
    const v = String(value).trim().replace(/\s+/g, '');
    if (/^https?:\/\//i.test(v)) return v;
    return `https://${v}`;
  };
  const toMailto = (value) => (value ? `mailto:${String(value).trim()}` : null);
  const handleTwitter = (value) =>
    value ? `https://twitter.com/${String(value).trim().replace(/^@/, '')}` : null;

  const socialChannels = [
    {
      label: 'Facebook',
      value: social.facebook || '',
      icon: <FaFacebookF />,
      href: toUrl(social.facebook),
    },
    {
      label: 'X (Twitter)',
      value: social.twitter || '',
      icon: <FaTwitter />,
      href: handleTwitter(social.twitter),
    },
    {
      label: 'Instagram',
      value: social.instagram || '',
      icon: <FaInstagram />,
      href: toUrl(social.instagram),
    },
    {
      label: 'LinkedIn',
      value: social.linkedin || '',
      icon: <FaLinkedinIn />,
      href: toUrl(social.linkedin),
    },
    {
      label: 'YouTube',
      value: social.youtube || '',
      icon: <FaYoutube />,
      href: toUrl(social.youtube),
    },
    { label: 'GitHub', value: social.github || '', icon: <FaGithub />, href: toUrl(social.github) },
  ];

  const emailValue = site?.supportEmail || site?.contactEmail || '';
  const channels = [
    { label: 'Email us', value: emailValue, icon: <FaEnvelope />, href: toMailto(emailValue) },
    ...socialChannels,
  ].filter((c) => c.value);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const nameParts = form.name.trim().split(/\s+/);
      await contentApi.sendContact({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: form.email,
        topic: form.topic,
        message: form.message,
      });
      setThankYouIndex(Math.floor(Math.random() * successMessages.length));
      setShowThankYou(true);
      toast.showToast('Feedback sent successfully!', 'success');
    } catch (err) {
      toast.showToast(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to send feedback. Please try again.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const closeThankYou = () => {
    setShowThankYou(false);
    setForm({ name: '', email: '', topic: topics[0], message: '' });
  };

  const inputClass =
    'w-full rounded-lg bg-[#131318] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-400/50 transition-colors';

  return (
    <InfoLayout>
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.2),transparent_55%)]" />
        <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12 pt-14 pb-14">
          <nav className="flex items-center gap-2 text-[13px] text-white/40">
            <Link to="/" className="hover:text-[#3b82f6] transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/60">Feedback</span>
          </nav>
          <div className="mt-6 max-w-[640px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-[12px] font-semibold text-blue-300">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                stroke-linejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Feedback
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              We'd love to hear from you
            </h1>
            <p className="mt-4 text-white/60 leading-relaxed">
              Questions, feedback or a bug to report — send a message and we'll get back to you as
              soon as we can.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          <div className="lg:col-span-2" style={{ width: 'calc(100% + 10px)', marginLeft: '-5px' }}>
            <h2 className="text-lg font-semibold text-white/90">Other ways to reach us</h2>
            <div className="mt-5 space-y-3">
              {channels.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-gradient-to-b from-[#14141c] to-[#101018] px-5 py-4"
                >
                  <span className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-lg text-blue-400 bg-gradient-to-br from-[#60a5fa]/20 to-[#3b82f6]/20">
                    {c.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold uppercase tracking-widest text-white/40">
                      {c.label}
                    </p>
                    {c.href ? (
                      <a
                        href={c.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-[14px] font-medium text-blue-300 hover:text-blue-200 transition-colors"
                      >
                        {c.value}
                      </a>
                    ) : (
                      <p className="truncate text-[14px] font-medium text-white/85">{c.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-[#131318] p-5">
              <p className="text-[13px] leading-relaxed text-white/50">
                Prefer to ask about a specific flow? The{' '}
                <Link to="/help" className="text-blue-300 hover:text-blue-200 transition-colors">
                  Help Center
                </Link>{' '}
                covers accounts, security and encryption.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            {showThankYou ? (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={closeThankYou}
              >
                <div
                  className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-[#14141c] to-[#101018] p-8 sm:p-10 text-center shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative mb-6">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-[#60a5fa]/30 to-[#3b82f6]/30 rounded-full blur-2xl"
                      style={{ animation: 'pulse 2s infinite' }}
                    />
                    <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#60a5fa]/20 to-[#3b82f6]/20 border border-[#3b82f6]/30">
                      <svg
                        className="w-10 h-10 text-[#60a5fa]"
                        style={{ animation: 'bounce 1s infinite' }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaStar className="w-5 h-5 text-[#3b82f6]" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Thank You!</h2>
                    <FaStar className="w-5 h-5 text-[#60a5fa]" />
                  </div>

                  <p className="text-lg text-white/80 mb-2 font-medium">
                    {form.name.split(' ')[0]}, your feedback means the world to us! 💙
                  </p>

                  <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <FaHeart className="w-5 h-5 text-[#ef4444] mx-auto mb-2" />
                    <p className="text-white/70 italic text-base leading-relaxed">
                      "{successMessages[thankYouIndex]}"
                    </p>
                  </div>

                  <div className="mt-6 space-y-3 text-sm text-white/50">
                    <p>
                      We've sent a confirmation email to{' '}
                      <span className="text-white/90 font-medium">{form.email}</span>
                    </p>
                    <p>Our team will review your feedback and get back to you if needed.</p>
                  </div>

                  <button
                    type="button"
                    onClick={closeThankYou}
                    className="mt-8 w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 hover:shadow-[0_16px_40px_-12px_rgba(59,130,246,1)] transition-all"
                  >
                    <FaStar className="w-5 h-5" />
                    <span>Back to Feedback</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#14141c] to-[#101018] p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-xl text-blue-400 bg-gradient-to-br from-[#60a5fa]/20 to-[#3b82f6]/20">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-[#3b82f6]">
                      FEEDBACK FORM
                    </p>
                    <h2 className="text-lg font-semibold text-white/95">Send a message</h2>
                  </div>
                </div>
                <div className="mt-5 h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-[13px] font-medium text-white/70 mb-2"
                      >
                        Your name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Jane Doe"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-[13px] font-medium text-white/70 mb-2"
                      >
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="jane@example.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-white/70 mb-2">
                      Topic
                    </label>
                    <ContactTopicDropdown
                      value={form.topic}
                      topics={topics}
                      onSelect={(val) => setForm((prev) => ({ ...prev, topic: val }))}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-[13px] font-medium text-white/70 mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows="6"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us what's on your mind…"
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center h-12 w-full rounded-xl font-semibold text-white bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {loading ? 'Sending...' : 'Send feedback'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </InfoLayout>
  );
}
