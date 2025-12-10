/**
 * Manual Test Script for Plate Calorie Estimator - Text Generation Tests
 *
 * This script provides manual testing for text-based functionality of plateCalorieEstimator.ts
 * including prompt building, parsing, and rendering without requiring image inputs.
 */

import 'dotenv/config';
import { buildCaloriePrompt, renderCalorieEstimate, CalorieEstimate } from './src/plateCalorieEstimator';
import { OpenRouterClient } from './src/openrouter';
import { generateQnAResponse } from './src/qnaTemplate';
import { generateScienceBrief } from './src/scienceBrief';

/**
 * Local implementation of tryParseEstimate for testing purposes
 * (not exported from the original module)
 */
const tryParseEstimate = (text: string): CalorieEstimate | undefined => {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/\{[\s\S]*\}/);
  const candidate = fenceMatch ? fenceMatch[0] : trimmed;

  const coerceNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.\-]/g, '');
      const n = parseFloat(cleaned);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  };

  try {
    const raw = JSON.parse(candidate) as Partial<CalorieEstimate>;
    const est: CalorieEstimate = {
      kcal_low: coerceNumber(raw.kcal_low),
      kcal_high: coerceNumber(raw.kcal_high),
      protein_g: coerceNumber(raw.protein_g),
      carbs_g: coerceNumber(raw.carbs_g),
      fat_g: coerceNumber(raw.fat_g),
      notes: typeof raw.notes === 'string' ? raw.notes.trim() : ''
    };
    if (est.kcal_low === 0 && est.kcal_high === 0 && est.protein_g === 0 && est.carbs_g === 0 && est.fat_g === 0) {
      return undefined;
    }
    return est;
  } catch {
    return undefined;
  }
};

/**
 * Test 1: Build Calorie Prompt Function
 */
async function testBuildCaloriePrompt() {
  console.log('=== Test 1: Build Calorie Prompt ===');

  // Test with caption
  const promptWithCaption = buildCaloriePrompt('A plate with grilled chicken, rice, and vegetables');
  console.log('Prompt with caption:', promptWithCaption);

  // Test with empty caption
  const promptEmptyCaption = buildCaloriePrompt('');
  console.log('Prompt with empty caption:', promptEmptyCaption);

  // Test with whitespace-only caption
  const promptWhitespaceCaption = buildCaloriePrompt('   ');
  console.log('Prompt with whitespace caption:', promptWhitespaceCaption);

  // Test with special characters
  const promptSpecialChars = buildCaloriePrompt('Meal with 🍗 chicken, 🥦 broccoli, and 🍚 rice');
  console.log('Prompt with special characters:', promptSpecialChars);
}

/**
 * Test 2: Try Parse Estimate Function
 */
async function testTryParseEstimate() {
  console.log('=== Test 2: Try Parse Estimate ===');

  // Test valid JSON response
  const validResponse = `{
    "kcal_low": 300,
    "kcal_high": 450,
    "protein_g": 25,
    "carbs_g": 40,
    "fat_g": 12,
    "notes": "Estimated based on typical portion sizes"
  }`;

  const parsedValid = tryParseEstimate(validResponse);
  console.log('Valid JSON parsing result:', parsedValid);

  // Test invalid JSON response
  const invalidResponse = 'This is not valid JSON';
  const parsedInvalid = tryParseEstimate(invalidResponse);
  console.log('Invalid JSON parsing result:', parsedInvalid);

  // Test partial JSON response
  const partialResponse = `{
    "kcal_low": 200,
    "kcal_high": 300
  }`;

  const parsedPartial = tryParseEstimate(partialResponse);
  console.log('Partial JSON parsing result:', parsedPartial);

  // Test response with string numbers
  const stringNumbersResponse = `{
    "kcal_low": "350",
    "kcal_high": "500.5",
    "protein_g": "30",
    "carbs_g": "50",
    "fat_g": "15",
    "notes": "String numbers test"
  }`;

  const parsedStringNumbers = tryParseEstimate(stringNumbersResponse);
  console.log('String numbers parsing result:', parsedStringNumbers);

  // Test response with malformed numbers
  const malformedNumbersResponse = `{
    "kcal_low": "300abc",
    "kcal_high": "450xyz",
    "protein_g": "25!@#",
    "carbs_g": "40$%^",
    "fat_g": "12*()",
    "notes": "Malformed numbers test"
  }`;

  const parsedMalformedNumbers = tryParseEstimate(malformedNumbersResponse);
  console.log('Malformed numbers parsing result:', parsedMalformedNumbers);
}

