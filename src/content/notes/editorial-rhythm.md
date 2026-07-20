---
title: 4.14~4.20文档杂烩
date: 2026-04-14
summary: 动态代理，流式输出，短期记忆杂烩
category: 界面设计
tags:
  - spring ai
  - java
featured: true
---

chatModel调用了相关大模型的api，chatClient进一步对其进行了封装

可以把它们的关系理解为：

1. 

   **ChatModel（底层）**

   - 直接对接大模型厂商的 API（如 DashScope、OpenAI 等）。
   - 负责具体的 HTTP 请求、鉴权、参数拼装、返回解析。
   - 接口比较“原始”，比如 `call(String)`、`call(Message...)`、`stream(...)`。

2. 

   **ChatClient（上层封装）**

   - 在 `ChatModel`之上再做一层封装。

   - 提供更符合 Spring 风格、更易用的 API，比如 `chat()`、`prompt()`、`streamChat()`。

     内部还是调用 `ChatModel`的方法，只是帮你处理了：

     - 消息对象的组装（SystemMessage、UserMessage 等）
     - Prompt 模板管理
     - 统一的异常处理、日志、配置管理
     - 与 Spring 生态的集成（如自动注入、配置绑定）

ChatModel 一般一个项目一个，ChatClient 可以因不同模型或不同使用场景（如翻译、摘要、对话）封装多个。

------


**HTTP**：

你去餐厅点餐 → 服务员给你菜 → 走人

想再吃就得重新排队点餐

**WebSocket**：

你坐包间，和服务员连着对讲机

随时喊：“再加个菜”“上汤了没”

服务员也能随时告诉你：“菜好了”

这是为您生成的清晰对比表格：

| 对比维度       | HTTP (超文本传输协议)                              | WebSocket (全双工通信协议)                      |
| -------------- | -------------------------------------------------- | ----------------------------------------------- |
| **连接方式**   | **短连接** 一次请求对应一次响应，完成后立即断开    | **长连接** 握手后连接持续保持，直到一方主动关闭 |
| **通信模式**   | **单工/半双工** 只有客户端主动请求，服务器被动响应 | **全双工** 客户端和服务器**都可以主动**发送数据 |
| **实时性**     | **较低** 依赖轮询(Polling)，存在延迟和开销         | **很高** 服务端可即时推送，无延迟               |
| **技术复杂度** | **简单** 生态成熟，开发调试成本低                  | **较复杂** 需要处理连接保活、断线重连等问题     |
| **典型场景**   | 网页浏览、RESTful API、文件下载、表单提交          | 即时聊天(IM)、在线游戏、实时股票行情、协同编辑  |

今天做了苍穹外卖的用户催单、管理端订单提醒、以及定时任务处理未支付订单和取消配送成功但仍然是派送中的订单。前二者的核心就是websocket，通过其建立的长连接实现即时推送，只需添加pom坐标，导入configuration 类和重点的WebSocketServer类，我们实现代码的关键方法就在这里，将其作为容器管理后直接自动注入相应的service层就能实现相关接口；定时任务处理要先在启动类添加注解，并在相关模块添加cron表达式，使其按照规范操作数据库。

### 一、Spring AI ChatClient 中 system prompt 的优先级从高到低是：

> 你手动 new Prompt 里的 SystemMessage
>
> ＞ `.system("xxx")`临时设置
>
> ＞ `defaultSystem("xxx")`默认配置**

只要你传了 `Prompt`，前面两个全部失效。

```java

public void afterPropertiesSet() throws Exception {
        chatClient =ChatClient.builder(chatModel)
                .defaultSystem("1")
                .build();
    }

    @RequestMapping("/call")
    public String chat(@RequestParam String message){
        return chatClient.prompt(message).system("加3").call().content();
    }

    
    @RequestMapping("/callOverwrite")
    public String chat2(@RequestParam String message){
        return chatClient.prompt(new Prompt(new SystemMessage("加3"),new UserMessage( message))).call().content();
    }
```

### 二、.call(),.stream(),.content()的作用

一、`.call()`的作用

