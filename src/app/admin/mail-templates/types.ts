/**
 * メールテンプレートの型定義と定数
 */

// メールテンプレートの型定義
export interface MailTemplate {
  id: string;
  subject: string;
  body: string;
  ccEmail: string;
}

// メールテンプレートIDと表示名のマッピング
export const MAIL_TEMPLATE_LABELS: Record<string, string> = {
  authorized_mail: '注文確定待ちメール',
  approved_mail: '注文確定済メール',
  canceled_mail: '注文キャンセル済メール',
  refund_requested_mail: '返品依頼中メール',
};

// フォームの状態を表す型
export interface MailTemplateFormState {
  status: 'idle' | 'success' | 'error';
  message: string;
}
