import { Response } from 'express';
import { streamWithGroq } from './groq';
import { streamWithOpenAI } from './openai';
import { streamWithOllama } from './ollama';
import { JiraTicket } from '../jira-client';

export type Provider = 'groq' | 'openai' | 'ollama';

const DEFAULT_TEMPLATE_SECTIONS = `
1. Test Plan Overview
2. Scope (In Scope / Out of Scope)
3. Test Objectives
4. Test Strategy
5. Test Cases (Positive / Negative / Edge Cases)
6. Entry and Exit Criteria
7. Test Environment
8. Risks and Mitigations
`.trim();

export function buildSystemPrompt(ticket: JiraTicket, templateSections: string): string {
  return `You are a senior QA Engineer. Generate a comprehensive, professional test plan in Markdown.

JIRA Ticket:
- ID: ${ticket.ticketId}
- Summary: ${ticket.summary}
- Description: ${ticket.description || 'Not provided'}
- Priority: ${ticket.priority}
- Status: ${ticket.status}
- Acceptance Criteria: ${ticket.acceptanceCriteria || 'Not specified'}
- Labels: ${ticket.labels.length ? ticket.labels.join(', ') : 'None'}

Template Structure to follow:
${templateSections}

Instructions:
- Follow the template structure exactly — use its section headings.
- Write specific, actionable test cases derived from the acceptance criteria.
- Cover positive paths, negative paths, and edge cases.
- Each test case must have: ID, Title, Steps, Expected Result.
- Output clean, well-formatted Markdown only.`;
}

export async function streamGenerate(
  provider: Provider,
  ticket: JiraTicket,
  templateSections: string,
  res: Response,
): Promise<string> {
  const sections = templateSections || DEFAULT_TEMPLATE_SECTIONS;
  const systemPrompt = buildSystemPrompt(ticket, sections);

  const messages: { role: 'system' | 'user'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate the full test plan for ${ticket.ticketId}: ${ticket.summary}` },
  ];

  switch (provider) {
    case 'groq':   return streamWithGroq(messages, res);
    case 'openai': return streamWithOpenAI(messages, res);
    case 'ollama': return streamWithOllama(messages, res);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}
