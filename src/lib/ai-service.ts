import { getConfig } from './config';
import { loadPrompt, getPromptConfig } from './prompts';

interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

/**
 * Make a request to Groq API with a specific prompt
 */
async function callGroqAPI(
  systemPrompt: string, 
  userContent: string, 
  config: { model: string; max_tokens: number; temperature: number }
): Promise<AIResponse> {
  const apiConfig = getConfig();
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        max_tokens: config.max_tokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content?.trim() || '';
    
    return {
      content,
      success: true
    };
  } catch (error) {
    console.error('Groq API error:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a title for note content using the title-generation prompt
 */
export async function generateTitle(content: string): Promise<string> {
  try {
    const prompt = loadPrompt('title-generation');
    const config = getPromptConfig('title-generation');
    
    // Limit content as specified in prompt config
    const limitedContent = content.substring(0, prompt.config.content_limit || 1000);
    
    const response = await callGroqAPI(
      prompt.systemPrompt,
      limitedContent,
      config
    );
    
    return response.success ? response.content : 'Nota de voz';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'Nota de voz';
  }
}

/**
 * Generate tags for note content using the tags-generation prompt
 */
export async function generateTags(content: string): Promise<string[]> {
  try {
    const prompt = loadPrompt('tags-generation');
    const config = getPromptConfig('tags-generation');
    
    // Limit content as specified in prompt config
    const limitedContent = content.substring(0, prompt.config.content_limit || 1000);
    
    const response = await callGroqAPI(
      prompt.systemPrompt,
      limitedContent,
      config
    );
    
    if (response.success) {
      return response.content
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }
    
    return [];
  } catch (error) {
    console.error('Error generating tags:', error);
    return [];
  }
}

/**
 * Organize ideas from transcription using the idea-organization prompt
 */
export async function organizeIdeas(transcription: string): Promise<string> {
  try {
    const prompt = loadPrompt('idea-organization');
    const config = getPromptConfig('idea-organization');
    
    // Limit content as specified in prompt config
    const limitedContent = transcription.substring(0, prompt.config.content_limit || 2000);
    
    const response = await callGroqAPI(
      prompt.systemPrompt,
      limitedContent,
      config
    );
    
    return response.success ? response.content : transcription;
  } catch (error) {
    console.error('Error organizing ideas:', error);
    return transcription; // Return original if organization fails
  }
}

/**
 * Generate title and tags from organized content
 */
export async function generateTitleAndTags(content: string): Promise<{ title: string; tags: string[] }> {
  const [title, tags] = await Promise.all([
    generateTitle(content),
    generateTags(content)
  ]);
  
  return { title, tags };
}