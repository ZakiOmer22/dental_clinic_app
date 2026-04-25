// ─── Growth.tsx ───────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Download, TrendingUp, Building2, Users, DollarSign, Activity, MapPin, Award, Calendar, CreditCard, PieChart } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/app/store";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const C = {
  border: "#e5eae8", bg: "#ffffff", bgMuted: "#f7f9f8", bgPage: "#f0f2f1",
  text: "#111816", muted: "#7a918b", faint: "#a0b4ae",
  teal: "#0d9e75", tealBg: "#e8f7f2", tealText: "#0a7d5d", tealBorder: "#c3e8dc",
  amber: "#f59e0b", amberBg: "#fffbeb", amberText: "#92400e", amberBorder: "#fde68a",
  red: "#e53e3e", redBg: "#fff5f5", redText: "#c53030", redBorder: "#fed7d7",
  blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1d4ed8", blueBorder: "#bfdbfe",
  purple: "#8b5cf6", purpleBg: "#f5f3ff", purpleText: "#5b21b6",
} as const;

function StatCard({ label, value, trend, positive, icon: Icon, color, bg }: any) {
  return (
    <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{value}</p>
      {trend && (
        <p style={{ fontSize: 10, color: positive ? C.tealText : C.redText, marginTop: 4 }}>
          {positive ? '↑' : '↓'} {trend}
        </p>
      )}
    </div>
  );
}

