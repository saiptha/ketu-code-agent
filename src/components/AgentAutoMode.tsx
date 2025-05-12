
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useAIService } from "@/services/AIService";
import { useMCPClient } from "@/services/MCPClient";
import { useVSCodeService } from "@/services/VSCodeService";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  code?: string;
  language?: string;
  status?: "success" | "error" | "pending" | "running";
  testResults?: {
    passed: boolean;
    message: string;
  }[];
  timestamp: Date;
};

export const AgentAutoMode: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
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
      // Add system message to indicate process starting
      const processingId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        {
          id: processingId,
          role: "system",
          content: "Processing your request...",
          status: "pending",
          timestamp: new Date(),
        },
      ]);
      
      // Fetch relevant documentation from Context7 MCP Server
      const contextDocs = await mcpClient.fetchRelevantDocs(input);
      
      // Get GitHub context if available
      const githubContext = await vscodeService.getGitHubContext();
      
      // Update system message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === processingId
            ? {
                ...msg,
                content: "Generating code based on your request...",
                status: "running",
                timestamp: new Date(),
              }
            : msg
        )
      );
      
      // Generate code
      const codeResponse = await aiService.generateCode(input, contextDocs, githubContext);
      
      // Insert code into editor
      await vscodeService.insertCode(codeResponse.code);
      
      // Update system message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === processingId
            ? {
                ...msg,
                content: "Code generated and inserted. Executing...",
                status: "running",
                timestamp: new Date(),
              }
            : msg
        )
      );
      
      // Execute the code
      const executionResult = await vscodeService.executeCode(codeResponse.language);
      
      // Update system message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === processingId
            ? {
                ...msg,
                content: "Code execution complete. Running tests...",
                status: "running",
                timestamp: new Date(),
              }
            : msg
        )
      );
      
      // Run tests
      const testResults = await vscodeService.runTests();
      
      // Add final assistant message with results
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: codeResponse.explanation,
        code: codeResponse.code,
        language: codeResponse.language,
        status: testResults.every((t) => t.passed) ? "success" : "error",
        testResults: testResults,
        timestamp: new Date(),
      };
      
      // Remove processing message and add final message
      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== processingId),
        assistantMessage,
      ]);
      
      // Show toast based on results
      if (testResults.every((t) => t.passed)) {
        toast({
          title: "Success",
          description: "Code generated, executed and tested successfully",
        });
      } else {
        toast({
          title: "Warning",
          description: "Some tests failed. Check the results for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed in auto agent process:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "system",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        status: "error",
        timestamp: new Date(),
      };
      
      // Remove processing message and add error message
      setMessages((prev) => [
        ...prev.filter((msg) => !msg.content.startsWith("Processing")),
        errorMessage,
      ]);
      
      toast({
        title: "Error",
        description: "Failed to complete the automated process",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-[600px]">
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Automatic Mode</AlertTitle>
        <AlertDescription>
          Ketu will automatically generate, insert, execute, and test the code based on your request.
        </AlertDescription>
      </Alert>
      
      <ScrollArea className="flex-1 p-4 mb-4 border rounded-md">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>Describe what you want Ketu to build for you</p>
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
                    : message.role === "system"
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-gray-100 mr-12"
                )}
              >
                <div className="font-semibold mb-1 flex items-center gap-2">
                  {message.role === "user" ? (
                    "You"
                  ) : message.role === "system" ? (
                    <>
                      <span>System</span>
                      {message.status === "pending" && (
                        <Loader className="h-3 w-3 animate-spin" />
                      )}
                      {message.status === "running" && (
                        <Loader className="h-3 w-3 animate-spin text-blue-500" />
                      )}
                      {message.status === "error" && (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                    </>
                  ) : (
                    <>
                      <span>Ketu</span>
                      {message.status === "success" && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                      {message.status === "error" && (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                    </>
                  )}
                </div>
                
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {message.code && (
                  <div className="mt-4">
                    <div className="bg-gray-800 text-white p-4 rounded overflow-auto">
                      <pre className="text-sm">
                        <code>{message.code}</code>
                      </pre>
                    </div>
                  </div>
                )}
                
                {message.testResults && message.testResults.length > 0 && (
                  <div className="mt-4 border rounded p-3">
                    <h4 className="font-medium mb-2">Test Results</h4>
                    <div className="space-y-2">
                      {message.testResults.map((test, i) => (
                        <div
                          key={i}
                          className={cn(
                            "p-2 rounded-md text-sm",
                            test.passed ? "bg-green-50" : "bg-red-50"
                          )}
                        >
                          {test.passed ? (
                            <CheckCircle className="inline-block h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="inline-block h-4 w-4 text-red-500 mr-2" />
                          )}
                          {test.message}
                        </div>
                      ))}
                    </div>
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
          placeholder="Describe what you want to build..."
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
