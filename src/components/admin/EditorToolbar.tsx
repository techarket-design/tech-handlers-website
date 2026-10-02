import { Button } from "@/components/ui/button";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link2, Code, Minus } from "lucide-react";

type Action = { icon: any; label: string; wrap?: [string, string]; block?: string };

const ACTIONS: Action[] = [
  { icon: Heading2, label: "Heading 2", wrap: ["<h2>", "</h2>"] },
  { icon: Heading3, label: "Heading 3", wrap: ["<h3>", "</h3>"] },
  { icon: Bold, label: "Bold", wrap: ["<strong>", "</strong>"] },
  { icon: Italic, label: "Italic", wrap: ["<em>", "</em>"] },
  { icon: Link2, label: "Link", wrap: ['<a href="https://www.techhandlers.in/">', "</a>"] },
  { icon: Quote, label: "Quote", wrap: ["<blockquote>", "</blockquote>"] },
  { icon: List, label: "Bullet list", block: "<ul>\n  <li>Item one</li>\n  <li>Item two</li>\n</ul>" },
  { icon: ListOrdered, label: "Numbered list", block: "<ol>\n  <li>Step one</li>\n  <li>Step two</li>\n</ol>" },
  { icon: Code, label: "Paragraph", wrap: ["<p>", "</p>"] },
  { icon: Minus, label: "Divider", block: "<hr />" },
];

/**
 * Lightweight HTML formatting toolbar for the blog content textarea.
 * Wraps the current selection (or inserts a block) and keeps focus in the editor.
 */
export default function EditorToolbar({
  textareaRef,
  value,
  onChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (next: string) => void;
}) {
  const apply = (action: Action) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const insert = action.wrap
      ? `${action.wrap[0]}${selected || action.label}${action.wrap[1]}`
      : `\n${action.block}\n`;
    const next = value.slice(0, start) + insert + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + insert.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="flex flex-wrap gap-1 border border-border rounded-lg p-1 bg-muted/40">
      {ACTIONS.map((a) => (
        <Button
          key={a.label}
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title={a.label}
          aria-label={a.label}
          onClick={() => apply(a)}
        >
          <a.icon className="h-3.5 w-3.5" />
        </Button>
      ))}
    </div>
  );
}
