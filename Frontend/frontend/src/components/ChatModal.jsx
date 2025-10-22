

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiSend, FiTrash2, FiCheck, FiCheckCircle, FiClock, FiChevronDown, FiSmile, FiMessageSquare } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';

const ChatModal = ({ isOpen, onClose, eventId, eventTitle, volunteerId, volunteerName }) => {
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);


// Handler for delete 


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

  
  // Get current user info from token
  const getCurrentUser = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { 
          userId: payload.user_id, 
          userType: payload.user_type,
          name: payload.name || null,
          organizationName: payload.organization_name || null
        };
      }
    } catch (e) {}
    return { userId: null, userType: null, name: null, organizationName: null };
  };
  
  const { userId: currentUserId, userType: currentUserType, organizationName } = getCurrentUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Handle scroll detection for showing scroll-to-bottom button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    setShowScrollButton(!atBottom);
  };

  useEffect(() => {
    if (initialLoadDone) {
      const shouldScrollToBottom = 
        !showScrollButton || 
        messages.length > 0 && messages[messages.length - 1].user_id === currentUserId;
      
      if (shouldScrollToBottom) {
        scrollToBottom();
      }
    }
  }, [messages, initialLoadDone, showScrollButton, currentUserId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessages([]);
        return;
      }
      
      setIsLoading(true);
      
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
          setTimeout(() => {
            scrollToBottom();
            setInitialLoadDone(true);
          }, 100);
        } else {
          setError('Could not load messages');
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
          setTimeout(() => {
            scrollToBottom();
            setInitialLoadDone(true);
          }, 100);
        } else {
          setError('Could not load messages');
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Network error when loading messages');
      setMessages([]);
    } finally {
      setIsLoading(false);
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
    
    setError(null);
    setIsLoading(true);

    // Create a temporary message to show immediately
    const tempMessage = {
      id: `temp-${Date.now()}`,
      event_id: eventId,
      user_id: currentUserId,
      message: newMessage.trim(),
      sender_type: currentUserType,
      sender_name: "You",
      created_at: new Date().toISOString(),
      _status: 'sending'
    };
    
    // Add the temporary message to the messages array
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // Scroll to bottom to show the new message
    setTimeout(scrollToBottom, 50);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        
        // Update the temp message to show error
        setMessages(prev => 
          prev.map(msg => msg.id === tempMessage.id 
            ? {...msg, _status: 'error'} 
            : msg
          )
        );
        return;
      }
      
      const endpoint = volunteerId && volunteerId !== null && volunteerId !== 'null'
        ? `http://localhost:9000/api/chat/events/${eventId}/messages/volunteer/${volunteerId}`
        : `http://localhost:9000/api/chat/events/${eventId}/messages`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: tempMessage.message })
      });
      
      if (response.ok) {
        // Once the server confirms the message is sent, refresh messages
        // This ensures we get the proper ID and timestamp from the server
        await fetchMessages();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to send message');
        
        // Update the temp message to show error
        setMessages(prev => 
          prev.map(msg => msg.id === tempMessage.id 
            ? {...msg, _status: 'error'} 
            : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Network error when sending message');
      
      // Update the temp message to show error
      setMessages(prev => 
        prev.map(msg => msg.id === tempMessage.id 
          ? {...msg, _status: 'error'} 
          : msg
        )
      );
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

  // Enhanced status display function for messages
  const getMessageStatusIcon = (message) => {
    if (message._status === 'sending') {
      return <FiClock className="text-gray-400" size={14} />;
    } else if (message._status === 'error') {
      return <span className="text-red-500 text-xs">!</span>;
    } else {
      return <FiCheck className="text-gray-400" size={14} />;
    }
  };

  // Handle emoji selection
  const onEmojiClick = (emojiObject) => {
    const emoji = emojiObject.emoji;
    const cursorPosition = document.activeElement.selectionStart;
    const textBeforeCursor = newMessage.slice(0, cursorPosition);
    const textAfterCursor = newMessage.slice(cursorPosition);
    
    setNewMessage(textBeforeCursor + emoji + textAfterCursor);
    setShowEmojiPicker(false);
  };
  
  // Handle click outside emoji picker to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format date to show day if not today
  const formatMessageDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return formatTime(dateString);
    } else {
      // Show day of week for this week, or date for older messages
      const daysSince = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (daysSince < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + formatTime(dateString);
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }
  };

  if (!isOpen) return null;

  // Determine chat header text
  const getChatHeaderInfo = () => {
    // Private chat between volunteer and organization
    if (volunteerId) {
      // If current user is a volunteer viewing chat with organization
      if (currentUserType === 'volunteer') {
        return {
          title: 'Private Chat',
          withText: 'Organization Admin',
          eventText: eventTitle
        };
      }
      
      // If current user is an organization viewing chat with volunteer
      if (currentUserType === 'organization') {
        return {
          title: 'Private Chat',
          withText: volunteerName || 'Volunteer',
          eventText: eventTitle
        };
      }
    }
    
    // Public event chat
    return {
      title: eventTitle,
      withText: null,
      eventText: null
    };
  };
  
  const headerInfo = getChatHeaderInfo();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col relative">
        {/* Enhanced header with status */}
        <div className="flex items-center gap-4 p-4 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shadow">
              {eventTitle ? eventTitle[0].toUpperCase() : 'F'}
            </div>
            {/* Online indicator dot */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {headerInfo.title}
            </h2>
            {headerInfo.withText ? (
              <div className="flex flex-col">
                <p className="text-sm text-gray-600">
                  with <span className="font-semibold">{headerInfo.withText}</span>
                </p>
                {headerInfo.eventText && (
                  <p className="text-xs text-blue-600">
                    Event: <span className="font-medium">{headerInfo.eventText}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Event Discussion</p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close chat"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Error display with improved styling */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2 flex items-center border-b border-red-100">
            <span className="font-medium mr-2">Error:</span> {error}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-blue-500 border-r-blue-500 border-b-gray-200 border-l-gray-200 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading messages...</p>
            </div>
          </div>
        )}

        {/* Enhanced messages container with ref for scroll detection */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-2 space-y-3 bg-gradient-to-br from-blue-50 via-white to-blue-50 scroll-smooth"
          onScroll={handleScroll}
        >
          {/* Date separators and improved message grouping */}
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <FiMessageSquare className="text-blue-500" size={28} />
              </div>
              <p className="text-gray-500 text-center">No messages yet.<br />Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwn = message.user_id === currentUserId;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const isNewSender = !prevMessage || prevMessage.user_id !== message.user_id;
                const showDateSeparator = index === 0 || 
                  new Date(message.created_at).toDateString() !== 
                  new Date(prevMessage.created_at).toDateString();
                
                return (
                  <div key={message.id || index}>
                    {/* Date separator */}
                    {showDateSeparator && (
                      <div className="flex justify-center my-4">
                        <div className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                          {new Date(message.created_at).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Message bubble with improved styling */}
                    <div
                      className={`flex mb-1 ${isOwn ? 'justify-end' : 'justify-start'} 
                        ${!isNewSender && !showDateSeparator ? (isOwn ? 'mt-1' : 'mt-1') : 'mt-3'}`}
                    >
                      <div className={`flex items-end ${isOwn ? 'flex-row-reverse' : ''} max-w-[80%] group`}>
                        {/* Avatar - only show for first message in a group */}
                        {isNewSender && (
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold mx-2 shadow-sm ${isOwn ? 'ml-2' : 'mr-2'}`}>
                            {message.sender_name ? message.sender_name[0].toUpperCase() : 'O'}
                          </div>
                        )}
                        
                        {/* Message content with dynamic styling */}
                        <div
                          className={`relative px-4 py-2 shadow-sm text-sm break-words flex flex-col
                            ${isOwn
                              ? message._status === 'error' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800'}
                            ${isNewSender 
                              ? (isOwn ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md' : 'rounded-tr-2xl rounded-tl-md rounded-bl-2xl rounded-br-2xl')
                              : (isOwn ? 'rounded-tl-2xl rounded-bl-2xl rounded-br-md' : 'rounded-tr-2xl rounded-br-2xl rounded-bl-md')}
                          `}
                          style={{
                            wordBreak: 'break-word',
                            minWidth: '60px',
                          }}
                        >
                          {/* Sender name - only show for first message in group from others */}
                          {isNewSender && !isOwn && (
                            <span className="font-semibold text-xs text-blue-800 mb-1">
                              {message.sender_name}
                            </span>
                          )}
                          
                          {/* Message text */}
                          <div className="whitespace-pre-wrap">{message.message}</div>
                          
                          {/* Message timestamp and status */}
                          <div className={`flex items-center text-xxs mt-1 ${isOwn ? 'justify-end' : 'justify-start'} opacity-70`}>
                            <span className={isOwn ? 'text-blue-100' : 'text-gray-500'}>
                              {formatTime(message.created_at)}
                            </span>
                            {isOwn && (
                              <span className="ml-1">
                                {getMessageStatusIcon(message)}
                              </span>
                            )}
                          </div>
                          
                          {/* Delete button */}
                          {isOwn && canDeleteMessage(message) && !message._status && (
                            <button
                              className="absolute -top-1 -right-1 text-xs bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all shadow-sm"
                              title="Delete message"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <FiTrash2 size={14} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-5 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700 transition-all opacity-80 hover:opacity-100 z-20"
          >
            <FiChevronDown size={20} />
          </button>
        )}
        
        {/* Enhanced input area with buttons */}
        <form
          className="flex items-center gap-2 p-3 border-t bg-white sticky bottom-0 z-10 rounded-b-2xl"
          onSubmit={e => {
            e.preventDefault();
            sendMessage();
          }}
        >
          {/* Emoji picker button and popup */}
          <div className="relative">
            <button 
              type="button" 
              className={`p-2 ${showEmojiPicker ? 'bg-blue-50 text-blue-600' : 'text-gray-500'} hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors`}
              title="Add emoji"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <FiSmile size={20} />
            </button>
            
            {/* Emoji picker popup */}
            {showEmojiPicker && (
              <div 
                className="absolute bottom-12 left-0 z-30 shadow-xl rounded-lg border border-gray-200"
                ref={emojiPickerRef}
              >
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  searchDisabled={false}
                  width={280}
                  height={350}
                  previewConfig={{
                    showPreview: false
                  }}
                  skinTonesDisabled
                />
              </div>
            )}
          </div>
          
          {/* Enhanced input field */}
          <div className="flex-1 relative">
            <input
              type="text"
              className="w-full rounded-full border border-gray-300 pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800 bg-gray-50 shadow-inner"
              placeholder={isLoading ? "Sending..." : "Type your message..."}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          {/* Enhanced send button */}
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="flex items-center justify-center p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
            title="Send message"
          >
            <FiSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatModal;