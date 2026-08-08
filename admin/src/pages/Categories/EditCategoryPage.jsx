import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { categoriesApi } from '../../methods/api/categories';
import CategoryForm from './CategoryForm';

export default function EditCategoryPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(categoriesApi.getById);
  return (
    <FormPageLayout eyebrow="Catalog" title="Edit Category" onBack={() => navigate('/categories')}>
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Category not found.</div>
      ) : (
        <CategoryForm record={record} onDone={() => navigate('/categories')} />
      )}
    </FormPageLayout>
  );
}