> **`.call()`是 Spring AI 中用于「同步调用大模型」的方法。**

它的作用是：

✅ 将当前构建好的 `Prompt`（包含 system、user、memory 等信息） 发送给底层的 `ChatModel`

✅ 阻塞等待模型计算完成

✅ 返回一个 `ChatResponse`对象

📌 **一句话记忆：**

> **`.call()`= 真正发起一次大模型请求**

------

二、`.content()`的作用

> **`.content()`是从模型返回的 `ChatResponse`中，提取最终生成的文本内容。**

它的作用是：

✅ 从 `ChatResponse`中取出 `AssistantMessage`

✅ 再从中取出 `content`

✅ 返回一个 `String`

📌 **一句话记忆：**

> **`.content()`= 只要模型说出来的那句话**

另外流式输出就用stream:

```java
   //第二个参数用来指定输出内容的字节码
    @RequestMapping("/stream")
    public Flux<String> chat3(@RequestParam String message, HttpServletResponse response){
        response.setCharacterEncoding("utf-8");
        return chatClient.prompt(message).system("加3").stream().content();
    }
```

.call()和 .stream()是 ChatClient 的“出口”

前面都是在拼 Prompt，到这里才开始真正请求模型

他们的返回方式：

.call()：等模型说完，一次性给你

 .stream()：模型一边说，你一边听

### 三、自定义初始化逻辑：

理解一下这段代码：

```java
public class PromptEngineerController implements InitializingBean {

    @Autowired
    private ChatModel chatModel;

    private ChatClient chatClient;

    public void afterPropertiesSet() throws Exception {
        chatClient =ChatClient.builder(chatModel)
                .defaultSystem("你是一个助手，你需要帮助用户完成一个任务")
                .build();
    }

}
```

Spring 里没有 chatClient 这个 Bean，

我就自己造一个，

但我必须等 Spring 先把 chatModel 给我，

所以我借用了 InitializingBean，

让 Spring 在所有东西都准备好（也就是afterPropertiesSet）之后再叫我。**

讲正规一点就是：**InitializingBean是 Spring 提供的一个生命周期接口，用于在 Bean 的所有属性注入完成后执行自定义初始化逻辑，其 afterPropertiesSet()方法由 Spring 容器自动调用。**

### 四、**Map.of（）**是干嘛的？

一句话：用来快速创建一个 Map（键值对）

以前你可能见过这种写法：

```
Map<String, String> map = new HashMap<>();
map.put("topic", "Java");
```

现在用 Map.of可以一行搞定：

```
Map<String, String> map = Map.of("topic", "Java");
```

使用时：成对传入，不可重复，只读


```java
Book book  = chatClient
                .prompt("推荐好看的小说")
                .call().entity(Book.class);
```

### 一、entity() 内部到底干了什么？

你可以把 `entity()`看成这样一个**隐藏流程**：

```
// 伪代码（非常接近真实源码）
1. 自动创建 BeanOutputConverter<T>
2. 从 Converter 里拿 JSON Schema
3. 把 Schema 悄悄塞进 Prompt
4. 调用 AI
5. 拿到 AI 返回的字符串
6. 调用 converter.convert(json)
7. 返回 Java 对象
```

 **但是entity() 不是万能的**

如果 AI 返回的内容：

多了多余文字

JSON 不完整

忘了按格式输出

调用.entity()时就会直接爆出异常

### 二、BeanOutputConverter是干什么的？

**BeanOutputConverter 的作用只有一个：**

 **把 AI 返回的字符串（通常是 JSON），转换成你指定的 Java Bean**

------

对ai而言：

AI 只会说 **文本**

即使它“看起来”返回了 JSON， 本质上还是 **String**类型

对Java而言，你想要的是：

```
Book book = new Book();
book.setName("xxx");
```

中间缺了什么？

 **一个能把 JSON 文本 → Java 对象的转换器**

 **BeanOutputConverter 就是这个角色**

```
String（AI 返回）
    ↓
BeanOutputConverter
    ↓
Java Object（Book）
```

对应到代码中：

