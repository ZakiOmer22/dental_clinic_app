import { format, formatDistanceToNow } from "date-fns";

export const formatDate = (date: any): string => {
  if (!date) return "—";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, "MMM d, yyyy");
};

export const formatDateTime = (date: any): string => {
  if (!date) return "—";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, "MMM d, yyyy · h:mm a");
};

export const timeAgo = (date: any): string => {
  if (!date) return "—";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

export const getInitials = (name: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const classNames = (...classes: (string | undefined | false | null)[]) => {
  return classes.filter(Boolean).join(" ");
};

export const statusColor = (status: string) => {
  const map: Record<string, string> = {
    scheduled:  "badge-blue",
    completed:  "badge-green",
    cancelled:  "badge-red",
    no_show:    "badge-yellow",
    paid:       "badge-green",
    partial:    "badge-yellow",
    unpaid:     "badge-red",
  };
  return map[status] ?? "badge-gray";
};
