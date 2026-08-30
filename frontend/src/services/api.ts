import { ChatResponse, HealthResponse, Message } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function sendChatMessage(
  question: string,
  history: Message[] = [],
  signal?: AbortSignal
): Promise<ChatResponse> {
  const contextHistory = history
    .slice(-6)
    .map(m => {
      const item: Record<string, any> = {
        role: m.role,
        content: m.content,
      };
      if (m.responseMetadata?.intent) {
        item.intent = m.responseMetadata.intent;
      }
      if (m.responseMetadata?.explainability?.filters_applied?.sector) {
        item.sector = m.responseMetadata.explainability.filters_applied.sector;
      }
      return item;
    });

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        question: question.trim(),
        context_history: contextHistory
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      let detailMsg = `Server returned status code ${response.status}`;

      if (errData.detail) {
        if (typeof errData.detail === 'string') {
          detailMsg = errData.detail;
        } else if (Array.isArray(errData.detail)) {
          detailMsg = errData.detail
            .map((item: any) => `${item.loc?.join('.') || 'field'}: ${item.msg}`)
            .join('; ');
        } else if (typeof errData.detail === 'object') {
          detailMsg = JSON.stringify(errData.detail);
        }
      }
      throw new Error(detailMsg);
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Generation stopped by user.');
    }
    const cleanMsg = typeof error.message === 'string' && error.message.trim()
      ? error.message
      : 'Failed to communicate with the Skylark BI server.';
    throw new Error(cleanMsg);
  }
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return await res.json();
  } catch (e) {
    return {
      status: 'offline',
      monday_connected: false,
      details: { error: 'Could not reach API server' }
    };
  }
}
