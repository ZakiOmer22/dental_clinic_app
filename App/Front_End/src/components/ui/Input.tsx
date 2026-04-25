interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({ label, error, hint, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="label">{label}</label>}
      <input
        className={`input ${error ? "border-danger-500 focus:ring-danger-500/30 focus:border-danger-500" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger-500 mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-surface-700/50 mt-0.5">{hint}</p>}
    </div>
  );
}
