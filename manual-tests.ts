import 'dotenv/config';
import { summarizeRecentChat } from './src/chatSummary';
import { estimatePlateCalories } from './src/plateCalorieEstimator';
import { generateScienceBrief } from './src/scienceBrief';
import { OpenRouterClient } from './src/openrouter';

type StubClient = {
  getChatById: () => Promise<{ fetchMessages: () => Promise<Array<{ body: string; timestamp: number; fromMe: boolean }>> }>;
  sendMessage: (jid: string, text: string) => Promise<void>;
};

const chatPrompts: string[] = [
  'I am heading to the gym. Give me a nice back and biceps workout. Give me the exercises along with the sets and reps. You can include machines, barbelsl and dumbbells. Do not include bodyweight workouts.',
  'I need a protein supplement for my mother. She is a pure vegetarian, and does not consume enough protein. She is lactose intolerant so she cannot consume milk products, and she cannot consume pulses like chickpeas, kidney beans or black eyed peas as well. Basically, she gets almost no protein.\n\nNow she has started doing pilates, and i can see her getting skinny fat. Should she alter her diet to include more protein? Keep in mind, she cannot consume a lot of food. Or should she take a protein supplement? And if so, which supplement would you recommend?',
  'I have high calf inserts, so even though my calves are shredded and super strong and I have great athleticism, they always look skinny. Is there any way to increase the size of my calves so it becomes a little bulkier, like any type of exercise or program that could help me achieve size?',
  'How to release my triceps without any equipment?',
  'Which Youtuber to follow for workouts and fitness related info?',
  "I don't like the fact that my trainer trains me in the same way he trains guys. He completely ignores my limitations as a girl, such as period cramps, limited strength, more fat storage. I feel Indian trainers are not sensitized towards women when it comes to training. What should I do?",
  'I am currently 103 kgs, and my height is 179 cm. I am very overweight. How do I lose weight considering I do not exercise and I have a desk job where I work for 9-12 hours a day?',
];

const platePrompt =
  "In Italy for 2 weeks. How can I maintain my muscle mass and bodyweight there, when all I will be eating is pizza, pasta, croissant, gelato and tiramisu? How can I not put on weight when I'll be eating junk food for 2 straight weeks?";

const scienceTopics: string[] = [
  'Why do muscles get tight so fast and so easily?',
  'What is the difference between visible abs and functional abs? how do I test which one of the two I have?',
];

// Create a real OpenRouter client instance
const openRouterClient = new OpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY,
  textModel: process.env.OPENROUTER_TEXT_MODEL,
  visionModel: process.env.OPENROUTER_VISION_MODEL,
  referer: process.env.OPENROUTER_REFERER,
  appTitle: process.env.OPENROUTER_APP_TITLE ?? 'WhatsApp Demo Bot'
});

// Check if OpenRouter client is enabled
const isOpenRouterEnabled = openRouterClient.isEnabled();

if (!isOpenRouterEnabled) {
  console.warn('⚠️  OpenRouter API key not detected. Tests will use mock responses.');
  console.warn('💡 Set OPENROUTER_API_KEY environment variable to enable real API calls.');
}

const runChatSummaryTests = async () => {
  if (!isOpenRouterEnabled) {
    console.log('⚠️  Skipping chat summary tests - OpenRouter client disabled');
    return;
  }

  const results: Array<{ prompt: string; response: string }> = [];
  for (const [index, prompt] of chatPrompts.entries()) {
    try {
      const messages = [{ body: prompt, timestamp: Math.floor(Date.now() / 1000), fromMe: index % 2 === 0 }];
      const client: StubClient = {
        getChatById: async () => ({
          fetchMessages: async () => messages,
        }),
        sendMessage: async (_jid: string, text: string) => {
          results.push({ prompt, response: text });
        },
      };

      await summarizeRecentChat({
        client: client as never,
        openRouterClient,
        jid: `test-chat-${index + 1}`,
        lookbackMs: 48 * 60 * 60 * 1000,
        maxMessages: 10,
      });
    } catch (error) {
      console.error(`❌ Failed to process chat prompt ${index + 1}:`, error);
      results.push({ prompt, response: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }

  console.log('=== Chat Summary Results (7 cases) ===');
  results.forEach((r, idx) => {
    console.log(`\n[Case ${idx + 1}] Prompt: ${r.prompt.slice(0, 80)}...`);
    console.log(`Response:\n${r.response}`);
  });
};

const runPlateEstimatorTest = async () => {
  if (!isOpenRouterEnabled) {
    console.log('⚠️  Skipping plate estimator test - OpenRouter client disabled');
    return;
  }

  try {
    const result = await estimatePlateCalories({
      captionText: platePrompt,
      openRouterClient,
    });

    console.log('\n=== Plate Calorie Estimator Result (1 case) ===');
    console.log('Prompt:', platePrompt);
    console.log('Parsed estimate:', result);
  } catch (error) {
    console.error('❌ Failed to estimate plate calories:', error);
    console.log('\n=== Plate Calorie Estimator Result (1 case) ===');
    console.log('Prompt:', platePrompt);
    console.log('Parsed estimate: ERROR -', error instanceof Error ? error.message : 'Unknown error');
  }
};

const runScienceBriefTests = async () => {
  if (!isOpenRouterEnabled) {
    console.log('⚠️  Skipping science brief tests - OpenRouter client disabled');
    return;
  }

  const outputs: Array<{ topic: string; brief: string }> = [];
  for (const topic of scienceTopics) {
    try {
      const brief = await generateScienceBrief({
        topic,
        openRouterClient,
      });
      outputs.push({ topic, brief });
    } catch (error) {
      console.error(`❌ Failed to generate science brief for topic "${topic}":`, error);
      outputs.push({ topic, brief: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }

  console.log('\n=== Science Brief Results (2 cases) ===');
  outputs.forEach((o, idx) => {
    console.log(`\n[Case ${idx + 1}] Topic: ${o.topic}`);
    console.log(o.brief);
  });
};

const main = async () => {
  console.log('🚀 Starting manual tests...');

  if (!isOpenRouterEnabled) {
    console.log('ℹ️  Running tests in mock mode (no API calls)');
  } else {
    console.log('✅ OpenRouter client enabled - will make real API calls');
  }

  await runChatSummaryTests();
  await runPlateEstimatorTest();
  await runScienceBriefTests();

  console.log('\n🎉 All manual tests completed.');
  console.log('📊 Summary:');
  console.log(`- Chat summary tests: ${isOpenRouterEnabled ? 'Real API calls' : 'Mock mode'}`);
  console.log(`- Plate estimator test: ${isOpenRouterEnabled ? 'Real API call' : 'Mock mode'}`);
  console.log(`- Science brief tests: ${isOpenRouterEnabled ? 'Real API calls' : 'Mock mode'}`);
};

void main();

