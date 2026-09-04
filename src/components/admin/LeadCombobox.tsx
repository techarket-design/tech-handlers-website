import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface LeadOption {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
}

interface Props {
  value?: string | null;
  onChange: (value: string | null) => void;
  leads: LeadOption[];
  placeholder?: string;
  className?: string;
}

export function LeadCombobox({ value, onChange, leads, placeholder = "Search lead by name…", className }: Props) {
  const [open, setOpen] = useState(false);
  const selected = leads.find((l) => l.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate text-left">
            {selected ? `${selected.name}${selected.company ? ` · ${selected.company}` : ""}` : <span className="text-muted-foreground">No lead linked</span>}
          </span>
          <div className="flex items-center gap-1">
            {selected && (
              <X
                className="h-3.5 w-3.5 opacity-60 hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); onChange(null); }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          filter={(value, search) => {
            // value is the haystack we put into CommandItem value=
            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No leads found</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__ no lead clear unlink remove"
                onSelect={() => { onChange(null); setOpen(false); }}
              >
                <span className="text-muted-foreground">No lead</span>
              </CommandItem>
              {leads.map((l) => {
                const haystack = `${l.name} ${l.company ?? ""} ${l.email ?? ""}`;
                return (
                  <CommandItem
                    key={l.id}
                    value={haystack}
                    onSelect={() => { onChange(l.id); setOpen(false); }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === l.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col">
                      <span className="text-sm">{l.name}</span>
                      {l.company && <span className="text-[11px] text-muted-foreground">{l.company}</span>}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}