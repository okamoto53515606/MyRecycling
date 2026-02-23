'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImageAsset } from '@/lib/types';

interface ImageSliderProps {
  images: ImageAsset[];
}

export default function ImageSlider({ images }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goToPrevious = () => {
    const isFirstImage = currentIndex === 0;
    const newIndex = isFirstImage ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastImage = currentIndex === images.length - 1;
    const newIndex = isLastImage ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // 横方向の移動が縦方向より大きく、かつ50px以上の場合のみスワイプ判定
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!images || images.length === 0) {
    return (
      <div className="image-slider__placeholder">
        <span>No Image</span>
      </div>
    );
  }

  return (
    <div
      className="image-slider__container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {images.length > 1 && (
        <button onClick={goToPrevious} className="image-slider__arrow image-slider__arrow--left">
          <ChevronLeft size={32} />
        </button>
      )}
      <div className="image-slider__image-wrapper">
        <Image
          src={images[currentIndex].url}
          alt={`Product image ${currentIndex + 1}`}
          fill
          style={{ objectFit: 'contain' }}
          priority={currentIndex === 0} // 最初の画像だけ優先的に読み込む
        />
      </div>
      {images.length > 1 && (
        <button onClick={goToNext} className="image-slider__arrow image-slider__arrow--right">
          <ChevronRight size={32} />
        </button>
      )}
       {images.length > 1 && (
        <div className="image-slider__dots">
          {images.map((_, index) => (
            <span
              key={index}
              className={`image-slider__dot ${currentIndex === index ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
