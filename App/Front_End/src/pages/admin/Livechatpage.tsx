// ══════════════════════════════════════════════════════════════════════════════
// LIVE CHAT PAGE
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tantml:react-query";
import { MessageCircle, Send, User, Clock, CheckCheck, Paperclip, Search, X, Circle } from "lucide-react";
import { apiGetConversations, apiGetMessages, apiSendMessage, apiMarkAsRead } from "@/api/chat";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = { border: "#e5eae8", bg: "#fff", bgMuted: "#f7f9f8", text: "#111816", muted: "#7a918b", faint: "#a0b4ae", teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc", amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a", red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7", blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe", purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6", purpleBorder: "#ddd6fe", gray: "#6b7f75", grayBg: "#f4f7f5" };
const IS: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", border: `1.5px solid ${C.border}`, borderRadius: 9, background: C.bg, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const GS = `@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.conv-item:hover{background:${C.bgMuted}!important}.pulse{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`;

// ── Shared atoms ──────────────────────────────────────────────────────────────
function Avi({ name, size = 28, online }: { name: string; size?: number; online?: boolean }) { const p = ["linear-gradient(135deg,#0d9e75,#0a7d5d)", "linear-gradient(135deg,#3b82f6,#1d4ed8)", "linear-gradient(135deg,#8b5cf6,#5b21b6)", "linear-gradient(135deg,#f59e0b,#92400e)"]; return <div style={{ position: "relative" }}><div style={{ width: size, height: size, borderRadius: "50%", background: p[(name?.charCodeAt(0) ?? 0) % p.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * .35, fontWeight: 700, color: "white", flexShrink: 0 }}>{(name ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}</div>{online && <div style={{ position: "absolute", bottom: 0, right: 0, width: size * .3, height: size * .3, borderRadius: "50%", background: C.teal, border: `2px solid ${C.bg}` }} />}</div>; }

export function LiveChatPage() {
    const qc = useQueryClient(); const user = useAuthStore(s => s.user);
    const [selectedConv, setSelectedConv] = useState<any>(null); const [message, setMessage] = useState(""); const [search, setSearch] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { data: convData } = useQuery({ queryKey: ["conversations"], queryFn: () => apiGetConversations(), refetchInterval: 3000 });
    const { data: msgData } = useQuery({ queryKey: ["messages", selectedConv?.id], queryFn: () => selectedConv ? apiGetMessages(selectedConv.id) : null, enabled: !!selectedConv, refetchInterval: 2000 });
    const conversations: any[] = convData?.data ?? convData ?? []; const messages: any[] = msgData?.data ?? msgData ?? [];

    const sendMut = useMutation({ mutationFn: ({ convId, text }: any) => apiSendMessage(convId, { text, senderId: user?.id }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["messages"] }); setMessage(""); }, onError: () => toast.error("Failed to send") });
    const markReadMut = useMutation({ mutationFn: apiMarkAsRead, onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }) });

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
    useEffect(() => { if (selectedConv && selectedConv.unread_count > 0) markReadMut.mutate(selectedConv.id); }, [selectedConv]);

    const handleSend = () => { if (!message.trim() || !selectedConv) return; sendMut.mutate({ convId: selectedConv.id, text: message.trim() }); };
    const formatTime = (ts: string) => { const d = new Date(ts); const now = new Date(); const diff = Math.floor((now.getTime() - d.getTime()) / 1000); if (diff < 60) return "Just now"; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };

    const filteredConv = conversations.filter(c => !search || c.participant_name?.toLowerCase().includes(search.toLowerCase()));

    return (<>
        <style>{GS}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, animation: "fadeUp .4s ease both", height: "calc(100vh - 140px)" }}>
            <div style={{ marginBottom: 16 }}><h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>Live Chat</h1><p style={{ fontSize: 13, color: C.faint, marginTop: 2 }}>{conversations.length} conversations · {conversations.filter(c => c.unread_count > 0).length} unread</p></div>

            <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 0, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", flex: 1 }}>
                {/* Conversations list */}
                <div style={{ borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ position: "relative" }}>
                            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…" className="inp" style={{ ...IS, paddingLeft: 30, height: 34, fontSize: 12 }} />
                            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint, display: "flex" }}><X size={13} /></button>}
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {filteredConv.length === 0 ? <div style={{ padding: "40px 18px", textAlign: "center" }}><MessageCircle size={24} color={C.border} style={{ margin: "0 auto 8px", display: "block" }} /><p style={{ fontSize: 12, color: C.faint }}>No conversations</p></div> : filteredConv.map(conv => (
                            <div key={conv.id} className="conv-item" onClick={() => setSelectedConv(conv)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", background: selectedConv?.id === conv.id ? C.bgMuted : "transparent", borderBottom: `1px solid ${C.border}`, transition: "background .1s" }}>
                                <Avi name={conv.participant_name ?? "?"} size={40} online={conv.is_online} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.participant_name}</p>
                                        <span style={{ fontSize: 10, color: C.faint }}>{formatTime(conv.last_message_at)}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <p style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{conv.last_message}</p>
                                        {conv.unread_count > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 100, background: C.teal, color: "white", minWidth: 18, textAlign: "center" }}>{conv.unread_count}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat area */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {selectedConv ? <>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
                            <Avi name={selectedConv.participant_name} size={36} online={selectedConv.is_online} />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedConv.participant_name}</p>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <Circle size={7} color={selectedConv.is_online ? C.teal : C.gray} fill={selectedConv.is_online ? C.teal : C.gray} />
                                    <span style={{ fontSize: 11, color: C.faint }}>{selectedConv.is_online ? "Online" : "Offline"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                            {messages.map((msg: any, i: number) => {
                                const isMe = msg.sender_id === user?.id; const showAvatar = i === 0 || messages[i - 1]?.sender_id !== msg.sender_id;
                                return <div key={msg.id} style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isMe ? "row-reverse" : "row" }}>
                                    {showAvatar ? <Avi name={isMe ? user.full_name : selectedConv.participant_name} size={28} /> : <div style={{ width: 28 }} />}
                                    <div style={{ maxWidth: "70%" }}>
                                        <div style={{ padding: "8px 12px", borderRadius: 12, background: isMe ? C.teal : C.bgMuted, border: `1px solid ${isMe ? C.tealBorder : C.border}` }}>
                                            <p style={{ fontSize: 13, color: isMe ? "white" : C.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{msg.text}</p>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                                            <span style={{ fontSize: 10, color: C.faint }}>{formatTime(msg.created_at)}</span>
                                            {isMe && msg.is_read && <CheckCheck size={11} color={C.teal} />}
                                        </div>
                                    </div>
                                </div>;
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.border}`, background: C.bgMuted }}>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}><Paperclip size={16} /></button>
                                <input value={message} onChange={e => setMessage(e.target.value)} onKeyPress={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Type a message…" className="inp" style={{ ...IS, flex: 1 }} />
                                <button onClick={handleSend} disabled={!message.trim() || sendMut.isPending} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 36, borderRadius: 8, background: !message.trim() || sendMut.isPending ? "#9ab5ae" : C.teal, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: !message.trim() || sendMut.isPending ? "not-allowed" : "pointer", fontFamily: "inherit" }}><Send size={14} />Send</button>
                            </div>
                        </div>
                    </> : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
                        <MessageCircle size={48} color={C.border} />
                        <p style={{ fontSize: 14, color: C.faint }}>Select a conversation to start chatting</p>
                    </div>}
                </div>
            </div>
        </div>
    </>);
}