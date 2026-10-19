import axios from 'axios';
import { getOpenRouterConfig } from '../config/openai';
import logger from '../config/logger';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONTEXT_MESSAGES = 10;

const getOpenRouterClient = () => {
  const config = getOpenRouterConfig();
  return {
    config,
    client: axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.referer,
        'X-Title': config.title,
      },
    }),
  };
};

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const requestCompletion = async (messages: ChatMessage[]): Promise<string> => {
  const { config, client } = getOpenRouterClient();
  const response = await client.post('/chat/completions', {
    model: config.model,
    messages,
  });
  const content = response.data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('AI provider returned an empty response');
  }
  return content.trim();
};

const localCybersecurityGuidance = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('phish') || lowerMessage.includes('email')) {
    return 'Check the sender address, unexpected urgency, links, attachments, and requests for credentials. Do not click first; verify through a trusted channel and report suspicious messages.';
  }
  if (lowerMessage.includes('password') || lowerMessage.includes('passphrase')) {
    return 'Use a unique passphrase for every account, store it in a reputable password manager, enable MFA, and never share verification codes.';
  }
  if (lowerMessage.includes('link') || lowerMessage.includes('url')) {
    return 'Treat unexpected links as suspicious. Inspect the real domain, avoid shortened URLs from unknown senders, and navigate to the service using a trusted bookmark instead.';
  }
  return 'Use MFA, unique passwords, software updates, least privilege, and careful verification of unexpected requests. Share the specific cybersecurity situation and I can help you assess it.';
};

export const generateChatbotResponse = async (
  userMessage: string,
  _chatId: string,
  context: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> => {
  const boundedMessage = userMessage.trim().slice(0, MAX_MESSAGE_LENGTH);

  try {
    const config = getOpenRouterConfig();
    return await requestCompletion([
      { role: 'system', content: config.systemPrompt },
      ...context.slice(-MAX_CONTEXT_MESSAGES),
      { role: 'user', content: boundedMessage },
    ]);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.warn(`AI provider request failed (status ${error.response?.status ?? 'unknown'}): ${error.message}; using local guidance`);
    } else {
      logger.error(`Unexpected AI service error: ${error instanceof Error ? error.message : 'unknown error'}; using local guidance`);
    }
    return localCybersecurityGuidance(boundedMessage);
  }
};

export const analyzePhishingAttempt = async (
  emailContent: string
): Promise<{ isPhishing: boolean; confidence: number; reason: string }> => {
  try {
    const content = await requestCompletion([
      {
        role: 'system',
        content: 'You are a phishing detection expert. Respond only with valid JSON containing isPhishing (boolean), confidence (number from 0 to 100), and reason (string).',
      },
      {
        role: 'user',
        content: `Analyze this email for phishing: ${emailContent}`,
      },
    ]);
    return JSON.parse(content) as { isPhishing: boolean; confidence: number; reason: string };
  } catch (error) {
    console.error('Phishing analysis error:', error);
    return {
      isPhishing: false,
      confidence: 0,
      reason: 'Unable to analyze phishing attempt at the moment.',
    };
  }
};
