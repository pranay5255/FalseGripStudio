import { OpenRouterClient } from './openrouter';
import { QNA_PROMPT_TEMPLATE, QNA_SYSTEM_PROMPT } from './modulePrompt';

/**
 * QnA Template for Short, Direct Answers
 *
 * Designed for general queries that need concise, factual responses.
 * Unlike science briefs (detailed evidence) or chat summaries (conversation analysis),
 * QnA responses are brief, direct answers optimized for WhatsApp readability.
 */

export interface QnAPromptParams {
  question: string;
  context?: string;
}

export const buildQnAPrompt = ({ question, context }: QnAPromptParams): string => {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error('Question is required to build a QnA prompt.');
  }

  let prompt = QNA_PROMPT_TEMPLATE.replace('{{QUESTION}}', trimmedQuestion);

  if (context?.trim()) {
    prompt = prompt.replace('{{CONTEXT_SECTION}}', `\n**Context:** ${context.trim()}\n`);
  } else {
    prompt = prompt.replace('{{CONTEXT_SECTION}}', '');
  }

  return prompt;
};

export interface GenerateQnAParams {
  question: string;
  context?: string;
}

export interface QnADependencies {
  openRouterClient: OpenRouterClient;
}

export type GenerateQnAInput = GenerateQnAParams & QnADependencies;

export const generateQnAResponse = async ({
  question,
  context,
  openRouterClient,
}: GenerateQnAInput): Promise<string> => {
  const sanitizedQuestion = question.trim();
  if (!sanitizedQuestion) {
    throw new Error('Question is required for QnA generation.');
  }

  if (!openRouterClient.isEnabled()) {
    throw new Error('OpenRouter client is disabled.');
  }

  const prompt = buildQnAPrompt({ question: sanitizedQuestion, context });
  return openRouterClient.generateText(prompt, QNA_SYSTEM_PROMPT);
};

