# 🚀 Quick Start - AI Integration Example

## Complete Integration in 5 Minutes

### 1. Copy Files (✓ Already Done!)

Your `src/ai` folder should have:
```
src/ai/
├── types.ts              # TypeScript definitions
├── agents.ts             # 6 specialized agents
├── agentFunctions.ts     # API function handlers
├── claudeService.ts      # Claude AI service
├── AIChat.tsx            # Chat UI component
├── AIAssistant.tsx       # Integration wrapper
└── README.md             # Full documentation
```

### 2. Install Package

```bash
npm install @anthropic-ai/sdk
```

### 3. Add API Key

Create `.env` in your project root:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get your API key: https://console.anthropic.com/

### 4. Add to Layout (Choose One)

**Admin Layout:**

```tsx
// src/layouts/DashboardLayout.tsx
import { AIAssistant } from "@/ai/AIAssistant";

export default function DashboardLayout() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside>{/* Sidebar */}</aside>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header>{/* Topbar */}</header>
        <main>
          <Outlet />
        </main>
      </div>
      
      {/* 👇 Add this line */}
      <AIAssistant />
    </div>
  );
}
```

**Doctor Layout:**

```tsx
// src/layouts/DoctorLayout.tsx
import { AIAssistant } from "@/ai/AIAssistant";

export default function DoctorLayout() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside>{/* Sidebar */}</aside>
      <div style={{ flex: 1 }}>
        <header>{/* Topbar */}</header>
        <main>
          <Outlet />
        </main>
      </div>
      
      {/* 👇 Add this line */}
      <AIAssistant />
    </div>
  );
}
```

### 5. Test It! 🎉

1. Start your dev server: `npm run dev`
2. Look for floating button (bottom-right corner)
3. Click the ✨ sparkles icon
4. Try these queries:

```
"Show me today's appointments"
"Find patient named Ahmed"
"What's today's revenue?"
"Send a notification to Dr. Sarah"
```

---

## Example Queries by Agent

### 📅 Appointment Agent
```
- Show today's appointments
- What's Dr. Ahmed's schedule?
- Send reminders to tomorrow's patients
- Find available time slots for next week
```

### 👥 Patient Agent
```
- Find patient Mohammed Ali
- Show me patient PT-00123
- What's John's balance?
- Get treatment history for patient 45
- Show allergies for Sarah
```

### 🩺 Clinical Agent
```
- Look up root canal procedure
- What's the code for composite filling?
- Show me treatment plan for patient 12
- Check drug interactions for Amoxicillin and Ibuprofen
```

### 📊 Analytics Agent
```
- Show dashboard statistics
- What's this month's revenue?
- Give me today's key metrics
- What are the top 10 procedures?
```

### ⚙️ Admin Agent
```
- Send notification to Dr. Ahmed
- Create task for inventory check
- Show low stock items
- Send email to all staff
```

---

## Troubleshooting

### "Missing API key" Error

**Problem:** `.env` file not loaded

**Solutions:**
1. Verify `.env` file exists in project root
2. Check variable name: `VITE_ANTHROPIC_API_KEY`
3. Restart dev server after creating `.env`
4. Clear browser cache

```bash
# Verify .env
cat .env

# Should show:
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Floating Button Not Showing

**Problem:** Component not imported

**Solution:**
```tsx
// Make sure you have this import
import { AIAssistant } from "@/ai/AIAssistant";

// And this component in your JSX
<AIAssistant />
```

### Agent Functions Not Working

**Problem:** API endpoints missing

**Solution:** Update your `src/api.ts`:

```typescript
// Make sure these exist:
export const apiGetAppointments = (params?: any) => 
  api.get("/appointments", { params });

export const apiSearchPatients = (query: string) => 
  api.get(`/patients/search?q=${query}`);

export const apiGetPatient = (id: number) => 
  api.get(`/patients/${id}`);

// etc...
```

### Streaming Not Working

**Problem:** Anthropic SDK version

**Solution:**
```bash
# Update to latest version
npm install @anthropic-ai/sdk@latest
```

---

## Production Deployment

### ⚠️ SECURITY WARNING

**DO NOT** deploy with API key in frontend!

### Recommended Architecture:

```
Frontend (React)
    ↓ HTTP Request
Backend API (Node.js/Python)
    ↓ Uses Anthropic SDK
Claude AI API
```

### Backend Proxy Example (Node.js):

```typescript
// backend/routes/ai.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // Server-side only!
});

app.post("/api/ai/chat", async (req, res) => {
  const { messages, agent } = req.body;
  
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: messages,
    stream: true
  });
  
  // Stream to frontend
  for await (const event of response) {
    res.write(JSON.stringify(event) + "\n");
  }
  res.end();
});
```

### Update Frontend (for production):

```typescript
// src/ai/claudeService.ts

// Replace direct Anthropic call with backend proxy
export async function sendMessageToAgent(...) {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, agent: agentRole })
  });
  
  // Process stream from backend
  const reader = response.body?.getReader();
  // ... handle streaming
}
```

---

## Advanced Customization

### Add New Agent

```typescript
// src/ai/agents.ts

export const customAgent: Agent = {
  id: "custom",
  name: "Custom Agent",
  description: "Your custom agent",
  icon: YourIcon,
  color: "#your-color",
  systemPrompt: `You are a custom agent that...`,
  functions: [
    {
      name: "custom_function",
      description: "What it does",
      parameters: {
        type: "object",
        properties: {
          param: { type: "string" }
        }
      },
      handler: async (args) => {
        // Your logic
        return { status: "success", data: {} };
      }
    }
  ]
};

// Add to AGENTS object
export const AGENTS = {
  // ... existing agents
  custom: customAgent,
};
```

### Customize UI Colors

```typescript
// src/ai/AIChat.tsx

const C = {
  teal: "#0d9e75",      // Your primary color
  border: "#e5eae8",    // Border color
  bg: "#fff",           // Background
  // ... other colors
};
```

### Add Quick Actions

```typescript
// src/ai/claudeService.ts

export const QUICK_ACTIONS = [
  // ... existing actions
  {
    id: "my-action",
    label: "My Custom Action",
    agent: "appointment",
    prompt: "Do something specific"
  }
];
```

---

## Need Help?

1. **Read Full Documentation:** `README.md` in `/ai` folder
2. **Check Anthropic Docs:** https://docs.anthropic.com/
3. **Browser Console:** Check for error messages
4. **Verify Setup:** Run through this checklist again

---

**🎉 You're all set! Enjoy your AI-powered dental clinic!**