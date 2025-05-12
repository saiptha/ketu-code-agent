
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader, Upload } from "lucide-react";
import { useAIService } from "@/services/AIService";
import { useMCPClient } from "@/services/MCPClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export const DeployMode: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const aiService = useAIService();
  const mcpClient = useMCPClient();
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
      
      // Create specialized prompt for deployment guidance
      const deployPrompt = `
        I need deployment guidance for the following:
        ${input}
        
        Please provide:
        1. Recommended deployment steps
        2. Configuration and environment setup
        3. Best practices for CI/CD
        4. Troubleshooting tips for common deployment issues
        5. Post-deployment monitoring recommendations
      `;
      
      // Send user message and deployment-focused prompt to AI service
      const response = await aiService.generateChatResponse(deployPrompt, contextDocs);
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to get deployment guidance:", error);
      toast({
        title: "Error",
        description: "Failed to generate deployment guidance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-[600px]">
      <ScrollArea className="flex-1 p-4 mb-4 border rounded-md">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <Upload className="h-12 w-12 text-green-400" />
            <p className="text-center">Ask for deployment guidance and CI/CD setup</p>
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
                    : "bg-green-50 mr-12"
                )}
              >
                <div className="font-semibold mb-1">
                  {message.role === "user" ? "You" : "Ketu"}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
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
          placeholder="Ask about deployment, CI/CD, or infrastructure..."
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
