# YouLearn - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Prerequisites
Make sure you have:
- **Node.js v22+** - Check with `node --version`
- **pnpm** - Install with `npm install -g pnpm`

### Step 2: Extract & Navigate
```bash
unzip youlearn.zip
cd youlearn
```

### Step 3: Install Dependencies
```bash
pnpm install
```

### Step 4: Start Development Server
```bash
pnpm dev
```

### Step 5: Open Browser
Visit: **http://localhost:3000**

---

## 🎯 First Steps

### Try Student Portal
1. Click "Sign In"
2. Select "Student Portal"
3. Explore:
   - **Dashboard** - See your courses and progress
   - **Learning** - Take a sample quiz
   - **Performance** - View your analytics
   - **Agents** - Learn how the system works

### Try Educator Portal
1. Go back to login
2. Select "Educator Portal"
3. View:
   - **Class Overview** - Performance trends and metrics
   - **Student Performance Matrix** - Individual student data
   - **At-Risk Students** - Students needing support

---

## 📁 Key Files to Edit

| File | Purpose |
|------|---------|
| `client/src/data/mockData.ts` | Change student/course data |
| `client/src/pages/` | Edit page content |
| `client/src/index.css` | Modify global styles |
| `client/src/agents/` | Add backend integration |

---

## 🛠️ Common Commands

```bash
pnpm dev        # Start development server
pnpm build      # Create production build
pnpm check      # Check TypeScript errors
pnpm format     # Format code
```

---

## 📚 Project Structure

```
client/src/
├── pages/          # Landing, Login, Dashboard, etc.
├── components/     # Reusable UI components
├── agents/         # Agent logic (StudentAgent, etc.)
├── data/           # Mock data
├── layouts/        # MainLayout wrapper
├── types/          # TypeScript definitions
└── App.tsx         # Main app with routing
```

---

## 🔗 Connecting to Backend

Replace mock data in `client/src/agents/` with API calls:

```typescript
// StudentAgent.ts
async getStudentProfile(studentId: string) {
  const response = await fetch(`/api/students/${studentId}`);
  return response.json();
}
```

---

## ❓ Need Help?

- **TypeScript errors?** Run `pnpm check`
- **Port in use?** Vite will use next available port
- **Changes not showing?** Clear cache and restart dev server
- **Full docs?** See `SETUP_INSTRUCTIONS.md`

---

**Ready to build? Start with `pnpm dev` 🎉**
