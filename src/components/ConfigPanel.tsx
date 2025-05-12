
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAIService } from "@/services/AIService";
import { useMCPClient } from "@/services/MCPClient";
import { useVSCodeService } from "@/services/VSCodeService";
import { useToast } from "@/hooks/use-toast";

type AIProvider = "openai" | "anthropic" | "groq" | "ollama" | "custom";

export const ConfigPanel: React.FC = () => {
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [useGitHub, setUseGitHub] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  
  const aiService = useAIService();
  const mcpClient = useMCPClient();
  const vscodeService = useVSCodeService();
  const { toast } = useToast();
  
  const handleSaveConfig = async () => {
    try {
      // Save AI provider configuration
      await aiService.configure({ provider, apiKey, model, endpoint });
      
      // Configure GitHub if enabled
      if (useGitHub) {
        await vscodeService.configureGitHub(repoUrl);
      }
      
      // Configure MCP client
      await mcpClient.configure();
      
      toast({
        title: "Configuration saved",
        description: "Your changes have been applied",
      });
    } catch (error) {
      console.error("Failed to save configuration:", error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    }
  };
  
  const ollemaModels = [
    "llama3",
    "llama2",
    "codellama",
    "mistral",
    "dolphin-mistral",
    "phi",
    "gemma"
  ];
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="ai-provider">AI Provider</Label>
          <Select
            value={provider}
            onValueChange={(value: AIProvider) => setProvider(value)}
          >
            <SelectTrigger id="ai-provider">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="ollama">Ollama (Local)</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {provider !== "ollama" && (
          <div>
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              placeholder="Enter API key"
            />
          </div>
        )}
        
        <div>
          <Label htmlFor="model">Model</Label>
          {provider === "ollama" ? (
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {ollemaModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={
                provider === "openai"
                  ? "e.g., gpt-4"
                  : provider === "anthropic"
                  ? "e.g., claude-3"
                  : provider === "groq"
                  ? "e.g., llama3-70b"
                  : "Enter model name"
              }
            />
          )}
        </div>
        
        {provider === "custom" && (
          <div>
            <Label htmlFor="endpoint">API Endpoint</Label>
            <Input
              id="endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.example.com/v1"
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2 pt-4">
          <Switch
            id="github-integration"
            checked={useGitHub}
            onCheckedChange={setUseGitHub}
          />
          <Label htmlFor="github-integration">Enable GitHub Integration</Label>
        </div>
        
        {useGitHub && (
          <div>
            <Label htmlFor="repo-url">Repository URL</Label>
            <Input
              id="repo-url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
            />
          </div>
        )}
      </div>
      
      <Button onClick={handleSaveConfig} className="w-full">
        Save Configuration
      </Button>
    </div>
  );
};
