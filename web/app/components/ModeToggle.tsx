"use client";

export type Mode = "ui" | "cli";

type Props = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

export default function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="toggle" role="tablist" aria-label="Interaction mode">
      <button
        role="tab"
        aria-selected={mode === "ui"}
        className={mode === "ui" ? "active" : ""}
        onClick={() => onChange("ui")}
      >
        UI Mode
      </button>
      <button
        role="tab"
        aria-selected={mode === "cli"}
        className={mode === "cli" ? "active" : ""}
        onClick={() => onChange("cli")}
      >
        CLI Mode
      </button>
    </div>
  );
}
