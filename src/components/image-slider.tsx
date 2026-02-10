'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImageAsset } from '@/lib/types';

interface ImageSliderProps {
  images: ImageAsset[];
}

export default function ImageSlider({ images }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

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

  if (!images || images.length === 0) {
    return (
      <div className="image-slider__placeholder">
        <span>No Image</span>
      </div>
    );
  }

  return (
    <div className="image-slider__container">
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
          style={{ objectFit: 'cover' }}
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
