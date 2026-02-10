'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/auth-provider';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  termsOfServiceContent: string;
}

function stripMarkdown(text: string): string {
  if (!text) return ''; // textが空の場合は空文字を返す

  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^-\s+/gm, '・')
    .replace(/^---+$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n');
}

export function LoginModal({ isOpen, onClose, siteName, termsOfServiceContent }: LoginModalProps) {
  const { signIn } = useAuth();

  const plainTerms = useMemo(() => stripMarkdown(termsOfServiceContent), [termsOfServiceContent]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleLogin = () => {
    onClose();
    signIn();
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-backdrop" onClick={handleBackdropClick}>
      <div className="login-modal">
        <h2 className="login-modal__title">{siteName} へようこそ</h2>
        
        <div className="login-modal__terms-box">
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
            {plainTerms}
          </pre>
        </div>
        
        <p className="login-modal__notice">
          ログインすることで、上記の利用規約に同意したものとみなされます。
        </p>
        
        <button onClick={handleLogin} className="btn btn--primary btn--full">
          Googleでログイン
        </button>
        
        <button onClick={onClose} className="login-modal__close-btn">
          閉じる
        </button>
      </div>
    </div>
  );
}
