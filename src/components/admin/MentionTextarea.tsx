import { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type MentionMember = { user_id: string; email: string };

type Props = {
  value: string;
  onChange: (val: string) => void;
  members: MentionMember[];
  onMentionsChange?: (userIds: string[]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
};

/**
 * Textarea with @mention autocomplete. Members are matched by email local-part.
 * Stores plain text in the form `@email` — onMentionsChange receives the resolved user IDs.
 */
export function MentionTextarea({ value, onChange, members, onMentionsChange, placeholder, rows = 3, className }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  const filtered = members
    .filter((m) => {
      const local = m.email.split("@")[0].toLowerCase();
      return local.includes(query.toLowerCase()) || m.email.toLowerCase().includes(query.toLowerCase());
    })
    .slice(0, 6);

  // Resolve mentions whenever value changes
  useEffect(() => {
    if (!onMentionsChange) return;
    const ids = new Set<string>();
    const re = /@([\w.+-]+)/g;
    let m;
    while ((m = re.exec(value)) !== null) {
      const handle = m[1].toLowerCase();
      const found = members.find((mb) => mb.email.split("@")[0].toLowerCase() === handle || mb.email.toLowerCase() === handle);
      if (found) ids.add(found.user_id);
    }
    onMentionsChange(Array.from(ids));
  }, [value, members, onMentionsChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    onChange(next);
    const caret = e.target.selectionStart || 0;
    const upto = next.slice(0, caret);
    const match = upto.match(/@([\w.+-]*)$/);
    if (match) {
      setQuery(match[1]);
      setOpen(true);
      setActiveIdx(0);
    } else {
      setOpen(false);
    }
  };

  const insertMention = (member: MentionMember) => {
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart || 0;
    const before = value.slice(0, caret).replace(/@([\w.+-]*)$/, `@${member.email.split("@")[0]} `);
    const after = value.slice(caret);
    const next = before + after;
    onChange(next);
    setOpen(false);
    requestAnimationFrame(() => {
      el.focus();
      const pos = before.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % filtered.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length); }
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(filtered[activeIdx]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-2 bottom-full mb-1 w-64 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {filtered.map((m, i) => (
            <button
              type="button"
              key={m.user_id}
              onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm hover:bg-accent",
                i === activeIdx && "bg-accent"
              )}
            >
              <span className="font-semibold">@{m.email.split("@")[0]}</span>
              <span className="text-muted-foreground text-xs ml-2">{m.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Render plain text with @mentions highlighted */
export function MentionText({ text }: { text: string }) {
  const safe = typeof text === "string" ? text : text == null ? "" : String(text);
  // Split on @mentions and URLs, keeping the delimiters
  const parts = safe.split(/(@[\w.+-]+|https?:\/\/[^\s<>()"']+|www\.[^\s<>()"']+)/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, i) => {
        if (!p) return null;
        if (p.startsWith("@")) {
          return <span key={i} className="text-primary font-medium bg-primary/10 px-1 rounded">{p}</span>;
        }
        if (/^https?:\/\//i.test(p) || /^www\./i.test(p)) {
          const href = /^www\./i.test(p) ? `https://${p}` : p;
          return (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all hover:opacity-80">
              {p}
            </a>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}