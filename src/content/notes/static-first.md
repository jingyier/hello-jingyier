---
title: 线程理解
date: 2026-05-12
summary: 线程
category: 技术架构
tags:
  - java
featured: true
---

进程 vs 线程

| 对比点           | 进程（餐厅）                 | 线程（员工）                             |
| ---------------- | ---------------------------- | ---------------------------------------- |
| **独立性**       | 每家餐厅独立运营，互不干涉   | 员工都在同一家店里干活                   |
| **资源占用**     | 很占地方（房租、装修、设备） | 只占工位和小工具                         |
| **创建速度**     | 开一家新餐厅很慢             | 招一个新员工很快                         |
| **沟通难度**     | 两家餐厅合作要打电话、签合同 | 员工面对面喊一声就行                     |
| **出问题的影响** | 这家店着火，隔壁店没事       | 一个员工犯错，可能拖累整个店（进程挂掉） |

------

### 一、单进程单线程：你一个人开小面馆

```java
/**
 * 单进程单线程
 * 你一个人开小面馆，自己下面、自己端、自己收钱
 * 来两桌客人就手忙脚乱
 */
@GetMapping("/single-thread")
public String singleThreadNoodleShop() {
    // 你一个人，既当老板又当厨师又当服务员
    System.out.println("【老板】来客了，我亲自下面...");
    
    // 下面（模拟耗时操作）
    try { Thread.sleep(3000); } catch (InterruptedException e) {}
    
    // 端盘子
    System.out.println("【老板】面好了，我亲自端过去...");
    
    // 收钱
    System.out.println("【老板】客人吃完了，我亲自收钱...");
    
    return "单线程：忙完一桌，才能接下一桌";
}
```

**效果**：

一次只能服务一桌，第二桌要等第一桌全流程干完，效率很低。

------

### 二、多进程：兰州拉面连锁，每家店独立

```java
/**
 * 多进程
 * 你开成“兰州拉面连锁”，每家店独立
 * 一家店着火，别家没事，但开分店贵
 */
@GetMapping("/multi-process")
public String multiProcessNoodleChain() throws Exception {
    // 开第一家店
    ProcessBuilder shop1 = new ProcessBuilder("java", "-version");
    Process p1 = shop1.start();
    p1.waitFor();
    System.out.println("【分店1】兰州拉面城东店 已开业，独立经营");
    
    // 开第二家店
    ProcessBuilder shop2 = new ProcessBuilder("java", "-version");
    Process p2 = shop2.start();
    p2.waitFor();
    System.out.println("【分店2】兰州拉面城西店 已开业，独立经营");
    
    // 开第三家店
    ProcessBuilder shop3 = new ProcessBuilder("java", "-version");
    Process p3 = shop3.start();
    p3.waitFor();
    System.out.println("【分店3】兰州拉面城南店 已开业，独立经营");
    
    return "多进程：每家店独立，一家着火不影响别家，但开分店成本高";
}
```

**效果**：

每个 `Process`都是一家“分店”，有自己独立的资源和空间，一个挂了不影响其他，但创建和销毁很“贵”。

------

### 三、多线程：一家店多招员工

```java
/**
 * 多线程
 * 你还是一家店，但多招几个员工
 * 切菜、下面、端盘、收银各司其职，效率高
 * 但一个员工搞砸，全店遭殃
 */
@GetMapping("/multi-thread")
public String multiThreadNoodleShop() {
    // 你招了三个员工
    Thread cutter = new Thread(() -> {
        System.out.println("【切菜工】切菜中...");
        try { Thread.sleep(2000); } catch (InterruptedException e) {}
        System.out.println("【切菜工】菜切好了");
    });

    Thread cooker = new Thread(() -> {
        System.out.println("【厨师】下面中...");
        try { Thread.sleep(3000); } catch (InterruptedException e) {}
        System.out.println("【厨师】面煮好了");
    });

    Thread waiter = new Thread(() -> {
        System.out.println("【服务员】端盘中...");
        try { Thread.sleep(1000); } catch (InterruptedException e) {}
        System.out.println("【服务员】面端上桌了");
    });

    // 同时开工
    cutter.start();
    cooker.start();
    waiter.start();

    // 等他们都干完
    try {
        cutter.join();
        cooker.join();
        waiter.join();
    } catch (InterruptedException e) {}

    System.out.println("【老板】一桌饭齐活了，效率高！");
    return "多线程：一个店多个员工，各干各的，但一个员工搞砸，全店遭殃";
}
```

**效果**：

