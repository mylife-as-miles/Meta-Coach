// lib/agents/index.ts
// Main export for MetaCoach Agent system

export { AGENTS, INTENT_TO_AGENT, type AgentConfig } from './registry';
export {
    buildPrompt,
    runAgent,
    routeAgent,
    getAvailableIntents,
    getAgentInfo
} from './gemini';
