# YouLearn - Setup Instructions

## Prerequisites

Before setting up YouLearn, ensure you have the following installed on your system:

- **Node.js** (v22.13.0 or higher) - [Download](https://nodejs.org/)
- **pnpm** (v10.4.1 or higher) - Install globally with: `npm install -g pnpm`
- **VS Code** - [Download](https://code.visualstudio.com/)

## Installation Steps

### 1. Extract the Project

Unzip the `youlearn.zip` file to your desired location:

```bash
unzip youlearn.zip
cd youlearn
```

### 2. Open in VS Code

```bash
code .
```

Or open VS Code and use `File > Open Folder` to select the `youlearn` directory.

### 3. Install Dependencies

Open the integrated terminal in VS Code (`Ctrl + ~` or `View > Terminal`) and run:

```bash
pnpm install
```

This will install all required packages listed in `package.json`.

### 4. Start Development Server

In the terminal, run:

```bash
pnpm dev
```

You should see output like:
```
➜  Local:   http://localhost:3000/
➜  Network: http://169.254.0.21:3000/
```

### 5. Open in Browser

Navigate to `http://localhost:3000/` in your web browser.

## Project Structure

```
youlearn/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── agents/        # Agent logic files
│   │   ├── data/          # Mock data
│   │   ├── layouts/       # Layout components
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   └── index.css      # Global styles
│   ├── public/            # Static files
│   └── index.html         # HTML entry point
├── server/                # Express server (placeholder)
├── package.json           # Dependencies
├── pnpm-lock.yaml         # Dependency lock file
└── README.md              # Project documentation
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm check` | Run TypeScript type checking |
| `pnpm format` | Format code with Prettier |

## Using the Application

### Login

1. Navigate to `http://localhost:3000/`
2. Click "Sign In" or "Get Started"
3. Choose your role:
   - **Student Portal** - Access student dashboard, courses, and performance tracking
   - **Educator Portal** - View class analytics and student monitoring

### Student Features

- **Dashboard**: View your courses, progress, and notifications
- **Learning**: Access course content and take quizzes
- **Performance**: Track your scores and view personalized recommendations
- **Agents**: Learn how the system works

### Educator Features

- **Dashboard**: View class analytics, performance trends, and at-risk students
- **Student Performance Matrix**: Monitor individual student metrics
- **Course Statistics**: See completion and performance data by course

## Development Tips

### Hot Module Replacement (HMR)

Changes to your code automatically reload in the browser. Just save your file and the browser will update instantly.

### TypeScript

The project uses TypeScript for type safety. Run `pnpm check` to verify types:

```bash
pnpm check
```

### Debugging

1. Open DevTools in your browser (`F12` or `Ctrl + Shift + I`)
2. Use the Console tab for error messages
3. Use the Network tab to inspect API calls
4. Use the React DevTools extension for component inspection

## Customizing the Project

### Adding New Pages

1. Create a new file in `client/src/pages/`
2. Import it in `client/src/App.tsx`
3. Add a new route:

```tsx
<Route path="/your-page" component={YourPage} />
```

### Modifying Mock Data

Edit `client/src/data/mockData.ts` to change student information, courses, or other data.

### Updating Styles

Global styles are in `client/src/index.css`. Component styles use Tailwind CSS classes.

### Implementing Backend Integration

Replace mock data functions in `client/src/agents/` with actual API calls:

```typescript
// Before (mock)
return mockData;

// After (API)
const response = await fetch('/api/endpoint');
return response.json();
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, Vite will automatically use the next available port. Check the terminal output for the correct URL.

### Dependencies Not Installing

Clear the cache and reinstall:

```bash
pnpm store prune
pnpm install
```

### TypeScript Errors

Ensure you're using the correct Node.js version:

```bash
node --version  # Should be v22.13.0 or higher
```

### Changes Not Reflecting

1. Clear browser cache (`Ctrl + Shift + Delete`)
2. Stop the dev server (`Ctrl + C`)
3. Run `pnpm dev` again

## Building for Production

To create a production build:

```bash
pnpm build
```

This generates optimized files in the `dist/` folder. You can preview it with:

```bash
pnpm preview
```

## Next Steps

1. **Explore the codebase** - Familiarize yourself with the component structure
2. **Customize mock data** - Replace with your own student/course data
3. **Connect to backend** - Replace mock functions with API calls
4. **Deploy** - Use services like Vercel, Netlify, or your own server

## Support & Documentation

- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript**: https://www.typescriptlang.org

## Project Details

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Routing**: Wouter
- **Charts**: Recharts
- **Icons**: Lucide React

---

**Happy coding! 🚀**
