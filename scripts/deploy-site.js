#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function colorLog(color, message) {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

try {
  // Read .firebaserc to get site configuration
  const firebasercPath = join(projectRoot, '.firebaserc');
  
  if (!existsSync(firebasercPath)) {
    colorLog('red', '❌ .firebaserc not found! Run "npm run setup:firebase" first.');
    process.exit(1);
  }

  const firebasercContent = readFileSync(firebasercPath, 'utf8');
  const firebaserc = JSON.parse(firebasercContent);
  
  // Get project ID
  const projectId = firebaserc.projects?.default;
  if (!projectId) {
    colorLog('red', '❌ No default project found in .firebaserc');
    process.exit(1);
  }

  // Check if there are targets configured (multi-site setup)
  const targets = firebaserc.targets?.[projectId]?.hosting;
  
  if (targets) {
    // Multi-site deployment
    const siteIds = Object.keys(targets);
    if (siteIds.length === 1) {
      const siteId = siteIds[0];
      colorLog('blue', `🚀 Deploying to site: ${siteId}`);
      colorLog('gray', `   Project: ${projectId}`);
      
      // Build first
      colorLog('yellow', '📦 Building application...');
      execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });
      
      // Deploy to specific site
      colorLog('yellow', `🚀 Deploying to ${siteId}...`);
      execSync(`firebase deploy --only hosting:${siteId}`, { 
        stdio: 'inherit', 
        cwd: projectRoot 
      });
      
      colorLog('green', '✅ Deployment complete!');
    } else {
      colorLog('yellow', '⚠️  Multiple sites configured. Please specify which site to deploy to:');
      siteIds.forEach((siteId, index) => {
        console.log(`   ${index + 1}. ${siteId}`);
      });
      colorLog('gray', 'You can modify this script to handle site selection.');
    }
  } else {
    // Single-site deployment (fallback to default)
    colorLog('blue', `🚀 Deploying to default site: ${projectId}`);
    
    // Build first
    colorLog('yellow', '📦 Building application...');
    execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });
    
    // Deploy to default site
    colorLog('yellow', '🚀 Deploying...');
    execSync('firebase deploy --only hosting', { 
      stdio: 'inherit', 
      cwd: projectRoot 
    });
    
    colorLog('green', '✅ Deployment complete!');
  }

} catch (error) {
  colorLog('red', `❌ Deployment failed: ${error.message}`);
  process.exit(1);
}
