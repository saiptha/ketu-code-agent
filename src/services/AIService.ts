
import { useState } from "react";
import axios from "axios";

type AIProvider = "openai" | "anthropic" | "groq" | "ollama" | "custom";

type AIServiceConfig = {
  provider: AIProvider;
  apiKey: string;
  model: string;
  endpoint?: string;
};

type CodeResponse = {
  explanation: string;
  code: string;
  language: string;
};

const aiApiClients = {
  openai: async (prompt: string, model: string, apiKey: string) => {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
  },
  
  anthropic: async (prompt: string, model: string, apiKey: string) => {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.content[0].text;
  },
  
  groq: async (prompt: string, model: string, apiKey: string) => {
    const response = await axios.post(
      "https://api.groq.com/v1/chat/completions",
      {
        model,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
  },
  
  ollama: async (prompt: string, model: string) => {
    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model,
        prompt,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.response;
  },
  
  custom: async (prompt: string, model: string, apiKey: string, endpoint: string) => {
    const response = await axios.post(
      endpoint,
      {
        model,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices?.[0]?.message?.content || response.data.response || response.data.text;
  },
};

export const useAIService = () => {
  const [config, setConfig] = useState<AIServiceConfig>({
    provider: "openai",
    apiKey: "",
    model: "",
  });
  
  const configure = async (newConfig: AIServiceConfig) => {
    setConfig(newConfig);
    return true;
  };
  
  const generateChatResponse = async (
    query: string,
    contextDocs: string[]
  ): Promise<string> => {
    try {
      const contextText = contextDocs.join("\n\n");
      
      const prompt = `
        Use the following documentation as context to answer the user's question:
        
        ${contextText}
        
        User question: ${query}
        
        Provide a clear and concise answer based on the context provided. If the context doesn't contain relevant information, provide your best response based on general knowledge.
      `;
      
      let response;
      
      switch (config.provider) {
        case "openai":
          response = await aiApiClients.openai(prompt, config.model, config.apiKey);
          break;
        case "anthropic":
          response = await aiApiClients.anthropic(prompt, config.model, config.apiKey);
          break;
        case "groq":
          response = await aiApiClients.groq(prompt, config.model, config.apiKey);
          break;
        case "ollama":
          response = await aiApiClients.ollama(prompt, config.model);
          break;
        case "custom":
          response = await aiApiClients.custom(prompt, config.model, config.apiKey, config.endpoint!);
          break;
        default:
          throw new Error("Invalid provider specified");
      }
      
      return response;
    } catch (error) {
      console.error("Error generating chat response:", error);
      throw error;
    }
  };
  
  const generateCode = async (
    query: string,
    contextDocs: string[],
    githubContext?: string
  ): Promise<CodeResponse> => {
    try {
      const contextText = contextDocs.join("\n\n");
      
      const prompt = `
        Use the following documentation as context to generate code that satisfies the user's request:
        
        ${contextText}
        
        ${githubContext ? `Also consider this repository context: ${githubContext}` : ""}
        
        User request: ${query}
        
        Generate detailed, working code that fulfills the request. Include comments to explain key parts.
        Return your response in the following JSON format:
        {
          "explanation": "A clear explanation of the generated code and how it satisfies the request",
          "code": "The full generated code",
          "language": "The programming language of the code (e.g., python, javascript, java)"
        }
      `;
      
      let rawResponse;
      
      switch (config.provider) {
        case "openai":
          rawResponse = await aiApiClients.openai(prompt, config.model, config.apiKey);
          break;
        case "anthropic":
          rawResponse = await aiApiClients.anthropic(prompt, config.model, config.apiKey);
          break;
        case "groq":
          rawResponse = await aiApiClients.groq(prompt, config.model, config.apiKey);
          break;
        case "ollama":
          rawResponse = await aiApiClients.ollama(prompt, config.model);
          break;
        case "custom":
          rawResponse = await aiApiClients.custom(
            prompt,
            config.model,
            config.apiKey,
            config.endpoint!
          );
          break;
        default:
          throw new Error("Invalid provider specified");
      }
      
      // Try to parse the JSON response
      try {
        // Extract JSON from the response (in case the model wrapped it in text)
        const jsonMatch = rawResponse.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) ||
                        rawResponse.match(/({[\s\S]*})/);
        
        const jsonStr = jsonMatch ? jsonMatch[1] : rawResponse;
        const parsedResponse = JSON.parse(jsonStr);
        
        return {
          explanation: parsedResponse.explanation || "Generated code based on your request.",
          code: parsedResponse.code || "",
          language: parsedResponse.language || "text",
        };
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        
        // Fallback: Try to extract code blocks
        const codeBlockMatch = rawResponse.match(/```(?:(\w+))?\s*([\s\S]*?)```/);
        
        if (codeBlockMatch) {
          return {
            explanation: "Generated code based on your request.",
            code: codeBlockMatch[2].trim(),
            language: codeBlockMatch[1] || "text",
          };
        }
        
        // If all else fails, return the raw response
        return {
          explanation: "Generated content based on your request.",
          code: rawResponse,
          language: "text",
        };
      }
    } catch (error) {
      console.error("Error generating code:", error);
      throw error;
    }
  };
  
  return {
    configure,
    generateChatResponse,
    generateCode,
  };
};
