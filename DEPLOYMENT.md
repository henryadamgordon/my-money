# 🚀 Firebase Deployment Guide

This guide shows the **modern, best-practice approach** for deploying the My Money SvelteKit app to Firebase Hosting with **multi-site support**.

## 📋 Prerequisites

1. **Firebase CLI installed globally:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project created** at [Firebase Console](https://console.firebase.google.com)
   - Enable **Firestore Database** for data storage
   - Enable **Authentication** (Email/Password provider recommended)
   - Enable **Hosting** for web deployment

3. **Firebase CLI authenticated:**
   ```bash
   firebase login
   ```

4. **Environment variables configured** in `.env` file:
   ```env
   PUBLIC_FIREBASE_API_KEY=your_api_key
   PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
   
   > 💡 **Tip**: Get these values from Firebase Console → Project Settings → General → Your apps

## 🔧 Initial Setup (One-time)

### 1. Interactive Firebase Setup (Recommended)

Run the interactive setup script that will configure everything automatically:

```bash
npm run setup:firebase
```

This intelligent script will:
- ✅ Create `.firebaserc` from sample file if needed
- ✅ Create `firebase.json` from sample file if needed
- ✅ Prompt you for your Firebase project ID with validation
- ✅ Ask for hosting site ID (for projects with multiple sites)
- ✅ Update both `.firebaserc` and `firebase.json` with proper configuration
- ✅ Handle single-site and multi-site deployments automatically
- ✅ Validate project ID format and provide guidance
- ✅ Check your environment configuration
- ✅ Provide clear next steps

#### Multi-Site Support

The setup script automatically detects and configures:

**Single Site Setup** (Default):
- Uses project ID as site ID
- Standard Firebase hosting configuration
- Deploys to `https://project-id.web.app`

**Multi-Site Setup** (Advanced):
- Prompts for specific site ID
- Configures targets in `.firebaserc`
- Updates `firebase.json` with correct target
- Deploys to `https://site-id.web.app`

### 2. Manual Setup (Alternative)

If you prefer manual setup:

1. **Copy configuration files:**
   ```bash
   cp .firebaserc.sample .firebaserc
   cp firebase.json.sample firebase.json
   ```

2. **Edit `.firebaserc`** and replace `your-firebase-project-id` with your actual project ID:
   ```json
   {
     "projects": {
       "default": "your-actual-project-id"
     }
   }
   ```

3. **Edit `firebase.json`** and replace `SITE_ID_PLACEHOLDER` with your site ID:
   ```json
   {
     "hosting": [
       {
         "target": "your-site-id",
         "public": "build",
         // ... rest of configuration
       }
     ]
   }
   ```

4. **For multi-site projects**, add targets configuration to `.firebaserc`:
   ```json
   {
     "projects": {
       "default": "your-project-id"
     },
     "targets": {
       "your-project-id": {
         "hosting": {
           "your-site-id": ["your-site-id"]
         }
       }
     }
   }
   ```

### 3. Firestore Security Rules Setup

For the My Money app to work properly, you need to configure Firestore security rules:

1. **Navigate to Firebase Console** → Firestore Database → Rules
2. **Update the rules** to allow authenticated users to access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Budget items - user can only access their own
    match /budgetItems/{document} {
      allow read, write, create, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Categories - user can only access their own
    match /categories/{document} {
      allow read, write, create, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Transactions - user can only access their own
    match /transactions/{document} {
      allow read, write, create, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. **Publish the rules** to apply them to your database

## 🚀 Deployment Commands

### **Option 1: Smart Multi-Site Deployment (Recommended)**
Intelligently detects your configuration and deploys to the correct site:
```bash
npm run deploy:site
```

This command:
- 🔍 Reads your `.firebaserc` configuration
- 🎯 Automatically detects single-site vs multi-site setup
- 🏗️ Builds the app (`npm run build`)
- 🚀 Deploys to the correct Firebase hosting site
- ✅ Provides clear feedback about deployment target

### **Option 2: Full Deployment**
Builds and deploys everything (hosting + Firestore rules if configured):
```bash
npm run deploy
```

### **Option 3: Hosting Only**
Deploys only the built static files:
```bash
npm run deploy:hosting
```

### **Option 4: Manual Process**
For full control over the deployment process:
```bash
# Build the app
npm run build

# Deploy to Firebase (single-site)
firebase deploy --only hosting

# Deploy to Firebase (multi-site)
firebase deploy --only hosting:your-site-id
```

### **Development Deployment**
For testing purposes, you can deploy to a preview channel:
```bash
# Build first
npm run build

# Deploy to preview
firebase hosting:channel:deploy preview
```

## 📁 Project Structure

```
my-money/
├── firebase.json.sample   # Firebase hosting configuration template
├── firebase.json          # Firebase hosting configuration (gitignored)
├── .firebaserc.sample     # Firebase project configuration template
├── .firebaserc            # Firebase project configuration (gitignored)
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore database indexes
├── scripts/
│   ├── setup-firebase.js  # Interactive Firebase setup script
│   └── deploy-site.js     # Multi-site deployment script
├── build/                 # Generated static files (auto-created)
├── src/                   # Source code
│   ├── lib/
│   │   ├── components/    # Reusable UI components
│   │   ├── services/      # Firebase service layers
│   │   ├── stores/        # Svelte stores
│   │   ├── types/         # TypeScript interfaces
│   │   └── firebase.ts    # Firebase configuration
│   └── routes/            # SvelteKit routes
└── .env                   # Environment variables (gitignored)
```

## ⚙️ Configuration Details

### **Firebase Hosting Configuration**

The `firebase.json` file includes optimized settings for SvelteKit:

- **SPA Routing**: All routes redirect to `index.html` for client-side routing
- **Multi-Site Support**: Uses target-based configuration for multiple hosting sites
- **Optimized Caching Headers**: 
  - Static assets (JS/CSS/MJS): 1 year cache with immutable flag
  - Images/Fonts: 1 year cache with immutable flag
  - HTML/JSON: 1 hour cache for faster content updates
  - Service Worker: No cache for immediate updates

### **Multi-Site Configuration Examples**

**Single Site Setup:**
```json
// .firebaserc
{
  "projects": {
    "default": "my-money-app"
  }
}

// firebase.json
{
  "hosting": [{
    "target": "my-money-app",
    "public": "build",
    // ... configuration
  }]
}
```

**Multi-Site Setup:**
```json
// .firebaserc
{
  "projects": {
    "default": "my-company"
  },
  "targets": {
    "my-company": {
      "hosting": {
        "my-money-prod": ["my-money-prod"],
        "my-money-staging": ["my-money-staging"]
      }
    }
  }
}

// firebase.json
{
  "hosting": [{
    "target": "my-money-prod",
    "public": "build",
    // ... configuration
  }]
}
```
  - Service Worker: No cache for immediate updates
- **Clean URLs**: Removes `.html` extensions
- **Firestore Integration**: Rules and indexes deployment

### **SvelteKit Configuration**

The `svelte.config.js` uses:
- `@sveltejs/adapter-static`: Generates static files for Firebase Hosting
- `fallback: 'index.html'`: Enables SPA routing for all routes

## 🔍 Troubleshooting

### **Common Issues:**

1. **Build fails**: Check that all dependencies are installed with `npm install`
2. **404 errors**: Ensure `fallback: 'index.html'` is set in `svelte.config.js`
3. **Auth issues**: Verify environment variables are correctly set
4. **Firestore permission errors**: Check that `firestore.rules` are properly configured

### **Verification Steps:**

1. **Test locally**: `npm run preview` after building
2. **Check Firebase project**: Ensure project ID matches in `.firebaserc`
3. **Verify build output**: Check that `build/` directory contains `index.html`

## 🌟 Benefits of This Approach

- ✅ **Industry Standard**: Follows SvelteKit and Firebase best practices
- ✅ **Interactive Setup**: Guided configuration with `npm run setup:firebase`
- ✅ **Automated**: Single command deployment with `npm run deploy`
- ✅ **Optimized**: Proper caching strategies for performance
- ✅ **Maintainable**: Configuration at project root, not in build folder
- ✅ **Clone-and-Deploy Ready**: Easy for others to clone and deploy
- ✅ **Error Handling**: Custom 404 page with automatic dashboard redirect
- ✅ **User-Friendly**: No manual file editing required

## 🔗 Useful Commands

```bash
# View deployment status
firebase hosting:channel:list

# Deploy to preview channel
firebase hosting:channel:deploy preview

# View logs
firebase functions:log

# Local emulator (if using functions)
firebase emulators:start
```

---

**Happy Deploying! 🎉**

This setup ensures your SvelteKit app deploys seamlessly to Firebase Hosting with optimal performance and maintainability.
