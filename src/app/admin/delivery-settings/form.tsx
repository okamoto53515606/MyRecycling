/**
 * 受け渡し日時設定 フォーム
 */
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { FormState } from './actions';
import type { AvailableWeekday, AvailableTime, UnavailableDate } from '@/lib/types';
import { Loader2 } from 'lucide-react';

// 保存ボタン
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
      {pending ? (
        <><Loader2 className="loading-spin" size={16} /> 保存中...</>
      ) : ( '設定を保存' )}
    </button>
  );
}

interface DeliverySettingsFormProps {
  formAction: (payload: FormData) => void;
  initialState: FormState;
  initialData: {
    weekdays: AvailableWeekday[];
    times: AvailableTime[];
    dates: UnavailableDate[];
  };
}

export default function DeliverySettingsForm({ formAction, initialState, initialData }: DeliverySettingsFormProps) {
  const [state, dispatch] = useActionState(formAction, initialState);

  // 時間をソートしてからテキストに変換 (data.tsでもソートしているが念のため)
  const sortedTimes = [...initialData.times].sort((a, b) => a.time.localeCompare(b.time));
  const timesText = sortedTimes.map(t => t.time).join('\n');

  // yyyy-MM-dd 形式に変換
  const datesText = initialData.dates.map(d => new Date(d.date).toISOString().split('T')[0]).join('\n');

  return (
    <form action={dispatch} className="admin-card">
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

      {/* === 受け渡し可能な曜日 === */}
      <div className="admin-form-group">
        <h3 className="admin-form-group-title">受け渡し可能な曜日</h3>
        <div className="admin-form-checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {initialData.weekdays.map(day => (
            <label key={day.id} className="admin-form-checkbox-label">
              <input
                type="checkbox"
                name="available_weekdays"
                value={day.id}
                defaultChecked={day.isAvailable}
              />
              {day.name}
            </label>
          ))}
        </div>
      </div>
      
      {/* === 受け渡し可能な時間帯 === */}
      <div className="admin-form-group">
          <h3 className="admin-form-group-title">受け渡し可能な時間帯</h3>
          <label htmlFor="available_times">時間（HH:MM形式）を改行で区切って入力してください。</label>
          <textarea 
              id="available_times"
              name="available_times"
              className="admin-form-input"
              rows={8}
              defaultValue={timesText}
          />
          <p className="admin-form-hint">例：<br />10:00<br />13:30<br />15:00</p>
      </div>

      {/* === 受け渡しが不可能な特定の日付 === */}
      <div className="admin-form-group">
          <h3 className="admin-form-group-title">受け渡しが不可能な特定の日付</h3>
          <label htmlFor="unavailable_dates">日付（YYYY-MM-DD形式）を改行で区切って入力してください。</label>
          <textarea 
              id="unavailable_dates"
              name="unavailable_dates"
              className="admin-form-input"
              rows={8}
              defaultValue={datesText}
          />
          <p className="admin-form-hint">例：<br />2024-12-30<br />2024-12-31<br />2025-01-01</p>
      </div>

      <div className="admin-form-actions">
        <SubmitButton />
      </div>
    </form>
  );
}
