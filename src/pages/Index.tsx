
import React, { useState } from "react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { ChatMode } from "@/components/ChatMode";
import { AgentMode } from "@/components/AgentMode";
import { AgentAutoMode } from "@/components/AgentAutoMode";
import { ConfigPanel } from "@/components/ConfigPanel";
import { Settings, Code, Play } from "lucide-react";

const Index = () => {
  const [mode, setMode] = useState<"chat" | "agent" | "agent-auto">("chat");
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-blue-700">Ketu</h1>
          <span className="text-sm text-gray-500">AI Development Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowConfig(!showConfig)}>
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex flex-1">
        {showConfig && (
          <div className="w-80 border-r bg-white p-4">
            <ConfigPanel />
          </div>
        )}

        <div className="flex-1 p-6">
          <Card className="mx-auto max-w-4xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ketu AI Assistant</CardTitle>
                <Select value={mode} onValueChange={(value: "chat" | "agent" | "agent-auto") => setMode(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="chat">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span>Chat Mode</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="agent">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          <span>Agent Mode</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="agent-auto">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          <span>Agent Auto Mode</span>
                        </div>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>
                {mode === "chat" && "Ask questions and get AI-generated answers."}
                {mode === "agent" && "Request code generation and review before insertion."}
                {mode === "agent-auto" && "Automatically generate, insert, execute and test code."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mode === "chat" && <ChatMode />}
              {mode === "agent" && <AgentMode />}
              {mode === "agent-auto" && <AgentAutoMode />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
