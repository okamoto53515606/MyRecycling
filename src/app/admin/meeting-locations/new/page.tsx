/**
 * 受け渡し場所 新規作成ページ
 */
import MeetingLocationForm from '../form'; // 共通フォームをインポート
import { createMeetingLocationAction } from '../actions'; // Corrected import path

export default function NewMeetingLocationPage() {
  const initialState = { status: 'idle', message: '' };

  return (
    <div className="admin-content">
      <header className="admin-content-header">
        <h1>受け渡し場所の新規作成</h1>
      </header>
      <MeetingLocationForm
        formAction={createMeetingLocationAction}
        initialState={initialState}
      />
    </div>
  );
}
