import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export default function useEntity(getById) {
  const { id } = useParams();
  const location = useLocation();
  const stateRecord = location?.state?.record || null;
  const [record, setRecord] = useState(stateRecord);
  const [loading, setLoading] = useState(!!getById && !stateRecord);
  const [notFound, setNotFound] = useState(!getById && !stateRecord);

  useEffect(() => {
    if (stateRecord) return;
    if (!getById) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const res = await getById({ id });
        const data = res.data?.data || res.data;
        if (active) {
          if (data && typeof data === 'object') setRecord(data);
          else setNotFound(true);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [getById, id, stateRecord]);

  return { record, loading, notFound };
}
