<template>
  <div class="chat-page">
    <!-- 顶部标题栏 -->
    <div class="chat-header">
      <div class="header-left">
        <button class="menu-btn" @click="$emit('switchToSessions')">
          <span class="codicon codicon-menu"></span>
        </button>
        <h2 class="chat-title">{{ title }}</h2>
      </div>
      <div class="header-right">
        <button class="new-chat-btn" title="新建对话" @click="createNew">
          <span class="codicon codicon-plus"></span>
        </button>
        <button class="new-chat-btn" title="设置" @click="$emit('switchToSettings')">
          <span class="codicon codicon-settings-gear"></span>
        </button>
      </div>
    </div>

    <!-- 主体：消息容器 -->
    <div class="main">
      <!-- <div class="chatContainer"> -->
        <div
          ref="containerEl"
          :class="['messagesContainer', 'custom-scroll-container', { dimmed: permissionRequestsLen > 0 }]"
        >
          <template v-if="messages.length === 0">
            <div v-if="isBusy" class="emptyState">
              <div class="emptyWordmark">
                <ClaudeWordmark class="emptyWordmarkSvg" />
              </div>
            </div>
            <div v-else class="emptyState">
              <div class="emptyWordmark">
                <ClaudeWordmark class="emptyWordmarkSvg" />
              </div>
              <RandomTip :platform="platform" />
            </div>
          </template>
          <template v-else>
            <!-- <div class="msg-list"> -->
              <MessageRenderer
                v-for="(m, i) in messages"
                :key="m?.id ?? i"
                :message="m"
                :context="toolContext"
              />
            <!-- </div> -->
            <div v-if="isBusy" class="spinnerRow">
              <Spinner :size="16" :permission-mode="permissionMode" />
            </div>
            <div v-else-if="messages.length > 0 && hasCompleted" class="completedRow">
              <span class="codicon codicon-check completed-icon" />
              <span class="completed-text">对话完成</span>
            </div>
            <div ref="endEl" />
          </template>
        </div>

        <div class="inputContainer">
          <!-- 消息队列（输入框上方） -->
          <div v-if="messageQueue.length > 0" class="message-queue">
            <div class="queue-header">
              <span class="queue-label">队列消息 ({{ messageQueue.length }})</span>
              <button class="queue-clear-btn" @click="messageQueue = []" title="清空队列">
                <span class="codicon codicon-trash"></span>
              </button>
            </div>
            <div v-for="(msg, idx) in messageQueue" :key="idx" class="queue-item">
              <span class="queue-text" @click="editQueueMessage(idx)" title="点击编辑">{{ msg.length > 60 ? msg.slice(0, 60) + '...' : msg }}</span>
              <div class="queue-actions">
                <button v-if="idx > 0" class="queue-action-btn" @click="moveQueueMessage(idx, idx - 1)" title="上移">
                  <span class="codicon codicon-chevron-up"></span>
                </button>
                <button v-if="idx < messageQueue.length - 1" class="queue-action-btn" @click="moveQueueMessage(idx, idx + 1)" title="下移">
                  <span class="codicon codicon-chevron-down"></span>
                </button>
                <button class="queue-remove-btn" @click="messageQueue.splice(idx, 1)" title="移除">
                  <span class="codicon codicon-close"></span>
                </button>
              </div>
            </div>
          </div>
          <PermissionRequestModal
            v-if="pendingPermission && toolContext"
            :request="pendingPermission"
            :context="toolContext"
            :on-resolve="handleResolvePermission"
            data-permission-panel="1"
          />
          <ChatInputBox
            ref="chatInputBoxRef"
            :show-progress="true"
            :progress-percentage="progressPercentage"
            :conversation-working="isBusy"
            :attachments="attachments"
            :thinking-level="session?.thinkingLevel.value"
            :permission-mode="session?.permissionMode.value"
            :selected-model="session?.modelSelection.value"
            @submit="handleSubmit"
            @stop="handleStop"
            @add-attachment="handleAddAttachment"
            @remove-attachment="handleRemoveAttachment"
            @thinking-toggle="handleToggleThinking"
            @mode-select="handleModeSelect"
            @model-select="handleModelSelect"
            @queue-message="handleQueueMessage"
          />
        </div>
      <!-- </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, inject, onMounted, onUnmounted, nextTick, watch } from 'vue';
  import { RuntimeKey } from '../composables/runtimeContext';
  import { useSession } from '../composables/useSession';
  import type { Session } from '../core/Session';
  import type { PermissionRequest } from '../core/PermissionRequest';
  import type { ToolContext } from '../types/tool';
  import type { AttachmentItem } from '../types/attachment';
  import { convertFileToAttachment } from '../types/attachment';
  import ChatInputBox from '../components/ChatInputBox.vue';
  import PermissionRequestModal from '../components/PermissionRequestModal.vue';
  import Spinner from '../components/Messages/WaitingIndicator.vue';
  import ClaudeWordmark from '../components/ClaudeWordmark.vue';
  import RandomTip from '../components/RandomTip.vue';
  import MessageRenderer from '../components/Messages/MessageRenderer.vue';
  import { useKeybinding } from '../utils/useKeybinding';
  import { useSignal } from '@gn8/alien-signals-vue';
  import type { PermissionMode } from '@anthropic-ai/claude-agent-sdk';

  const runtime = inject(RuntimeKey);
  if (!runtime) throw new Error('[ChatPage] runtime not provided');

  const toolContext = computed<ToolContext>(() => ({
    fileOpener: {
      open: (filePath: string, location?: any) => {
        void runtime.appContext.fileOpener.open(filePath, location);
      },
      openContent: (content: string, fileName: string, editable: boolean) => {
        return runtime.appContext.fileOpener.openContent(
          content,
          fileName,
          editable
        );
      },
    },
  }));

  // 订阅 activeSession（alien-signal → Vue ref）
  const activeSessionRaw = useSignal<Session | undefined>(
    runtime.sessionStore.activeSession
  );

  // 使用 useSession 将 alien-signals 转换为 Vue Refs
  const session = computed(() => {
    const raw = activeSessionRaw.value;
    return raw ? useSession(raw) : null;
  });

  // 现在所有访问都使用 Vue Ref（.value）
  const title = computed(() => session.value?.summary.value || '新对话');
  const messages = computed<any[]>(() => session.value?.messages.value ?? []);
  const isBusy = computed(() => session.value?.busy.value ?? false);

  // 追踪对话是否已完成：从 busy → 非 busy 转变时标记为完成
  const hasCompleted = ref(false);
  watch(isBusy, (busy, wasBusy) => {
    if (wasBusy && !busy && messages.value.length > 0) {
      hasCompleted.value = true;
    }
  });
  // 新对话或新消息发出时重置
  watch(
    () => session.value,
    () => { hasCompleted.value = false; }
  );
  const permissionMode = computed(
    () => session.value?.permissionMode.value ?? 'acceptEdits'
  );
  const permissionRequests = computed(
    () => session.value?.permissionRequests.value ?? []
  );
  const permissionRequestsLen = computed(() => permissionRequests.value.length);
  const pendingPermission = computed(() => permissionRequests.value[0] as any);
  const platform = computed(() => runtime.appContext.platform);

  // 注册命令：permissionMode.toggle（在下方定义函数后再注册）

  // 估算 Token 使用占比（基于 usageData）
  const progressPercentage = computed(() => {
    const s = session.value;
    if (!s) return 0;

    const usage = s.usageData.value;
    const total = usage.totalTokens;
    const windowSize = usage.contextWindow || 200000;

    if (typeof total === 'number' && total > 0) {
      return Math.max(0, Math.min(100, (total / windowSize) * 100));
    }

    return 0;
  });

  // DOM refs
  const containerEl = ref<HTMLDivElement | null>(null);
  const endEl = ref<HTMLDivElement | null>(null);

  // 附件状态管理
  const attachments = ref<AttachmentItem[]>([]);

  // 消息队列：对话工作中时排队，完成后自动发送
  const messageQueue = ref<string[]>([]);

  // 记录上次消息数量，用于判断是否需要滚动
  let prevCount = 0;

  // 智能滚动：用户手动向上滚动时暂停自动滚动
  const userScrolledUp = ref(false);

  function isNearBottom(): boolean {
    const el = containerEl.value;
    if (!el) return true;
    // 距离底部 80px 以内视为「在底部」
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function handleScroll(): void {
    userScrolledUp.value = !isNearBottom();
  }

  function stringify(m: any): string {
    try {
      return JSON.stringify(m ?? {}, null, 2);
    } catch {
      return String(m);
    }
  }

  function scrollToBottom(force = false): void {
    if (!force && userScrolledUp.value) return;
    const end = endEl.value;
    if (!end) return;
    requestAnimationFrame(() => {
      try {
        end.scrollIntoView({ block: 'end' });
      } catch {}
    });
  }

  watch(session, async () => {
    // 切换会话：复位并强制滚动底部
    prevCount = 0;
    userScrolledUp.value = false;
    await nextTick();
    scrollToBottom(true);
  });

  // moved above

  watch(
    () => messages.value.length,
    async len => {
      const increased = len > prevCount;
      prevCount = len;
      if (increased) {
        await nextTick();
        scrollToBottom();
      }
    }
  );

  watch(permissionRequestsLen, async () => {
    // 有权限请求出现时也确保滚动到底部
    await nextTick();
    scrollToBottom();
  });

  onMounted(async () => {
    prevCount = messages.value.length;
    await nextTick();
    scrollToBottom(true);

    // 监听滚动事件
    const el = containerEl.value;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
    }
  });

  onUnmounted(() => {
    try { unregisterToggle?.(); } catch {}
    // 移除滚动监听
    const el = containerEl.value;
    if (el) {
      el.removeEventListener('scroll', handleScroll);
    }
  });

  async function createNew(): Promise<void> {
    if (!runtime) return;

    // 1. 先尝试通过 appContext.startNewConversationTab 创建新标签（多标签模式）
    if (runtime.appContext.startNewConversationTab()) {
      return;
    }

    // 2. 如果不是多标签模式，检查当前会话是否为空
    const currentMessages = messages.value;
    if (currentMessages.length === 0) {
      // 当前已经是空会话，无需创建新会话
      return;
    }

    // 3. 当前会话有内容，创建新会话
    await runtime.sessionStore.createSession({ isExplicit: true });
  }

  // ChatInput 事件处理
  async function handleSubmit(content: string) {
    const s = session.value;
    const trimmed = (content || '').trim();
    if (!s || (!trimmed && attachments.value.length === 0) || isBusy.value) return;

    hasCompleted.value = false;

    try {
      // 传递附件给 send 方法
      await s.send(trimmed || ' ', attachments.value);

      // 发送成功后清空附件
      attachments.value = [];
    } catch (e) {
      console.error('[ChatPage] send failed', e);
    }
  }

  function handleQueueMessage(content: string) {
    const trimmed = (content || '').trim();
    if (trimmed) {
      messageQueue.value.push(trimmed);
    }
  }

  // ChatInputBox ref
  const chatInputBoxRef = ref<InstanceType<typeof ChatInputBox> | null>(null);

  // 点击队列消息：取消排队，返回输入框编辑
  function editQueueMessage(idx: number) {
    const msg = messageQueue.value[idx];
    if (!msg) return;
    messageQueue.value.splice(idx, 1);
    if (chatInputBoxRef.value) {
      chatInputBoxRef.value.setContent(msg);
      chatInputBoxRef.value.focus();
    }
  }

  // 队列消息上下移动
  function moveQueueMessage(from: number, to: number) {
    if (to < 0 || to >= messageQueue.value.length) return;
    const arr = [...messageQueue.value];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    messageQueue.value = arr;
  }

  // 从队列发送下一条消息（绕过 isBusy 检查，因为 watcher 已确认 busy=false）
  async function sendNextQueueMessage() {
    if (messageQueue.value.length === 0) return;
    const s = session.value;
    if (!s) return;

    const nextMsg = messageQueue.value.shift()!;
    try {
      await s.send(nextMsg);
    } catch (e) {
      console.error('[ChatPage] queue send failed', e);
    }
  }

  // 监听 isBusy 变化，对话完成后自动发送队列中的下一条消息
  watch(isBusy, async (busy, wasBusy) => {
    if (wasBusy && !busy && messageQueue.value.length > 0) {
      await nextTick();
      await sendNextQueueMessage();
    }
  });

  async function handleToggleThinking() {
    const s = session.value;
    if (!s) return;

    const currentLevel = s.thinkingLevel.value;
    const newLevel = currentLevel === 'off' ? 'default_on' : 'off';

    await s.setThinkingLevel(newLevel);
  }

  async function handleModeSelect(mode: PermissionMode) {
    const s = session.value;
    if (!s) return;

    await s.setPermissionMode(mode);
  }

  // permissionMode.toggle：按固定顺序轮转
  const togglePermissionMode = () => {
    const s = session.value;
    if (!s) return;
    const order: PermissionMode[] = ['acceptEdits', 'default', 'plan'];
    const cur = (s.permissionMode.value as PermissionMode) ?? 'acceptEdits';
    const idx = Math.max(0, order.indexOf(cur));
    const next = order[(idx + 1) % order.length];
    void s.setPermissionMode(next);
  };

  // 现在注册命令（toggle 已定义）
  const unregisterToggle = runtime.appContext.commandRegistry.registerAction(
    {
      id: 'permissionMode.toggle',
      label: 'Toggle Permission Mode',
      description: 'Cycle permission mode in fixed order'
    },
    'App Shortcuts',
    () => {
      togglePermissionMode();
    }
  );

  // 注册快捷键：shift+tab → permissionMode.toggle（允许在输入区生效）
  useKeybinding({
    keys: 'shift+tab',
    handler: togglePermissionMode,
    allowInEditable: true,
    priority: 100,
  });

  async function handleModelSelect(modelId: string) {
    const s = session.value;
    if (!s) return;

    await s.setModel({ value: modelId });
  }

  function handleStop() {
    const s = session.value;
    if (s) {
      // 方法已经在 useSession 中绑定，可以直接调用
      void s.interrupt();
    }
  }

  async function handleAddAttachment(files: FileList) {
    if (!files || files.length === 0) return;

    try {
      // 将所有文件转换为 AttachmentItem
      const conversions = await Promise.all(
        Array.from(files).map(convertFileToAttachment)
      );

      // 添加到附件列表
      attachments.value = [...attachments.value, ...conversions];

      console.log('[ChatPage] Added attachments:', conversions.map(a => a.fileName));
    } catch (e) {
      console.error('[ChatPage] Failed to convert files:', e);
    }
  }

  function handleRemoveAttachment(id: string) {
    attachments.value = attachments.value.filter(a => a.id !== id);
  }

  // Permission modal handler
  function handleResolvePermission(request: PermissionRequest, allow: boolean) {
    try {
      if (allow) {
        request.accept(request.inputs);
      } else {
        request.reject('User denied', true);
      }
    } catch (e) {
      console.error('[ChatPage] permission resolve failed', e);
    }
  }
