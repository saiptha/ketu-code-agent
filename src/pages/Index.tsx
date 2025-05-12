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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";
import { ChatMode } from "@/components/ChatMode";
import { AgentMode } from "@/components/AgentMode";
import { AgentAutoMode } from "@/components/AgentAutoMode";
import { IdeaMode } from "@/components/IdeaMode";
import { DesignMode } from "@/components/DesignMode";
import { DeployMode } from "@/components/DeployMode";
import { ConfigPanel } from "@/components/ConfigPanel";
import { Settings, Play, Lightbulb, PaintBucket, Upload, Code } from "lucide-react";

type AppMode = "idea" | "design" | "generate" | "deploy";
type GenerateSubMode = "chat" | "agent" | "agent-auto";

const Index = () => {
  const [appMode, setAppMode] = useState<AppMode>("generate");
  const [generateMode, setGenerateMode] = useState<GenerateSubMode>("chat");
  const [showConfig, setShowConfig] = useState(false);

  const getIcon = (mode: AppMode) => {
    switch (mode) {
      case "idea": return <Lightbulb className="h-4 w-4" />;
      case "design": return <PaintBucket className="h-4 w-4" />;
      case "generate": return (
        <img 
          src="/generate-icon.png" 
          alt="Generate" 
          className="h-4 w-4"
        />
      );
      case "deploy": return <Upload className="h-4 w-4" />;
    }
  };

  const getDescription = (mode: AppMode) => {
    switch (mode) {
      case "idea": return "Brainstorm ideas and generate functional requirements";
      case "design": return "Design UI components and visualize interfaces";
      case "generate": return "Generate code with different levels of automation";
      case "deploy": return "Deploy and manage your code in production";
    }
  };

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
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        {getIcon(appMode)}
                        <span className="capitalize">{appMode} Mode</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem onClick={() => setAppMode("idea")} className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        <span>Idea Mode</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAppMode("design")} className="flex items-center gap-2">
                        <PaintBucket className="h-4 w-4" />
                        <span>Design Mode</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAppMode("generate")} className="flex items-center gap-2">
                        <img src="/generate-icon.png" alt="Generate" className="h-4 w-4" />
                        <span>Generate Mode</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAppMode("deploy")} className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span>Deploy Mode</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {appMode === "generate" && (
                    <Select value={generateMode} onValueChange={(value: GenerateSubMode) => setGenerateMode(value)}>
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
                  )}
                </div>
              </div>
              <CardDescription>
                {getDescription(appMode)}
                {appMode === "generate" && generateMode === "chat" && " - Ask questions and get AI-generated answers."}
                {appMode === "generate" && generateMode === "agent" && " - Request code generation and review before insertion."}
                {appMode === "generate" && generateMode === "agent-auto" && " - Automatically generate, insert, execute and test code."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appMode === "generate" && generateMode === "chat" && <ChatMode />}
              {appMode === "generate" && generateMode === "agent" && <AgentMode />}
              {appMode === "generate" && generateMode === "agent-auto" && <AgentAutoMode />}
              {appMode === "idea" && <IdeaMode />}
              {appMode === "design" && <DesignMode />}
              {appMode === "deploy" && <DeployMode />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
