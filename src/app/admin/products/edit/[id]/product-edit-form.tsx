/**
 * 商品編集フォーム（クライアントコンポーネント）
 */
'use client';

import type { Product } from '@/features/product/types';
import { useActionState, useState, useRef, useCallback, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { handleUpdateProduct, type FormState } from './actions';
import Link from 'next/link';

// Firebase / 画像処理関連のインポート
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, deleteObject } from 'firebase/storage';
import { useAuth } from '@/components/auth/auth-provider';
import imageCompression from 'browser-image-compression';

/**
 * 送信ボタン
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="admin-btn admin-btn--primary">
      {pending ? (
        <>
          <Loader2 size={16} className="loading-spin" />
          <span>更新中...</span>
        </>
      ) : (
        '商品を更新'
      )}
    </button>
  );
}

interface ProductEditFormProps {
  product: Product;
}

export default function ProductEditForm({ product }: ProductEditFormProps) {
  const initialState: FormState = { status: 'idle', message: '' };
  const handleUpdateProductWithId = handleUpdateProduct.bind(null, product.id);
  const [state, formAction] = useActionState(handleUpdateProductWithId, initialState);
  
  const router = useRouter();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuth();
  
  const initialImageUrls = product.imageAssets?.map(asset => asset.url) || [];
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>(initialImageUrls);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (state.status !== 'idle') {
      setNotification({ type: state.status, message: state.message });
      const timer = setTimeout(() => setNotification(null), 5000);
      if (state.status === 'success') {
        // 成功したら一覧ページにリダイレクト
        setTimeout(() => router.push('/admin/products'), 1000);
      }
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  const optimizeImage = async (file: File): Promise<File> => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Image optimization error:', error);
      return file;
    }
  };

  const handleFilesUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !user.user?.uid) return;
    setIsUploading(true);
    setNotification(null);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const optimizedFile = await optimizeImage(file);
        const timestamp = Date.now();
        const filePath = `products/${user.user!.uid}/${timestamp}-${optimizedFile.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, optimizedFile);
        const bucket = storage.app.options.storageBucket;
        return `https://storage.googleapis.com/${bucket}/${filePath}`;
      } catch (error) {
        console.error('Upload failed for', file.name, error);
        setNotification({ type: 'error', message: `${file.name} のアップロードに失敗しました。`});
        return null;
      }
    });
    try {
      const urls = (await Promise.all(uploadPromises)).filter((url): url is string => url !== null);
      setUploadedImageUrls(prev => [...prev, ...urls]);
    } finally {
      setIsUploading(false);
    }
  }, [user.user]);

  const handleRemoveImage = async (urlToRemove: string) => {
    setUploadedImageUrls(prev => prev.filter(url => url !== urlToRemove));
    try {
      const imageRef = ref(storage, urlToRemove);
      await deleteObject(imageRef);
    } catch (error) {
      // @ts-ignore
      if (error.code !== 'storage/object-not-found') {
        console.error('[Storage] Failed to delete image:', error);
        setNotification({ type: 'error', message: 'ストレージからの画像削除に失敗しました。' });
        setUploadedImageUrls(prev => [...prev, urlToRemove]);
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFilesUpload(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [handleFilesUpload]);

  return (
    <form action={formAction}>
      {notification && (
        <div className={`admin-notice admin-notice--${notification.type}`} style={{ marginBottom: '1.5rem' }}>
          <p>{notification.message}</p>
        </div>
      )}
      
      <div className="admin-form-group">
        <label htmlFor="title">商品名</label>
        <input type="text" id="title" name="title" required defaultValue={product.title} className="admin-form-input" />
      </div>

      <div className="admin-form-group">
        <label htmlFor="content">商品説明 (Markdown対応)</label>
        <textarea id="content" name="content" rows={15} defaultValue={product.content} className="admin-form-input" />
      </div>

      <div className="admin-form-group">
        <label htmlFor="excerpt">要約</label>
        <textarea id="excerpt" name="excerpt" rows={3} defaultValue={product.excerpt} className="admin-form-input" />
      </div>
      
      {/* Price and Status side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="admin-form-group">
          <label htmlFor="price">価格（円）</label>
          <input type="number" id="price" name="price" required defaultValue={product.price} min="0" className="admin-form-input" />
        </div>
        <div className="admin-form-group">
          <label>公開状態</label>
          <div className="admin-form-radio-group">
            <label className="admin-form-radio-label">
              <input type="radio" name="status" value="published" defaultChecked={product.status === 'published'} className="admin-form-radio"/>
              <span>公開</span>
            </label>
            <label className="admin-form-radio-label">
              <input type="radio" name="status" value="draft" defaultChecked={product.status === 'draft' || !product.status} className="admin-form-radio"/>
              <span>下書き</span>
            </label>
          </div>
        </div>
      </div>

      <div className="admin-form-group">
        <label htmlFor="condition">商品の状態</label>
        <input type="text" id="condition" name="condition" defaultValue={product.condition} className="admin-form-input" />
      </div>

      <div className="admin-form-group">
        <label htmlFor="tags">タグ（カンマ区切り）</label>
        <input type="text" id="tags" name="tags" defaultValue={product.tags?.join(', ')} className="admin-form-input" />
      </div>

      <div className="admin-form-group">
        <label htmlFor="referenceURL">参考URL</label>
        <input type="url" id="referenceURL" name="referenceURL" defaultValue={product.referenceURL} className="admin-form-input" />
      </div>

      <div className="admin-form-group">
        <label>商品画像</label>
        <div 
          className={`admin-image-uploader ${isDragging ? 'is-dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            multiple 
            accept="image/png, image/jpeg, image/gif"
            onChange={(e) => handleFilesUpload(e.target.files)}
            ref={fileInputRef}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <div className="admin-image-uploader__dropzone">
            <UploadCloud size={24} />
            <span>クリックまたはドラッグ＆ドロップで画像を追加</span>
            {isUploading && (
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem'}}>
                <Loader2 size={16} className="loading-spin"/>
                <span>アップロード中...</span>
              </div>
            )}
          </div>
          {uploadedImageUrls.length > 0 && (
            <div className="admin-thumbnail-grid">
              {uploadedImageUrls.map((url, index) => (
                <div key={index} className="admin-thumbnail">
                  <img src={url} alt={`商品画像 ${index + 1}`} />
                  <button type="button" onClick={() => handleRemoveImage(url)} className="admin-thumbnail__delete">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <input type="hidden" name="imageUrls" value={JSON.stringify(uploadedImageUrls)} />

      <div className="admin-form-actions">
        <SubmitButton />
        <Link href={`/products/${product.id}`} className="admin-btn admin-btn--secondary" target="_blank">
          公開ページを確認
        </Link>
      </div>
    </form>
  );
}
