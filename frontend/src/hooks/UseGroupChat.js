import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to manage WebSocket connection for group chat
 * @param {number} groupId - The active group ID
 * @param {string} userId - The current user ID
 * @param {Function} getToken - Function to get auth token
 * @param {Function} onNewMessage - Callback when new message received
 * @param {Function} onHistoryLoaded - Callback when history is loaded
 */
export const useGroupChat = (groupId, userId, getToken, onNewMessage, onHistoryLoaded) => {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = async () => {
    if (!groupId || !userId) return;

    try {
      const token = await getToken();
      
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }
// ✅ CORRECT
      const wsUrl = `ws://localhost:8000/api/${userId}/${groupId}/ws?token=${token}`;  
      console.log('Connecting to:', wsUrl); // Debug log
    
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        console.log(`✅ Connected to group ${groupId}`);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Load message history on connect
        ws.send(JSON.stringify({
          action: 'load_history',
          payload: {
            last_message_id: null,
            user_id: userId,
            group_id: groupId
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.error) {
            console.error('WebSocket error:', data.error);
            return;
          }

          // Handle different message types
          if (data.action === 'new_message') {
            onNewMessage?.(data.message);
          } else if (data.action === 'load_history') {
            onHistoryLoaded?.(data.history);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log(`❌ Disconnected from group ${groupId}`);
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = (content, type = 'text') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    wsRef.current.send(JSON.stringify({
      action: 'send_message',
      payload: {
        user_id: userId,
        group_id: groupId,
        content: content,
        type: type
      }
    }));

    return true;
  };

  const loadMoreHistory = (lastMessageId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    wsRef.current.send(JSON.stringify({
      action: 'load_history',
      payload: {
        last_message_id: lastMessageId,
        user_id: userId,
        group_id: groupId
      }
    }));

    return true;
  };

  const editMessage = (messageId, editedContent, editedType) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    wsRef.current.send(JSON.stringify({
      action: 'edit',
      payload: {
        user_id: userId,
        message_id: messageId,
        group_id: groupId,
        edited_content: editedContent,
        edited_type: editedType
      }
    }));

    return true;
  };

  const replyToMessage = (repliedMessageId, repliedToId, replyContent, replyContentType = 'text') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    wsRef.current.send(JSON.stringify({
      action: 'reply',
      payload: {
        replied_message_id: repliedMessageId,
        group_id: groupId,
        replied_to_id: repliedToId,
        replied_by_id: userId,
        reply_content: replyContent,
        reply_content_type: replyContentType
      }
    }));

    return true;
  };

  const deleteMessage = (messageId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    wsRef.current.send(JSON.stringify({
      action: 'delete',
      payload: {
        delete_message_id: messageId,
        group_id: groupId,
        user_id: userId
      }
    }));

    return true;
  };

  // Connect when groupId or userId changes
  useEffect(() => {
    if (groupId && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [groupId, userId]);

  return {
    isConnected,
    sendMessage,
    loadMoreHistory,
    editMessage,
    replyToMessage,
    deleteMessage,
    reconnect: connect
  };
};