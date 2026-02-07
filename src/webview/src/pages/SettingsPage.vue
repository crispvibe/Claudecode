<template>
  <div class="settings-page">
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$emit('back')">
          <span class="codicon codicon-arrow-left"></span>
        </button>
        <h2 class="page-title">设置</h2>
      </div>
    </div>

    <div class="page-content custom-scroll-container">
      <!-- Provider 选择 -->
      <section class="settings-section">
        <h3 class="section-title">AI 服务提供商</h3>
        <div class="form-group">
          <label class="form-label">Provider 类型</label>
          <select class="form-select" v-model="provider" @change="handleProviderChange">
            <option value="openai">OpenAI 兼容</option>
            <option value="anthropic">Anthropic API</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </div>
      </section>

      <!-- API 配置 -->
      <section class="settings-section">
        <h3 class="section-title">API 配置</h3>

        <div class="form-group">
          <label class="form-label">API Key</label>
          <input
            type="password"
            class="form-input"
            v-model="apiKey"
            :placeholder="apiKeyMasked ? '已配置: ' + apiKeyMasked : '输入 API Key...'"
            @change="saveConfig"
          />
          <span v-if="apiKeyMasked && !apiKey" class="form-hint">已保存，输入新值可覆盖</span>
        </div>

        <div class="form-group">
          <label class="form-label">Base URL</label>
          <input
            type="text"
            class="form-input"
            v-model="baseUrl"
            :placeholder="defaultBaseUrl"
            @change="saveConfig"
          />
          <span class="form-hint">留空使用默认地址</span>
        </div>

      </section>

      <!-- 自定义模型 -->
      <section class="settings-section">
        <h3 class="section-title">
          自定义模型
          <button class="add-btn" @click="addCustomModel">
            <span class="codicon codicon-add"></span>
          </button>
        </h3>

        <div v-if="customModels.length === 0" class="empty-hint">
          暂无自定义模型，点击 + 添加
        </div>

        <div v-for="(model, index) in customModels" :key="index" class="custom-model-card">
          <div class="model-row">
            <div class="form-group compact">
              <label class="form-label-sm">模型 ID</label>
              <input
                type="text"
                class="form-input-sm"
                v-model="model.id"
                placeholder="如 gpt-4o-mini"
                @change="saveConfig"
              />
            </div>
            <div class="form-group compact">
              <label class="form-label-sm">显示名称</label>
              <input
                type="text"
                class="form-input-sm"
                v-model="model.label"
                placeholder="如 GPT-4o Mini"
                @change="saveConfig"
              />
            </div>
            <button class="remove-btn" @click="removeCustomModel(index)">
              <span class="codicon codicon-trash"></span>
            </button>
          </div>
        </div>
      </section>

      <!-- 额外请求头 -->
      <section class="settings-section">
        <h3 class="section-title">额外请求头（可选）</h3>
        <div class="form-group">
          <textarea
            class="form-textarea"
            v-model="extraHeadersText"
            placeholder='{"X-Custom-Header": "value"}'
            rows="3"
            @change="saveConfig"
          ></textarea>
          <span class="form-hint">JSON 格式的自定义请求头</span>
        </div>
      </section>

      <!-- 追加规则 -->
      <section class="settings-section">
        <h3 class="section-title">追加规则</h3>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="appendRuleEnabled" @change="saveConfig" />
            <span>启用追加规则</span>
          </label>
        </div>
        <div class="form-group">
          <textarea
            class="form-textarea"
            v-model="appendRule"
            placeholder="每次发送消息时自动追加到内容末尾..."
            rows="6"
            @change="saveConfig"
          ></textarea>
          <span class="form-hint">规则会在每次发送消息时自动追加，用于引导 AI 按照你的习惯回答</span>
        </div>
      </section>

      <!-- 保存按钮 + 状态 -->
      <section class="settings-section save-section">
        <button class="save-btn" @click="saveConfig" :disabled="saveStatus === 'saving'">
          <span class="codicon" :class="saveStatus === 'saving' ? 'codicon-loading codicon-modifier-spin' : 'codicon-save'"></span>
          <span>{{ saveStatus === 'saving' ? '保存中...' : '保存配置' }}</span>
        </button>
        <div v-if="saveStatus === 'saved'" class="save-indicator saved">
          <span class="codicon codicon-check"></span>
          <span>配置已保存</span>
        </div>
        <div v-else-if="saveStatus === 'error'" class="save-indicator error">
          <span class="codicon codicon-error"></span>
          <span>保存失败</span>
        </div>
      </section>

      <!-- 版本信息 -->
      <section class="settings-section">
        <div class="version-info">Claudecode v1.0.0</div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { RuntimeKey } from '../composables/runtimeContext'

