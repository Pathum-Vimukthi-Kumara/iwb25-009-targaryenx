import { useState, useEffect, useRef } from 'react';
import { FiMessageSquare } from 'react-icons/fi';


export default function ChatNotificationButton({ eventId, volunteerId, onClick }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchUnread() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:9000/api/chat/events/${eventId}/messages/unread?volunteer_id=${volunteerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread || 0);
      }
    } catch (error) {
      console.log("Error fetching unread messages:", error);
    }
    setLoading(false);
  }
  useEffect(() => {
    fetchUnread();
  }, [eventId, volunteerId]);

  return (
    <button
      onClick={onClick}
      className="relative flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-md text-xs hover:bg-purple-200 transition-colors font-medium"
      title="View Messages"
    >
      <FiMessageSquare className="mr-1" />
      <span>Messages</span>
      {(!loading && unreadCount > 0) && (
        <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{unreadCount}</span>
      )}
    </button>
  );
}
