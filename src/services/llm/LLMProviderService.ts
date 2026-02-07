/**
 * LLMProviderService - LLM Provider 管理服务
 *
 * 管理所有已注册的 Provider，根据配置路由查询到对应 Provider
 * 读取/写入 VSCode 配置，支持运行时切换 Provider
 */

import { ILogService } from '../logService';
import { IConfigurationService } from '../configurationService';
import type {
    ILLMProviderService,
    ILLMProviderBackend,
    LLMQueryHandle,
    ProviderStatus,
} from './ILLMProvider';
import type {
    ProviderType,
    ProviderConfig,
    LLMQueryParams,
    ModelInfo,
    CustomModelConfig,
} from './types';
import { DEFAULT_MODELS, PROVIDER_DEFAULT_URLS } from './types';

// Provider 实现
import { ClaudeCodeProvider } from './providers/ClaudeCodeProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GeminiProvider } from './providers/GeminiProvider';

// 重新导出 decorator
export { ILLMProviderService } from './ILLMProvider';

/**
 * LLMProviderService 实现
 */
export class LLMProviderService implements ILLMProviderService {
    readonly _serviceBrand: undefined;

    private providers = new Map<ProviderType, ILLMProviderBackend>();
    private activeType: ProviderType = 'claude-code';
    private currentConfig: ProviderConfig = { type: 'claude-code' };

    constructor(
        @ILogService private readonly logService: ILogService,
        @IConfigurationService private readonly configService: IConfigurationService
    ) {
        // 注册所有 Provider
        this.registerProvider(new ClaudeCodeProvider());
        this.registerProvider(new OpenAIProvider());
        this.registerProvider(new AnthropicProvider());
        this.registerProvider(new GeminiProvider());

        // 从配置加载
        this.loadFromConfig();

        // 监听配置变更
        configService.onDidChangeConfiguration((e: any) => {
            if (e.affectsConfiguration?.('claudix')) {
                this.loadFromConfig();
            }
        });

        this.logService.info('[LLMProviderService] 已初始化，注册了 ' + this.providers.size + ' 个 Provider');
    }

    // ========================================================================
    // 公共方法
    // ========================================================================

    getActiveProviderType(): ProviderType {
        return this.activeType;
    }

    getProviderConfig(): ProviderConfig {
        return { ...this.currentConfig };
    }

    async setActiveProvider(type: ProviderType): Promise<void> {
        if (!this.providers.has(type)) {
            throw new Error(`未知的 Provider 类型: ${type}`);
        }

        this.activeType = type;
        this.currentConfig.type = type;

        // 从配置读取该 Provider 的设置
        this.loadProviderSpecificConfig(type);

        // 初始化 Provider
        const provider = this.providers.get(type)!;
        await provider.initialize(this.currentConfig);

        // 保存到 VSCode 配置
        await this.configService.updateValue('claudix.provider', type);

        this.logService.info(`[LLMProviderService] 切换到 Provider: ${type}`);
    }

    async updateProviderConfig(config: Partial<ProviderConfig>): Promise<void> {
        // 只合并非 undefined 的值，防止覆盖已有配置
        for (const [key, value] of Object.entries(config)) {
            if (value !== undefined) {
                (this.currentConfig as any)[key] = value;
            }
        }

        // 重新初始化当前 Provider
        const provider = this.providers.get(this.activeType);
        if (provider) {
            await provider.initialize(this.currentConfig);
        }

        // 持久化关键配置
        if (config.apiKey !== undefined) {
            await this.configService.updateValue(`claudix.${this.activeType}ApiKey`, config.apiKey);
        }
        if (config.baseUrl !== undefined) {
            await this.configService.updateValue(`claudix.${this.activeType}BaseUrl`, config.baseUrl);
        }
        if (config.defaultModel !== undefined) {
            await this.configService.updateValue(`claudix.${this.activeType}DefaultModel`, config.defaultModel);
        }
        if (config.customModels !== undefined) {
            await this.configService.updateValue(`claudix.${this.activeType}CustomModels`, config.customModels);
        }
        if (config.extraHeaders !== undefined) {
            await this.configService.updateValue(`claudix.${this.activeType}ExtraHeaders`, config.extraHeaders);
        }

        this.logService.info(`[LLMProviderService] 更新配置: ${JSON.stringify(Object.keys(config))}`);
    }