const emit = defineEmits<{
  back: []
}>()

const runtime = inject(RuntimeKey)
if (!runtime) throw new Error('[SettingsPage] runtime not provided')

// 状态
const provider = ref('openai')
const apiKey = ref('')
const apiKeyMasked = ref('')
const baseUrl = ref('')
const customModels = ref<Array<{ id: string; label: string; description?: string }>>([])
const extraHeadersText = ref('')
const appendRule = ref('')
const appendRuleEnabled = ref(true)
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

const defaultBaseUrls: Record<string, string> = {
  'openai': 'https://api.openai.com',
  'anthropic': 'https://api.anthropic.com',
  'gemini': 'https://generativelanguage.googleapis.com',
}

const defaultBaseUrl = computed(() => defaultBaseUrls[provider.value] || '')

// 加载 Provider 状态
async function loadProviderStatus() {
  try {
    const conn = await runtime!.connectionManager.get()

    const response = await (conn as any).request({ type: 'get_provider_status' })
    if (response) {
      provider.value = response.provider || 'openai'
      apiKeyMasked.value = response.apiKeyMasked || ''
      baseUrl.value = response.baseUrl || ''

      // 回显自定义模型
      if (response.customModels && Array.isArray(response.customModels) && response.customModels.length > 0) {
        customModels.value = response.customModels.map((m: any) => ({
          id: m.id || '',
          label: m.label || '',
          description: m.description,
        }))
      } else {
        customModels.value = []
      }

      // 回显额外请求头
      if (response.extraHeaders && typeof response.extraHeaders === 'object' && Object.keys(response.extraHeaders).length > 0) {
        extraHeadersText.value = JSON.stringify(response.extraHeaders, null, 2)
      } else {
        extraHeadersText.value = ''
      }

      // 回显追加规则
      if (response.appendRule !== undefined) {
        appendRule.value = response.appendRule || ''
      }
      if (response.appendRuleEnabled !== undefined) {
        appendRuleEnabled.value = response.appendRuleEnabled ?? true
      }
    }
  } catch (e) {
    console.error('[SettingsPage] 加载 Provider 状态失败:', e)
  }
}

// 切换 Provider
async function handleProviderChange() {
  try {
    const conn = await runtime!.connectionManager.get()

    // 重置表单字段（新 Provider 的配置将通过 loadProviderStatus 回显）
    apiKey.value = ''
    apiKeyMasked.value = ''
    baseUrl.value = ''
    customModels.value = []
    extraHeadersText.value = ''

    const response = await (conn as any).request({
      type: 'set_provider',
      provider: provider.value,
    })

    if (response?.success) {
      // 重新加载完整状态（会回显新 Provider 的已保存配置）
      await loadProviderStatus()
    }
  } catch (e) {
    console.error('[SettingsPage] 切换 Provider 失败:', e)
  }
}