一个进程里多个线程同时干活，效率比单线程高，但大家共享“厨房”，一个线程把锅烧了，整个店（进程）可能挂。

------

### 四、线程池：固定养一支员工队伍

```java
/**
 * 线程池
 * 你固定养 5~10 个员工，平时待命
 * 来活就分给他们，没活就休息
 * 不用来一个客人现招人，降低成本，方便管理
 */
@Configuration
public class NoodleShopThreadPoolConfig {

    @Bean("noodleShopPool")
    public Executor noodleShopPool() {
        ThreadPoolTaskExecutor pool = new ThreadPoolTaskExecutor();
        pool.setCorePoolSize(5);         // 平时常备5个员工
        pool.setMaxPoolSize(10);        // 忙的时候最多扩到10个
        pool.setQueueCapacity(100);     // 排队等活的任务最多100个
        pool.setKeepAliveSeconds(60);   // 闲下来60秒没活，就裁掉多余的人
        pool.setThreadNamePrefix("noodle-"); // 员工名字前缀
        pool.initialize();
        return pool;
    }
}

@RestController
public class NoodleShopController {

    @Autowired
    @Qualifier("noodleShopPool")
    private Executor noodleShopPool;

    @GetMapping("/thread-pool")
    public String useThreadPool() {
        System.out.println("【老板】有客人来了，从员工池里派活...");

        for (int i = 1; i <= 8; i++) {
            int table = i;
            noodleShopPool.execute(() -> {
                System.out.println("【员工-" + Thread.currentThread().getName() + 
                                   "】去服务" + table + "号桌");
                try { Thread.sleep(2000); } catch (InterruptedException e) {}
                System.out.println("【员工-" + Thread.currentThread().getName() + 
                                   "】" + table + "号桌服务完毕");
            });
        }

        return "线程池：活来了就分，不用来一个客人现招人，系统稳得很";
    }
}
```

**效果**：

任务来了，从池子里拿个空闲“员工”去干

干完，员工回池子待命

你只管“分活”，不操心“招人/辞退”

------

### 五、在 Spring 里用：搭好“员工池”，只管分活

```java
/**
 * 在 Spring 里
 * 你写一个 @Configuration 类，把“员工池”搭好
 * 业务代码里用 @Autowired 拿到这个池子，把任务丢进去
 * 你只管“分活”，不操心“招人/辞退”，系统稳得很
 */
@Service
public class NoodleOrderService {

    @Autowired
    @Qualifier("noodleShopPool")
    private Executor noodleShopPool;

    public void takeOrder(int tableId) {
        // 收到订单，把任务丢进“员工池”
        noodleShopPool.execute(() -> {
            System.out.println("【接单员】" + tableId + "号桌的订单已交给员工 " + 
                               Thread.currentThread().getName());
            // 模拟做面
            try { Thread.sleep(3000); } catch (InterruptedException e) {}
            System.out.println("【接单员】" + tableId + "号桌的面做好了");
        });
    }
}

@RestController
public class OrderController {

    @Autowired
    private NoodleOrderService orderService;

    @GetMapping("/order/{tableId}")
    public String placeOrder(@PathVariable int tableId) {
        orderService.takeOrder(tableId);
        return tableId + "号桌下单成功，后厨正在做面...";
    }
}
```

**效果**：

你只管 `orderService.takeOrder(tableId)`分活

具体谁干、怎么干、招多少人，全是“员工池”和 Spring 帮你管

你这个“老板”轻松多了，系统也稳

### 总结

1. 

   **单进程单线程**

   你一个人开小面馆，自己下面、端盘、收钱

   来两桌客人就手忙脚乱

   代码：`new Thread`或直接在主线程里干

2. 

   **多进程**

   开成“兰州拉面连锁”，每家店独立

   一家着火，别家没事，但开分店贵

   代码：`new ProcessBuilder().start()`

3. 

   **多线程**

   还是一家店，多招员工

   切菜、下面、端盘、收银各司其职，效率高

   但一个员工搞砸，全店遭殃

   代码：自己 `new Thread`启动多个

4. 

   **线程池**

   固定养 5~10 个员工，平时待命

   来活就分，没活休息

   不用来一个客人现招人

   代码：`ThreadPoolTaskExecutor`配好，用 `executor.execute()`

5. 

   **在 Spring 里用**

   写个 `@Configuration`搭好“员工池”

   业务里 `@Autowired`拿池子，把任务丢进去

   你只管“分活”，不操心“招人/辞退”，系统稳得很

   代码：上面 `NoodleShopThreadPoolConfig`+ `NoodleOrderService`那一套
