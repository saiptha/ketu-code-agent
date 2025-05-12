
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader, Copy, Check } from "lucide-react";
import { useAIService } from "@/services/AIService";
import { useMCPClient } from "@/services/MCPClient";
import { useVSCodeService } from "@/services/VSCodeService";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  code?: string;
  language?: string;
  timestamp: Date;
};

export const AgentMode: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copying, setCopying] = useState<string | null>(null);
  
  const aiService = useAIService();
  const mcpClient = useMCPClient();
  const vscodeService = useVSCodeService();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Fetch relevant documentation from Context7 MCP Server
      const contextDocs = await mcpClient.fetchRelevantDocs(input);
      
      // Get GitHub context if available
      const githubContext = await vscodeService.getGitHubContext();
      
      // Send user message, context and GitHub data to AI service
      const response = await aiService.generateCode(input, contextDocs, githubContext);
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: response.explanation,
        code: response.code,
        language: response.language,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to generate code:", error);
      toast({
        title: "Error",
        description: "Failed to generate code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInsertCode = async (code: string) => {
    try {
      await vscodeService.insertCode(code);
      toast({
        title: "Success",
        description: "Code inserted into active editor",
      });
    } catch (error) {
      console.error("Failed to insert code:", error);
      toast({
        title: "Error",
        description: "Failed to insert code into editor",
        variant: "destructive",
      });
    }
  };
  
  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopying(id);
      setTimeout(() => setCopying(null), 2000);
      
      toast({
        title: "Copied",
        description: "Code copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex flex-col h-[600px]">
      <ScrollArea className="flex-1 p-4 mb-4 border rounded-md">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>Describe what code you want Ketu to generate</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "p-3 rounded-lg",
                  message.role === "user"
                    ? "bg-blue-100 ml-12"
                    : "bg-gray-100 mr-12"
                )}
              >
                <div className="font-semibold mb-1">
                  {message.role === "user" ? "You" : "Ketu"}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {message.code && (
                  <div className="mt-4">
                    <div className="bg-gray-800 text-white p-4 rounded overflow-auto relative">
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopy(message.code!, message.id)}
                          className="h-6 w-6 bg-gray-700 hover:bg-gray-600"
                        >
                          {copying === message.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <pre className="text-sm">
                        <code>{message.code}</code>
                      </pre>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => handleInsertCode(message.code!)}
                    >
                      Insert into Editor
                    </Button>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the code you need..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};
