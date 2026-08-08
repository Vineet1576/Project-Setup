import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FaqForm from './FaqForm';

export default function EditFaqPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const record = location.state?.record;
  if (!record) {
    navigate('/faqs', { replace: true });
    return null;
  }
  return (
    <div>
      <PageHeader eyebrow="Support" title="Edit FAQ" />
      <div className="card" style={{ padding: 24 }}>
        <FaqForm record={record} onDone={() => navigate('/faqs')} />
      </div>
    </div>
  );
}
