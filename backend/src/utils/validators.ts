const JIRA_ID_REGEX = /^[A-Z]+-\d+$/;
const URL_REGEX = /^https?:\/\/.+/;

export function isValidJiraId(id: string): boolean {
  return JIRA_ID_REGEX.test(id.trim());
}

export function isValidUrl(url: string): boolean {
  return URL_REGEX.test(url.trim());
}

export function isValidProvider(provider: string): provider is 'groq' | 'openai' | 'ollama' {
  return ['groq', 'openai', 'ollama'].includes(provider);
}

export function sanitizeJiraId(id: string): string {
  return id.trim().toUpperCase();
}
