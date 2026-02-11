/**
 * 受け渡し場所詳細モーダル
 * 
 * 受け渡し場所の詳細情報（名前、地図、写真、説明）を表示するモーダル
 * 注文確認画面などで共通利用
 */
'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import type { MeetingLocation } from '@/lib/types';

// サーバーでMarkdownをHTMLに変換済みの受け渡し場所
type MeetingLocationWithHtml = MeetingLocation & { descriptionHtml: string };

interface MeetingLocationModalProps {
  location: MeetingLocationWithHtml;
  onClose: () => void;
}

export default function MeetingLocationModal({ location, onClose }: MeetingLocationModalProps) {
  // ESCキーでモーダルを閉じる
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  // 背景クリックでモーダルを閉じる
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal modal--large">
        <div className="modal__header">
          <h2>{location.name}</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
        </div>
        <div className="modal__body">
          {/* Google Map */}
          {location.googleMapEmbedURL && (
            <div 
              className="meeting-location-detail__map"
              dangerouslySetInnerHTML={{ __html: location.googleMapEmbedURL }}
            />
          )}

          {/* 写真と説明 */}
          <div className="meeting-location-detail__content">
            {location.photoURL && (
              <a
                href={location.photoURL}
                target="_blank"
                rel="noopener noreferrer"
                className="meeting-location-detail__photo-link"
              >
                <img
                  src={location.photoURL}
                  alt={`${location.name}の写真`}
                  className="meeting-location-detail__photo"
                />
              </a>
            )}
            {location.descriptionHtml && (
              <div 
                className="meeting-location-detail__description markdown-content"
                dangerouslySetInnerHTML={{ __html: location.descriptionHtml }}
              />
            )}
          </div>
        </div>

        {/* 下部の閉じるボタン */}
        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary btn--full"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
