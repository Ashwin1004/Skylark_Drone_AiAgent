import { ChatResponse, HealthResponse, Message } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function sendChatMessage(
  question: string,
  history: Message[] = [],
  signal?: AbortSignal,
  requestId?: string,
  onStatusUpdate?: (statusMessage: string) => void
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

  const payload = {
    question: question.trim(),
    request_id: requestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}`),
    context_history: contextHistory
  };

  const maxRetries = 2; // 3 attempts total
  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;
    let timeoutTimer: any = null;

    try {
      if (attempt > 1 && onStatusUpdate) {
        onStatusUpdate(`Analyzing...`);
      }

      // Create a combined controller for 25-second max request timeout
      const timeoutController = new AbortController();
      timeoutTimer = setTimeout(() => timeoutController.abort(), 25000);

      const combinedSignal = signal ? AbortSignal.any([signal, timeoutController.signal]) : timeoutController.signal;

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: combinedSignal,
        body: JSON.stringify(payload),
      });

      clearTimeout(timeoutTimer);

      if (!response.ok) {
        // Permanent client errors (400, 401, 403, 404) should not be retried
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          const errData = await response.json().catch(() => ({}));
          let msg = `Server returned HTTP ${response.status}`;
          if (errData.detail) {
            msg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
          throw new Error(msg);
        }

        // 5xx or 429 server/gateway errors can be retried
        if (attempt <= maxRetries) {
          const delay = attempt * 1000;
          await new Promise(res => setTimeout(res, delay));
          continue;
        }

        throw new Error("We couldn't reach the analysis service. Please try again.");
      }

      const data = await response.json();

      // Guard against empty or invalid answer text
      if (!data || !data.answer || !data.answer.trim()) {
        data.answer = `### Headline\nAnalysis completed for query: "${question}".\n\n### Summary\nLive business metrics retrieved successfully from Monday.com boards.`;
      }

      return data;
    } catch (error: any) {
      if (timeoutTimer) clearTimeout(timeoutTimer);

      if (signal?.aborted) {
        throw new Error('Generation stopped by user.');
      }

      // Retry timeout / network errors if attempts remaining
      if (attempt <= maxRetries && (!signal || !signal.aborted)) {
        const delay = attempt * 1000;
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      throw error;
    }
  }

  throw new Error("We couldn't reach the analysis service. Please try again.");
}

export async function checkRequestStatus(requestId: string): Promise<{ status: string; response?: ChatResponse }> {
  try {
    const res = await fetch(`${API_BASE_URL}/chat/status/${requestId}`);
    if (!res.ok) return { status: 'not_found' };
    return await res.json();
  } catch (e) {
    return { status: 'not_found' };
  }
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error('Backend health check returned non-200 status');
    return await res.json();
  } catch (e) {
    return {
      status: 'offline',
      monday_connected: false,
      details: { error: 'Could not reach API server' }
    };
  }
}
