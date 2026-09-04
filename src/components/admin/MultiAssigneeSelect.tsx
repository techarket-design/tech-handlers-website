import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, X } from "lucide-react";
import { useTeamMembers } from "@/hooks/useData";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

export default function MultiAssigneeSelect({ value, onChange, placeholder = "Assign team members" }: Props) {
  const { data: members } = useTeamMembers();
  const [open, setOpen] = useState(false);
  const selected = new Set(value);
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(Array.from(next));
  };
  const labelFor = (id: string) =>
    (members?.find((m: any) => m.user_id === id) as any)?.email || id;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            {value.length ? `${value.length} assigned` : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2 max-h-72 overflow-y-auto">
          {(members || []).length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-3">No team members</p>
          )}
          {(members || []).map((m: any) => (
            <label key={m.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
              <Checkbox checked={selected.has(m.user_id)} onCheckedChange={() => toggle(m.user_id)} />
              <span className="flex-1 truncate">{m.email}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{m.role}</span>
            </label>
          ))}
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((id) => (
            <Badge key={id} variant="secondary" className="text-[10px] gap-1 pr-1">
              {labelFor(id)}
              <button type="button" onClick={() => toggle(id)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}