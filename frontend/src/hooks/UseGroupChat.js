import { useEffect, useRef, useState, useCallback } from 'react';

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

  // Use refs for callbacks to avoid stale closures
  const onNewMessageRef = useRef(onNewMessage);
  const onHistoryLoadedRef = useRef(onHistoryLoaded);

  // Keep refs in sync with latest callbacks
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onHistoryLoadedRef.current = onHistoryLoaded;
  }, [onHistoryLoaded]);

  const connect = useCallback(async () => {
    if (!groupId || !userId) return;

    try {
      const token = await getToken();
      
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

     const wsUrl = `ws://localhost:8000/api/ws/group/${userId}/${groupId}?token=${encodeURIComponent(token)}`;
     console.log('Connecting to:', wsUrl);
    
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

          // Handle different message types using refs to avoid stale closures
          if (data.action === 'new_message') {
            onNewMessageRef.current?.(data.message);
          } else if (data.action === 'load_history') {
            onHistoryLoadedRef.current?.(data.history);
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
  }, [groupId, userId, getToken]); // Only depend on stable values, not callbacks

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((content, type = 'text') => {
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
  }, [groupId, userId]);

  const loadMoreHistory = useCallback((lastMessageId) => {
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
  }, [groupId, userId]);

  const editMessage = useCallback((messageId, editedContent, editedType) => {
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
  }, [groupId, userId]);

  const replyToMessage = useCallback((repliedMessageId, repliedToId, replyContent, replyContentType = 'text') => {
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
  }, [groupId, userId]);

  const deleteMessage = useCallback((messageId) => {
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
  }, [groupId, userId]);

  // Connect when groupId or userId changes
  useEffect(() => {
    if (groupId && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [groupId, userId, connect, disconnect]);

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