/**
 * 受け渡し場所 編集ページ
 */
import { getMeetingLocation } from '@/lib/data';
import MeetingLocationForm from '../../form'; // Corrected import path
import { updateMeetingLocationAction } from '../../actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: { id: string };
}

export default async function EditMeetingLocationPage({ params }: PageProps) {
  const location = await getMeetingLocation(params.id);

  if (!location) {
    return <div>場所が見つかりません</div>;
  }

  const initialState = { status: 'idle', message: '' };
  const updateAction = updateMeetingLocationAction.bind(null, location.id);

  return (
    <div className="admin-content">
      <header className="admin-content-header">
        <h1>受け渡し場所の編集</h1>
        <Link href="/admin/meeting-locations" className="admin-btn admin-btn--secondary">
            <ArrowLeft size={16} />
            <span>一覧へ戻る</span>
        </Link>
      </header>
      <MeetingLocationForm
        formAction={updateAction}
        initialState={initialState}
        initialData={location}
      />
    </div>
  );
}