    async query(params: LLMQueryParams): Promise<LLMQueryHandle> {
        const provider = this.providers.get(this.activeType);
        if (!provider) {
            throw new Error(`Provider 未找到: ${this.activeType}`);
        }

        if (!provider.isReady()) {
            throw new Error(`Provider "${this.activeType}" 未就绪，请检查 API Key 配置`);
        }

        this.logService.info(`[LLMProviderService] 使用 ${this.activeType} 执行查询, model=${params.model}`);
        return provider.query(params);
    }

    getAvailableModels(): ModelInfo[] {
        // 只返回用户配置的自定义模型，不包含内置默认模型
        // claude-code 模式的模型由 SDK loadConfig 提供，不走此处
        const customModels = this.getCustomModels();
        return customModels;
    }

    getAllModels(): Record<ProviderType, ModelInfo[]> {
        const result: Record<ProviderType, ModelInfo[]> = {
            'claude-code': [],
            'openai': [],
            'anthropic': [],
            'gemini': [],
        };

        for (const [type, provider] of this.providers) {
            result[type] = provider.getModels();
        }

        // 添加自定义模型
        const customModels = this.getCustomModels();
        for (const model of customModels) {
            const providerType = model.provider || this.activeType;
            if (result[providerType]) {
                result[providerType].push(model);
            }
        }

        return result;
    }

    isReady(): boolean {
        const provider = this.providers.get(this.activeType);
        return provider?.isReady() ?? false;
    }

    getStatus(): ProviderStatus {
        const provider = this.providers.get(this.activeType);
        const apiKey = this.currentConfig.apiKey || '';
        return {
            type: this.activeType,
            ready: provider?.isReady() ?? false,
            hasApiKey: !!apiKey,
            apiKeyMasked: apiKey ? apiKey.slice(0, 4) + '****' + apiKey.slice(-4) : '',
            baseUrl: this.currentConfig.baseUrl || PROVIDER_DEFAULT_URLS[this.activeType] || '',
            currentModel: this.currentConfig.defaultModel || '',
            customModels: (this.currentConfig.customModels || []).map(c => ({
                id: c.id,
                label: c.label,
                description: c.description,
            })),
            extraHeaders: this.currentConfig.extraHeaders || {},
        };
    }

    // ========================================================================
    // 私有方法
    // ========================================================================

    private registerProvider(provider: ILLMProviderBackend): void {
        this.providers.set(provider.type, provider);
    }

    private loadFromConfig(): void {
        // 读取 Provider 类型
        const providerType = this.configService.getValue<string>('claudix.provider', 'claude-code') as ProviderType;
        this.activeType = providerType;

        this.loadProviderSpecificConfig(providerType);

        // 初始化 Provider（异步，不阻塞）
        const provider = this.providers.get(providerType);
        if (provider) {
            provider.initialize(this.currentConfig).catch(err => {
                this.logService.error(`[LLMProviderService] Provider 初始化失败: ${err}`);
            });
        }
    }

    private loadProviderSpecificConfig(type: ProviderType): void {
        // claude-code 不需要 API 配置，直接返回空配置
        if (type === 'claude-code') {
            this.currentConfig = { type };
            return;
        }

        this.currentConfig = {
            type,
            apiKey: this.configService.getValue<string>(`claudix.${type}ApiKey`, ''),
            baseUrl: this.configService.getValue<string>(`claudix.${type}BaseUrl`, PROVIDER_DEFAULT_URLS[type] || ''),
            defaultModel: this.configService.getValue<string>(`claudix.${type}DefaultModel`, ''),
            customModels: this.configService.getValue<CustomModelConfig[]>(`claudix.${type}CustomModels`, []),
            extraHeaders: this.configService.getValue<Record<string, string>>(`claudix.${type}ExtraHeaders`, {}),
            timeout: this.configService.getValue<number>(`claudix.${type}Timeout`, 60000),
        };
    }

    private getCustomModels(): ModelInfo[] {
        const customConfigs = this.currentConfig.customModels || [];
        return customConfigs.map(c => ({
            id: c.id,
            label: c.label,
            description: c.description,
            provider: c.provider || this.activeType,
            contextWindow: c.contextWindow,
            supportsTools: c.supportsTools,
            supportsVision: c.supportsVision,
            maxOutputTokens: c.maxOutputTokens,
        }));
    }
}
