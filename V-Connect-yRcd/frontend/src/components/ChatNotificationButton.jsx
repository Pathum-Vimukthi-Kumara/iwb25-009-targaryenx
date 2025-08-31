import { useState, useEffect, useRef } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import { useWebSocket } from '../contexts/WebSocketContext';

/**
 * ChatNotificationButton - shows a button with unread message count for a volunteer's event chat
 * Props:
 *   eventId: number
 *   volunteerId: number
 *   onClick: function (opens chat modal)
 */
export default function ChatNotificationButton({ eventId, volunteerId, onClick }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchUnread() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/chat/events/${eventId}/messages/unread?volunteer_id=${volunteerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread || 0);
      }
    } catch {}
    setLoading(false);
  }
  useEffect(() => {
    fetchUnread();
  }, [eventId, volunteerId]);

  return (
    <div>
      <button
        onClick={onClick}
        className="relative flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-md text-xs hover:bg-purple-200 transition-colors font-medium"
        title="View Messages"
      >
        <FiMessageSquare className="mr-1" />
        {(!loading && unreadCount > 0) && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{unreadCount}</span>
        )}
      </button>
      <button
        onClick={fetchUnread}
        className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs"
        title="Refresh unread count"
      >Refresh</button>
    </div>
  );
}
