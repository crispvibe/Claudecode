/**
 * LLM Provider 类型定义
 *
 * 统一不同 API 协议的消息格式和配置
 * 支持: Claude Code SDK, OpenAI, Anthropic HTTP, Gemini
 */

// ============================================================================
// Provider 配置类型
// ============================================================================

/**
 * 支持的 Provider 类型（统一使用 Claude Code SDK）
 */
export type ProviderType = 'claude-code';

/**
 * Provider 配置
 */
export interface ProviderConfig {
    /** Provider 类型 */
    type: ProviderType;
    /** API Key */
    apiKey?: string;
    /** API Base URL（用于自定义端点/代理） */
    baseUrl?: string;
    /** 默认模型 ID */
    defaultModel?: string;
    /** 自定义模型列表 */
    customModels?: CustomModelConfig[];
    /** 额外的请求头 */
    extraHeaders?: Record<string, string>;
    /** 请求超时（毫秒） */
    timeout?: number;
}

/**
 * 自定义模型配置
 */
export interface CustomModelConfig {
    /** 模型 ID（发送给 API 的值） */
    id: string;
    /** 显示名称 */
    label: string;
    /** 描述 */
    description?: string;
    /** 所属 Provider */
    provider?: ProviderType;
    /** 上下文窗口大小 */
    contextWindow?: number;
    /** 是否支持工具调用 */
    supportsTools?: boolean;
    /** 是否支持视觉（图片输入） */
    supportsVision?: boolean;
    /** 最大输出 tokens */
    maxOutputTokens?: number;
}

// ============================================================================
// 统一消息类型（内部格式）
// ============================================================================

/**
 * 消息角色
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * 内容块类型
 */
export type ContentBlockType = 'text' | 'image' | 'tool_use' | 'tool_result' | 'thinking';

/**
 * 文本内容块
 */
export interface TextContentBlock {
    type: 'text';
    text: string;
}

/**
 * 图片内容块
 */
export interface ImageContentBlock {
    type: 'image';
    source: {
        type: 'base64' | 'url';
        media_type?: string;
        data: string;
        url?: string;
    };
}

/**
 * 工具调用内容块
 */
export interface ToolUseContentBlock {
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, unknown>;
}

/**
 * 工具结果内容块
 */
export interface ToolResultContentBlock {
    type: 'tool_result';
    tool_use_id: string;
    content: string | ContentBlock[];
    is_error?: boolean;
}

/**
 * 思考内容块
 */
export interface ThinkingContentBlock {
    type: 'thinking';
    thinking: string;
}

/**
 * 联合内容块类型
 */
export type ContentBlock =
    | TextContentBlock
    | ImageContentBlock
    | ToolUseContentBlock
    | ToolResultContentBlock
    | ThinkingContentBlock;

/**
 * 统一消息格式
 */
export interface LLMMessage {
    role: MessageRole;
    content: string | ContentBlock[];
}

// ============================================================================
// 工具定义（统一格式）
// ============================================================================

/**
 * 工具参数属性
 */
export interface ToolParameterProperty {
    type: string;
    description?: string;
    enum?: string[];
    items?: ToolParameterProperty;
    properties?: Record<string, ToolParameterProperty>;
    required?: string[];
}

/**
 * 工具定义
 */
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, ToolParameterProperty>;
        required?: string[];
    };
}

// ============================================================================
// 流式事件（统一格式，兼容 Claude SDK 事件格式）
// ============================================================================

/**
 * 系统事件（会话初始化）
 */
export interface SystemEvent {
    type: 'system';
    subtype: 'init';
    session_id: string;
}

/**
 * 助手消息事件（流式增量或完整）
 */
export interface AssistantEvent {
    type: 'assistant';
    message: {
        role: 'assistant';
        content: ContentBlock[];
        model?: string;
        usage?: UsageInfo;
        stop_reason?: string;
    };
}

/**
 * 结果事件（完成标记）
 */
export interface ResultEvent {
    type: 'result';
    subtype: 'success' | 'error';
    session_id?: string;
    error?: string;
    cost_usd?: number;
    duration_ms?: number;
    is_error?: boolean;
    num_turns?: number;
}

/**
 * 用户消息事件
 */
export interface UserEvent {
    type: 'user';
    session_id: string;
    parent_tool_use_id: string | null;
    message: {
        role: 'user';
        content: ContentBlock[];
    };
}

/**
 * 联合事件类型（兼容 SDK 的 SDKMessage）
 */
export type LLMStreamEvent = SystemEvent | AssistantEvent | ResultEvent | UserEvent;

// ============================================================================
// 使用统计
// ============================================================================

export interface UsageInfo {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
}

// ============================================================================
// Provider 查询参数
// ============================================================================

/**
 * 查询参数
 */
export interface LLMQueryParams {
    /** 用户消息内容 */
    messages: LLMMessage[];
    /** 模型 ID */
    model: string;
    /** 系统提示 */
    systemPrompt?: string;
    /** 工具定义 */
    tools?: ToolDefinition[];
    /** 最大输出 tokens */
    maxTokens?: number;
    /** 温度 */
    temperature?: number;
    /** 是否启用流式输出 */
    stream?: boolean;
    /** 最大思考 tokens（扩展思考） */
    maxThinkingTokens?: number;
    /** 工作目录 */
    cwd?: string;
    /** 会话 ID（用于恢复） */
    sessionId?: string;
}

// ============================================================================
// Provider 模型信息
// ============================================================================

/**
 * 模型信息
 */
export interface ModelInfo {
    id: string;
    label: string;
    description?: string;
    provider: ProviderType;
    contextWindow?: number;
    supportsTools?: boolean;
    supportsVision?: boolean;
    maxOutputTokens?: number;
}

// ============================================================================
// 默认模型列表
// ============================================================================

/**
 * 各 Provider 的默认模型
 */
export const DEFAULT_MODELS: Record<ProviderType, ModelInfo[]> = {
    'claude-code': [
        {
            id: 'claude-opus-4-5',
            label: 'Claude Opus 4.5',
            description: '最强推理能力',
            provider: 'claude-code',
            contextWindow: 200000,
            supportsTools: true,
            supportsVision: true,
            maxOutputTokens: 32000,
        },
        {
            id: 'claude-sonnet-4-5',
            label: 'Claude Sonnet 4.5',
            description: '速度与质量平衡',
            provider: 'claude-code',
            contextWindow: 200000,
            supportsTools: true,
            supportsVision: true,
            maxOutputTokens: 16000,
        },
        {
            id: 'claude-haiku-4-5',
            label: 'Claude Haiku 4.5',
            description: '最快响应速度',
            provider: 'claude-code',
            contextWindow: 200000,
            supportsTools: true,
            supportsVision: true,
            maxOutputTokens: 8000,
        },
    ],
};

/**
 * Provider 显示名称
 */
export const PROVIDER_LABELS: Record<ProviderType, string> = {
    'claude-code': 'Claude Code (SDK)',
};

/**
 * Provider 默认 Base URL
 */
export const PROVIDER_DEFAULT_URLS: Record<ProviderType, string> = {
    'claude-code': '',
};
