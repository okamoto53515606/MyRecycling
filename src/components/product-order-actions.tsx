'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoginModal } from '@/components/login-modal';
import type { Product } from '@/lib/types';
import type { UserInfo } from '@/lib/auth';

interface ProductOrderActionsProps {
  product: Pick<Product, 'id' | 'isSoldOut'>;
  user: UserInfo | null;
  siteName: string;
  termsOfServiceContent: string;
}

export default function ProductOrderActions({ product, user, siteName, termsOfServiceContent }: ProductOrderActionsProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const renderOrderButton = () => {
    if (product.isSoldOut) {
      return <span className="product-detail__sold-out-text">Sold Out</span>;
    }

    // userオブジェクトのisLoggedInプロパティで判定する
    if (!user?.isLoggedIn) {
      return (
        <>
          <p className="product-detail__login-prompt">注文するにはログインが必要です。</p>
          <button onClick={() => setIsLoginModalOpen(true)} className="btn btn--primary">
            ログインして注文する
          </button>
        </>
      );
    }

    return (
      <Link href={`/orders/${product.id}/confirm`} className="btn btn--primary">
        注文する
      </Link>
    );
  };

  return (
    <>
      <div className="product-detail__actions">
        {renderOrderButton()}
      </div>

      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          siteName={siteName}
          termsOfServiceContent={termsOfServiceContent}
        />
      )}
    </>
  );
}
