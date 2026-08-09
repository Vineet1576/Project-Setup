import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import Brand from '../../components/common/Brand';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('idle');
      return;
    }
    (async () => {
      try {
        const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
        const { id, code } = JSON.parse(decodeURIComponent(decoded));
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${API_BASE}/users/verify?id=${encodeURIComponent(id)}&code=${encodeURIComponent(code)}`, { redirect: 'manual' });

        if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400) || res.ok) {
          setStatus('success');
          setMessage('Email verified! Redirecting...');
          window.location.href = `/autologin?id=${encodeURIComponent(id)}`;
          return;
        }

        const data = await res.json().catch(() => ({}));
        setStatus('failed');
        setMessage(data?.message || 'Verification failed. The link may be invalid or expired.');
      } catch {
        setStatus('failed');
        setMessage('Verification failed. The link may be invalid or expired.');
      }
    })();
  }, []);

  const renderState = () => {
    if (status === 'loading') {
      return (
        <AuthLayout>
          <div className="w-full text-center">
            <div className="flex justify-center">
              <Brand />
            </div>
            <h2 className="text-[20px] sm:text-[30px] text-white font-[600] mt-6 mb-1">Verifying your email...</h2>
          </div>
        </AuthLayout>
      );
    }
    if (status === 'success') {
      return (
        <AuthLayout>
          <div className="w-full text-center">
            <div className="flex justify-center">
              <Brand />
            </div>
            <h2 className="text-[20px] sm:text-[30px] text-white font-[600] mt-6 mb-1">{message}</h2>
          </div>
        </AuthLayout>
      );
    }
    if (status === 'idle') {
      return (
        <AuthLayout>
          <div className="w-full text-center">
            <div className="flex justify-center">
              <Brand />
            </div>
            <h2 className="text-[20px] sm:text-[30px] text-white font-[600] mt-6 mb-1">Check your inbox</h2>
            <p className="max-w-[320px] mx-auto text-[14px] text-center font-normal text-white/60 mt-2 mb-4">
              A verification link was sent to your email. Please check your inbox.
            </p>
            <div className="flex justify-center mt-5">
              <Link to="/login" className="text-[#3b82f6] font-semibold text-[14px] cursor-pointer hover:underline">
                Go to Login
              </Link>
            </div>
          </div>
        </AuthLayout>
      );
    }

    return (
      <AuthLayout>
        <div className="w-full text-center">
          <div className="flex justify-center">
            <Brand />
          </div>
          <h2 className="text-[20px] sm:text-[30px] text-white font-[600] mt-6 mb-1">{message}</h2>
          <div className="flex justify-center mt-5">
            <Link to="/login" className="text-[#3b82f6] font-semibold text-[14px] cursor-pointer hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  };

  return renderState();
}
