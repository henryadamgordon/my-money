#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createReadlineInterface() {
  return createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function question(rl, query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupFirebaseProject() {
  const rl = createReadlineInterface();
  
  try {
    colorLog('cyan', '\n🚀 Firebase Project Setup for My Money App\n');
    colorLog('yellow', 'This script will configure your Firebase project for deployment.\n');

    // Check if .firebaserc exists and read current project ID
    const firebasercPath = join(projectRoot, '.firebaserc');
    const firebasercSamplePath = join(projectRoot, '.firebaserc.sample');
    const firebaseJsonPath = join(projectRoot, 'firebase.json');
    const firebaseJsonSamplePath = join(projectRoot, 'firebase.json.sample');

    // Check if .firebaserc exists, if not create from sample
    if (!existsSync(firebasercPath)) {
      if (existsSync(firebasercSamplePath)) {
        console.log('📋 Creating .firebaserc from sample file...');
        copyFileSync(firebasercSamplePath, firebasercPath);
        console.log('✅ .firebaserc created from sample');
      } else {
        console.log('❌ Neither .firebaserc nor .firebaserc.sample found!');
        console.log('Please make sure you have a .firebaserc.sample file in your project root.');
        process.exit(1);
      }
    }

    // Check if firebase.json exists, if not create from sample
    if (!existsSync(firebaseJsonPath)) {
      if (existsSync(firebaseJsonSamplePath)) {
        console.log('📋 Creating firebase.json from sample file...');
        copyFileSync(firebaseJsonSamplePath, firebaseJsonPath);
        console.log('✅ firebase.json created from sample');
      } else {
        console.log('❌ Neither firebase.json nor firebase.json.sample found!');
        console.log('Please make sure you have a firebase.json.sample file in your project root.');
        process.exit(1);
      }
    }

    let currentProjectId = 'your-firebase-project-id';
    
    try {
      const firebasercContent = readFileSync(firebasercPath, 'utf8');
      const firebaserc = JSON.parse(firebasercContent);
      currentProjectId = firebaserc.projects?.default || 'your-firebase-project-id';
    } catch (error) {
      colorLog('yellow', 'Warning: Could not read existing .firebaserc file');
    }

    if (currentProjectId !== 'your-firebase-project-id') {
      colorLog('green', `Current Firebase project: ${currentProjectId}`);
      const useExisting = await question(rl, 'Do you want to keep this project? (y/n): ');
      if (useExisting.toLowerCase() === 'y' || useExisting.toLowerCase() === 'yes') {
        colorLog('green', '✅ Keeping existing Firebase project configuration');
        rl.close();
        return;
      }
    }

    colorLog('blue', '\n📋 Please provide your Firebase project information:');
    colorLog('gray', '   (You can find this in your Firebase Console at https://console.firebase.google.com)\n');

    // Get project ID from user
    const projectId = await question(rl, `Enter your Firebase project ID [${currentProjectId}]: `);
    const finalProjectId = projectId.trim() || currentProjectId;

    // Validate project ID format
    const projectIdRegex = /^[a-z0-9-]+$/;
    if (!projectIdRegex.test(finalProjectId)) {
      colorLog('red', '❌ Invalid project ID format!');
      colorLog('yellow', 'Project IDs must contain only lowercase letters, numbers, and hyphens.');
      process.exit(1);
    }

    // Ask about hosting site (for projects with multiple sites)
    console.log('\n📍 Firebase Hosting Site Configuration');
    console.log('If your Firebase project has multiple hosting sites, you can specify which one to use.');
    console.log('Leave empty to use the default site (same as project ID).');
    
    const siteId = await question(rl, `Enter hosting site ID (optional) [${finalProjectId}]: `);
    const finalSiteId = siteId.trim() || finalProjectId;

    // Update .firebaserc with project and optional site
    const firebasercConfig = {
      projects: {
        default: finalProjectId
      }
    };

    // Add site configuration if different from project ID
    if (finalSiteId !== finalProjectId) {
      firebasercConfig.targets = {
        [finalProjectId]: {
          hosting: {
            [finalSiteId]: [finalSiteId]
          }
        }
      };
    }

    try {
      writeFileSync(firebasercPath, JSON.stringify(firebasercConfig, null, 2));
      colorLog('green', `✅ Updated .firebaserc with project ID: ${finalProjectId}`);
      if (finalSiteId !== finalProjectId) {
        colorLog('green', `✅ Configured hosting site: ${finalSiteId}`);
      }
    } catch (error) {
      colorLog('red', `❌ Failed to update .firebaserc: ${error.message}`);
      rl.close();
      return;
    }

    // Update firebase.json with site configuration
    try {
      const firebaseJsonContent = readFileSync(firebaseJsonPath, 'utf8');
      const firebaseJson = JSON.parse(firebaseJsonContent);
      
      // Update the target in firebase.json if it's a multi-site setup
      if (finalSiteId !== finalProjectId && firebaseJson.hosting && Array.isArray(firebaseJson.hosting)) {
        firebaseJson.hosting[0].target = finalSiteId;
        writeFileSync(firebaseJsonPath, JSON.stringify(firebaseJson, null, 2));
        colorLog('green', `✅ Updated firebase.json with site target: ${finalSiteId}`);
      } else if (finalSiteId !== finalProjectId) {
        // Handle case where firebase.json might have old format
        const updatedContent = firebaseJsonContent.replace(
          /"target":\s*"[^"]*"/,
          `"target": "${finalSiteId}"`
        ).replace(
          /"SITE_ID_PLACEHOLDER"/g,
          `"${finalSiteId}"`
        );
        writeFileSync(firebaseJsonPath, updatedContent);
        colorLog('green', `✅ Updated firebase.json with site target: ${finalSiteId}`);
      } else {
        // For single-site setup, replace placeholder with site ID
        const updatedContent = firebaseJsonContent.replace(
          /"SITE_ID_PLACEHOLDER"/g,
          `"${finalSiteId}"`
        );
        writeFileSync(firebaseJsonPath, updatedContent);
        colorLog('green', `✅ Updated firebase.json configuration`);
      }
    } catch (error) {
      colorLog('red', `❌ Failed to update firebase.json: ${error.message}`);
      colorLog('yellow', 'You may need to manually update firebase.json with the correct site target.');
    }

    // Check if environment file exists and provide guidance
    const envPath = join(projectRoot, '.env');
    if (!existsSync(envPath)) {
      colorLog('yellow', '\n⚠️  Environment file (.env) not found!');
      colorLog('blue', '\n📝 Next steps:');
      colorLog('white', '   1. Create a .env file in your project root');
      colorLog('white', '   2. Add your Firebase configuration variables:');
      colorLog('gray', '\n      PUBLIC_FIREBASE_API_KEY=your_api_key');
      colorLog('gray', '      PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com');
      colorLog('gray', '      PUBLIC_FIREBASE_PROJECT_ID=' + finalProjectId);
      colorLog('gray', '      PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com');
      colorLog('gray', '      PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id');
      colorLog('gray', '      PUBLIC_FIREBASE_APP_ID=your_app_id\n');
      colorLog('blue', '   3. Get these values from: Firebase Console > Project Settings > General > Your apps');
    } else {
      // Check if PROJECT_ID in .env matches
      try {
        const envContent = readFileSync(envPath, 'utf8');
        if (envContent.includes('PUBLIC_FIREBASE_PROJECT_ID=')) {
          const projectIdMatch = envContent.match(/PUBLIC_FIREBASE_PROJECT_ID=(.+)/);
          if (projectIdMatch && projectIdMatch[1].trim() !== finalProjectId) {
            colorLog('yellow', `\n⚠️  Your .env file has a different project ID: ${projectIdMatch[1].trim()}`);
            colorLog('blue', `   Consider updating PUBLIC_FIREBASE_PROJECT_ID to: ${finalProjectId}`);
          }
        }
      } catch (error) {
        colorLog('yellow', '⚠️  Could not read .env file to verify project ID');
      }
    }

    colorLog('green', '\n🎉 Firebase project setup complete!');
    colorLog('blue', '\n🚀 Ready to deploy:');
    colorLog('white', '   npm run deploy          # Full deployment');
    colorLog('white', '   npm run deploy:hosting  # Hosting only');
    colorLog('gray', '\n💡 Make sure you\'re logged in to Firebase CLI: firebase login\n');

  } catch (error) {
    colorLog('red', `❌ Setup failed: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run the setup
setupFirebaseProject().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});
