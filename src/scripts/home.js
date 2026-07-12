const page = document.querySelector("[data-home-page]");

if (page) {
  const storagePrefix = "jingyier.home.";
  const defaults = {
    weather: "今天适合慢慢看。",
    status: "整理一些句子，也整理一点页面。",
    weatherNotes: [],
    statusNotes: [],
    quotes: [],
    messages: []
  };

  const readData = () => {
    const dataNode = document.querySelector("#home-data");
    if (!dataNode) return defaults;
    try {
      return { ...defaults, ...JSON.parse(dataNode.textContent ?? "{}") };
    } catch {
      return defaults;
    }
  };

  const canStore = () => {
    try {
      const key = `${storagePrefix}test`;
      window.localStorage.setItem(key, "1");
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  };

  const storageEnabled = canStore();
  const homeData = readData();
  const quotes = homeData.quotes.length > 0 ? homeData.quotes : [{ text: "先把这里当成一张桌面。", source: "fallback" }];
  const weatherNotes = homeData.weatherNotes.length > 0 ? homeData.weatherNotes : [homeData.weather];
  const statusNotes = homeData.statusNotes.length > 0 ? homeData.statusNotes : [homeData.status];
  const staticMessages = Array.isArray(homeData.messages) ? homeData.messages : [];
  const isLocalHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  const clock = page.querySelector("[data-home-clock]");
  const weatherLabel = page.querySelector("[data-weather-label]");
  const statusLabel = page.querySelector("[data-status-label]");
  const quoteText = page.querySelector("[data-quote-text]");
  const quoteSource = page.querySelector("[data-quote-source]");
  const nextQuote = page.querySelector("[data-next-quote]");
  const messageForm = page.querySelector("[data-message-form]");
  const approvedMessageList = page.querySelector("[data-message-approved-list]");
  const localMessageList = page.querySelector("[data-message-local-list]");
  const messageFeedback = page.querySelector("[data-message-feedback]");
  const undoMessage = page.querySelector("[data-undo-message]");
  const clearMessages = page.querySelector("[data-clear-messages]");
  const tools = [...page.querySelectorAll("[data-tool]")];
  const state = {
    quoteIndex: 0,
    weatherIndex: 0,
    statusIndex: 0,
    messages: []
  };

  const readStoredJson = (key, fallback) => {
    if (!storageEnabled) return fallback;
    try {
      const value = window.localStorage.getItem(`${storagePrefix}${key}`);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeStoredJson = (key, value) => {
    if (!storageEnabled) return;
    try {
      window.localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value));
    } catch {
      // Storage can fail in private mode or when quota is full; the page still works without it.
    }
  };

  const normalizeIndex = (value, length) => {
    const number = Number(value);
    if (!Number.isFinite(number) || length <= 0) return 0;
    return Math.abs(Math.trunc(number)) % length;
  };

  const updateClock = () => {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date());
  };

  const setActiveTool = (toolName) => {
    tools.forEach((tool) => {
      tool.setAttribute("aria-pressed", String(tool.dataset.tool === toolName));
    });
  };

  const showQuote = (index, animate = true) => {
    const quote = quotes[index];
    if (!quote || !quoteText || !quoteSource) return;
    if (animate) quoteText.classList.add("is-changing");
    window.setTimeout(() => {
      quoteText.textContent = quote.text;
      quoteSource.textContent = quote.source;
      quoteText.classList.remove("is-changing");
    }, animate ? 120 : 0);
  };

  const showWeather = (index) => {
    if (weatherLabel) weatherLabel.textContent = weatherNotes[index] ?? homeData.weather;
  };

  const showStatus = (index) => {
    if (statusLabel) statusLabel.textContent = statusNotes[index] ?? homeData.status;
  };

  const setMessageFeedback = (text) => {
    if (messageFeedback) messageFeedback.textContent = text;
  };

  const formatMessageTime = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.valueOf())) return "";
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  };

  const createMessageNode = (value, className = "") => {
    const body = typeof value === "string" ? value : value?.body;
    const createdAt = typeof value === "string" ? "" : value?.createdAt;
    const message = document.createElement("article");
    const content = document.createElement("p");
    const timestamp = document.createElement("time");
    message.className = ["message-letter", className].filter(Boolean).join(" ");
    content.textContent = body;
    message.append(content);
    if (createdAt) {
      timestamp.textContent = formatMessageTime(createdAt);
      timestamp.dateTime = createdAt;
      message.append(timestamp);
    }
    return message;
  };

  const createEmptyMessageNode = () => {
    const message = document.createElement("p");
    message.className = "message-empty";
    message.textContent = "暂无公开留言。";
    return message;
  };

  const renderApprovedMessages = (messages) => {
    if (!approvedMessageList) return;
    approvedMessageList.textContent = "";
    if (messages.length === 0) {
      approvedMessageList.append(createEmptyMessageNode());
      return;
    }
    messages.forEach((message) => {
      const body = typeof message === "string" ? message : message?.body;
      if (!body) return;
      approvedMessageList.append(createMessageNode(message, "is-approved"));
    });
  };

  const renderStoredMessages = () => {
    if (!localMessageList) return;
    localMessageList.textContent = "";
    state.messages.forEach((value) => {
      const message = createMessageNode(value, "is-new");
      message.dataset.userMessage = "true";
      localMessageList.append(message);
    });
  };

  const persistMessages = () => {
    writeStoredJson("messages", state.messages);
  };

  const submitRemoteMessage = async (body, website = "") => {
    if (isLocalHost) {
      throw new Error("local_message_service_unavailable");
    }

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify({ body, website })
    });

    const result = await response.json().catch(() => ({ ok: false }));
    if (!response.ok || !result.ok) {
      throw new Error(result.error ?? "message_submit_failed");
    }
  };

  const loadApprovedMessages = async () => {
    if (!approvedMessageList) return;
    if (isLocalHost) return;
    try {
      const response = await fetch("/api/messages", {
        headers: { "accept": "application/json" }
      });
      const result = await response.json();
      if (response.ok && result.ok && Array.isArray(result.messages)) {
        renderApprovedMessages(result.messages);
      }
    } catch {
      // Approved messages are an enhancement; static and local messages stay visible without the API.
    }
  };

  state.quoteIndex = normalizeIndex(readStoredJson("quoteIndex", 0), quotes.length);
  state.weatherIndex = normalizeIndex(readStoredJson("weatherIndex", 0), weatherNotes.length);
  state.statusIndex = normalizeIndex(readStoredJson("statusIndex", 0), statusNotes.length);
  state.messages = readStoredJson("messages", []);

  if (!Array.isArray(state.messages)) state.messages = [];

  tools.forEach((tool) => {
    tool.addEventListener("click", () => {
      setActiveTool(tool.dataset.tool);
      if (tool.dataset.tool === "weather") {
        state.weatherIndex = (state.weatherIndex + 1) % weatherNotes.length;
        showWeather(state.weatherIndex);
        writeStoredJson("weatherIndex", state.weatherIndex);
      }
      if (tool.dataset.tool === "status") {
        state.statusIndex = (state.statusIndex + 1) % statusNotes.length;
        showStatus(state.statusIndex);
        writeStoredJson("statusIndex", state.statusIndex);
      }
    });
  });

  nextQuote?.addEventListener("click", () => {
    state.quoteIndex = (state.quoteIndex + 1) % quotes.length;
    showQuote(state.quoteIndex);
    writeStoredJson("quoteIndex", state.quoteIndex);
  });

  messageForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("message");
    const website = form.elements.namedItem("website")?.value?.trim() ?? "";
    const value = input?.value?.trim().replace(/\s+/g, " ");
    if (!value) return;

    try {
      await submitRemoteMessage(value, website);
      input.value = "";
      const honeypot = form.elements.namedItem("website");
      if (honeypot) honeypot.value = "";
      setMessageFeedback("已收到，审核后会公开显示。");
    } catch {
      state.messages.push({ body: value, createdAt: new Date().toISOString() });
      persistMessages();
      renderStoredMessages();
      input.value = "";
      setMessageFeedback(storageEnabled ? "接口暂时不可用，已保存在你的浏览器里。" : "接口暂时不可用，已临时留下。刷新页面后不会保留。");
    }
  });

  undoMessage?.addEventListener("click", () => {
    if (state.messages.length === 0) {
      setMessageFeedback("还没有可撤回的本地留言。");
      return;
    }
    state.messages.pop();
    persistMessages();
    renderStoredMessages();
    setMessageFeedback("已撤回最后一条本地留言。");
  });

  clearMessages?.addEventListener("click", () => {
    if (state.messages.length === 0) {
      setMessageFeedback("本地留言已经是空的。");
      return;
    }
    state.messages = [];
    persistMessages();
    renderStoredMessages();
    setMessageFeedback("已清空本地保存的留言。");
  });

  showQuote(state.quoteIndex, false);
  showWeather(state.weatherIndex);
  showStatus(state.statusIndex);
  renderApprovedMessages(staticMessages);
  renderStoredMessages();
  loadApprovedMessages();
  updateClock();
  window.setInterval(updateClock, 1000);
}
