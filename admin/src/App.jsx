import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfirmProvider } from './context/ConfirmContext';
import Layout from './components/global/layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/users';
import AddUserPage from './pages/users/AddUserPage';
import ViewUserPage from './pages/users/ViewUserPage';
import EditUserPage from './pages/users/EditUserPage';
import Roles from './pages/roles';
import AddRolePage from './pages/roles/AddRolePage';
import ViewRolePage from './pages/roles/ViewRolePage';
import EditRolePage from './pages/roles/EditRolePage';
import Plans from './pages/Plans';
import AddPlanPage from './pages/Plans/AddPlanPage';
import ViewPlanPage from './pages/Plans/ViewPlanPage';
import EditPlanPage from './pages/Plans/EditPlanPage';
import Transactions from './pages/Transactions';
import ViewTransactionPage from './pages/Transactions/ViewTransactionPage';
import Categories from './pages/Categories';
import AddCategoryPage from './pages/Categories/AddCategoryPage';
import EditCategoryPage from './pages/Categories/EditCategoryPage';
import ContentManagement from './pages/ContentManagement';
import AddContentPage from './pages/ContentManagement/AddContentPage';
import ViewContentPage from './pages/ContentManagement/ViewContentPage';
import EditContentPage from './pages/ContentManagement/EditContentPage';
import Feedback from './pages/Feedback';
import ViewFeedbackPage from './pages/Feedback/ViewFeedbackPage';
import Features from './pages/Features';
import AddFeaturePage from './pages/Features/AddFeaturePage';
import EditFeaturePage from './pages/Features/EditFeaturePage';
import Notifications from './pages/Notifications';
import ViewNotificationPage from './pages/Notifications/ViewNotificationPage';
import BroadcastPage from './pages/Notifications/BroadcastPage';
import Faqs from './pages/Faqs';
import AddFaqPage from './pages/Faqs/AddFaqPage';
import ViewFaqPage from './pages/Faqs/ViewFaqPage';
import EditFaqPage from './pages/Faqs/EditFaqPage';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';

export default function App() {
  return (
    <ConfirmProvider>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/users/add" element={<ProtectedRoute><AddUserPage /></ProtectedRoute>} />
          <Route path="/users/view" element={<ProtectedRoute><ViewUserPage /></ProtectedRoute>} />
          <Route path="/users/edit" element={<ProtectedRoute><EditUserPage /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute><Roles /></ProtectedRoute>} />
          <Route path="/roles/add" element={<ProtectedRoute><AddRolePage /></ProtectedRoute>} />
          <Route path="/roles/view" element={<ProtectedRoute><ViewRolePage /></ProtectedRoute>} />
          <Route path="/roles/edit" element={<ProtectedRoute><EditRolePage /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
          <Route path="/plans/add" element={<ProtectedRoute><AddPlanPage /></ProtectedRoute>} />
          <Route path="/plans/view" element={<ProtectedRoute><ViewPlanPage /></ProtectedRoute>} />
          <Route path="/plans/edit" element={<ProtectedRoute><EditPlanPage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/transactions/view" element={<ProtectedRoute><ViewTransactionPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/categories/add" element={<ProtectedRoute><AddCategoryPage /></ProtectedRoute>} />
          <Route path="/categories/edit" element={<ProtectedRoute><EditCategoryPage /></ProtectedRoute>} />
          <Route path="/content-management" element={<ProtectedRoute><ContentManagement /></ProtectedRoute>} />
          <Route path="/content-management/add" element={<ProtectedRoute><AddContentPage /></ProtectedRoute>} />
          <Route path="/content-management/view" element={<ProtectedRoute><ViewContentPage /></ProtectedRoute>} />
          <Route path="/content-management/edit" element={<ProtectedRoute><EditContentPage /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
          <Route path="/feedback/view" element={<ProtectedRoute><ViewFeedbackPage /></ProtectedRoute>} />
          <Route path="/features" element={<ProtectedRoute><Features /></ProtectedRoute>} />
          <Route path="/features/add" element={<ProtectedRoute><AddFeaturePage /></ProtectedRoute>} />
          <Route path="/features/edit" element={<ProtectedRoute><EditFeaturePage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/notifications/view" element={<ProtectedRoute><ViewNotificationPage /></ProtectedRoute>} />
          <Route path="/notifications/broadcast" element={<ProtectedRoute><BroadcastPage /></ProtectedRoute>} />
          <Route path="/faqs" element={<ProtectedRoute><Faqs /></ProtectedRoute>} />
          <Route path="/faqs/add" element={<ProtectedRoute><AddFaqPage /></ProtectedRoute>} />
          <Route path="/faqs/view" element={<ProtectedRoute><ViewFaqPage /></ProtectedRoute>} />
          <Route path="/faqs/edit" element={<ProtectedRoute><EditFaqPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
    </ConfirmProvider>
  );
}
