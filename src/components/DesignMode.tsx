
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader, PaintBucket } from "lucide-react";
import { useAIService } from "@/services/AIService";
import { useMCPClient } from "@/services/MCPClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  designDescription?: string;
  timestamp: Date;
};

export const DesignMode: React.FC = () => {
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
      
      // Create specialized prompt for design guidance
      const designPrompt = `
        I need design guidance for the following UI/UX requirement:
        ${input}
        
        Please provide:
        1. A description of the appropriate UI components
        2. Suggested layout structure
        3. Recommended color scheme and styling
        4. Accessibility considerations
        5. Tailwind CSS and shadcn/ui implementation suggestions
      `;
      
      // Send user message and design-focused prompt to AI service
      const response = await aiService.generateChatResponse(designPrompt, contextDocs);
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to get design guidance:", error);
      toast({
        title: "Error",
        description: "Failed to generate design guidance",
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
            <PaintBucket className="h-12 w-12 text-violet-400" />
            <p className="text-center">Describe the UI or component you want to design</p>
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
                    : "bg-violet-50 mr-12"
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
          placeholder="Describe the UI component or design needs..."
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