```java
        //创建一个 BeanOutputConverter转换器
        BeanOutputConverter<Book> bookBeanOutputConverter = new BeanOutputConverter<>(Book.class);

        //先用 getFormat()约束 AI 的输出
        String result = chatClient.prompt(promptTemplate.create(Map.of("format", bookBeanOutputConverter.getFormat()))).call().content();

        //再用 convert()把 AI 输出转成 Java 对象
        Book book = bookBeanOutputConverter.convert(result);
```



### 三、三种converter对比

| Converter           | 是否可传类型 | 返回类型             |
| ------------------- | ------------ | -------------------- |
| BeanOutputConverter | 支持         | `T`                  |
| MapOutputConverter  | 不支持       | `Map<String,Object>` |
| ListOutputConverter | 不支持       | `List<String>`       |

后两个返回类型不是泛型，只能处理一些简单情况，无法自定义指定实体类对象

**这是 Spring AI 中获取 `List<Book>`的标准写法：**

```java
.entity(new ParameterizedTypeReference<List<Book>>() {})
```

代码示例：

```java
 @RequestMapping("/convertList")
    public String convertList(){

       List<Book> books  = chatClient
                .prompt("推荐好看的小说")
                .call()
                .entity(new ParameterizedTypeReference<List<Book>>() {
                });

        return books.toString();
    }
```


### 四、短期记忆

1.直接手动拼接

把多轮对话历史扁平化为一个 Prompt，一次性发送给模型，由模型基于上下文生成下一次回复。

```java
 List<Message> messages = new ArrayList<>();

        messages.add(new SystemMessage("你是一个旅行助手"));
        messages.add(new UserMessage("我想去新疆玩"));
        messages.add(new SystemMessage("好的，你准备什么时候去玩"));
        messages.add(new UserMessage("我要元旦去玩"));
        messages.add(new SystemMessage("你想玩什么"));
        messages.add(new UserMessage("我喜欢自然风光"));


        Prompt prompt = new Prompt(messages);
        return chatModel.call(prompt).getResult().getOutput().getText();
```

**本质还是「一次 API 调用」**

不管是：

单条 system + user还是 10 轮对话

**底层都是一次 model.call(prompt)**

 LLM **本身没有记忆**

所谓“多轮对话”，全是靠我自己把历史塞回去

## 2026.4.19

不容易，今天终于做完了苍穹外卖。之前一直觉得我的妈呀这么难这么难，要学这儿还要学那就一直打退堂鼓。直到今天做完之后，感觉也不是想象中那么高不可攀，最终也是花了21天拿下了。我觉得时至今日也无需去想为什么开始的这么晚云云，确定方向本事就需要考虑和打磨，这也算是我尝试许多选择的一条技术栈。从今以后就要全力拿下ai项目课，因为我对此并不熟悉，所以我也无法预估完成时间。我只能说尽力而为就好。

------

以后你看到任何 Spring AI 代码，只问自己 **3 个问题**：

**是不是 ChatClient？**

 **有没有 Advisor？**

 **Memory 是显式还是隐式？**

只要这三点清晰，就 **不会被继承链绕晕**

### 一、Spring AI = ChatClient + 一堆“插件”

####  第 1 步：你发起请求

```
chatClient.prompt()
    .user("你好")
    .advisors(...)
```

👉 含义只有一句话：

> **“我要发一个请求，并且允许一些插件插手”**

------

####  第 2 步：插件先动手（Before）

**在你真正访问 LLM 之前**

插件们会依次做事情，比如：

- 打日志
- 查数据库（读历史记忆）
- 准备工具定义
- 检查参数

👉你可以理解为：

```
for (插件 : 插件列表) {
    插件.before();
}
```

------

#### 第 3 步：真正访问大模型

```
ChatModel.call()
ChatModel.stream()
```

👉 这一步**只会发生一次**（不考虑 retry / tool）

------

####  第 4 步：大模型返回结果

- 普通回答 
- 或：要调用工具 

------

#### 第 5 步：插件再动手（After）

**在返回给你之前**

插件们会：

- 处理工具调用
- 把对话存进数据库（写记忆）
- 打日志
- 统计 token

