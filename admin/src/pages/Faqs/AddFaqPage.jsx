import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import FaqForm from './FaqForm';

export default function AddFaqPage() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader eyebrow="Support" title="Add FAQ" />
      <div className="card" style={{ padding: 24 }}>
        <FaqForm onDone={() => navigate('/faqs')} />
      </div>
    </div>
  );
}
