/**
 * 受け渡し場所 共通フォーム
 */
'use client';

import { useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { FormState } from './actions';
import { MeetingLocation } from '@/lib/definitions';
import { deleteMeetingLocationAction } from './actions';
import SingleImageUploader from '@/components/admin/single-image-uploader';
import { Loader2 } from 'lucide-react';


// 保存ボタン
function SubmitButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
      {pending ? (
        <><Loader2 className="loading-spin" size={16} /> 保存中...</>
      ) : ( isNew ? '登録する' : '更新する' )}
    </button>
  );
}

// 削除ボタン
function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      className="admin-btn admin-btn--danger"
      disabled={pending}
      formAction={async (formData: FormData) => {
        if (confirm('本当にこの受け渡し場所を削除しますか？この操作は元に戻せません。')) {
          await deleteMeetingLocationAction(formData.get('id') as string);
        }
      }}
    >
      {pending ? '削除中...' : '削除'}
    </button>
  );
}

interface MeetingLocationFormProps {
  formAction: (payload: FormData) => void;
  initialState: FormState;
  initialData?: MeetingLocation | null;
}

export default function MeetingLocationForm({ formAction, initialState, initialData }: MeetingLocationFormProps) {
  const [state, dispatch] = useActionState(formAction, initialState);
  const isNew = !initialData;
  
  const [photoURL, setPhotoURL] = useState(initialData?.photoURL || '');
  
  return (
    <form action={dispatch} className="admin-card">
      {/* 隠しフィールド */}
      {initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}
      {/* 画像URLをフォーム送信に含める */}
      <input type="hidden" name="photoURL" value={photoURL} />

      {/* state.message に応じて通知を表示 */}
      {state.status === 'error' && (
        <div className="admin-notice admin-notice--error">
          <p>{state.message}</p>
        </div>
      )}
      {state.status === 'success' && (
        <div className="admin-notice admin-notice--success">
          <p>{state.message}</p>
        </div>
      )}

      <div className="admin-form-group">
        <label htmlFor="name">名前</label>
        <input
          id="name"
          name="name"
          type="text"
          className="admin-form-input"
          defaultValue={initialData?.name}
          required
        />
      </div>

      <div className="admin-form-group">
          <label htmlFor="description">場所に関する補足説明 (Markdown)</label>
          <textarea 
              id="description"
              name="description"
              className="admin-form-input"
              rows={5}
              defaultValue={initialData?.description}
          />
      </div>

      <div className="admin-form-group">
          <label htmlFor="googleMapEmbedURL">Google Mapの埋め込み用HTMLタグ</label>
          <textarea 
              id="googleMapEmbedURL"
              name="googleMapEmbedURL"
              className="admin-form-input"
              rows={5}
              defaultValue={initialData?.googleMapEmbedURL}
          />
      </div>
      
      <div className="admin-form-group">
        <label htmlFor="order">表示順</label>
        <input
          id="order"
          name="order"
          type="number"
          className="admin-form-input"
          defaultValue={initialData?.order ?? 0}
          required
        />
        <p className="admin-form-hint">数字が小さい順に表示されます。</p>
      </div>

      <div className="admin-form-group">
        <SingleImageUploader
          initialUrl={photoURL}
          onUrlChange={setPhotoURL} 
          storagePath="meeting-locations"
        />
      </div>

      <div className="admin-form-actions">
        <SubmitButton isNew={isNew} />
        {!isNew && <DeleteButton />}
      </div>
    </form>
  );
}
