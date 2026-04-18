// ══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE PAGE 
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, X, BookOpen, Eye, ThumbsUp, FolderOpen, FileText, TrendingUp, ChevronRight, Clock } from "lucide-react";
import { apiGetArticles, apiIncrementViews, apiMarkHelpful } from "@/api/knowledgeBase";
import { useAuthStore } from "@/app/store";
import toast from "react-hot-toast";

// ── Design tokens ─────────────────────────────────────────────────────────────
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
    tealBorder: "#c3e8dc", 
    amber: "#f59e0b", 
    amberBg: "#fffbeb", 
    amberText: "#92400e", 
    amberBorder: "#fde68a", 
    red: "#e53e3e", 
    redBg: "#fff5f5", 
    redText: "#c53030", 
    redBorder: "#fed7d7", 
    blue: "#3b82f6", 
    blueBg: "#eff6ff", 
    blueText: "#1d4ed8", 
    blueBorder: "#bfdbfe", 
    purple: "#8b5cf6", 
    purpleBg: "#f5f3ff", 
    purpleText: "#5b21b6", 
    purpleBorder: "#ddd6fe", 
    gray: "#6b7f75", 
    grayBg: "#f4f7f5" 
};

const GS = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes modalIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .article-card:hover { border-color: ${C.tealBorder} !important; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
    .category-chip { transition: all 0.2s ease; }
    .category-chip:hover { background: ${C.tealBg} !important; border-color: ${C.tealBorder} !important; color: ${C.tealText} !important; }
    .search-input:focus { border-color: ${C.teal} !important; box-shadow: 0 0 0 3px rgba(13,158,117,.1) !important; }
`;

// ── Shared Components ─────────────────────────────────────────────────────────
function Modal({ open, onClose, title, size = "md", children }: { open: boolean; onClose: () => void; title: string; size?: "sm" | "md" | "lg"; children: React.ReactNode }) { 
    if (!open) return null; 
    const mw = size === "sm" ? 420 : size === "lg" ? 700 : 540; 
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
            <div style={{ background: C.bg, borderRadius: 20, width: "100%", maxWidth: mw, boxShadow: "0 25px 50px rgba(0,0,0,.25)", animation: "modalIn .2s ease", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 16 }}>✕</button>
                </div>
                <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>{children}</div>
            </div>
        </div>
    ); 
}

function TEmpty({ icon: Icon, text }: { icon: any; text: string }) { 
    return (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Icon size={40} color={C.border} style={{ margin: "0 auto 16px", display: "block" }} />
            <p style={{ fontSize: 14, color: C.faint }}>{text}</p>
        </div>
    ); 
}

function KPI({ label, value, icon: Icon, color, sub }: { label: string; value: any; icon: any; color: string; sub?: string }) { 
    return (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: color + "12", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} color={color} strokeWidth={1.8} />
                </div>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-.02em", lineHeight: 1 }}>{value}</p>
            {sub && <p style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>{sub}</p>}
        </div>
    ); 
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) { 
    return (
        <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
            <input 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder} 
                className="search-input"
                style={{ 
                    width: "100%", 
                    height: 42, 
                    padding: "0 16px 0 42px", 
                    border: `1.5px solid ${C.border}`, 
                    borderRadius: 12, 
                    background: C.bg, 
                    fontSize: 13, 
                    color: C.text, 
                    fontFamily: "inherit", 
                    outline: "none",
                    transition: "all 0.2s"
                }} 
            />
            {value && (
                <button onClick={() => onChange("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.faint, display: "flex" }}>
                    <X size={14} />
                </button>
            )}
        </div>
    ); 
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function KnowledgeBasePage() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === "admin" || user?.role === "super_admin";
    
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [viewModal, setViewModal] = useState<any>(null);
    
    const { data, isLoading, refetch } = useQuery({ 
        queryKey: ["kb-articles"], 
        queryFn: () => apiGetArticles() 
    });
    
    const articles: any[] = data?.data ?? data ?? [];
    
    // Get unique categories from articles
    const categories = useMemo(() => {
        const cats = [...new Set(articles.map(a => a.category).filter(Boolean))];
        return ["all", ...cats];
    }, [articles]);
    
    // Filter articles based on search and category
    const filtered = useMemo(() => {
        return articles.filter(a => {
            if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
            if (search && !a.title?.toLowerCase().includes(search.toLowerCase()) && 
                !a.content?.toLowerCase().includes(search.toLowerCase()) && 
                !a.tags?.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [articles, selectedCategory, search]);
    
    // Stats
    const totalViews = articles.reduce((sum, a) => sum + (a.views ?? 0), 0);
    const totalHelpful = articles.reduce((sum, a) => sum + (a.helpful_count ?? 0), 0);
    
    // Mark article as viewed when opened
    const viewMutation = useMutation({
        mutationFn: (id: number) => apiIncrementViews(id),
        onSuccess: () => refetch()
    });
    
    // Mark as helpful
    const helpfulMutation = useMutation({
        mutationFn: (id: number) => apiMarkHelpful(id),
        onSuccess: () => {
            toast.success("Thanks for your feedback!");
            refetch();
        },
        onError: () => toast.error("Failed to submit feedback")
    });
    
    const handleOpenArticle = (article: any) => {
        setViewModal(article);
        viewMutation.mutate(article.id);
    };

    return (
        <>
            <style>{GS}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: 28, animation: "fadeUp .4s ease both" }}>
                
                {/* Header */}
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-.02em", marginBottom: 8 }}>Knowledge Base</h1>
                    <p style={{ fontSize: 14, color: C.muted }}>Find answers, guides, and documentation to help you get the most out of our platform</p>
                </div>
                
                {/* Stats Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                    <KPI label="Total Articles" value={articles.length} icon={FileText} color={C.teal} sub="Helpful resources" />
                    <KPI label="Categories" value={categories.length - 1} icon={FolderOpen} color={C.purple} sub="Topics covered" />
                    <KPI label="Total Views" value={totalViews.toLocaleString()} icon={Eye} color={C.blue} sub="All time" />
                    <KPI label="Helpful Votes" value={totalHelpful.toLocaleString()} icon={ThumbsUp} color={C.amber} sub="User feedback" />
                </div>
                
                {/* Search and Filters */}
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <SearchBar value={search} onChange={setSearch} placeholder="Search articles by title, content, or tags..." />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className="category-chip"
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: 20,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    border: `1px solid ${selectedCategory === cat ? C.tealBorder : C.border}`,
                                    background: selectedCategory === cat ? C.tealBg : C.bg,
                                    color: selectedCategory === cat ? C.tealText : C.muted,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "all 0.2s"
                                }}
                            >
                                {cat === "all" ? "All Topics" : cat}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Articles Grid */}
                {isLoading ? (
                    <div style={{ padding: "60px 20px", textAlign: "center" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.teal, animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
                        <p style={{ fontSize: 13, color: C.faint }}>Loading articles...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <TEmpty icon={BookOpen} text={search ? "No articles match your search" : "No articles available yet"} />
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
                        {filtered.map(article => (
                            <div
                                key={article.id}
                                className="article-card"
                                onClick={() => handleOpenArticle(article)}
                                style={{
                                    background: C.bg,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 16,
                                    padding: "20px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: C.tealBg, border: `1px solid ${C.tealBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <BookOpen size={18} color={C.teal} />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: C.purpleBg, color: C.purpleText, border: `1px solid ${C.purpleBorder}` }}>
                                        {article.category}
                                    </span>
                                </div>
                                
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8, lineHeight: 1.4 }}>
                                    {article.title}
                                </h3>
                                
                                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 16 }}>
                                    {article.content?.substring(0, 120)}...
                                </p>
                                
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <Eye size={12} color={C.faint} />
                                            <span style={{ fontSize: 11, color: C.faint }}>{article.views || 0}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <ThumbsUp size={12} color={C.faint} />
                                            <span style={{ fontSize: 11, color: C.faint }}>{article.helpful_count || 0}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.teal }}>
                                        <span style={{ fontSize: 11, fontWeight: 500 }}>Read more</span>
                                        <ChevronRight size={12} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Article View Modal */}
            <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={viewModal?.title ?? ""} size="lg">
                {viewModal && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* Metadata */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: C.purpleBg, color: C.purpleText, border: `1px solid ${C.purpleBorder}` }}>
                                {viewModal.category}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Eye size={13} color={C.faint} />
                                <span style={{ fontSize: 12, color: C.muted }}>{viewModal.views || 0} views</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <ThumbsUp size={13} color={C.faint} />
                                <span style={{ fontSize: 12, color: C.muted }}>{viewModal.helpful_count || 0} found helpful</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Clock size={13} color={C.faint} />
                                <span style={{ fontSize: 12, color: C.muted }}>
                                    Updated: {new Date(viewModal.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div style={{ 
                            lineHeight: 1.7, 
                            fontSize: 14, 
                            color: C.text,
                            maxHeight: "60vh",
                            overflowY: "auto",
                            paddingRight: 8
                        }}>
                            <div style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                                {viewModal.content}
                            </div>
                        </div>
                        
                        {/* Tags */}
                        {viewModal.tags && (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                                <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Tags:</span>
                                {viewModal.tags.split(",").map((tag: string) => (
                                    <span key={tag.trim()} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: C.blueBg, color: C.blueText, border: `1px solid ${C.blueBorder}` }}>
                                        #{tag.trim()}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        {/* Helpful Section */}
                        <div style={{ 
                            marginTop: 8, 
                            padding: 20, 
                            background: C.bgMuted, 
                            borderRadius: 16, 
                            textAlign: "center",
                            border: `1px solid ${C.border}`
                        }}>
                            <p style={{ fontSize: 13, color: C.text, marginBottom: 12 }}>Was this article helpful?</p>
                            <button
                                onClick={() => helpfulMutation.mutate(viewModal.id)}
                                disabled={helpfulMutation.isPending}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 20px",
                                    borderRadius: 30,
                                    background: C.teal,
                                    border: "none",
                                    color: "white",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: helpfulMutation.isPending ? "not-allowed" : "pointer",
                                    opacity: helpfulMutation.isPending ? 0.6 : 1
                                }}
                            >
                                <ThumbsUp size={14} />
                                {helpfulMutation.isPending ? "Submitting..." : "Yes, it helped"}
                            </button>
                        </div>
                        
                        {/* Admin Note - only visible to admins */}
                        {isAdmin && (
                            <div style={{ 
                                marginTop: 8, 
                                padding: 12, 
                                background: C.amberBg, 
                                borderRadius: 12, 
                                fontSize: 12, 
                                color: C.amberText,
                                border: `1px solid ${C.amberBorder}`,
                                display: "flex",
                                alignItems: "center",
                                gap: 8
                            }}>
                                <span>📝</span>
                                <span>Admin: You can edit or delete this article in the admin panel.</span>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}