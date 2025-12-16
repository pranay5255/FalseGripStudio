/**
 * Debug Script 3: Test Image File Reading and Data URL Construction
 * 
 * This script tests if images can be read from disk and converted to
 * the data URL format required by OpenRouter's vision API.
 * 
 * Run: npx tsx debug-image-read.ts
 */

import 'dotenv/config';
import { readFile, readdir, stat, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import mime from 'mime-types';

const DOWNLOADS_DIR = path.resolve(process.cwd(), 'downloads');

async function listDownloadsFolder(): Promise<void> {
  console.log('🔍 Scanning downloads folder...\n');
  console.log(`   Path: ${DOWNLOADS_DIR}`);

  try {
    await access(DOWNLOADS_DIR, constants.R_OK);
  } catch {
    console.log('   ❌ Downloads folder does not exist or is not readable');
    console.log('   💡 Create it with: mkdir -p downloads');
    return;
  }

  const files = await readdir(DOWNLOADS_DIR);
  
  if (files.length === 0) {
    console.log('   📭 Downloads folder is empty');
    console.log('   💡 Add a test image (jpg/png) to the downloads folder');
    return;
  }

  console.log(`\n   Found ${files.length} file(s):\n`);

  for (const file of files) {
    const filePath = path.join(DOWNLOADS_DIR, file);
    const stats = await stat(filePath);
    const mimeType = mime.lookup(file);
    const isImage = typeof mimeType === 'string' && mimeType.startsWith('image/');

    console.log(`   ${isImage ? '🖼️' : '📄'} ${file}`);
    console.log(`      Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`      MIME: ${mimeType || 'unknown'}`);
    console.log(`      Is Image: ${isImage ? 'Yes' : 'No'}`);
    console.log();
  }
}

async function testImageReading(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 Testing Image File Reading');
  console.log('='.repeat(60));

  const files = await readdir(DOWNLOADS_DIR).catch(() => []);
  const imageFiles = files.filter(f => {
    const mimeType = mime.lookup(f);
    return typeof mimeType === 'string' && mimeType.startsWith('image/');
  });

  if (imageFiles.length === 0) {
    console.log('\n❌ No image files found in downloads folder');
    return;
  }

  for (const file of imageFiles) {
    const filePath = path.join(DOWNLOADS_DIR, file);
    console.log(`\n📷 Testing: ${file}`);

    try {
      // Step 1: Read file as buffer
      const buffer = await readFile(filePath);
      console.log(`   ✅ Read ${buffer.length} bytes`);

      // Step 2: Convert to base64
      const base64Data = buffer.toString('base64');
      console.log(`   ✅ Base64 encoded: ${base64Data.length} chars`);

      // Step 3: Get MIME type
      const mimeType = mime.lookup(filePath);
      console.log(`   ✅ MIME type: ${mimeType}`);

      // Step 4: Build data URL
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      console.log(`   ✅ Data URL built: ${dataUrl.substring(0, 50)}...`);
      console.log(`   ✅ Data URL length: ${dataUrl.length} chars`);

      // Step 5: Validate data URL format
      const isValidDataUrl = dataUrl.startsWith('data:image/') && dataUrl.includes(';base64,');
      console.log(`   ${isValidDataUrl ? '✅' : '❌'} Valid data URL format: ${isValidDataUrl}`);

      // Step 6: Check if base64 is valid
      try {
        const decoded = Buffer.from(base64Data, 'base64');
        const roundTrip = decoded.length === buffer.length;
        console.log(`   ${roundTrip ? '✅' : '❌'} Base64 round-trip: ${roundTrip}`);
      } catch {
        console.log(`   ❌ Base64 decode failed`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function testMimeTypes(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 Testing MIME Type Detection');
  console.log('='.repeat(60));

  const testCases = [
    'photo.jpg',
    'image.jpeg',
    'picture.png',
    'animation.gif',
    'photo.webp',
    'document.pdf',
    'unknown.xyz'
  ];

  console.log('\n   File Extension → MIME Type:\n');
  
  for (const filename of testCases) {
    const mimeType = mime.lookup(filename);
    const icon = mimeType && String(mimeType).startsWith('image/') ? '🖼️' : '📄';
    console.log(`   ${icon} ${filename.padEnd(20)} → ${mimeType || 'not detected'}`);
  }
}

async function main(): Promise<void> {
  console.log('🔧 Debug Script 3: Image File Reading Test');
  console.log('='.repeat(60));

  await listDownloadsFolder();
  await testImageReading();
  await testMimeTypes();

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('\n   If all tests pass, image reading is working correctly.');
  console.log('   Issues here would indicate file system or encoding problems.');
  console.log('\n   Next step: Run debug-vision-api.ts to test the API call.');
}

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