/**
 * Test 3: Render Calorie Estimate Function
 */
async function testRenderCalorieEstimate() {
  console.log('=== Test 3: Render Calorie Estimate ===');

  const testEstimate = {
    kcal_low: 350,
    kcal_high: 480,
    protein_g: 28,
    carbs_g: 45,
    fat_g: 18,
    notes: 'Balanced meal with lean protein'
  };

  const rendered = renderCalorieEstimate(testEstimate);
  console.log('Rendered estimate:', rendered);

  // Test with empty notes
  const estimateNoNotes = {
    ...testEstimate,
    notes: ''
  };

  const renderedNoNotes = renderCalorieEstimate(estimateNoNotes);
  console.log('Rendered estimate without notes:', renderedNoNotes);

  // Test with zero values
  const estimateZeroValues = {
    kcal_low: 0,
    kcal_high: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    notes: 'Empty estimation'
  };

  const renderedZeroValues = renderCalorieEstimate(estimateZeroValues);
  console.log('Rendered estimate with zero values:', renderedZeroValues);
}

/**
 * Test 4: Edge Cases and Validation
 */
async function testEdgeCases() {
  console.log('=== Test 4: Edge Cases and Validation ===');

  // Test with very large numbers
  const largeNumbersResponse = `{
    "kcal_low": 999999,
    "kcal_high": 9999999,
    "protein_g": 9999,
    "carbs_g": 99999,
    "fat_g": 9999,
    "notes": "Very large numbers test"
  }`;

  const parsedLargeNumbers = tryParseEstimate(largeNumbersResponse);
  console.log('Large numbers parsing result:', parsedLargeNumbers);

  // Test with negative numbers
  const negativeNumbersResponse = `{
    "kcal_low": -100,
    "kcal_high": -50,
    "protein_g": -10,
    "carbs_g": -20,
    "fat_g": -5,
    "notes": "Negative numbers test"
  }`;

  const parsedNegativeNumbers = tryParseEstimate(negativeNumbersResponse);
  console.log('Negative numbers parsing result:', parsedNegativeNumbers);

  // Test with decimal numbers
  const decimalNumbersResponse = `{
    "kcal_low": 350.5,
    "kcal_high": 480.75,
    "protein_g": 28.25,
    "carbs_g": 45.1,
    "fat_g": 18.9,
    "notes": "Decimal numbers test"
  }`;

  const parsedDecimalNumbers = tryParseEstimate(decimalNumbersResponse);
  console.log('Decimal numbers parsing result:', parsedDecimalNumbers);
}

/**
 * Test 5: Performance and Validation
 */
async function testPerformance() {
  console.log('=== Test 5: Performance and Validation ===');

  const startTime = Date.now();

  // Test parsing performance with multiple responses
  const testResponses = [
    `{"kcal_low": 300, "kcal_high": 450, "protein_g": 25, "carbs_g": 40, "fat_g": 12, "notes": "Test 1"}`,
    `{"kcal_low": 250, "kcal_high": 350, "protein_g": 20, "carbs_g": 30, "fat_g": 10, "notes": "Test 2"}`,
    `{"kcal_low": 400, "kcal_high": 550, "protein_g": 30, "carbs_g": 50, "fat_g": 15, "notes": "Test 3"}`,
    `{"kcal_low": 350, "kcal_high": 480, "protein_g": 28, "carbs_g": 45, "fat_g": 18, "notes": "Test 4"}`,
    `{"kcal_low": 280, "kcal_high": 380, "protein_g": 22, "carbs_g": 35, "fat_g": 12, "notes": "Test 5"}`
  ];

  const results = testResponses.map(tryParseEstimate);
  const endTime = Date.now();

  console.log('Parsing completed in', (endTime - startTime), 'milliseconds');
  console.log('Successfully parsed:', results.filter(r => r !== undefined).length, 'out of', testResponses.length);

  // Validate that all results have required fields
  results.forEach((result, index) => {
    if (result) {
      const hasRequiredFields = typeof result.kcal_low === 'number' &&
                              typeof result.kcal_high === 'number' &&
                              typeof result.protein_g === 'number' &&
                              typeof result.carbs_g === 'number' &&
                              typeof result.fat_g === 'number' &&
                              typeof result.notes === 'string';

      console.log(`Result ${index + 1} validation:`, hasRequiredFields ? 'PASS' : 'FAIL');
    }
  });
}

