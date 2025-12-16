/**
 * Debug Script 1: Test OpenRouter Vision API Directly
 * 
 * This script tests if the OpenRouter vision model API works correctly
 * by sending a test image from the downloads folder.
 * 
 * Run: npx tsx debug-vision-api.ts
 */

import 'dotenv/config';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import mime from 'mime-types';
import { OpenRouterClient } from './src/openrouter';

const TEST_IMAGE_PATH = path.resolve(process.cwd(), 'downloads', 'photo_6136538011856997208_y.jpg');

interface DebugResult {
  step: string;
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

const results: DebugResult[] = [];

function logResult(result: DebugResult): void {
  results.push(result);
  const icon = result.success ? '✅' : '❌';
  console.log(`\n${icon} ${result.step}`);
  console.log(`   ${result.message}`);
  if (result.data) {
    console.log('   Data:', typeof result.data === 'string' ? result.data.slice(0, 500) : result.data);
  }
  if (result.error) {
    console.log('   Error:', result.error);
  }
}

async function step1_checkEnvVariables(): Promise<boolean> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const visionModel = process.env.OPENROUTER_VISION_MODEL;
  const textModel = process.env.OPENROUTER_TEXT_MODEL;

  console.log('\n📋 Environment Variables:');
  console.log(`   OPENROUTER_API_KEY: ${apiKey ? '***' + apiKey.slice(-8) : 'NOT SET'}`);
  console.log(`   OPENROUTER_TEXT_MODEL: ${textModel ?? 'NOT SET (will use default)'}`);
  console.log(`   OPENROUTER_VISION_MODEL: ${visionModel ?? 'NOT SET (will use text model)'}`);

  if (!apiKey) {
    logResult({
      step: 'Step 1: Check Environment Variables',
      success: false,
      message: 'OPENROUTER_API_KEY is not set in .env file',
      error: 'Missing API key. Create a .env file with OPENROUTER_API_KEY=your_key'
    });
    return false;
  }

  logResult({
    step: 'Step 1: Check Environment Variables',
    success: true,
    message: 'API key found',
    data: { hasApiKey: true, hasVisionModel: !!visionModel, hasTextModel: !!textModel }
  });
  return true;
}

