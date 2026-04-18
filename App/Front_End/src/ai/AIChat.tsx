// ══════════════════════════════════════════════════════════════════════════════
// AI CHAT INTERFACE - eALIF Agent with Markdown Support
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Zap, RefreshCw, X, Eye, EyeOff } from "lucide-react";
import { Message, AgentRole } from "./types";
import { getAllAgents, getAgent } from "./agents";
import { sendMessageToAgent, routeToAgent, QUICK_ACTIONS } from "@/ai/geminiService";
import { useAuthStore } from "@/app/store";

const C = {
  border: "#e5eae8",
  bg: "#fff",
  bgMuted: "#f7f9f8",
  text: "#111816",
  muted: "#7a918b",
  faint: "#a0b4ae",
  teal: "#0d9e75",
  tealBg: "#e8f7f2",
  tealText: "#0a7d5d",
  purple: "#8b5cf6",
  purpleBg: "#f5f3ff",
  blue: "#3b82f6",
  amber: "#f59e0b",
  red: "#e53e3e",
  redBg: "#fed7d7",
};

const GS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.msg:hover .actions{opacity:1}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.markdown-code{background:#e5eae8;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px}
.markdown-pre{background:#e5eae8;padding:8px 12px;border-radius:6px;overflow-x:auto;font-family:monospace;font-size:12px;margin:8px 0}
.markdown-table{border-collapse:collapse;width:100%;margin:8px 0;font-size:12px}
.markdown-table th,.markdown-table td{border:1px solid #e5eae8;padding:6px 8px;text-align:left}
.markdown-table th{background:#f0f2f1;font-weight:600}
.markdown-blockquote{border-left:3px solid #0d9e75;padding-left:12px;margin:8px 0;color:#7a918b}
`;

const CONFIG = {
  SHOW_ACTIONS_EXECUTED: false,
  AUTO_ROUTE_ENABLED: true,
  SHOW_AGENT_LABELS: true,
};

const getCleanAgentName = (name: string): string => {
  return name.replace(" Agent", "").replace(" Assistant", "");
};

// ══════════════════════════════════════════════════════════════════════════════
// ENHANCED MARKDOWN FORMATTER - Supports tables, blockquotes, headers, lists, code
// ══════════════════════════════════════════════════════════════════════════════

function FormattedMessage({ content }: { content: string }) {
  const formatText = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let codeLanguage = '';
    let inList = false;
    let listItems: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let tableAligns: string[] = [];
    let inBlockquote = false;
    let blockquoteContent: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} style={{ margin: "4px 0", paddingLeft: 20 }}>
            {listItems.map((item, i) => (
              <li key={i} style={{ marginBottom: 2 }}>
                <InlineFormat text={item} />
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushCodeBlock = () => {
      if (codeContent.length > 0) {
        elements.push(
          <pre key={`code-${elements.length}`} className="markdown-pre">
            <code>{codeContent.join('\n')}</code>
          </pre>
        );
        codeContent = [];
        inCodeBlock = false;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        elements.push(
          <table key={`table-${elements.length}`} className="markdown-table">
            <thead>
              <tr>
                {tableRows[0].map((cell, i) => (
                  <th key={i}>
                    <InlineFormat text={cell.trim()} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>
                      <InlineFormat text={cell.trim()} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
        tableRows = [];
        inTable = false;
      }
    };

    const flushBlockquote = () => {
      if (blockquoteContent.length > 0) {
        elements.push(
          <blockquote key={`quote-${elements.length}`} className="markdown-blockquote">
            {blockquoteContent.map((line, i) => (
              <p key={i} style={{ margin: "2px 0" }}>
                <InlineFormat text={line} />
              </p>
            ))}
          </blockquote>
        );
        blockquoteContent = [];
        inBlockquote = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block handling
      if (line.startsWith('```')) {
        flushList();
        flushTable();
        flushBlockquote();
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        } else {
          flushCodeBlock();
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Table handling (lines with |)
      if (line.includes('|') && !line.startsWith('---') && !line.startsWith('| ---')) {
        if (!inTable) {
          flushList();
          flushBlockquote();
          inTable = true;
        }
        const cells = line.split('|').filter(cell => cell.trim() !== '');
        if (cells.length > 0) {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable && line.trim() === '') {
        flushTable();
        continue;
      }

      // Blockquote handling
      if (line.startsWith('> ')) {
        if (!inBlockquote) {
          flushList();
          flushTable();
          inBlockquote = true;
        }
        blockquoteContent.push(line.slice(2));
        continue;
      } else if (inBlockquote && line.trim() === '') {
        flushBlockquote();
        continue;
      } else {
        flushBlockquote();
      }

      // Headers (# Header)
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        flushList();
        flushTable();
        const level = headerMatch[1].length;
        const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
        const fontSize = { 1: 20, 2: 18, 3: 16, 4: 14, 5: 13, 6: 12 }[level] || 14;
        elements.push(
          <HeaderTag key={`header-${elements.length}`} style={{ fontSize, fontWeight: 600, margin: "8px 0 4px", color: C.text }}>
            <InlineFormat text={headerMatch[2]} />
          </HeaderTag>
        );
        continue;
      }

      // Horizontal rule
      if (line.match(/^[-*_]{3,}$/)) {
        flushList();
        elements.push(<hr key={`hr-${elements.length}`} style={{ margin: "8px 0", border: `1px solid ${C.border}` }} />);
        continue;
      }

      // Bullet list handling
      const bulletMatch = line.match(/^([*-])\s+(.+)$/);
      if (bulletMatch) {
        if (!inList) {
          flushList();
          inList = true;
        }
        listItems.push(bulletMatch[2]);
        continue;
      } else {
        flushList();
      }

      // Numbered list
      const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
      if (numberedMatch) {
        if (!inList) {
          flushList();
          inList = true;
        }
        listItems.push(numberedMatch[1]);
        continue;
      } else {
        flushList();
      }

      // Empty line
      if (line.trim() === '') {
        elements.push(<br key={`br-${elements.length}`} />);
        continue;
      }

      // Regular paragraph with bold/italic support
      elements.push(
        <p key={`p-${elements.length}`} style={{ margin: "4px 0" }}>
          <InlineFormat text={line} />
        </p>
      );
    }

    flushList();
    flushTable();
    flushCodeBlock();
    flushBlockquote();

    return <>{elements}</>;
  };

  return <>{formatText(content)}</>;
}

// Enhanced inline formatter with more markdown features
function InlineFormat({ text }: { text: string }): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold **text** or __text__
    const boldMatch = remaining.match(/^(.*?)(?:\*\*(.+?)\*\*|__(.+?)__)(.*)/s);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(<strong key={key++}>{boldMatch[2] || boldMatch[3]}</strong>);
      remaining = boldMatch[4];
      continue;
    }

    // Italic *text* or _text_
    const italicMatch = remaining.match(/^(.*?)(?:\*([^*]+)\*|_([^_]+)_)(.*)/s);
    if (italicMatch && !italicMatch[0].startsWith('**')) {
      if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
      parts.push(<em key={key++}>{italicMatch[2] || italicMatch[3]}</em>);
      remaining = italicMatch[4];
      continue;
    }

    // Inline code `text`
    const codeMatch = remaining.match(/^(.*?)`(.+?)`(.*)/s);
    if (codeMatch) {
      if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
      parts.push(<code key={key++} className="markdown-code">{codeMatch[2]}</code>);
      remaining = codeMatch[3];
      continue;
    }

    // Strikethrough ~~text~~
    const strikeMatch = remaining.match(/^(.*?)~~(.+?)~~(.*)/s);
    if (strikeMatch) {
      if (strikeMatch[1]) parts.push(<span key={key++}>{strikeMatch[1]}</span>);
      parts.push(<del key={key++}>{strikeMatch[2]}</del>);
      remaining = strikeMatch[3];
      continue;
    }

    // Links [text](url)
    const linkMatch = remaining.match(/^(.*?)\[(.+?)\]\((.+?)\)(.*)/s);
    if (linkMatch) {
      if (linkMatch[1]) parts.push(<span key={key++}>{linkMatch[1]}</span>);
      parts.push(
        <a key={key++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer" style={{ color: C.teal }}>
          {linkMatch[2]}
        </a>
      );
      remaining = linkMatch[4];
      continue;
    }

    // No more matches
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return <>{parts}</>;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT - eALIF Agent
// ══════════════════════════════════════════════════════════════════════════════

export function AIChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `# 👋 Welcome to **eALIF Agent**

Hi **${user?.fullName?.split(" ")[0] || "there"}**! I'm your intelligent dental AI assistant.

## 🦷 What I can help you with:

| Agent | Capabilities |
| :--- | :--- |
| **Appointments** | View, schedule, send reminders, manage calendar |
| **Patients** | Search records, view history, contact management |
| **Analytics** | Revenue reports, dashboard stats, performance metrics |
| **Tasks** | Create, assign, and track tasks |

## 💡 Quick Commands:
- *"Show me today's appointments"*
- *"What's the revenue for this month?"*
- *"Find patient John Smith"*
- *"Create a task for follow-up"*

---

**What would you like to do today?** 🚀`,
      timestamp: new Date(),
      agentType: "general",
    },
  ]);
  const [input, setInput] = useState("");
  const [currentAgent, setCurrentAgent] = useState<AgentRole>("general");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const agents = getAllAgents();
  const selectedAgent = getAgent(currentAgent);
  const userName = user?.fullName || user?.username || "You";
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = '38px';
    }

    try {
      let targetAgent = currentAgent;
      if (CONFIG.AUTO_ROUTE_ENABLED) {
        targetAgent = await routeToAgent(input.trim());
        setCurrentAgent(targetAgent);
      }

      const response = await sendMessageToAgent(
        [...messages, userMessage],
        targetAgent,
        (text) => setStreamingText((prev) => prev + text)
      );

      setMessages((prev) => [...prev, response]);
      setStreamingText("");
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "❌ **Error**: I encountered an issue. Please try again in a moment.",
          timestamp: new Date(),
          agentType: currentAgent,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    setCurrentAgent(action.agent);
    setInput(action.prompt);
    setTimeout(() => handleSend(), 100);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `# ✨ Chat Cleared

How can **eALIF Agent** help you today, **${userName.split(" ")[0]}**?

Ask me about:
- 📅 Appointments
- 👥 Patient records
- 📊 Analytics & reports
- ✅ Task management`,
        timestamp: new Date(),
        agentType: "general",
      },
    ]);
    setCurrentAgent("general");
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{GS}</style>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: 520,
          height: "calc(100vh - 80px)",
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: "16px 0 0 0",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
          animation: "fadeUp .3s ease",
        }}
      >
        {/* Header - eALIF Agent Branding */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: `1px solid ${C.border}`,
            background: `linear-gradient(135deg, ${C.tealBg}, ${C.bgMuted})`,
            borderRadius: "16px 0 0 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${selectedAgent.color}, ${selectedAgent.color}cc)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 2px 10px ${selectedAgent.color}60`,
                }}
              >
                <selectedAgent.icon size={22} color="white" />
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.3 }}>
                  eALIF Agent ✨
                </p>
                <p style={{ fontSize: 11, color: C.faint, margin: "2px 0 0" }}>
                  {CONFIG.SHOW_AGENT_LABELS ? (
                    <>🧠 {getCleanAgentName(selectedAgent.name)} • {selectedAgent.description}</>
                  ) : (
                    "Intelligent Dental AI Assistant"
                  )}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={handleClearChat}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: C.muted,
                }}
                title="Clear chat"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: C.muted,
                }}
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Agent Selector */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {agents.map((agent) => {
              const Icon = agent.icon;
              const isActive = currentAgent === agent.id;
              const cleanName = getCleanAgentName(agent.name);
              return (
                <button
                  key={agent.id}
                  onClick={() => setCurrentAgent(agent.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: `1.5px solid ${isActive ? agent.color + "60" : C.border}`,
                    background: isActive ? `${agent.color}10` : C.bg,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontSize: 11,
                    fontWeight: 600,
                    color: isActive ? agent.color : C.muted,
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                  title={agent.description}
                >
                  <Icon size={12} />
                  {cleanName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const msgAgent = msg.agentType ? getAgent(msg.agentType) : null;
            const MsgIcon = msgAgent?.icon || Bot;
            const senderName = isUser ? userName : (msgAgent?.name ? getCleanAgentName(msgAgent.name) : "eALIF");

            return (
              <div
                key={msg.id}
                className="msg"
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  flexDirection: isUser ? "row-reverse" : "row",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: isUser ? "50%" : 10,
                    background: isUser ? C.teal : (msgAgent?.color ? `${msgAgent.color}15` : C.bgMuted),
                    border: `1.5px solid ${isUser ? C.teal : (msgAgent?.color ? msgAgent.color + "40" : C.border)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: isUser ? "white" : (msgAgent?.color || C.muted),
                  }}
                >
                  {isUser ? userInitial : <MsgIcon size={16} color={msgAgent?.color || C.muted} />}
                </div>

                {/* Message Content */}
                <div style={{ flex: 1, maxWidth: "80%" }}>
                  {/* Sender Name */}
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isUser ? C.teal : (msgAgent?.color || C.teal),
                    marginBottom: 4,
                    marginLeft: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                    <span>{isUser ? userName : `🤖 ${senderName}`}</span>
                    <span style={{ fontSize: 10, fontWeight: 400, color: C.faint }}>
                      {msg.timestamp.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      background: isUser ? C.tealBg : C.bgMuted,
                      border: `1px solid ${isUser ? C.teal : C.border}`,
                      borderRadius: 12,
                      padding: "10px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: C.text,
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                      }}
                    >
                      <FormattedMessage content={msg.content} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Streaming message */}
          {streamingText && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${selectedAgent.color}15`,
                  border: `1.5px solid ${selectedAgent.color}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <selectedAgent.icon size={16} color={selectedAgent.color} />
              </div>
              <div style={{ flex: 1, maxWidth: "80%" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: selectedAgent.color, marginBottom: 4, marginLeft: 4 }}>
                  🤖 eALIF • thinking...
                </div>
                <div
                  style={{
                    background: C.bgMuted,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "10px 14px",
                  }}
                >
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, wordBreak: "break-word" }}>
                    <FormattedMessage content={streamingText} />
                    <span
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 12,
                        background: C.teal,
                        marginLeft: 2,
                        animation: "pulse 1s infinite",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        {messages.length <= 1 && (
          <div style={{ padding: "0 18px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.muted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.bgMuted;
                  e.currentTarget.style.borderColor = C.teal;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.bg;
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <Sparkles size={11} />
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.border}`, background: C.bgMuted }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask eALIF Agent anything...`}
              disabled={isLoading}
              rows={1}
              style={{
                flex: 1,
                minHeight: 40,
                maxHeight: 120,
                padding: "10px 14px",
                border: `1.5px solid ${C.border}`,
                borderRadius: 20,
                background: C.bg,
                fontSize: 13,
                color: C.text,
                outline: "none",
                fontFamily: "inherit",
                resize: "none",
                overflow: "auto",
                lineHeight: 1.4,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{
                width: 40,
                height: 40,
                minHeight: 40,
                borderRadius: 20,
                background: !input.trim() || isLoading ? C.border : C.teal,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                color: "white",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,.3)",
                    borderTopColor: "white",
                    animation: "spin .7s linear infinite",
                  }}
                />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          {input.length > 0 && (
            <div style={{ fontSize: 10, color: C.faint, marginTop: 4, textAlign: "right" }}>
              ⏎ Send • ⇧⏎ New line
              {input.length > 100 && ` • ${input.length} chars`}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Floating button
export function AIFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #0d9e75, #0a7d5d)",
        border: "none",
        boxShadow: "0 6px 20px rgba(13,158,117,.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 999,
        transition: "all 0.2s ease",
        fontWeight: 700,
        fontSize: 14,
        color: "white",
        gap: 4,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(229, 37, 12, 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 1, 1, 0.4)";
      }}
    >
      <Sparkles size={22} />
    </button>
  );
}