// 保存配置
let saveTimer: any = null
async function saveConfig() {
  try {
    saveStatus.value = 'saving'
    const conn = await runtime!.connectionManager.get()

    let extraHeaders: Record<string, string> = {}
    if (extraHeadersText.value.trim()) {
      try {
        extraHeaders = JSON.parse(extraHeadersText.value)
      } catch {
        // 忽略无效 JSON
      }
    }

    // 只发送有值的字段，避免 undefined 覆盖后端已有配置
    const config: Record<string, any> = {}
    if (apiKey.value) config.apiKey = apiKey.value
    if (baseUrl.value) config.baseUrl = baseUrl.value
    if (customModels.value.length > 0) config.customModels = customModels.value
    if (Object.keys(extraHeaders).length > 0) config.extraHeaders = extraHeaders
    config.appendRule = appendRule.value
    config.appendRuleEnabled = appendRuleEnabled.value

    await conn.request({
      type: 'update_provider_config',
      config,
    })

    // 刷新状态
    await loadProviderStatus()
    saveStatus.value = 'saved'

    // 2秒后清除保存状态
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { saveStatus.value = 'idle' }, 2000)
  } catch (e) {
    console.error('[SettingsPage] 保存配置失败:', e)
    saveStatus.value = 'error'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { saveStatus.value = 'idle' }, 3000)
  }
}

// 添加/删除自定义模型
function addCustomModel() {
  customModels.value.push({ id: '', label: '' })
}

function removeCustomModel(index: number) {
  customModels.value.splice(index, 1)
  saveConfig()
}

onMounted(() => {
  loadProviderStatus()
})
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--vscode-editor-foreground);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--vscode-panel-border);
  min-height: 32px;
  padding: 0 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--vscode-titleBar-activeForeground);
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background: var(--vscode-toolbar-hoverBackground);
}

.page-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--vscode-titleBar-activeForeground);
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.settings-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.settings-section:last-child {
  border-bottom: none;
}

.section-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 8px;
}

.status-bar.ready {
  background: color-mix(in srgb, var(--vscode-testing-iconPassed) 15%, transparent);
  color: var(--vscode-testing-iconPassed);
}

.status-bar.not-ready {
  background: color-mix(in srgb, var(--vscode-editorWarning-foreground) 15%, transparent);
  color: var(--vscode-editorWarning-foreground);
}

.form-group {
  margin-bottom: 10px;
}

.form-group.compact {
  margin-bottom: 0;
  flex: 1;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--vscode-foreground);
}

.form-label-sm {
  display: block;
  font-size: 11px;
  margin-bottom: 2px;
  color: var(--vscode-descriptionForeground);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid var(--vscode-input-border);
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}

.form-input-sm {
  width: 100%;
  padding: 3px 6px;
  border: 1px solid var(--vscode-input-border);
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border-radius: 3px;
  font-size: 11px;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus,
.form-input-sm:focus {
  border-color: var(--vscode-focusBorder);
}

.form-textarea {
  resize: vertical;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

.form-hint {
  display: block;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  margin-top: 3px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  color: var(--vscode-foreground);
}

.checkbox-label input[type="checkbox"] {
  accent-color: var(--vscode-button-background);
  cursor: pointer;
}

.empty-hint {
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  padding: 8px 0;
}

.custom-model-card {
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
}

.model-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--vscode-foreground);
  border-radius: 3px;
  cursor: pointer;
  opacity: 0.7;
}

.add-btn:hover {
  opacity: 1;
  background: var(--vscode-toolbar-hoverBackground);
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--vscode-errorForeground);
  border-radius: 3px;
  cursor: pointer;
  opacity: 0.6;
  flex-shrink: 0;
}

.remove-btn:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--vscode-errorForeground) 15%, transparent);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background: var(--vscode-button-secondaryHoverBackground);
}

.save-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  transition: background-color 0.2s, opacity 0.2s;
}

.save-btn:hover {
  background: var(--vscode-button-hoverBackground);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.save-indicator.saved {
  color: var(--vscode-testing-iconPassed);
}

.save-indicator.saving {
  color: var(--vscode-descriptionForeground);
}

.save-indicator.error {
  color: var(--vscode-errorForeground);
}

.version-info {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  margin-top: 8px;
  opacity: 0.6;
}
</style>
