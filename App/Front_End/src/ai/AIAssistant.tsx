// ══════════════════════════════════════════════════════════════════════════════
// AI ASSISTANT INTEGRATION - Add to any layout
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { AIChat, AIFloatingButton } from "./AIChat";

/**
 * AI Assistant Integration Component
 * 
 * Add this component to your layout to enable AI assistant:
 * 
 * In DashboardLayout.tsx or DoctorLayout.tsx:
 * ```tsx
 * import { AIAssistant } from "@/ai/AIAssistant";
 * 
 * export default function DashboardLayout() {
 *   return (
 *     <div>
 *       {/* Your layout content *\/}
 *       <Outlet />
 *       
 *       {/* AI Assistant *\/}
 *       <AIAssistant />
 *     </div>
 *   );
 * }
 * ```
 */
export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AIFloatingButton onClick={() => setIsOpen(true)} />
      <AIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default AIAssistant;