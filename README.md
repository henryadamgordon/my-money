# My Money 💰

A comprehensive personal finance management application built with SvelteKit and Firebase. Track your budget, manage transactions, visualize spending patterns, and gain insights into your financial health.

## ✨ Features

### 📊 **Dashboard & Analytics**
- Interactive pie charts showing income and expense breakdowns by category
- Real-time summary cards with total income, expenses, and net balance
- Visual insights with Chart.js integration
- Responsive design for mobile and desktop

### 💳 **Budget Management**
- Create and manage budget items (income, expenses, savings)
- Categorize transactions with custom colors and icons
- Set recurring items with due dates or one-time payments
- Advanced filtering and sorting capabilities
- Pagination for large datasets
- Excel import functionality for bulk data entry

### 📈 **Transaction Tracking**
- Comprehensive transaction management system
- Track both income and expenses in one place
- Category-based organization
- Date-based filtering and reporting
- Real-time balance calculations

### 📋 **Category Management**
- Create custom categories with colors and emoji icons
- Default categories for quick setup
- Category-based filtering and reporting
- Visual category indicators throughout the app

### 📊 **Reports & Analysis**
- Budget vs. actual spending comparison
- Interactive bar charts and detailed tables
- Progress tracking with visual indicators
- Category-wise spending analysis
- Export capabilities for further analysis

### 🔐 **Security & Data**
- Firebase Authentication integration
- User-scoped data isolation
- Secure Firestore database
- Real-time data synchronization
- Offline capability support

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-money
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Firebase (Interactive)**
   ```bash
   npm run setup:firebase
   ```
   This interactive script will:
   - ✅ Create configuration files from templates
   - ✅ Prompt for your Firebase project ID
   - ✅ Handle multi-site hosting setup
   - ✅ Configure both `.firebaserc` and `firebase.json`
   - ✅ Validate configuration and provide guidance

4. **Configure environment variables**
   Create a `.env` file with your Firebase configuration:
   ```env
   PUBLIC_FIREBASE_API_KEY=your_api_key
   PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Deploy to Firebase**
   ```bash
   npm run deploy:site
   ```

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## 🛠️ Tech Stack

- **Frontend**: SvelteKit 5 with TypeScript
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Charts**: Chart.js for data visualization
- **Styling**: Custom CSS with responsive design
- **Build**: Vite with SvelteKit adapter
- **Deployment**: Firebase Hosting with multi-site support

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── budget/         # Budget management components
│   │   ├── reports/        # Reporting and analytics components
│   │   └── dashboard/      # Dashboard widgets
│   ├── services/           # Firebase service layers
│   │   ├── budgetService.ts
│   │   ├── categoryService.ts
│   │   └── transactionService.ts
│   ├── stores/             # Svelte stores for state management
│   ├── types/              # TypeScript interfaces
│   └── firebase.ts         # Firebase configuration
├── routes/                 # SvelteKit routes
│   ├── dashboard/          # Dashboard page
│   ├── budget/            # Budget management page
│   ├── transactions/      # Transaction management page
│   └── reports/           # Reports and analytics page
scripts/
├── setup-firebase.js      # Interactive Firebase setup
└── deploy-site.js         # Multi-site deployment script
```

## 🚀 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev -- --open    # Start dev server and open browser

# Building
npm run build           # Create production build
npm run preview         # Preview production build

# Firebase Setup & Deployment
npm run setup:firebase  # Interactive Firebase configuration
npm run deploy          # Full deployment (build + deploy)
npm run deploy:site     # Smart multi-site deployment
npm run deploy:hosting  # Hosting only deployment

# Utilities
npm run check           # Run type checking
npm run lint            # Run linting
```

### Development Workflow

1. **Setup**: Run `npm run setup:firebase` once for initial configuration
2. **Develop**: Use `npm run dev` for local development with hot reload
3. **Test**: Build and preview with `npm run build && npm run preview`
4. **Deploy**: Use `npm run deploy:site` for production deployment

## 🔧 Configuration

### Firebase Multi-Site Support

This project supports Firebase multi-site hosting configurations:

- **Single Site**: Default setup using project ID as site ID
- **Multi-Site**: Specify different site ID for projects with multiple hosting sites
- **Automatic Configuration**: Setup script handles both `.firebaserc` and `firebase.json`
- **Security**: Configuration files are gitignored, only templates are committed

### Environment Variables

Required environment variables (create `.env` file):

```env
PUBLIC_FIREBASE_API_KEY=your_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 📊 Features in Detail

### Budget Management
- **CRUD Operations**: Create, read, update, delete budget items
- **Categories**: Organize items with custom categories and colors
- **Recurring Items**: Set monthly recurring expenses with due dates
- **One-time Items**: Track specific date-based transactions
- **Filtering**: Advanced filters by type, category, owner, payment method
- **Sorting**: Sort by any column with persistent state
- **Pagination**: Handle large datasets efficiently
- **Excel Import**: Bulk import from Excel files with validation

### Analytics & Reporting
- **Dashboard Widgets**: Real-time summary cards and pie charts
- **Budget vs Actual**: Compare planned vs actual spending
- **Category Analysis**: Breakdown by category with progress indicators
- **Visual Charts**: Interactive Chart.js visualizations
- **Export Options**: Data export for external analysis

### User Experience
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Persistent State**: Table filters and pagination remembered
- **Loading States**: Smooth loading indicators
- **Error Handling**: Comprehensive error messages and recovery
- **Accessibility**: ARIA labels and keyboard navigation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md)
For feature requests or bugs, please open an issue on GitHub.
