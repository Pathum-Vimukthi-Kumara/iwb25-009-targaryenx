import { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messageListeners, setMessageListeners] = useState(new Map());

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:9001/ws');
    
    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Notify all listeners
        messageListeners.forEach((callback) => callback(data));
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const addMessageListener = (id, callback) => {
    setMessageListeners(prev => new Map(prev.set(id, callback)));
  };

  const removeMessageListener = (id) => {
    setMessageListeners(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  return (
    <WebSocketContext.Provider value={{
      socket,
      isConnected,
      addMessageListener,
      removeMessageListener
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};