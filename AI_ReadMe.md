\# 🚀 Quick Start - AI Integration Example



\## Complete Integration in 5 Minutes



\### 1. Copy Files (✓ Already Done!)



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



\### 2. Install Package



```bash

npm install @anthropic-ai/sdk

```



\### 3. Add API Key



Create `.env` in your project root:



```env

VITE\_ANTHROPIC\_API\_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

```



Get your API key: https://console.anthropic.com/



\### 4. Add to Layout (Choose One)



\*\*Admin Layout:\*\*



```tsx

// src/layouts/DashboardLayout.tsx

import { AIAssistant } from "@/ai/AIAssistant";



export default function DashboardLayout() {

&#x20; return (

&#x20;   <div style={{ display: "flex", height: "100vh" }}>

&#x20;     <aside>{/\* Sidebar \*/}</aside>

&#x20;     <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

&#x20;       <header>{/\* Topbar \*/}</header>

&#x20;       <main>

&#x20;         <Outlet />

&#x20;       </main>

&#x20;     </div>

&#x20;     

&#x20;     {/\* 👇 Add this line \*/}

&#x20;     <AIAssistant />

&#x20;   </div>

&#x20; );

}

```



\*\*Doctor Layout:\*\*



```tsx

// src/layouts/DoctorLayout.tsx

import { AIAssistant } from "@/ai/AIAssistant";



export default function DoctorLayout() {

&#x20; return (

&#x20;   <div style={{ display: "flex", height: "100vh" }}>

&#x20;     <aside>{/\* Sidebar \*/}</aside>

&#x20;     <div style={{ flex: 1 }}>

&#x20;       <header>{/\* Topbar \*/}</header>

&#x20;       <main>

&#x20;         <Outlet />

&#x20;       </main>

&#x20;     </div>

&#x20;     

&#x20;     {/\* 👇 Add this line \*/}

&#x20;     <AIAssistant />

&#x20;   </div>

&#x20; );

}

```



\### 5. Test It! 🎉



1\. Start your dev server: `npm run dev`

2\. Look for floating button (bottom-right corner)

3\. Click the ✨ sparkles icon

4\. Try these queries:



```

"Show me today's appointments"

"Find patient named Ahmed"

"What's today's revenue?"

"Send a notification to Dr. Sarah"

```



\---



\## Example Queries by Agent



\### 📅 Appointment Agent

```

\- Show today's appointments

\- What's Dr. Ahmed's schedule?

\- Send reminders to tomorrow's patients

\- Find available time slots for next week

```



\### 👥 Patient Agent

```

\- Find patient Mohammed Ali

\- Show me patient PT-00123

\- What's John's balance?

\- Get treatment history for patient 45

\- Show allergies for Sarah

```



\### 🩺 Clinical Agent

```

\- Look up root canal procedure

\- What's the code for composite filling?

\- Show me treatment plan for patient 12

\- Check drug interactions for Amoxicillin and Ibuprofen

```



\### 📊 Analytics Agent

```

\- Show dashboard statistics

\- What's this month's revenue?

\- Give me today's key metrics

\- What are the top 10 procedures?

```



\### ⚙️ Admin Agent

```

\- Send notification to Dr. Ahmed

\- Create task for inventory check

\- Show low stock items

\- Send email to all staff

```



\---



\## Troubleshooting



\### "Missing API key" Error



\*\*Problem:\*\* `.env` file not loaded



\*\*Solutions:\*\*

1\. Verify `.env` file exists in project root

2\. Check variable name: `VITE\_ANTHROPIC\_API\_KEY`

3\. Restart dev server after creating `.env`

4\. Clear browser cache



```bash

\# Verify .env

cat .env



\# Should show:

VITE\_ANTHROPIC\_API\_KEY=sk-ant-api03-...

```



\### Floating Button Not Showing



\*\*Problem:\*\* Component not imported



\*\*Solution:\*\*

```tsx

// Make sure you have this import

import { AIAssistant } from "@/ai/AIAssistant";



// And this component in your JSX

<AIAssistant />

```



\### Agent Functions Not Working



\*\*Problem:\*\* API endpoints missing



\*\*Solution:\*\* Update your `src/api.ts`:



