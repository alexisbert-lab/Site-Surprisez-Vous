'use client';

import { useScaleIn } from '@/lib/useAnime';

const sizes = {
  sm: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
} as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: keyof typeof sizes;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, size = 'sm', children }: ModalProps) {
  const modalRef = useScaleIn<HTMLDivElement>(open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className={`relative bg-surface rounded-2xl shadow-2xl shadow-primary/10 border border-border p-7 w-full ${sizes[size]} max-h-[85vh] overflow-y-auto mx-4`}
        style={{ opacity: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-primary text-2xl leading-none transition-colors cursor-pointer"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

export function ModalTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-primary mb-4">{children}</h2>;
}

export function ModalSubtitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-secondary mb-4">{children}</p>;
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 flex gap-2">{children}</div>;
}