const apiFetch = async (endpoint: string, token: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/v1/admin${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error();
  return res.json();
};

// Helper to convert image to base64 for PDF
const getBase64Image = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

export function GrowthPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [topClinics, setTopClinics] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [cityDistribution, setCityDistribution] = useState<any[]>([]);
  const [stats, setStats] = useState({
    clinicGrowth: 0,
    revenueGrowth: 0,
    userGrowth: 0,
    totalRevenue: 0,
    totalClinics: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const fetchGrowthData = async () => {
      if (!token) return;
      try {
        // Fetch revenue data
        const revenueData = await apiFetch('/revenue', token);
        const monthly = revenueData.monthly || [];

        // Fetch clinics data
        const clinicsData = await apiFetch('/clinics', token);
        const clinics = clinicsData.clinics || [];

        // Calculate total revenue
        const totalRevenue = clinics.reduce((sum, c) => sum + (c.total_revenue || 0), 0);

        // Get top 5 clinics by revenue
        const topClinicsList = [...clinics]
          .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
          .slice(0, 5)
          .map(c => ({ 
            name: c.name, 
            revenue: c.total_revenue || 0, 
            patients: c.patient_count || 0,
            plan: c.plan_name || 'Basic',
            pct: totalRevenue > 0 ? ((c.total_revenue || 0) / totalRevenue) * 100 : 0
          }));

        setTopClinics(topClinicsList);

        // Calculate plan distribution
        const plans: Record<string, number> = {};
        clinics.forEach((c: any) => {
          const plan = c.plan_name || 'Basic';
          plans[plan] = (plans[plan] || 0) + 1;
        });
        setPlanDistribution(Object.entries(plans).map(([name, count]) => ({ name, count })));

        // Calculate city distribution
        const cities: Record<string, number> = {};
        clinics.forEach((c: any) => {
          const city = c.city || 'Other';
          cities[city] = (cities[city] || 0) + 1;
        });
        setCityDistribution(Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })));

        // Calculate monthly stats from clinic creation dates
        const monthlyStats: Record<string, { clinics: number; users: number; revenue: number }> = {};

        clinics.forEach((clinic: any) => {
          const date = new Date(clinic.created_at);
          const monthKey = date.toLocaleString('default', { month: 'short' });
          if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = { clinics: 0, users: 0, revenue: 0 };
          }
          monthlyStats[monthKey].clinics++;
          monthlyStats[monthKey].users += clinic.user_count || 0;
          monthlyStats[monthKey].revenue += clinic.total_revenue || 0;
        });

        // Process revenue data into monthly format
        monthly.forEach((rev: any) => {
          const month = new Date(rev.month).toLocaleString('default', { month: 'short' });
          if (monthlyStats[month]) {
            monthlyStats[month].revenue = rev.revenue;
          } else {
            monthlyStats[month] = { clinics: 0, users: 0, revenue: rev.revenue };
          }
        });

        // Convert to array and sort by month order
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const sortedData = Object.entries(monthlyStats)
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
          .slice(-7);

        setGrowthData(sortedData);

        // Calculate growth percentages
        if (sortedData.length >= 2) {
          const prevMonth = sortedData[sortedData.length - 2];
          const currMonth = sortedData[sortedData.length - 1];

          const clinicGrowth = prevMonth.clinics ? ((currMonth.clinics - prevMonth.clinics) / prevMonth.clinics * 100) : 0;
          const revenueGrowth = prevMonth.revenue ? ((currMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100) : 0;
          const userGrowth = prevMonth.users ? ((currMonth.users - prevMonth.users) / prevMonth.users * 100) : 0;

          setStats({
            clinicGrowth: parseFloat(clinicGrowth.toFixed(1)),
            revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
            userGrowth: parseFloat(userGrowth.toFixed(1)),
            totalRevenue: totalRevenue,
            totalClinics: clinics.length,
            totalUsers: clinics.reduce((sum, c) => sum + (c.user_count || 0), 0),
          });
        } else {
          setStats({
            clinicGrowth: 0,
            revenueGrowth: 0,
            userGrowth: 0,
            totalRevenue: totalRevenue,
            totalClinics: clinics.length,
            totalUsers: clinics.reduce((sum, c) => sum + (c.user_count || 0), 0),
          });
        }
      } catch (err) {
        console.error('Failed to fetch growth data:', err);
        toast.error('Failed to load growth data');
      } finally {
        setLoading(false);
      }
    };
    fetchGrowthData();
  }, [token]);

  const handleExport = async () => {
    try {
      toast.loading('Generating PDF report...');

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;

      // Colors
      const primaryColor: [number, number, number] = [13, 158, 117];
      const darkColor: [number, number, number] = [17, 24, 22];
      const mutedColor: [number, number, number] = [122, 145, 139];
      const purpleColor: [number, number, number] = [139, 92, 246];
      const blueColor: [number, number, number] = [59, 130, 246];
      const amberColor: [number, number, number] = [245, 158, 11];
      const successColor: [number, number, number] = [13, 158, 117];
      const errorColor: [number, number, number] = [229, 62, 62];

      // Load logo
      let logoData: string | null = null;
      try {
        logoData = await getBase64Image('/icon.png');
      } catch (e) {
        console.warn('Could not load logo, using text-based logo');
      }

      // ─── HEADER ────────────────────────────────────
      doc.setFillColor(17, 24, 22);
      doc.rect(0, 0, pageWidth, 38, 'F');

      // Logo
      if (logoData) {
        doc.addImage(logoData, 'PNG', margin, 6, 10, 10);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('DARYEEL', margin + 13, 14);
      } else {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('DARYEEL', margin, 14);
      }

      doc.setFontSize(7);
      doc.setTextColor(160, 180, 174);
      doc.setFont('helvetica', 'normal');
      doc.text('Multi-Clinic Dental SaaS Platform', logoData ? margin + 13 : margin, 20);

      // Report Title
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('Growth Analytics Report', pageWidth - margin, 14, { align: 'right' });

      doc.setFontSize(7);
      doc.setTextColor(160, 180, 174);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })}`, pageWidth - margin, 20, { align: 'right' });

      // Decorative line under header
      doc.setDrawColor(13, 158, 117);
      doc.setLineWidth(0.8);
      doc.line(margin, 38, pageWidth - margin, 38);

      let currentY = 48;

      // ─── EXECUTIVE SUMMARY ────────────────────────
      doc.setFontSize(13);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', margin, currentY);

      currentY += 5;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.4);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      currentY += 8;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...mutedColor);
      const summaryText = `This report provides a comprehensive overview of the Daryeel platform's growth metrics, including clinic performance, user acquisition trends, and subscription distribution across ${stats.totalClinics} active clinics. Data is current as of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`;
      const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
      doc.text(summaryLines, margin, currentY);

      currentY += (summaryLines.length * 5) + 12;

      // ─── KEY METRICS CARDS ────────────────────────
      doc.setFontSize(13);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Performance Indicators', margin, currentY);

      currentY += 5;
      doc.setDrawColor(...primaryColor);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      currentY += 10;

      const cardWidth = (pageWidth - 2 * margin - 15) / 2;
      const cardHeight = 30;

      const metricsData = [
        { label: 'Total Clinics', value: stats.totalClinics.toLocaleString(), trend: 'All time', color: primaryColor },
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), trend: 'Across all clinics', color: blueColor },
        { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, trend: 'Lifetime', color: purpleColor },
        { label: 'Active Clinics', value: stats.totalClinics.toLocaleString(), trend: 'Currently active', color: amberColor },
      ];

      metricsData.forEach((metric, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + col * (cardWidth + 15);
        const y = currentY + row * (cardHeight + 10);

        doc.setFillColor(247, 249, 248);
        doc.setDrawColor(229, 234, 232);
        doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

        doc.setFontSize(7);
        doc.setTextColor(...mutedColor);
        doc.setFont('helvetica', 'normal');
        doc.text(metric.label, x + 5, y + 8);

        doc.setFontSize(16);
        doc.setTextColor(...metric.color);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.value, x + 5, y + 20);

        doc.setFontSize(6);
        doc.setTextColor(...primaryColor);
        doc.text(`↑ ${metric.trend}`, x + cardWidth - 5, y + cardHeight - 4, { align: 'right' });
      });

      currentY += 2 * (cardHeight + 10) + 15;

      // ─── GROWTH METRICS ───────────────────────────
      doc.setFontSize(13);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Growth Metrics (Month-over-Month)', margin, currentY);

      currentY += 5;
      doc.setDrawColor(...primaryColor);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      currentY += 10;

      const growthMetrics = [
        { 
          label: 'Clinic Growth', 
          value: isNaN(stats.clinicGrowth) ? 'N/A' : `${stats.clinicGrowth > 0 ? '+' : ''}${stats.clinicGrowth}%`,
          color: primaryColor,
          positive: stats.clinicGrowth >= 0
        },
        { 
          label: 'Revenue Growth', 
          value: isNaN(stats.revenueGrowth) ? 'N/A' : `${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth}%`,
          color: purpleColor,
          positive: stats.revenueGrowth >= 0
        },
        { 
          label: 'User Growth', 
          value: isNaN(stats.userGrowth) ? 'N/A' : `${stats.userGrowth > 0 ? '+' : ''}${stats.userGrowth}%`,
          color: blueColor,
          positive: stats.userGrowth >= 0
        },
      ];

      const chartWidth = pageWidth - 2 * margin;
      const chartHeight = 50;

      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(229, 234, 232);
      doc.roundedRect(margin, currentY, chartWidth, chartHeight, 3, 3, 'FD');

      doc.setFontSize(7);
      doc.setTextColor(...mutedColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Growth Comparison (%)', margin + 5, currentY + 6);

      const barStartY = currentY + chartHeight - 10;
      const barSpacing = 12;
      const totalBars = growthMetrics.length;
      const availableWidth = chartWidth - 60;
      const barWidth = (availableWidth - (totalBars - 1) * barSpacing) / totalBars;
      const startX = margin + 30;

      growthMetrics.forEach((metric, index) => {
        const x = startX + index * (barWidth + barSpacing + 30);
        const barValue = metric.value === 'N/A' ? 0 : Math.min(Math.abs(parseFloat(metric.value)), 100);
        const barHeight = (barValue / 100) * 35;

        // Bar
        doc.setFillColor(...metric.color);
        doc.setDrawColor(...metric.color);
        doc.roundedRect(x, barStartY - barHeight, barWidth, barHeight, 2, 2, 'FD');

        // Value on top
        doc.setFontSize(7);
        doc.setTextColor(metric.positive ? primaryColor[0] : errorColor[0], metric.positive ? primaryColor[1] : errorColor[1], metric.positive ? primaryColor[2] : errorColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.value, x + barWidth / 2, barStartY - barHeight - 2, { align: 'center' });

        // Arrow
        if (metric.value !== 'N/A') {
          doc.text(metric.positive ? '↑' : '↓', x + barWidth / 2, barStartY - barHeight - 6, { align: 'center' });
        }

        // Label
        doc.setFontSize(6);
        doc.setTextColor(...mutedColor);
        doc.setFont('helvetica', 'normal');
        doc.text(metric.label, x + barWidth / 2, barStartY + 4, { align: 'center' });
      });

      currentY += chartHeight + 12;

      // ─── MONTHLY GROWTH DATA ──────────────────────
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(13);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Growth Breakdown', margin, currentY);

      currentY += 5;
      doc.setDrawColor(...primaryColor);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      currentY += 8;

      if (growthData.length > 0) {
        const monthlyTableData = growthData.map(d => [
          { content: d.month, styles: { fontStyle: 'bold' } },
          { content: (d.clinics || 0).toString(), styles: { halign: 'center' } },
          { content: (d.users || 0).toString(), styles: { halign: 'center' } },
          { content: `$${((d.revenue || 0) / 1000).toFixed(1)}k`, styles: { halign: 'center' } },
          { content: `$${(d.revenue || 0).toLocaleString()}`, styles: { halign: 'right' } }
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [[
            { content: 'Month', styles: { textColor: 255 } },
            { content: 'Clinics', styles: { textColor: 255, halign: 'center' } },
            { content: 'Users', styles: { textColor: 255, halign: 'center' } },
            { content: 'Revenue', styles: { textColor: 255, halign: 'center' } },
            { content: 'Total Revenue', styles: { textColor: 255, halign: 'right' } }
          ]],
          body: monthlyTableData,
          theme: 'grid',
          headStyles: { 
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8
          },
          alternateRowStyles: { fillColor: [247, 249, 248] },
          styles: { fontSize: 8, cellPadding: 4 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 35, halign: 'center' },
            4: { cellWidth: 40, halign: 'right' }
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 12;
      }

      // ─── TOP PERFORMING CLINICS ────────────────────
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(13);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Performing Clinics', margin, currentY);

      currentY += 5;
      doc.setDrawColor(...primaryColor);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      currentY += 10;

      if (topClinics.length > 0) {
        const maxRevenue = Math.max(...topClinics.map(c => c.revenue), 1);

        topClinics.forEach((clinic, index) => {
          const y = currentY + index * 16;
          const barWidthPx = clinic.revenue > 0 ? (clinic.revenue / maxRevenue) * (pageWidth - 2 * margin - 90) : 0;

          // Rank
          doc.setFillColor(139, 92, 246, 0.15);
          doc.circle(margin + 7, y + 7, 6, 'F');
          doc.setFontSize(7);
          doc.setTextColor(...purpleColor);
          doc.setFont('helvetica', 'bold');
          doc.text(`#${index + 1}`, margin + 7, y + 8, { align: 'center' });

          // Name
          doc.setFontSize(8);
          doc.setTextColor(...darkColor);
          doc.setFont('helvetica', 'bold');
          doc.text(clinic.name, margin + 18, y + 6);

          // Revenue
          doc.setFontSize(8);
          doc.setTextColor(...primaryColor);
          doc.setFont('helvetica', 'bold');
          doc.text(`$${clinic.revenue.toLocaleString()}`, pageWidth - margin, y + 6, { align: 'right' });

          // Bar
          if (barWidthPx > 0) {
            doc.setFillColor(232, 247, 242);
            doc.setDrawColor(195, 232, 220);
            doc.roundedRect(margin + 18, y + 10, pageWidth - 2 * margin - 108, 4, 2, 2, 'FD');
            
            doc.setFillColor(...primaryColor);
            doc.roundedRect(margin + 18, y + 10, barWidthPx, 4, 2, 2, 'F');
          }
        });

        currentY += topClinics.length * 16 + 12;
      }

      // ─── PLAN DISTRIBUTION ────────────────────────
      if (currentY > 210) {
        doc.addPage();
        currentY = 20;
      }

      const colWidth = (pageWidth - 2 * margin - 10) / 2;
      const leftCol = margin;
      const rightCol = margin + colWidth + 10;

      // Left - Plan Distribution
      doc.setFontSize(13);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Plan Distribution', leftCol, currentY);

      let leftY = currentY + 5;
      doc.setDrawColor(...primaryColor);
      doc.line(leftCol, leftY, leftCol + colWidth, leftY);

      leftY += 10;

      if (planDistribution.length > 0) {
        const totalClinics = planDistribution.reduce((sum, p) => sum + p.count, 0);

        planDistribution.forEach((plan, index) => {
          const y = leftY + index * 35;
          const percentage = (plan.count / totalClinics) * 100;
          const planColor = plan.name === 'Enterprise' ? purpleColor : 
                           plan.name === 'Professional' ? blueColor : primaryColor;

          // Circle
          doc.setFillColor(240, 240, 240);
          doc.circle(leftCol + 18, y + 14, 12, 'F');
          doc.setFillColor(...planColor);
          doc.circle(leftCol + 18, y + 14, 8, 'F');

          // Percentage
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text(`${percentage.toFixed(0)}%`, leftCol + 18, y + 15, { align: 'center' });

          // Name & count
          doc.setFontSize(10);
          doc.setTextColor(...darkColor);
          doc.setFont('helvetica', 'bold');
          doc.text(plan.name, leftCol + 38, y + 9);

          doc.setFontSize(7);
          doc.setTextColor(...mutedColor);
          doc.setFont('helvetica', 'normal');
          doc.text(`${plan.count} clinics`, leftCol + 38, y + 16);

          // Bar
          doc.setFillColor(240, 240, 240);
          doc.roundedRect(leftCol + 38, y + 22, colWidth - 48, 4, 2, 2, 'F');
          doc.setFillColor(...planColor);
          doc.roundedRect(leftCol + 38, y + 22, (colWidth - 48) * (percentage / 100), 4, 2, 2, 'F');
        });
      }

      // Right - Subscription Insights
      doc.setFontSize(13);
      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Subscription Insights', rightCol, currentY);

      let rightY = currentY + 5;
      doc.setDrawColor(...primaryColor);
      doc.line(rightCol, rightY, rightCol + colWidth, rightY);

      rightY += 12;

      const insights = [
        { label: 'Avg Revenue / Clinic', value: `$${stats.totalClinics ? (stats.totalRevenue / stats.totalClinics).toFixed(0) : '0'}`, color: primaryColor },
        { label: 'Avg Users / Clinic', value: `${stats.totalClinics ? (stats.totalUsers / stats.totalClinics).toFixed(1) : '0'}`, color: blueColor },
        { label: 'Enterprise Adoption', value: `${planDistribution.find(p => p.name === 'Enterprise')?.count || 0} clinics`, color: purpleColor },
      ];

      insights.forEach((insight, index) => {
        const y = rightY + index * 28;

        doc.setFillColor(insight.color[0], insight.color[1], insight.color[2], 0.1);
        doc.circle(rightCol + 8, y + 8, 7, 'F');

        doc.setFontSize(7);
        doc.setTextColor(...insight.color);
        doc.setFont('helvetica', 'bold');
        doc.text('●', rightCol + 8, y + 9, { align: 'center' });

        doc.setFontSize(7);
        doc.setTextColor(...mutedColor);
        doc.setFont('helvetica', 'normal');
        doc.text(insight.label, rightCol + 20, y + 5);

        doc.setFontSize(12);
        doc.setTextColor(...insight.color);
        doc.setFont('helvetica', 'bold');
        doc.text(insight.value, rightCol + 20, y + 16);
      });

      currentY = Math.max(leftY + planDistribution.length * 35 + 10, rightY + insights.length * 28 + 10) + 10;

      // ─── CITY DISTRIBUTION ────────────────────────
      if (currentY > 230 && cityDistribution.length > 0) {
        doc.addPage();
        currentY = 20;
      }

      if (cityDistribution.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Geographic Distribution', margin, currentY);

        currentY += 5;
        doc.setDrawColor(...primaryColor);
        doc.line(margin, currentY, pageWidth - margin, currentY);

        currentY += 10;

        const totalCities = cityDistribution.reduce((sum, c) => sum + c.count, 0);

        cityDistribution.forEach((city, index) => {
          const y = currentY + index * 14;
          const percentage = (city.count / totalCities) * 100;

          doc.setFontSize(8);
          doc.setTextColor(...darkColor);
          doc.setFont('helvetica', 'bold');
          doc.text(city.name, margin, y + 6);

          doc.setFontSize(7);
          doc.setTextColor(...mutedColor);
          doc.setFont('helvetica', 'normal');
          doc.text(`${city.count} clinics (${percentage.toFixed(0)}%)`, pageWidth - margin, y + 6, { align: 'right' });

          // Bar
          doc.setFillColor(240, 240, 240);
          doc.roundedRect(margin, y + 10, pageWidth - 2 * margin, 3, 1.5, 1.5, 'F');
          doc.setFillColor(...blueColor);
          doc.roundedRect(margin, y + 10, (pageWidth - 2 * margin) * (percentage / 100), 3, 1.5, 1.5, 'F');
        });

        currentY += cityDistribution.length * 14 + 12;
      }

      // ─── FOOTER ────────────────────────────────────
      const footerY = pageHeight - 20;

      doc.setDrawColor(229, 234, 232);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      // Footer with logo
      if (logoData) {
        doc.addImage(logoData, 'PNG', margin, footerY - 1, 6, 6);
        doc.setFontSize(7);
        doc.setTextColor(...mutedColor);
        doc.setFont('helvetica', 'normal');
        doc.text('Daryeel App — Multi-Clinic Dental SaaS Platform | This report is automatically generated', margin + 8, footerY + 1);
        doc.text(`© ${new Date().getFullYear()} Daryeel. All rights reserved. | Confidential`, margin + 8, footerY + 5);
      } else {
        doc.setFontSize(7);
        doc.setTextColor(...mutedColor);
        doc.setFont('helvetica', 'normal');
        doc.text('Daryeel App — Multi-Clinic Dental SaaS Platform | This report is automatically generated', margin, footerY);
        doc.text(`© ${new Date().getFullYear()} Daryeel. All rights reserved. | Confidential`, margin, footerY + 4);
      }

      doc.setTextColor(...mutedColor);
      doc.text('Page 1/1', pageWidth - margin, footerY + 4, { align: 'right' });

      // Save
      doc.save(`Daryeel-Growth-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Growth report downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  const maxRevenue = growthData.length > 0 ? Math.max(...growthData.map(d => d.revenue || 0)) : 1;
  const maxClinics = growthData.length > 0 ? Math.max(...growthData.map(d => d.clinics)) : 1;
  const maxUsers = growthData.length > 0 ? Math.max(...growthData.map(d => d.users)) : 1;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.purple, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bgPage, padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>Growth Analytics</h1>
          <p style={{ fontSize: 13, color: C.muted }}>Platform growth trends, performance metrics, and insights</p>
        </div>
        <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 18px", height: 36, borderRadius: 9, background: C.purple, border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <Download size={14} /> Export Report
        </button>
      </div>

      {/* Rest of your JSX remains exactly the same */}
      {/* Key Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Building2} label="Total Clinics" value={stats.totalClinics.toLocaleString()} trend="All time" positive={true} color={C.teal} bg={C.tealBg} />
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers.toLocaleString()} trend="Across all clinics" positive={true} color={C.blue} bg={C.blueBg} />
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} trend="Lifetime" positive={true} color={C.purple} bg={C.purpleBg} />
        <StatCard icon={Activity} label="Active Clinics" value={stats.totalClinics} trend="Currently active" positive={true} color={C.amber} bg={C.amberBg} />
      </div>

      {/* Growth Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard 
          icon={TrendingUp} 
          label="Clinic Growth (MoM)" 
          value={`${stats.clinicGrowth > 0 ? '+' : ''}${stats.clinicGrowth}%`} 
          trend="vs previous month"
          positive={stats.clinicGrowth >= 0}
          color={C.teal} 
          bg={C.tealBg} 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Revenue Growth (MoM)" 
          value={`${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth}%`} 
          trend="vs previous month"
          positive={stats.revenueGrowth >= 0}
          color={C.purple} 
          bg={C.purpleBg} 
        />
        <StatCard 
          icon={TrendingUp} 
          label="User Growth (MoM)" 
          value={`${stats.userGrowth > 0 ? '+' : ''}${stats.userGrowth}%`} 
          trend="vs previous month"
          positive={stats.userGrowth >= 0}
          color={C.blue} 
          bg={C.blueBg} 
        />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Revenue Growth</h3>
          </div>
          <div style={{ padding: "24px 20px" }}>
            {growthData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No revenue data available</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, marginBottom: 10 }}>
                  {growthData.map((d) => (
                    <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 10, color: C.muted }}>${((d.revenue || 0) / 1000).toFixed(0)}k</span>
                      <div style={{
                        width: '100%',
                        background: `linear-gradient(180deg, ${C.teal}, ${C.tealBg})`,
                        borderRadius: '6px 6px 0 0',
                        height: `${((d.revenue || 0) / maxRevenue) * 160}px`,
                        transition: 'height 0.3s ease'
                      }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {growthData.map((d) => (
                    <div key={d.month} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: C.muted }}>{d.month}</div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Clinics & Users Growth</h3>
          </div>
          <div style={{ padding: "20px" }}>
            {growthData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No growth data available</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {growthData.map((d) => (
                  <div key={d.month} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px 1fr 60px', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{d.month}</span>
                    <div style={{ height: 6, background: C.bgMuted, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${((d.clinics || 0) / maxClinics) * 100}%`, height: '100%', background: C.teal, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>{d.clinics || 0}</span>
                    <div style={{ height: 6, background: C.bgMuted, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${((d.users || 0) / maxUsers) * 100}%`, height: '100%', background: C.purple, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>{d.users || 0}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 16, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.teal }} /><span style={{ fontSize: 12, color: C.muted }}>Clinics</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.purple }} /><span style={{ fontSize: 12, color: C.muted }}>Users</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={14} color={C.amber} /> Top Performing Clinics
            </h3>
          </div>
          <div style={{ padding: "20px" }}>
            {topClinics.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No clinic data available</div>
            ) : (
              topClinics.map((clinic, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: idx < topClinics.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 6, background: C.purpleBg, color: C.purpleText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>#{idx + 1}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{clinic.name}</p>
                      <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{clinic.patients} patients</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.purpleText }}>${clinic.revenue.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <PieChart size={14} color={C.blue} /> Plan Distribution
            </h3>
          </div>
          <div style={{ padding: "20px" }}>
            {planDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No plan data available</div>
            ) : (
              planDistribution.map((plan, idx) => {
                const total = planDistribution.reduce((sum, p) => sum + p.count, 0);
                const percentage = (plan.count / total) * 100;
                const planColor = plan.name === 'Enterprise' ? C.purple : plan.name === 'Pro' ? C.teal : C.blue;
                return (
                  <div key={idx} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>{plan.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: planColor }}>{plan.count} clinics ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: 6, background: C.bgMuted, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: planColor, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color={C.amber} /> Top Cities
            </h3>
          </div>
          <div style={{ padding: "20px" }}>
            {cityDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No location data available</div>
            ) : (
              cityDistribution.map((city, idx) => {
                const total = cityDistribution.reduce((sum, c) => sum + c.count, 0);
                const percentage = (city.count / total) * 100;
                return (
                  <div key={idx} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>{city.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.blue }}>{city.count} clinics</span>
                    </div>
                    <div style={{ height: 6, background: C.bgMuted, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: C.blue, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={14} color={C.teal} /> Subscription Insights
            </h3>
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ textAlign: 'center', padding: 12, background: C.bgMuted, borderRadius: 10 }}>
                <p style={{ fontSize: 10, color: C.muted }}>Avg Revenue per Clinic</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: C.tealText }}>
                  ${stats.totalClinics ? (stats.totalRevenue / stats.totalClinics).toFixed(0) : 0}
                </p>
              </div>
              <div style={{ textAlign: 'center', padding: 12, background: C.bgMuted, borderRadius: 10 }}>
                <p style={{ fontSize: 10, color: C.muted }}>Avg Users per Clinic</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: C.blueText }}>
                  {stats.totalClinics ? (stats.totalUsers / stats.totalClinics).toFixed(1) : 0}
                </p>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Enterprise Adoption</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.purple }}>
                  {planDistribution.find(p => p.name === 'Enterprise')?.count || 0} clinics
                </span>
              </div>
              <div style={{ height: 6, background: C.bgMuted, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${((planDistribution.find(p => p.name === 'Enterprise')?.count || 0) / stats.totalClinics) * 100}%`,
                  height: '100%',
                  background: C.purple,
                  borderRadius: 3
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}