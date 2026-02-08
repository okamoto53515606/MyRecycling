/**
 * 受け渡し場所管理 一覧ページ
 */
import Link from 'next/link';
import { getMeetingLocations } from '@/lib/data';
import { Plus } from 'lucide-react';

export default async function MeetingLocationsPage() {
  const locations = await getMeetingLocations();

  return (
    <div className="admin-content">
      <header className="admin-content-header">
        <h1>受け渡し場所管理</h1>
        <Link href="/admin/meeting-locations/new" className="admin-btn admin-btn--primary">
          <Plus size={16} />
          <span>新規作成</span>
        </Link>
      </header>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>名前</th>
              <th>表示順</th>
              <th>アクション</th>
            </tr>
          </thead>
          <tbody>
            {locations.length > 0 ? (
              locations.map(location => (
                <tr key={location.id}>
                  <td>{location.name}</td>
                  <td>{location.order}</td>
                  <td>
                    <Link href={`/admin/meeting-locations/edit/${location.id}`} className="admin-btn-sm admin-btn--secondary">
                      編集
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center">受け渡し場所はまだ登録されていません。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