/**
 * Test 6: User QnA/Science Questions
 */
async function testUserQuestions() {
  console.log('=== Test 6: User QnA/Science Questions ===');

  const openRouterClient = new OpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY,
    textModel: process.env.OPENROUTER_TEXT_MODEL,
    visionModel: process.env.OPENROUTER_VISION_MODEL,
    referer: process.env.OPENROUTER_REFERER,
    appTitle: process.env.OPENROUTER_APP_TITLE ?? 'WhatsApp Demo Bot'
  });

  if (!openRouterClient.isEnabled()) {
    console.log('OpenRouter client not enabled - skipping text generation tests');
    return;
  }

  const questions = [
    { type: 'qna', content: 'I am heading to the gym. Give me a nice back and biceps workout. Give me the exercises along with the sets and reps. You can include machines, barbelsl and dumbbells. Do not include bodyweight workouts.' },
    { type: 'qna', content: 'I need a protein supplement for my mother. She is a pure vegetarian, and does not consume enough protein. She is lactose intolerant so she cannot consume milk products, and she cannot consume pulses like chickpeas, kidney beans or black eyed peas as well. Basically, she gets almost no protein.\n\nNow she has started doing pilates, and i can see her getting skinny fat. Should she alter her diet to include more protein? Keep in mind, she cannot consume a lot of food. Or should she take a protein supplement? And if so, which supplement would you recommend?' },
    { type: 'qna', content: 'I have high calf inserts, so even though my calves are shredded and super strong and I have great athleticism, they always look skinny. Is there any way to increase the size of my calves so it becomes a little bulkier, like any type of exercise or program that could help me achieve size?' },
    { type: 'qna', content: 'How to release my triceps without any equipment?' },
    { type: 'qna', content: 'Which Youtuber to follow for workouts and fitness related info?' },
    { type: 'qna', content: 'I don\'t like the fact that my trainer trains me in the same way he trains guys. He completely ignores my limitations as a girl, such as period cramps, limited strength, more fat storage. I feel Indian trainers are not sensitized towards women when it comes to training. What should I do?' },
    { type: 'qna', content: 'I am currently 103 kgs, and my height is 179 cm. I am very overweight. How do I lose weight considering I do not exercise and I have a desk job where I work for 9-12 hours a day?' },
    { type: 'qna', content: 'I am going to Italy for 2 weeks. How can I maintain my muscle mass and bodyweight there, when all I will be eating is pizza, pasta, croissant, gelato and tiramisu? How can I not put on weight when I\'ll be eating junk food for 2 straight weeks?' },
    { type: 'science', topic: 'Muscle Tightness Mechanisms', content: 'Why do muscles get tight so fast and so easily?' },
    { type: 'science', topic: 'Visible vs Functional Abs', content: 'What is the difference between visible abs and functional abs? how do I test which one of the two I have?' }
  ];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n--- Question ${i + 1} (${q.type.toUpperCase()}) ---`);
    console.log(`Input: ${q.content}`);
    
    try {
      let result = '';
      if (q.type === 'qna') {
        result = await generateQnAResponse({
          question: q.content,
          openRouterClient
        });
      } else if (q.type === 'science') {
         // Using the topic if provided, otherwise the content
         const topic = (q as any).topic || q.content;
         console.log(`Topic: ${topic}`);
         result = await generateScienceBrief({
           topic: topic,
           openRouterClient
         });
      }
      console.log(`Response:\n${result}`);
    } catch (error) {
      console.error(`Error processing question ${i + 1}:`, error);
    }
    // Small delay to avoid rate limits if any
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Run All Text-Based Tests
 */
async function runAllTextTests() {
  console.log('Starting Plate Calorie Estimator Text-Based Manual Tests\n');

  // Run all text-based test functions
  await testBuildCaloriePrompt();
  await testTryParseEstimate();
  await testRenderCalorieEstimate();
  await testEdgeCases();
  await testPerformance();
  await testUserQuestions();

  console.log('\nAll text-based manual tests completed!');
  console.log('For image-based testing, please use manual-tests-image.ts');
}

// Execute tests
runAllTextTests().catch(console.error);
