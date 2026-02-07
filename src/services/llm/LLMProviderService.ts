/**
 * LLMProviderService - 配置管理服务
 *
 * 管理 SDK 的自定义配置（API Key / Base URL / 自定义模型）
 * 读取/写入 VSCode 配置
 */

import { ILogService } from '../logService';
import { IConfigurationService } from '../configurationService';
import type {
    ILLMProviderService,
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

// 重新导出 decorator
export { ILLMProviderService } from './ILLMProvider';

/**
 * LLMProviderService 实现（纯配置存储，不执行 HTTP 查询）
 */
export class LLMProviderService implements ILLMProviderService {
    readonly _serviceBrand: undefined;

    private currentConfig: ProviderConfig = { type: 'claude-code' };

    constructor(
        @ILogService private readonly logService: ILogService,
        @IConfigurationService private readonly configService: IConfigurationService
    ) {
        // 从配置加载
        this.loadFromConfig();

        // 监听配置变更
        configService.onDidChangeConfiguration((e: any) => {
            if (e.affectsConfiguration?.('claudix')) {
                this.loadFromConfig();
            }
        });

        this.logService.info('[LLMProviderService] 已初始化（SDK 配置管理模式）');
    }

    // ========================================================================
    // 公共方法
    // ========================================================================

    getActiveProviderType(): ProviderType {
        return 'claude-code';
    }

    getProviderConfig(): ProviderConfig {
        return { ...this.currentConfig };
    }

    async setActiveProvider(_type: ProviderType): Promise<void> {
        // 统一使用 SDK，不需要切换 Provider
        this.logService.info(`[LLMProviderService] SDK 模式不需要切换 Provider`);
    }

    async updateProviderConfig(config: Partial<ProviderConfig>): Promise<void> {
        // 合并配置
        for (const [key, value] of Object.entries(config)) {
            if (value !== undefined) {
                (this.currentConfig as any)[key] = value;
            }
        }

        // 持久化关键配置
        if (config.apiKey !== undefined) {
            await this.configService.updateValue('claudix.apiKey', config.apiKey);
        }
        if (config.baseUrl !== undefined) {
            await this.configService.updateValue('claudix.baseUrl', config.baseUrl);
        }
        if (config.customModels !== undefined) {
            await this.configService.updateValue('claudix.customModels', config.customModels);
        }

        this.logService.info(`[LLMProviderService] 更新配置: ${JSON.stringify(Object.keys(config))}`);
    }

    async query(_params: LLMQueryParams): Promise<LLMQueryHandle> {
        // SDK 模式不通过此接口查询，由 ClaudeSdkService 直接处理
        throw new Error('SDK 模式不通过 LLMProviderService.query() 查询');
    }

    getAvailableModels(): ModelInfo[] {
        return this.getCustomModels();
    }

    getAllModels(): Record<ProviderType, ModelInfo[]> {
        return { 'claude-code': this.getCustomModels() };
    }

    isReady(): boolean {
        return true;
    }

    getStatus(): ProviderStatus {
        const apiKey = this.currentConfig.apiKey || '';
        return {
            type: 'claude-code',
            ready: true,
            hasApiKey: !!apiKey,
            apiKeyMasked: apiKey ? apiKey.slice(0, 4) + '****' + apiKey.slice(-4) : '',
            baseUrl: this.currentConfig.baseUrl || '',
            currentModel: this.currentConfig.defaultModel || '',
            customModels: (this.currentConfig.customModels || []).map(c => ({
                id: c.id,
                label: c.label,
                description: c.description,
            })),
            extraHeaders: {},
        };
    }

    // ========================================================================
    // 私有方法
    // ========================================================================

    private loadFromConfig(): void {
        this.currentConfig = {
            type: 'claude-code',
            apiKey: this.configService.getValue<string>('claudix.apiKey', ''),
            baseUrl: this.configService.getValue<string>('claudix.baseUrl', ''),
            customModels: this.configService.getValue<CustomModelConfig[]>('claudix.customModels', []),
        };
    }

    private getCustomModels(): ModelInfo[] {
        const customConfigs = this.currentConfig.customModels || [];
        return customConfigs.map(c => ({
            id: c.id,
            label: c.label,
            description: c.description,
            provider: 'claude-code',
        }));
    }
}
