import { getInitials } from "@/utils";

const sizeMap = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
};

const colorMap = [
  "bg-primary-100 text-primary-700",
  "bg-accent-400/20 text-accent-600",
  "bg-warn-400/20 text-warn-500",
  "bg-danger-400/15 text-danger-600",
  "bg-purple-100 text-purple-700",
];

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

export default function Avatar({ name, size = "md" }: AvatarProps) {
  const colorIndex = name.charCodeAt(0) % colorMap.length;
  return (
    <div
      className={`${sizeMap[size]} ${colorMap[colorIndex]} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}
