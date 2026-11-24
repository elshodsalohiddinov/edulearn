// Modal oyna va tasdiqlash dialogi. Esc tugmasi va fon ustiga bosish yopadi, fokus ichkarida qoladi.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export function Modal({ open, onClose, title, children, footer, size = 'max-w-lg' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector('input, textarea, select, button[data-autofocus]')?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/45 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`card max-h-[90vh] w-full overflow-auto p-6 shadow-pop ${size}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
          <button type="button" className="btn btn-ghost btn-sm btn-icon -mr-2 -mt-1" onClick={onClose} aria-label="Yopish"><X /></button>
        </div>
        {children}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// confirm({ title, message, confirmText, danger }) -> Promise<boolean>
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setState({ ...opts, resolve })), []);
  const close = (result) => { state?.resolve(result); setState(null); };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(state)}
        onClose={() => close(false)}
        title={state?.title || 'Tasdiqlang'}
        size="max-w-md"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => close(false)}>Bekor qilish</button>
            <button type="button" data-autofocus className={`btn ${state?.danger ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-primary'}`} onClick={() => close(true)}>
              {state?.confirmText || 'Tasdiqlash'}
            </button>
          </>
        )}
      >
        <div className="flex gap-4">
          {state?.danger && <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-600"><AlertTriangle className="size-5" /></span>}
          <p className="text-muted">{state?.message}</p>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
