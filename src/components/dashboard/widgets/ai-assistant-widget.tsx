"use client";

import * as React from "react";
import { Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = ["Sammanfatta veckans byggmöten", "Vilka uppgifter är försenade?", "Skapa en checklista för skyddsrond"];

/**
 * Endast gränssnitt. Svaren är lokala platshållare – inga anrop görs.
 * Kopplas senare till Claude via en server-side route (se src/integrations/claude).
 */
export function AiAssistantWidget() {
  const [messages, setMessages] = React.useState<Message[]>([
    { role: "assistant", text: "Hej! Jag är plattformens AI-assistent. I demoläget kan jag inte svara på riktigt ännu." },
  ]);
  const [input, setInput] = React.useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "assistant", text: "Demoläge: AI-assistenten är inte ansluten ännu. När Claude kopplas in får du svar här." },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-xl px-3 py-2 text-sm",
              m.role === "user" ? "bg-primary text-primary-foreground self-end" : "bg-muted self-start",
            )}
          >
            {m.text}
          </div>
        ))}
      </div>
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="hover:bg-accent flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
            >
              <Sparkles className="text-primary size-3" /> {s}
            </button>
          ))}
        </div>
      )}
      <form
        className="mt-auto flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Fråga AI-assistenten…" />
        <Button type="submit" size="icon" aria-label="Skicka">
          <Send />
        </Button>
      </form>
    </div>
  );
}
