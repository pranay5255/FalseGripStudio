import { OpenRouterClient } from './openrouter';
import { SCIENCE_PROMPT_TEMPLATE, SCIENCE_SYSTEM_PROMPT } from './modulePrompt';

/**
 * Evidence-Based FAQ / Myth Buster plan
 *
 * 1. Receive a topic string from the WhatsApp command handler.
 * 2. Build a deterministic prompt that enforces markdown sections:
 *    ## Evidence, ## Uncertainties, ## Practical Takeaways.
 * 3. Send the prompt + strict system message to OpenRouter for response.
 * 4. Return formatted markdown back to the chat for immediate delivery.
 *
 * The prompt template below is shared so other modules can reuse or extend it.
 */

export interface ScienceBriefPromptParams {
  topic: string;
}

export const buildScienceBriefPrompt = ({ topic }: ScienceBriefPromptParams): string => {
  const trimmedTopic = topic.trim();
  if (!trimmedTopic) {
    throw new Error('Topic is required to build a science brief prompt.');
  }

  return SCIENCE_PROMPT_TEMPLATE.replace('{{TOPIC}}', trimmedTopic);
};

export interface GenerateScienceBriefParams {
  topic: string;
}

export interface ScienceBriefDependencies {
  openRouterClient: OpenRouterClient;
}

export type GenerateScienceBriefInput = GenerateScienceBriefParams & ScienceBriefDependencies;

export const generateScienceBrief = async ({
  topic,
  openRouterClient,
}: GenerateScienceBriefInput): Promise<string> => {
  const sanitizedTopic = topic.trim();
  if (!sanitizedTopic) {
    throw new Error('Topic is required for science brief generation.');
  }

  if (!openRouterClient.isEnabled()) {
    throw new Error('OpenRouter client is disabled.');
  }

  const prompt = buildScienceBriefPrompt({ topic: sanitizedTopic });
  return openRouterClient.generateText(prompt, SCIENCE_SYSTEM_PROMPT);
};

