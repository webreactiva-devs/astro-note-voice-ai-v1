import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PromptConfig {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  content_limit?: number;
  description?: string;
}

interface ParsedPrompt {
  systemPrompt: string;
  config: PromptConfig;
}

/**
 * Parse a markdown prompt file with YAML frontmatter
 */
function parsePromptFile(filePath: string): ParsedPrompt {
  const content = fs.readFileSync(filePath, "utf-8");

  // Parse YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    throw new Error(`Invalid prompt file format: ${filePath}`);
  }

  const [, yamlContent, systemPrompt] = frontmatterMatch;

  // Parse YAML manually (simple key-value parsing)
  const config: PromptConfig = {};
  const yamlLines = yamlContent.split("\n");

  for (const line of yamlLines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      switch (key) {
        case "model":
          config.model = value.trim();
          break;
        case "max_tokens":
          config.max_tokens = parseInt(value.trim());
          break;
        case "temperature":
          config.temperature = parseFloat(value.trim());
          break;
        case "content_limit":
          config.content_limit = parseInt(value.trim());
          break;
        case "description":
          config.description = value.trim();
          break;
      }
    }
  }

  return {
    systemPrompt: systemPrompt.trim(),
    config,
  };
}

/**
 * Load a prompt template by name
 */
export function loadPrompt(promptName: string): ParsedPrompt {
  const promptPath = path.join(__dirname, `${promptName}.md`);

  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${promptName}.md`);
  }

  return parsePromptFile(promptPath);
}

/**
 * Replace variables in a prompt template
 */
export function renderPrompt(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    rendered = rendered.replace(new RegExp(placeholder, "g"), value);
  }

  return rendered;
}

/**
 * List all available prompts
 */
export function listPrompts(): string[] {
  const promptsDir = __dirname;
  const files = fs.readdirSync(promptsDir);

  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(".md", ""));
}

/**
 * Get prompt configuration for API calls
 */
export function getPromptConfig(promptName: string) {
  const prompt = loadPrompt(promptName);

  return {
    model: prompt.config.model || "llama-3.3-70b-versatile",
    max_tokens: prompt.config.max_tokens || 100,
    temperature: prompt.config.temperature || 0.3,
  };
}
