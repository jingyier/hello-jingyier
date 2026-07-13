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
  const localTime = page.querySelector("#local-time");
  const weatherInfo = page.querySelector("#weather-info");
  const clock = page.querySelector("[data-home-clock]");
  const weatherLabel = page.querySelector("[data-weather-label]");
  const statusLabel = page.querySelector("[data-status-label]");
  const quoteText = page.querySelector("[data-quote-text]");
  const quoteSource = page.querySelector("[data-quote-source]");
  const nextQuote = page.querySelector("[data-next-quote]");
  const messageDialog = page.querySelector("[data-message-dialog]");
  const openMessageBoard = page.querySelector("[data-open-message-board]");
  const closeMessageBoard = page.querySelector("[data-close-message-board]");
  const toggleMessageFullscreen = page.querySelector("[data-toggle-message-fullscreen]");
  const messageForm = page.querySelector("[data-message-form]");
  const messageList = page.querySelector("[data-message-list]");
  const messageFeedback = page.querySelector("[data-message-feedback]");
  const messagePrev = page.querySelector("[data-message-prev]");
  const messageNext = page.querySelector("[data-message-next]");
  const messagePageStatus = page.querySelector("[data-message-page-status]");
  const tools = [...page.querySelectorAll("[data-tool]")];
  let approvedMessagesSource = staticMessages;
  const messagePageSize = 6;
  const state = {
    quoteIndex: 0,
    weatherIndex: 0,
    statusIndex: 0,
    messages: [],
    messagePage: 0
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

  const updateLocalTime = () => {
    if (!localTime) return;
    localTime.textContent = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date());
  };

  const formatWeather = (payload) => {
    const location = String(payload?.location?.name ?? "").trim();
    const condition = String(payload?.weather?.condition ?? "").trim();
    const temperature = Number(payload?.weather?.temperature);
    if (!location && !condition && !Number.isFinite(temperature)) return "--°C";
    const parts = [];
    if (location) parts.push(location);
    if (condition) parts.push(condition);
    if (Number.isFinite(temperature)) parts.push(`${Math.round(temperature)}°C`);
    return parts.join(" · ");
  };

  const loadWeatherInfo = async () => {
    if (!weatherInfo) return;
    weatherInfo.textContent = "加载中";
    try {
      const response = await fetch("/api/weather", {
        headers: { accept: "application/json" }
      });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.ok) {
        weatherInfo.textContent = formatWeather(payload);
        return;
      }
      weatherInfo.textContent = "--°C";
    } catch {
      weatherInfo.textContent = "--°C";
    }
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

  const normalizeMessageRecord = (value) => {
    if (typeof value === "string") return null;
    const body = String(value?.body ?? "").trim();
    const createdAt = String(value?.createdAt ?? "").trim();
    if (!body || !createdAt) return null;
    const time = new Date(createdAt).valueOf();
    if (Number.isNaN(time)) return null;
    return { ...value, body, createdAt, time };
  };

  const getRenderableMessages = () =>
    [...approvedMessagesSource, ...state.messages]
      .map(normalizeMessageRecord)
      .filter(Boolean)
      .sort((a, b) => b.time - a.time);

  const createMessageNode = (value, className = "") => {
    const body = value?.body;
    const createdAt = value?.createdAt;
    const message = document.createElement("li");
    const content = document.createElement("p");
    const timestamp = document.createElement("time");
    message.className = ["message-letter", className].filter(Boolean).join(" ");
    content.textContent = body;
    message.append(content);
    timestamp.textContent = formatMessageTime(createdAt);
    timestamp.dateTime = createdAt;
    message.append(timestamp);
    return message;
  };

  const createEmptyMessageNode = () => {
    const message = document.createElement("li");
    message.className = "message-empty";
    message.textContent = "暂无公开留言。";
    return message;
  };

  const renderMessages = () => {
    if (!messageList) return;
    messageList.textContent = "";
    const messages = getRenderableMessages();
    const pageCount = Math.max(1, Math.ceil(messages.length / messagePageSize));
    state.messagePage = Math.min(Math.max(state.messagePage, 0), pageCount - 1);
    const start = state.messagePage * messagePageSize;
    const pageMessages = messages.slice(start, start + messagePageSize);

    if (messages.length === 0) {
      messageList.append(createEmptyMessageNode());
    } else {
      pageMessages.forEach((message) => {
        messageList.append(createMessageNode(message, message.id ? "is-approved" : "is-new"));
      });
    }

    if (messagePageStatus) messagePageStatus.textContent = `${state.messagePage + 1} / ${pageCount}`;
    if (messagePrev) messagePrev.disabled = state.messagePage <= 0;
    if (messageNext) messageNext.disabled = state.messagePage >= pageCount - 1;
  };

  const renderApprovedMessages = (messages) => {
    approvedMessagesSource = messages;
    renderMessages();
  };

  const renderStoredMessages = () => {
    renderMessages();
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
    if (!messageList) return;
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

  openMessageBoard?.addEventListener("click", () => {
    if (!messageDialog) return;
    renderMessages();
    if (typeof messageDialog.showModal === "function") {
      messageDialog.showModal();
    } else {
      messageDialog.setAttribute("open", "");
    }
  });

  closeMessageBoard?.addEventListener("click", () => {
    messageDialog?.close();
  });

  messageDialog?.addEventListener("click", (event) => {
    if (event.target === messageDialog) messageDialog.close();
  });

  toggleMessageFullscreen?.addEventListener("click", () => {
    messageDialog?.classList.toggle("is-fullscreen");
  });

  messagePrev?.addEventListener("click", () => {
    state.messagePage -= 1;
    renderMessages();
  });

  messageNext?.addEventListener("click", () => {
    state.messagePage += 1;
    renderMessages();
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
      state.messagePage = 0;
      renderStoredMessages();
      input.value = "";
      setMessageFeedback(storageEnabled ? "接口暂时不可用，已保存在你的浏览器里。" : "接口暂时不可用，已临时留下。刷新页面后不会保留。");
    }
  });

  showQuote(state.quoteIndex, false);
  showWeather(state.weatherIndex);
  showStatus(state.statusIndex);
  renderApprovedMessages(staticMessages);
  loadApprovedMessages();
  updateClock();
  updateLocalTime();
  loadWeatherInfo();
  window.setInterval(updateClock, 1000);
  window.setInterval(updateLocalTime, 1000);
}
