// Handler for delete button
function handleDeleteMessage(messageId) {
  deleteMessage(messageId);
}
// Check if the current user can delete the message (sender and within 15 minutes)
function canDeleteMessage(message) {
  if (!message || !message.user_id) return false;
  const token = localStorage.getItem('token');
  if (!token) return false;
  let userId = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    userId = payload.user_id;
  } catch (e) {}
  if (message.user_id !== userId) return false;
  const created = new Date(message.created_at);
  const now = new Date();
  return (now - created) / 60000 <= 15;
}
// Format a timestamp as HH:mm or a readable time
function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiSend, FiTrash2 } from 'react-icons/fi';

  // Delete message handler
  const deleteMessage = async (messageId) => {
    if (!messageId) return;
    try {
      const token = localStorage.getItem('token');
      const endpoint = `http://localhost:9000/api/chat/messages/${messageId}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(messages.filter(m => m.id !== messageId));
      }
    } catch (err) {
      // Optionally show error
    }
  };

const ChatModal = ({ isOpen, onClose, eventId, eventTitle, volunteerId, volunteerName }) => {
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  
  // Get current user info from token
  const getCurrentUser = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { userId: payload.user_id, userType: payload.user_type };
      }
    } catch (e) {}
    return { userId: null, userType: null };
  };
  
  const { userId: currentUserId, userType: currentUserType } = getCurrentUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessages([]);
        return;
      }
      // Always use private messaging when volunteerId is provided and valid
      if (volunteerId && volunteerId !== null && volunteerId !== 'null') {
        const privateEndpoint = `http://localhost:9000/api/chat/events/${eventId}/messages/volunteer/${volunteerId}`;
        const privateResponse = await fetch(privateEndpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (privateResponse.ok) {
          const data = await privateResponse.json();
          setMessages(data);
        } else {
          setMessages([]);
        }
      } else {
        // Only use regular endpoint if no volunteerId (public chat)
        const response = await fetch(`http://localhost:9000/api/chat/events/${eventId}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  }, [eventId, volunteerId]);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchMessages();
    }
    // Only depend on memoized fetchMessages, not the function reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, eventId, volunteerId, fetchMessages]);



  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setIsLoading(false);
        return;
      }
      let sent = false;
      let failed = false;
      if (volunteerId && volunteerId !== null && volunteerId !== 'null') {
        const privateEndpoint = `http://localhost:9000/api/chat/events/${eventId}/messages/volunteer/${volunteerId}`;
        const privateResponse = await fetch(privateEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: newMessage })
        });
        if (privateResponse.ok) {
          setNewMessage('');
          sent = true;
        } else {
          setError('Failed to send message');
          failed = true;
        }
      } else {
        const response = await fetch(`http://localhost:9000/api/chat/events/${eventId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: newMessage })
        });
        if (response.ok) {
          setNewMessage('');
          sent = true;
        } else {
          setError('Failed to send message');
          failed = true;
        }
      }
      if (sent) {
        await fetchMessages();
      }
    } catch (error) {
      setError('Network error');
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col relative">
        {/* Header with avatar */}
        <div className="flex items-center gap-4 p-4 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shadow mr-2">
            {eventTitle ? eventTitle[0].toUpperCase() : 'F'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 truncate">Private Chat: {eventTitle}</h2>
            {volunteerName && (
              <p className="text-sm text-gray-600">with <span className="font-semibold">{volunteerName}</span></p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <FiX size={28} />
          </button>
        </div>
        {error && (
          <div className="text-red-500 text-xs px-4 py-2">{error}</div>
        )}
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 bg-gradient-to-b from-blue-50 via-white to-purple-50">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">No messages yet. Start the conversation!</div>
          )}
          {messages.map((message, index) => {
            const isOwn = message.user_id === currentUserId;
            return (
              <div
                key={index}
                className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end ${isOwn ? 'flex-row-reverse' : ''} max-w-[75%]`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold mx-2 shadow">
                    {message.sender_name ? message.sender_name[0].toUpperCase() : 'O'}
                  </div>
                  {/* Message bubble with custom shape */}
                  <div
                    className={`relative px-5 py-3 shadow text-base break-words flex flex-col
                      ${isOwn
                        ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white items-end self-end'
                        : 'bg-gray-200 text-gray-800 items-start self-start'}
                    `}
                    style={{
                      wordBreak: 'break-word',
                      minWidth: '60px',
                      borderRadius: isOwn
                        ? '18px 18px 4px 18px' // right: bottom-left less rounded
                        : '18px 18px 18px 4px' // left: bottom-right less rounded
                    }}
                  >
                    <div className="flex items-center mb-1">
                      <span className="font-semibold text-sm mr-2">
                        {isOwn ? 'You' : message.sender_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <div>{message.message}</div>
                    {isOwn && canDeleteMessage(message) && (
                      <button
                        className="absolute top-1 right-1 text-xs text-red-300 hover:text-red-600"
                        title="Delete message"
                        onClick={() => handleDeleteMessage(message.id)}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        {/* Typing bar restored */}
        <form
          className="flex items-center gap-2 p-4 border-t bg-white sticky bottom-0 z-10"
          onSubmit={e => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <input
            type="text"
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 bg-gray-50 shadow"
            placeholder="Type your message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="flex items-center justify-center px-5 py-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-full hover:from-purple-500 hover:to-blue-500 transition-colors disabled:opacity-60 shadow-lg font-semibold"
          >
            <FiSend size={22} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatModal;