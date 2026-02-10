'use client';

import type { Product } from '@/lib/types';
import ImageSlider from '@/components/image-slider';

interface ProductImageSliderProps {
  images: Product['imageAssets'];
}

export default function ProductImageSlider({ images }: ProductImageSliderProps) {
  return <ImageSlider images={images} />;
}
