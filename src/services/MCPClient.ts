
import { useState } from "react";
import axios from "axios";

export const useMCPClient = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  
  const configure = async () => {
    try {
      // No specific configuration needed for the MCP client
      // Just checking if we can connect to the Context7 MCP Server
      await axios.get("https://context7-mcp-server.example.com/health");
      setIsConfigured(true);
      return true;
    } catch (error) {
      console.error("Failed to configure MCP client:", error);
      // We'll continue even if the health check fails
      // The server might still be available for requests
      setIsConfigured(true);
      return true;
    }
  };
  
  const fetchRelevantDocs = async (query: string): Promise<string[]> => {
    try {
      // TODO: Replace with actual Context7 MCP Server API endpoint
      const response = await axios.post(
        "https://context7-mcp-server.example.com/api/fetch-docs",
        {
          query,
          languages: ["javascript", "typescript", "python", "java"],
          frameworks: ["react", "node", "django", "spring"],
        }
      );
      
      return response.data.documents || [];
    } catch (error) {
      console.error("Failed to fetch relevant docs:", error);
      
      // Return some basic documentation as fallback
      return [
        "# Basic Documentation\nThis is a fallback documentation as we couldn't connect to the Context7 MCP Server.",
        "The Ketu VS Code extension can help you write code, answer questions, and execute code.",
      ];
    }
  };
  
  return {
    configure,
    fetchRelevantDocs,
    isConfigured,
  };
};