async function step2_checkImageFile(): Promise<boolean> {
  try {
    await access(TEST_IMAGE_PATH, constants.R_OK);
    const stats = await readFile(TEST_IMAGE_PATH);
    const mimeType = mime.lookup(TEST_IMAGE_PATH);

    logResult({
      step: 'Step 2: Check Test Image File',
      success: true,
      message: `Image file exists and is readable`,
      data: { path: TEST_IMAGE_PATH, size: `${(stats.length / 1024).toFixed(2)} KB`, mimeType }
    });
    return true;
  } catch (error) {
    logResult({
      step: 'Step 2: Check Test Image File',
      success: false,
      message: `Cannot access test image at ${TEST_IMAGE_PATH}`,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function step3_createOpenRouterClient(): Promise<OpenRouterClient | null> {
  try {
    const client = new OpenRouterClient({
      apiKey: process.env.OPENROUTER_API_KEY,
      textModel: process.env.OPENROUTER_TEXT_MODEL,
      visionModel: process.env.OPENROUTER_VISION_MODEL,
      referer: process.env.OPENROUTER_REFERER,
      appTitle: process.env.OPENROUTER_APP_TITLE ?? 'WhatsApp Demo Bot - Debug'
    });

    const isEnabled = client.isEnabled();

    logResult({
      step: 'Step 3: Create OpenRouter Client',
      success: isEnabled,
      message: isEnabled ? 'OpenRouter client created and enabled' : 'OpenRouter client is disabled (no API key)',
      data: { isEnabled }
    });

    return isEnabled ? client : null;
  } catch (error) {
    logResult({
      step: 'Step 3: Create OpenRouter Client',
      success: false,
      message: 'Failed to create OpenRouter client',
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

async function step4_testVisionApiWithImagePath(client: OpenRouterClient): Promise<boolean> {
  console.log('\n🔄 Testing Vision API with imagePath parameter...');
  
  try {
    const response = await client.describeImage({
      imagePath: TEST_IMAGE_PATH,
      instruction: 'Describe what you see in this image in 2-3 sentences.',
      system: 'You are a helpful assistant that describes images accurately.',
      maxTokens: 300,
      temperature: 0.2
    });

    logResult({
      step: 'Step 4: Vision API with imagePath',
      success: true,
      message: 'Vision API responded successfully with imagePath',
      data: response
    });
    return true;
  } catch (error) {
    logResult({
      step: 'Step 4: Vision API with imagePath',
      success: false,
      message: 'Vision API request failed with imagePath',
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function step5_testVisionApiWithBase64(client: OpenRouterClient): Promise<boolean> {
  console.log('\n🔄 Testing Vision API with base64Data parameter...');
  
  try {
    const buffer = await readFile(TEST_IMAGE_PATH);
    const base64Data = buffer.toString('base64');
    const mimeType = mime.lookup(TEST_IMAGE_PATH) || 'image/jpeg';

    const response = await client.describeImage({
      base64Data,
      mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
      instruction: 'Describe what you see in this image in 2-3 sentences.',
      system: 'You are a helpful assistant that describes images accurately.',
      maxTokens: 300,
      temperature: 0.2
    });

    logResult({
      step: 'Step 5: Vision API with base64Data',
      success: true,
      message: 'Vision API responded successfully with base64Data',
      data: response
    });
    return true;
  } catch (error) {
    logResult({
      step: 'Step 5: Vision API with base64Data',
      success: false,
      message: 'Vision API request failed with base64Data',
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function step6_testVisionApiWithDataUrl(client: OpenRouterClient): Promise<boolean> {
  console.log('\n🔄 Testing Vision API with pre-built data URL...');
  
  try {
    const buffer = await readFile(TEST_IMAGE_PATH);
    const base64Data = buffer.toString('base64');
    const mimeType = mime.lookup(TEST_IMAGE_PATH) || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const response = await client.describeImage({
      imageUrl: dataUrl,
      instruction: 'Describe what you see in this image in 2-3 sentences.',
      system: 'You are a helpful assistant that describes images accurately.',
      maxTokens: 300,
      temperature: 0.2
    });

    logResult({
      step: 'Step 6: Vision API with imageUrl (data URL)',
      success: true,
      message: 'Vision API responded successfully with imageUrl',
      data: response
    });
    return true;
  } catch (error) {
    logResult({
      step: 'Step 6: Vision API with imageUrl (data URL)',
      success: false,
      message: 'Vision API request failed with imageUrl',
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

async function runAllTests(): Promise<void> {
  console.log('🔧 Debug Script 1: OpenRouter Vision API Test');
  console.log('=' .repeat(60));

  // Step 1: Check environment variables
  const hasEnv = await step1_checkEnvVariables();
  if (!hasEnv) {
    console.log('\n❌ Cannot proceed without API key. Exiting...');
    printSummary();
    process.exit(1);
  }

  // Step 2: Check test image file
  const hasImage = await step2_checkImageFile();
  if (!hasImage) {
    console.log('\n❌ Cannot proceed without test image. Exiting...');
    printSummary();
    process.exit(1);
  }

  // Step 3: Create OpenRouter client
  const client = await step3_createOpenRouterClient();
  if (!client) {
    console.log('\n❌ Cannot proceed without valid OpenRouter client. Exiting...');
    printSummary();
    process.exit(1);
  }

  // Step 4-6: Test different ways to pass image data
  await step4_testVisionApiWithImagePath(client);
  await step5_testVisionApiWithBase64(client);
  await step6_testVisionApiWithDataUrl(client);

  printSummary();
}

function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.step}`);
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n💡 TROUBLESHOOTING TIPS:');
    console.log('   1. Check if OPENROUTER_API_KEY is correct in .env');
    console.log('   2. Verify OPENROUTER_VISION_MODEL supports images (e.g., gpt-4o, claude-3-sonnet)');
    console.log('   3. Check OpenRouter API status: https://openrouter.ai/');
    console.log('   4. Ensure the test image is a valid JPEG/PNG file');
  }
}

runAllTests().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
