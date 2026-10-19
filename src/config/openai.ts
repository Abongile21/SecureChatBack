import dotenv from 'dotenv';

dotenv.config();

export const requiredEnvironmentValue = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be configured`);
  }
  return value;
};

export const getOpenRouterConfig = () => {
  const timeout = Number.parseInt(requiredEnvironmentValue('OPENAI_TIMEOUT_MS'), 10);
  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new Error('OPENAI_TIMEOUT_MS must be a positive integer');
  }

  return {
    baseURL: requiredEnvironmentValue('OPENAI_API_BASE').replace(/\/+$/, ''),
    apiKey: requiredEnvironmentValue('OPENAI_API_KEY'),
    model: requiredEnvironmentValue('OPENAI_MODEL_NAME'),
    title: requiredEnvironmentValue('X_OPENROUTER_TITLE'),
    referer: requiredEnvironmentValue('HTTP_REFERER'),
    systemPrompt: requiredEnvironmentValue('SYSTEM_PROMPT'),
    timeout,
  };
};
