/**
 * ご利用ガイドページ
 */
import { getSiteSettings } from '@/lib/settings';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ご利用ガイド',
};

export default async function GuidePage() {
  const settings = await getSiteSettings();
  const content = settings?.guideContent || 'コンテンツが設定されていません。';

  return (
    <div className="page-section container--narrow">
      <h1>ご利用ガイド</h1>
      <hr className="separator" />
      <div className="article__content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
