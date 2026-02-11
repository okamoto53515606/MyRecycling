/**
 * マイページ - ログイン要求コンポーネント
 */
'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { Loader } from 'lucide-react';

interface LoginRequiredProps {
  siteName: string;
}

export function LoginRequired({ siteName }: LoginRequiredProps) {
  const { signIn, isLoggingIn } = useAuth();

  return (
    <div className="mypage__login-required">
      <h1>マイページ</h1>
      <p>マイページを利用するにはログインが必要です。</p>
      <button 
        onClick={signIn} 
        className="btn btn--primary"
        disabled={isLoggingIn}
      >
        {isLoggingIn ? (
          <>
            <Loader size={16} className="loading-spinner" />
            ログイン中...
          </>
        ) : (
          'Googleでログイン'
        )}
      </button>
    </div>
  );
}
