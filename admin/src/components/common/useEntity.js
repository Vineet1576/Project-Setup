import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useRecord } from '../../context/RecordContext';

export default function useEntity(getById) {
  const { id } = useRecord();
  const location = useLocation();
  const stateRecord = location?.state?.record || null;
  const [record, setRecord] = useState(stateRecord);
  const [loading, setLoading] = useState(!!getById && !stateRecord);
  const [notFound, setNotFound] = useState(!getById && !stateRecord);

  const refetch = useCallback(async () => {
    if (!getById) return;
    try {
      const res = await getById({ id });
      const data = res.data?.data || res.data;
      if (data && typeof data === 'object') {
        setRecord(data);
        setNotFound(false);
      }
    } catch {
      setNotFound(true);
    }
  }, [getById, id]);

  useEffect(() => {
    if (!getById) {
      setNotFound(!stateRecord);
      setLoading(false);
      return;
    }
    let active = true;
    if (!stateRecord) setLoading(true);
    (async () => {
      try {
        const res = await getById({ id });
        const data = res.data?.data || res.data;
        if (active) {
          if (data && typeof data === 'object') {
            setRecord(data);
            setNotFound(false);
          } else if (!stateRecord) {
            setNotFound(true);
          }
        }
      } catch {
        if (active && !stateRecord) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [getById, id, stateRecord]);

  return { record, loading, notFound, refetch, setRecord };
}
