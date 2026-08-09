import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../methods/api/auth';
import { useAuth, saveAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/AuthLayout';
import Brand from '../../components/common/Brand';
import { useToast } from '../../components/common/Toast';

export default function Autologin() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const id = params.get('id');
    if (!id) {
      setStatus('failed');
      setMessage('Missing user id. The link may be invalid or expired.');
      return;
    }
    (async () => {
      try {
        const res = await authApi.autoLogin({ id });
        const data = res.data?.data || res.data;
        const token = data.access_token || data.token;
        if (!token) {
          setStatus('failed');
          setMessage('Could not create a session. Please login manually.');
          return;
        }
        const authData = { user: data, token };
        saveAuth(authData);
        setAuth(authData);
        toast.showToast('Login successful', 'success');
        navigate('/profile', { replace: true });
      } catch (err) {
        setStatus('failed');
        setMessage(err.response?.data?.error?.message || err.response?.data?.message || 'Auto-login failed. The link may be invalid or expired.');
      }
    })();
  }, []);

  return (
    <AuthLayout>
      <div className="w-full text-center">
        <div className="flex justify-center">
          <Brand />
        </div>
        <h2 className="text-[20px] sm:text-[30px] text-white font-[600] mt-6 mb-1">
          {status === 'loading' ? 'Signing you in...' : status === 'success' ? message : 'Login failed'}
        </h2>
        {status === 'loading' && (
          <p className="max-w-[320px] mx-auto text-[14px] text-center font-normal text-white/60 mt-2">
            Please wait while we verify your account.
          </p>
        )}
        {status === 'failed' && (
          <>
            <p className="max-w-[320px] mx-auto text-[14px] text-center font-normal text-white/60 mt-2">
              {message}
            </p>
            <div className="flex justify-center mt-5">
              <Link to="/login" className="text-[#3b82f6] font-semibold text-[14px] cursor-pointer hover:underline">
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
