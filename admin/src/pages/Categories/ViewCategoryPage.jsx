import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { categoriesApi } from '../../methods/api/categories';
import CategoryForm from './CategoryForm';

const toText = (v) => (Array.isArray(v) ? v.join(', ') : (v ?? '-'));

export default function ViewCategoryPage() {
  const navigate = useNavigate();
  const { record, loading, notFound } = useEntity(categoriesApi.getById);
  const name = toText(record?.name) || 'Category';
  return (
    <FormPageLayout
      eyebrow="Catalog"
      title={`View ${name}`}
      onBack={() => navigate('/categories')}
      actions={record && (
        <button type="button" className="button-primary" onClick={() => navigate(`/categories/edit/${record.id || record._id}`, { state: { record } })}>Edit</button>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Category not found.</div>
      ) : (
        <CategoryForm record={record} readOnly />
      )}
    </FormPageLayout>
  );
}
