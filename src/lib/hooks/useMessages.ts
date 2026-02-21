'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MessageDoc } from '../db-types';

export function useMessages() {
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      setError(null);
      const { getAllMessages } = await import('../services/message-service');
      const data = await getAllMessages();
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const send = useCallback(async (data: Omit<MessageDoc, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const { createMessage } = await import('../services/message-service');
    const msg = await createMessage(data);
    await loadMessages();
    return msg;
  }, [loadMessages]);

  return { messages, loading, error, send, reload: loadMessages };
}
