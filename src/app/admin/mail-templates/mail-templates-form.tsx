/**
 * メールテンプレート編集フォーム（クライアントコンポーネント）
 */
'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { updateMailTemplateAction } from './actions';
import { 
  type MailTemplate, 
  type MailTemplateFormState,
  MAIL_TEMPLATE_LABELS 
} from './types';

/**
 * 送信ボタン
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
      {pending ? (
        <>
          <Loader2 size={16} className="loading-spin" />
          <span>保存中...</span>
        </>
      ) : (
        '保存'
      )}
    </button>
  );
}

interface TemplateFormProps {
  template: MailTemplate;
}

function TemplateForm({ template }: TemplateFormProps) {
  const initialState: MailTemplateFormState = { status: 'idle', message: '' };
  const [state, formAction] = useActionState(updateMailTemplateAction, initialState);
  const [isExpanded, setIsExpanded] = useState(false);

  const label = MAIL_TEMPLATE_LABELS[template.id] || template.id;

  return (
    <div className="admin-card" style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '0.5rem 0',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <h3 style={{ margin: 0 }}>{label}</h3>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <form action={formAction} style={{ marginTop: '1rem' }}>
          <input type="hidden" name="id" value={template.id} />

          {/* フォーム送信結果の通知 */}
          {state.message && (
            <div
              className={`admin-notice ${state.status === 'success' ? 'admin-notice--success' : 'admin-notice--error'}`}
              style={{ marginBottom: '1rem' }}
            >
              <p>{state.message}</p>
            </div>
          )}

          <div className="admin-form-group">
            <label htmlFor={`subject-${template.id}`}>件名</label>
            <input
              type="text"
              id={`subject-${template.id}`}
              name="subject"
              className="admin-form-input"
              defaultValue={template.subject}
            />
            <small>プレースホルダー例: {'{'}<code>productName</code>{'}'}</small>
          </div>

          <div className="admin-form-group">
            <label htmlFor={`body-${template.id}`}>本文</label>
            <textarea
              id={`body-${template.id}`}
              name="body"
              className="admin-form-input"
              rows={12}
              defaultValue={template.body}
            />
            <small>
              使用可能なプレースホルダー: {'{'}<code>id</code>{'}'}, {'{'}<code>productName</code>{'}'}, {'{'}<code>price</code>{'}'}, {'{'}<code>buyerDisplayName</code>{'}'}, {'{'}<code>buyerEmail</code>{'}'}, {'{'}<code>meetingLocationName</code>{'}'}, {'{'}<code>meetingDatetime</code>{'}'} など
            </small>
          </div>

          <div className="admin-form-group">
            <label htmlFor={`ccEmail-${template.id}`}>控えメールの送信先</label>
            <input
              type="email"
              id={`ccEmail-${template.id}`}
              name="ccEmail"
              className="admin-form-input"
              defaultValue={template.ccEmail}
              placeholder="example@example.com"
            />
            <small>空欄の場合、控えメールは送信されません。</small>
          </div>

          <div className="admin-form-actions">
            <SubmitButton />
          </div>
        </form>
      )}
    </div>
  );
}

interface MailTemplatesFormProps {
  templates: MailTemplate[];
}

export default function MailTemplatesForm({ templates }: MailTemplatesFormProps) {
  return (
    <div>
      {templates.length === 0 ? (
        <div className="admin-card">
          <p>メールテンプレートが登録されていません。</p>
          <p>
            <code>npm run init-mail_templates</code> を実行して初期データを投入してください。
          </p>
        </div>
      ) : (
        templates.map((template) => (
          <TemplateForm key={template.id} template={template} />
        ))
      )}
    </div>
  );
}