```typescript

// Make sure these exist:

export const apiGetAppointments = (params?: any) => 

&#x20; api.get("/appointments", { params });



export const apiSearchPatients = (query: string) => 

&#x20; api.get(`/patients/search?q=${query}`);



export const apiGetPatient = (id: number) => 

&#x20; api.get(`/patients/${id}`);



// etc...

```



\### Streaming Not Working



\*\*Problem:\*\* Anthropic SDK version



\*\*Solution:\*\*

```bash

\# Update to latest version

npm install @anthropic-ai/sdk@latest

```



\---



\## Production Deployment



\### ⚠️ SECURITY WARNING



\*\*DO NOT\*\* deploy with API key in frontend!



\### Recommended Architecture:



```

Frontend (React)

&#x20;   ↓ HTTP Request

Backend API (Node.js/Python)

&#x20;   ↓ Uses Anthropic SDK

Claude AI API

```



\### Backend Proxy Example (Node.js):



```typescript

// backend/routes/ai.ts

import Anthropic from "@anthropic-ai/sdk";



const anthropic = new Anthropic({

&#x20; apiKey: process.env.ANTHROPIC\_API\_KEY // Server-side only!

});



app.post("/api/ai/chat", async (req, res) => {

&#x20; const { messages, agent } = req.body;

&#x20; 

&#x20; const response = await anthropic.messages.create({

&#x20;   model: "claude-3-5-sonnet-20241022",

&#x20;   max\_tokens: 4096,

&#x20;   messages: messages,

&#x20;   stream: true

&#x20; });

&#x20; 

&#x20; // Stream to frontend

&#x20; for await (const event of response) {

&#x20;   res.write(JSON.stringify(event) + "\\n");

&#x20; }

&#x20; res.end();

});

```



\### Update Frontend (for production):



```typescript

// src/ai/claudeService.ts



// Replace direct Anthropic call with backend proxy

export async function sendMessageToAgent(...) {

&#x20; const response = await fetch("/api/ai/chat", {

&#x20;   method: "POST",

&#x20;   headers: { "Content-Type": "application/json" },

&#x20;   body: JSON.stringify({ messages, agent: agentRole })

&#x20; });

&#x20; 

&#x20; // Process stream from backend

&#x20; const reader = response.body?.getReader();

&#x20; // ... handle streaming

}

```



\---



\## Advanced Customization



\### Add New Agent



```typescript

// src/ai/agents.ts



export const customAgent: Agent = {

&#x20; id: "custom",

&#x20; name: "Custom Agent",

&#x20; description: "Your custom agent",

&#x20; icon: YourIcon,

&#x20; color: "#your-color",

&#x20; systemPrompt: `You are a custom agent that...`,

&#x20; functions: \[

&#x20;   {

&#x20;     name: "custom\_function",

&#x20;     description: "What it does",

&#x20;     parameters: {

&#x20;       type: "object",

&#x20;       properties: {

&#x20;         param: { type: "string" }

&#x20;       }

&#x20;     },

&#x20;     handler: async (args) => {

&#x20;       // Your logic

&#x20;       return { status: "success", data: {} };

&#x20;     }

&#x20;   }

&#x20; ]

};



// Add to AGENTS object

export const AGENTS = {

&#x20; // ... existing agents

&#x20; custom: customAgent,

};

```



\### Customize UI Colors



```typescript

// src/ai/AIChat.tsx



const C = {

&#x20; teal: "#0d9e75",      // Your primary color

&#x20; border: "#e5eae8",    // Border color

&#x20; bg: "#fff",           // Background

&#x20; // ... other colors

};

```



\### Add Quick Actions



```typescript

// src/ai/claudeService.ts



export const QUICK\_ACTIONS = \[

&#x20; // ... existing actions

&#x20; {

&#x20;   id: "my-action",

&#x20;   label: "My Custom Action",

&#x20;   agent: "appointment",

&#x20;   prompt: "Do something specific"

&#x20; }

];

```



\---



\## Need Help?



1\. \*\*Read Full Documentation:\*\* `README.md` in `/ai` folder

2\. \*\*Check Anthropic Docs:\*\* https://docs.anthropic.com/

3\. \*\*Browser Console:\*\* Check for error messages

4\. \*\*Verify Setup:\*\* Run through this checklist again



\---



\*\*🎉 You're all set! Enjoy your AI-powered dental clinic!\*\*

