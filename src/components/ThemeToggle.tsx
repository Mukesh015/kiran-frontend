import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({
  dark,
  onToggle,
}: { dark: boolean; onToggle: () => void }) {
  return (
    <button className="icon-btn" onClick={onToggle} aria-label="Toggle theme">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