</script>

<style scoped>
  .chat-page {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .chat-header {
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
    overflow: hidden;
    flex: 1;
  }

  .menu-btn {
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
    opacity: 0.7;
  }

  .menu-btn .codicon {
    font-size: 12px;
  }

  .menu-btn:hover {
    background: var(--vscode-toolbar-hoverBackground);
    opacity: 1;
  }

  .chat-title {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-titleBar-activeForeground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-right {
    display: flex;
    gap: 4px;
  }

  .new-chat-btn {
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
    opacity: 0.7;
  }

  .new-chat-btn .codicon {
    font-size: 12px;
  }

  .new-chat-btn:hover {
    background: var(--vscode-toolbar-hoverBackground);
    opacity: 1;
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  /* Chat 容器与消息滚动容器（对齐 React） */
  .chatContainer {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .messagesContainer {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 0 12px;
    position: relative;
  }
  .messagesContainer.dimmed {
    filter: blur(1px);
    opacity: 0.5;
    pointer-events: none;
  }

  .msg-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 12px;
  }

  .msg-item {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    padding: 8px;
  }

  .json-block {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(
      --app-monospace-font-family,
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      'Liberation Mono',
      'Courier New',
      monospace
    );
    font-size: var(--app-monospace-font-size, 12px);
    line-height: 1.5;
    color: var(--vscode-editor-foreground);
  }

  /* 其他样式复用 */

  /* 输入区域容器 */
  .inputContainer {
    padding: 8px 12px 12px;
  }

  .spinnerRow {
    display: flex;
    justify-content: center;
    padding: 8px 0;
  }

  .completedRow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 0 4px;
    opacity: 0;
    animation: fadeInCompleted 0.3s ease forwards;
  }

  @keyframes fadeInCompleted {
    to { opacity: 1; }
  }

  .completed-icon {
    font-size: 14px;
    color: var(--vscode-testing-iconPassed, #73c991);
  }

  .completed-text {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
  }

  /* 底部对话框区域钉在底部 */
  .main > :last-child {
    flex-shrink: 0;
    background-color: var(--vscode-sideBar-background);
    /* border-top: 1px solid var(--vscode-panel-border); */
    max-width: 1200px;
    width: 100%;
    align-self: center;
  }

  /* 空状态样式 */
  .emptyState {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 32px 16px;
  }

  .emptyWordmark {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }

  /* 消息队列样式 */
  .message-queue {
    margin-bottom: 8px;
    padding: 6px 8px;
    background: color-mix(in srgb, var(--vscode-input-background) 80%, transparent);
    border: 1px solid var(--vscode-input-border);
    border-radius: 6px;
    font-size: 12px;
  }

  .queue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .queue-label {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    font-weight: 500;
  }

  .queue-clear-btn {
    background: none;
    border: none;
    color: var(--vscode-descriptionForeground);
    cursor: pointer;
    padding: 2px;
    opacity: 0.6;
  }

  .queue-clear-btn:hover {
    opacity: 1;
  }

  .queue-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 6px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--vscode-editor-background) 60%, transparent);
    margin-bottom: 2px;
  }

  .queue-item:last-child {
    margin-bottom: 0;
  }

  .queue-text {
    color: var(--vscode-foreground);
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
    cursor: pointer;
  }

  .queue-text:hover {
    color: var(--vscode-textLink-foreground);
    text-decoration: underline;
  }

  .queue-actions {
    display: flex;
    align-items: center;
    gap: 1px;
    flex-shrink: 0;
  }

  .queue-action-btn {
    background: none;
    border: none;
    color: var(--vscode-descriptionForeground);
    cursor: pointer;
    padding: 1px 2px;
    opacity: 0.4;
    font-size: 12px;
  }

  .queue-action-btn:hover {
    opacity: 1;
    color: var(--vscode-foreground);
  }

  .queue-remove-btn {
    background: none;
    border: none;
    color: var(--vscode-descriptionForeground);
    cursor: pointer;
    padding: 1px 3px;
    opacity: 0.5;
    flex-shrink: 0;
  }

  .queue-remove-btn:hover {
    opacity: 1;
    color: var(--vscode-errorForeground);
  }
</style>
