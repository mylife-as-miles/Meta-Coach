// lib/agents/gemini.ts
// Gemini SDK wrapper for MetaCoach agents

import { AGENTS, INTENT_TO_AGENT, AgentConfig } from './registry';

const GEMINI_MODEL = 'gemini-2.5-pro-preview-05-06';

interface GeminiResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}

/**
 * Build prompt from agent config and context
 */
export function buildPrompt(agentType: keyof typeof AGENTS, context: Record<string, unknown>): string {
    const agent = AGENTS[agentType];
    if (!agent) {
        throw new Error(`Unknown agent type: ${agentType}`);
    }

    return `SYSTEM:
${agent.system}

CONTEXT (JSON):
${JSON.stringify(context, null, 2)}

TASK:
${agent.task}

OUTPUT FORMAT:
Return STRICT JSON only matching this schema:
${agent.outputSchema || '{ "result": "..." }'}

Do not include any text outside the JSON object.`;
}

/**
 * Call Gemini API with structured prompt
 */
export async function runAgent(
    agentType: keyof typeof AGENTS,
    context: Record<string, unknown>,
    apiKey: string
): Promise<GeminiResponse> {
    // Validate context
    if (!context || Object.keys(context).length === 0) {
        return {
            success: false,
            error: 'INSUFFICIENT_DATA: Context payload is empty'
        };
    }

    const prompt = buildPrompt(agentType, context);

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No response from Gemini');
        }

        // Parse JSON response
        try {
            const parsed = JSON.parse(text);
            return { success: true, data: parsed };
        } catch {
            // If JSON parsing fails, return raw text
            return { success: true, data: { rawResponse: text } };
        }

    } catch (error) {
        console.error('Gemini agent error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Route intent to appropriate agent
 */
export function routeAgent(
    intent: keyof typeof INTENT_TO_AGENT,
    context: Record<string, unknown>,
    apiKey: string
): Promise<GeminiResponse> {
    const agentType = INTENT_TO_AGENT[intent];
    if (!agentType) {
        return Promise.resolve({
            success: false,
            error: `Unknown intent: ${intent}`
        });
    }

    return runAgent(agentType, context, apiKey);
}

/**
 * Get available intents
 */
export function getAvailableIntents(): string[] {
    return Object.keys(INTENT_TO_AGENT);
}

/**
 * Get agent info
 */
export function getAgentInfo(agentType: keyof typeof AGENTS): AgentConfig | undefined {
    return AGENTS[agentType];
}