👉 顺序是反过来的：

```
for (插件 : 插件列表倒序) {
    插件.after();
}
```

------

####  第 6 步：你拿到结果

```
.stream().content();
```

#### 例子：

你这段代码：

```java
chatClient
    .prompt()
    .user(message)
    .advisors(
        new MessageChatMemoryAdvisor(jdbcChatMemory)
    )
    .advisors(spec -> spec.param(ChatMemory.CONVERSATION_ID, chatId))
    .stream()
    .content();
```

翻译成人话就是：

1. 我要发消息
2. **Memory 插件先查数据库（读）**
3. 发给 LLM
4. LLM 回答
5. **Memory 插件再把这次对话写回数据库**
6. 返回前端

**没有复杂继承**

 **没有链式魔法**

 **就是“插件前后插手”**

------



### 二、advisor理解

- **对象封装**：进入 Advisor 链之前，请求会被封装为 `ChatClientRequest`；离开 Advisor 链之后，响应会被封装为 `ChatClientResponse`。
- **调用关系**：Advisor 之间确实是依次调用的关系，形成了一个责任链（Chain of Responsibility）。

 **洋葱模型（The Onion Model）**

这个流程通常被称为“洋葱模型”，其执行顺序如下：

1. **请求阶段（正向传递）**：

   - 请求从第一个 Advisor 进入。
   - 依次经过 `Advisor 1`-> `Advisor 2`-> ... -> `最后一个 Advisor`。
   - 最后一个 Advisor 负责调用底层的 `ChatModel`（如 OpenAI、Ollama）。

2. 

   **响应阶段（逆向返回）**：

   - 'ChatModel`返回响应。
   - 响应逆向经过 `最后一个 Advisor`-> ... -> `Advisor 2`-> `Advisor 1`。
   - 最终返回给调用者。

**关键机制**

- **`ChatClientRequest`& `ChatClientResponse`**：这两个对象包裹了原始的 `Prompt`和 `ChatResponse`，并附带了一个非常重要的 `AdvisedContext`（上下文）。这个上下文可以在链中的不同 Advisor 之间共享数据。
- **拦截与修改**：在正向传递时，Advisor 可以修改请求（例如 `MessageChatMemoryAdvisor`把历史记录加到 Prompt 里）；在逆向返回时，Advisor 可以修改响应（例如记录日志）。

所以，你看到的官方示意图描述的正是这个“先进后出”的栈式调用过程。

------

体测给我累死了，早上测得现在六点半了腿还疼，这两天似乎肾结石再现，我看起来不慌，其实已经吓坏了

------

### 三、@Qualifier

@Qualifier= 在多实现中选一个

在 Spring AI 里，它最常见的用途就是： 一个项目里同时存在多个 ChatModel

**写法 1（推荐，清晰）**

```
@Autowired
@Qualifier("ollamaChatModel")
private ChatModel ollamaChatModel;
```

**写法 2（更简洁）**

```
@Resource(name = "ollamaChatModel")
private ChatModel ollamaChatModel;
```


### 一、jdk，JVM是什么

```
JDK 是用来“写 + 跑”Java 的

JRE 是用来“只跑”Java 的

JVM （java 虚拟机）是它们俩共同依赖的“运行引擎”
```

------

### 二、动态代理之proxy

Proxy 是 JVM 在运行期生成的一个“替身对象”，

它实现了你的接口，

把所有方法调用转发给 InvocationHandler，

让你可以在不修改原代码的情况下增强行为

#### 1. Proxy 是一个类

```
java.lang.reflect.Proxy
```

✅ 它是 JDK 自带的

✅ 专门用来 **生成代理对象**

------

#### 2. Proxy 本身不是“代理对象”

```
Proxy.newProxyInstance(...)
```

✅ `Proxy`是工厂

✅ 返回的那个对象才是真正的 **Proxy 实例**

------

#### 3. Proxy 实例长什么样？

假设有接口：

```
interface UserService {
    void save();
}
```

JVM 在内存里生成了一个类：

