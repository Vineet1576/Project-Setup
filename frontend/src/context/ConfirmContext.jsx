import { createContext, useContext, useState } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'danger',
    loading: false,
    resolve: null,
  });

  const confirm = (config) =>
    new Promise((resolve) => {
      setState({
        open: true,
        title: config.title ?? 'Are you sure?',
        message: config.message ?? '',
        confirmLabel: config.confirmLabel ?? 'Confirm',
        cancelLabel: config.cancelLabel ?? 'Cancel',
        variant: config.variant ?? 'danger',
        loading: false,
        resolve,
      });
    });

  const handleConfirm = async () => {
    if (state.loading || !state.resolve) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      const result = state.resolve(true);
      if (result && typeof result.then === 'function') {
        await result;
      }
    } finally {
      setState({
        open: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        variant: 'danger',
        loading: false,
        resolve: null,
      });
    }
  };

  const handleCancel = () => {
    if (state.resolve) state.resolve(false);
    setState({
      open: false,
      title: '',
      message: '',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      variant: 'danger',
      loading: false,
      resolve: null,
    });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        variant={state.variant}
        loading={state.loading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
