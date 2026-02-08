'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, deleteObject } from 'firebase/storage';
import { useAuth } from '@/components/auth/auth-provider';
import imageCompression from 'browser-image-compression';

interface SingleImageUploaderProps {
  initialUrl?: string | null;
  onUrlChange: (url: string) => void;
  storagePath: string; // e.g. "meeting-locations"
}

export default function SingleImageUploader({ initialUrl, onUrlChange, storagePath }: SingleImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuth();

  // initialUrlが変わった時にStateを更新
  useEffect(() => {
    setImageUrl(initialUrl || null);
  }, [initialUrl]);
  
  // URLの変更を親コンポーネントに通知
  useEffect(() => {
    onUrlChange(imageUrl || '');
  }, [imageUrl, onUrlChange]);


  const optimizeImage = async (file: File): Promise<File> => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Image optimization error:', error);
      setError('画像の圧縮に失敗しました。');
      return file;
    }
  };

  const handleFileUpload = useCallback(async (file: File | null) => {
    if (!file || !user.user?.uid) return;
    
    // 古い画像があれば削除
    if (imageUrl) {
        await handleRemoveImage();
    }

    setIsUploading(true);
    setError(null);

    try {
      const optimizedFile = await optimizeImage(file);
      const timestamp = Date.now();
      const filePath = `${storagePath}/${user.user.uid}/${timestamp}-${optimizedFile.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, optimizedFile);
      
      const bucket = storage.app.options.storageBucket;
      const newUrl = `https://storage.googleapis.com/${bucket}/${filePath}`;
      setImageUrl(newUrl);

    } catch (err) {
      console.error('Upload failed:', err);
      setError(`${file.name} のアップロードに失敗しました。`);
    } finally {
      setIsUploading(false);
    }
  }, [user.user, storagePath, imageUrl]); // imageUrlを依存関係に追加

  const handleRemoveImage = async () => {
    if (!imageUrl) return;

    const urlToRemove = imageUrl;
    setImageUrl(null); // UIから即座に画像を消す

    try {
      const imageRef = ref(storage, urlToRemove);
      await deleteObject(imageRef);
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        console.error('[Storage] Failed to delete image:', error);
        setError('ストレージからの画像削除に失敗しました。');
        setImageUrl(urlToRemove); // 失敗したらURLを元に戻す
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
    if (e.dataTransfer.files?.[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [handleFileUpload]);

  return (
    <div className="admin-form-group">
        <label>写真</label>
        <input 
            type="file" 
            accept="image/png, image/jpeg, image/gif"
            onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
            ref={fileInputRef}
            style={{ display: 'none' }}
            id="image-upload"
        />

        {imageUrl ? (
            <div className="admin-thumbnail is-single">
                <img src={imageUrl} alt="アップロードされた画像" />
                <button type="button" onClick={handleRemoveImage} className="admin-thumbnail__delete">
                    <X size={16} />
                </button>
            </div>
        ) : (
            <div 
              className={`admin-image-uploader ${isDragging ? 'is-dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
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
            </div>
        )}
        {error && <small className="admin-form-error">{error}</small>}
    </div>
  );
}
