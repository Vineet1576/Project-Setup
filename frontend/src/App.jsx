import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import Home from './Pages/Home';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import VerifyEmail from './Pages/VerifyEmail';
import Autologin from './Pages/Autologin';
import ForgotPassword from './Pages/Forgotpassword';
import ResetPassword from './Pages/Resetpassword';
import Profile from './Pages/Profile';
import ChangePassword from './Pages/ChangePassword';
import Transactions from './Pages/Transactions';
import Notifications from './Pages/Notifications';
import HelpCenter from './Pages/HelpCenter';
import PrivacyPolicy from './Pages/PrivacyPolicy';
import TermsOfService from './Pages/TermsOfService';
import ContactUs from './Pages/ContactUs';
import PlanListing from './Pages/PlanListing';
import ScrollToTop from './components/common/ScrollToTop';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/autologin" element={<Autologin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/feedback" element={<ContactUs />} />
      <Route path="/plans" element={<PlanListing />} />
      <Route path="/email-verified" element={<VerifyEmail />} />
      <Route path="/verification-failed" element={<div style={{ textAlign: 'center', padding: 40, color: '#c00' }}><h2>Verification Failed</h2><p>The link is invalid or expired.</p></div>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