```java
final class $Proxy0 implements UserService {

    private InvocationHandler h;

    public $Proxy0(InvocationHandler h) {
        this.h = h;
    }

    public void save() throws Throwable {
        h.invoke(this,
                 UserService.class.getMethod("save"),
                 new Object[]{});
    }
}
```

✅ 这就是 **Proxy 的真面目**

------

#### 4. Proxy 做了哪几件事？

实现接口

```
implements UserService
```

------

把所有方法调用“转发”

```
h.invoke(...)
```

不让调用直接进入真实对象，这是 AOP / 增强的关键

Proxy 是“框架为了增强行为，在运行期偷偷生成的对象”

new 是“你明确告诉 JVM：我要这个类的实例



#### 5. Proxy vs 普通对象

| 普通对象     | Proxy                  |
| ------------ | ---------------------- |
| 编译期存在   | 运行期生成             |
| 方法直接执行 | 方法被拦截             |
| 难统一增强   | 极易增强               |
| new 出来的   | Proxy.newProxyInstance |

### 三、动态代理

#### 1.前提条件

> **JDK 动态代理只能代理「接口」**

```
interface UserService {
    void save();
}
```

 不能代理普通类， 只能代理接口

这对我来说还真挺重要，我的确不知道

#### 2.调用流程

```
你调用 proxy.save()
 ↓
JVM 生成的代理方法接管
 ↓
把控制权交给 InvocationHandler
 ↓
你在 invoke() 里加增强逻辑
 ↓
（可选）调用真实对象的 save()
```

#### 3.动态代理剧场 · 全对照版

##### （1）角色总表

| 生活故事 | Java 机制         | Spring AOP        | LangChain4j AI Service     |
| -------- | ----------------- | ----------------- | -------------------------- |
| 明星     | Interface         | 业务接口          | Assistant 接口             |
| 经纪人   | Proxy             | AOP 代理对象      | AI Service Proxy           |
| 老板     | InvocationHandler | MethodInterceptor | AiServiceInvocationHandler |
| 明星本人 | 真实对象          | 原始 Bean         | 无（接口无实现）           |
| 唱歌     | 方法              | save() / create() | chat()                     |

------

##### （2）你找明星唱歌

你（粉丝）发起请求

```
star.sing();
```

| 场景       | Spring AOP            | AI Service               |
| ---------- | --------------------- | ------------------------ |
| 你写的代码 | `orderService.save()` | `assistant.chat("你好")` |

✅ 你以为在直接调用

❌ 实际面对的是 **经纪人**

------

##### （3）经纪人拦截（Proxy）

实际执行的是

```
经纪人.sing();
```

对应 Java：

```
$Proxy0.sing();
```

| 场景     | Spring AOP | AI Service       |
| -------- | ---------- | ---------------- |
| 代理对象 | AOP Proxy  | AI Service Proxy |
| 作用     | 拦截方法   | 拦截方法         |

------

##### （4）交给老板决策（InvocationHandler）

```
老板.invoke(唱歌请求);
```

对应代码：

```
invoke(proxy, method, args)
```

✅ Spring AOP 在这里干什么？

```
invoke() {
    before();          // 开启事务
    Object result = method.invoke(target);
    afterReturning();  // 提交事务
    return result;
}
```

✅ 事务 / 日志 / 鉴权 / 监控

------

✅ AI Service 在这里干什么？

```
invoke() {
    Prompt prompt = buildPrompt(args);
    addMemory(prompt);
    addTools(prompt);
    ChatResponse res = model.chat(prompt);
    return parseResult(res);
}
```

✅ 拼 Prompt

✅ 管理对话记忆

✅ 执行 Tool Calling

✅ 结构化输出

------

##### （5）是否让明星本人上场

```
明星.sing();
```

| 场景             | Spring AOP | AI Service |
| ---------------- | ---------- | ---------- |
| 是否调用真实对象 | ✅ 是       | ❌ 否       |
| 原因             | 有业务实现 | 接口无实现 |

------

##### （6）一句话总结

> **Spring AOP 的 Proxy 是“有明星本人的剧组”，
>
> AI Service 的 Proxy 是“连明星都是临时凑出来的剧组”。**
