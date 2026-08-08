import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import CategoryForm from './CategoryForm';

export default function AddCategoryPage() {
  const navigate = useNavigate();
  return (
    <FormPageLayout eyebrow="Catalog" title="Add Category" onBack={() => navigate('/categories')}>
      <CategoryForm onDone={() => navigate('/categories')} />
    </FormPageLayout>
  );
}
