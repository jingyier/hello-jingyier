---
title: java程序对数据库的操作
date: 2026-03-31
summary: mybatis,jwt
category: 站点功能
tags:
  - java
featured: false
---

## 2026 3.19

@Pathvariable:用来接收路径参数,把一个路径参数绑定给方法形参，如

```
请求参数：/emp/1
```

```java
@GetMapping("/{id}")
    public Result getInfo(@PathVariable Integer id){
    、、、、、、
    }
```

### 关于Mybatis的xml映射文件

resultType（自动映射）

单表查询，且数据库列名（字段名） = Java属性名（如 name对 name）。

resultMap（手动映射）

列名 ≠ 属性名（如 user_name对 userName）<!--但这个问题可以在yml配置文件中经过相关配置后规避，可直接看作简单的字段名=属性名-->

```yaml
mybatis:
  configuration:
    map-underscore-to-camel-case: true
```

有嵌套对象/集合（如 Emp里包含一个 List<Expr>）<!--集合List<Expr>可以封装多条数据，这样的就只能手动映射了-->

映射示例

```xml
    <resultMap id="empResultMap" type="com.itheima.pojo.Emp">
        <id column="id" property="id" />  //主键用id
        //都有两个参数，第一个是字段名，第二个是属性名
        <result column="username" property="username" /> //其余属性用result
        <result column="password" property="password" />
        <result column="name" property="name" />
        <result column="gender" property="gender" />
        <result column="phone" property="phone"/>
        <result column="job" property="job"/>
        <result column="salary" property="salary"/>
        <result column="image" property="image" />
        <result column="entry_date" property="entryDate" />
        <result column="dept_id" property="deptId" />
        <result column="create_time" property="createTime" />
        <result column="update_time" property="updateTime" />
        
        <!--封装exprList-->
        <collection property="exprList" ofType="com.itheima.pojo.EmpExpr">//集合用collection
            <id column="ee_id" property="id"/>
            <result column="ee_company" property="company"/>
            <result column="ee_job" property="job"/>
            <result column="ee_begin" property="begin"/>
            <result column="ee_end" property="end"/>
            <result column="ee_empid" property="empId"/>
        </collection>
    </resultMap>

   #具体数据库操作语句
    <select id="getById" resultMap="empResultMap"> 
        select e.*,
               ee.id ee_id,
               ee.emp_id ee_empid,
               ee.begin ee_begin,
               ee.end ee_end,
               ee.company ee_company,
               ee.job ee_job
            from emp e left join emp_expr ee on e.id = ee.emp_id
            where e.id=#{id}
    </select>
```

### 杂项

CollectionUtils工具类常用来处理集合参数、结果集等

```java
if(!CollectionUtils.isEmpty(exprList))      //判断集合非空
```

forEach()是集合遍历方法，可对集合内每一个元素执行括号里的操作。

```java
exprList.forEach(empExpr -> empExpr.setEmpId(emp.getId())); 
```

json格式的数据要想封装到对象中，要加注解@RequestBody

```
public Result update(@RequestBody Emp emp){
、、、
}
```

<set>+ <if>—— 用于 UPDATE 语句

动态拼接 `SET`子句，自动处理逗号（避免最后多一个逗号），常用于更新部分字段。

```xml
<update id="updateById">
    UPDATE emp
    <set>
        <if test="username != null and username != ''">username = #{username},</if>
        <if test="password != null and password != ''">password = #{password},</if>
        <if test="name != null and name != ''">name = #{name},</if>
        <if test="gender != null">gender = #{gender},</if>
        <if test="phone != null and phone != ''">phone = #{phone},</if>
        <if test="job != null">job = #{job},</if>
        <if test="salary != null">salary = #{salary},</if>
        <if test="image != null and image != ''">image = #{image},</if>
        <if test="entryDate != null">entry_date = #{entryDate},</if>
        <if test="deptId != null">dept_id = #{deptId},</if>
        <if test="updateTime != null">update_time = #{updateTime}</if>
    </set>
    WHERE id = #{id}
</update>
```

<where>+ <if>—— 用于 SELECT / UPDATE / DELETE 语句

动态拼接 `WHERE`子句，自动处理开头的 `AND`或 `OR`，避免语法错误。

```xml
<select id="findByCondition" resultType="Emp">
    SELECT * FROM emp
    <where>
        <if test="username != null and username != ''">AND username = #{username}</if>
        <if test="gender != null">AND gender = #{gender}</if>
        <if test="deptId != null">AND dept_id = #{deptId}</if>
    </where>
</select>
```

## 2026 3.20

数据库出现group by分组字段后，select后只能使用分组字段和聚合函数

### 数据库的  **if**  流程控制函数

if(expr,val1,val2)：如果表达式expr成立，取val1，否则取val2

```sql
select
         if(gender=1,'男性员工','女性员工') name,
         count(*) value
          from emp group by gender
```

### case when条件判断

```
CASE WHEN 条件 THEN 结果 [ELSE 其他] END
```

**作用**：多条件分支判断，按条件返回对应值，可替代简单 `IF`嵌套。

`SELECT CASE WHEN score>=90 THEN '优'`

` WHEN score>=60 THEN '及格' ` 

`ELSE '不及格' END FROM stu;`

昨天下载了前端项目内容，今天处理了之前所有的前后端联调测试，在1~2天内要完成班级接口，学员接口的创建，然后再开后面的登录操作内容。

## 2026.3.21

今天开始班级接口和学生接口的开发；汇总一下问题

1.新增班级接口下拉班主任列表无选项，apifox键入emp的id后成功录入；

2.无法批量删去学生（已解决）

死于没有仔细看接口文档

```java
@DeleteMapping("/students/{ids}")   //把{ids}没写
```

还有要搞清楚常用注解的使用：

这里先留一下，做完接口统一汇总一下

------

用户第一次访问服务器时，服务器为他创建一个 Session 并存入数据，同时生成一个唯一的 SessionID，通过 `Set-Cookie`发给浏览器保存；之后浏览器每次访问都带上这个 SessionID（把它保存成cookie），服务器用它找到对应的 Session，读取里面的数据，从而实现会话级别的身份或状态保持。

### jwt令牌

1. JWT令牌由哪几个部分组成 ，每个部分都存储什么内容？
   - header (头) ，记录令牌类型、签名算法
   - payload (载荷) ，携带一些自定义的信息
   - signature (签名) ，访问被篡改，保证安全性
2. JWT令牌生成及校验？
   - Jwts.builder()...
   - Jwts.parser()...
3. JWT令牌解析（校验）时什么情况会报错？
   - JWT令牌被篡改 或 过期失效了
4. 注意事项
   - JWT校验时使用的签名秘钥，必须和生成JWT令牌时使用的秘钥是配套的

## 2026.3.21

### 过滤器

1. 过滤器的执行流程

放行前 -> 放行 -> 资源 -> 放行后

2. 配置的过滤器的拦截路径 `/*`与 `/emps/*`分别代表什么意思？

/*：表示拦截所有

/emps/*`：表示目录拦截，拦截 `/emps`下的所有资源

3. 什么是过滤器链？

当一个请求进入 Web 应用时，容器（如 Tomcat）会根据**过滤器的配置顺序**（或注解的 `@Order`优先级），将请求传递给第一个过滤器。

每个过滤器的处理逻辑分为三个阶段：

**放行前（Pre-processing）**：过滤器执行自己的逻辑（如权限校验、字符编码设置、Token 验证等）。

**放行（Forward）**：调用 `filterChain.doFilter(request, response)`，将请求传递给**下一个过滤器**（如果没有下一个过滤器，则传递给目标资源，如 Servlet/Controller）。

**放行后（Post-processing）**：目标资源处理完请求后，响应会沿着过滤器链**反向**返回，此时过滤器可以执行“收尾逻辑”（如日志记录、响应头修改等）。

### 拦截器

```java
@Override
public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(demoInterceptor)
            .addPathPatterns("/**")       // 需要拦截的资源（任意级路径）
            .excludePathPatterns("/login"); // 不需要拦截的资源
}
```

拦截路径规则表：

| 拦截路径    | 含义                 | 举例（匹配/不匹配）                                       |
| ----------- | -------------------- | --------------------------------------------------------- |
| `/*`        | 一级路径             | 匹配 `/depts`、`/emps`；不匹配 `/depts/1`                 |
| `/**`       | 任意级路径           | 匹配 `/depts`、`/depts/1`、`/depts/1/2`                   |
| `/depts/*`  | `/depts`下一级路径   | 匹配 `/depts/1`；不匹配 `/depts/1/2`、`/depts`            |
| `/depts/**` | `/depts`下任意级路径 | 匹配 `/depts`、`/depts/1`、`/depts/1/2`；不匹配 `/emps/1` |

拦截器是Spring提供的技术，它只会拦截对于Spring当中资源的请求；过滤器不是Spring提供的技术，是sevlet提供的规范，它可以拦截项目中的所有资源。同时存在过滤器和拦截器时，先处理过滤器，再处理拦截器。

## 2026.3.25

### Spring AOP概念

Spring AOP 的核心思想就是：在不修改原有业务代码的前提下，通过定义切入点（Pointcut）锁定目标方法，然后在切面（Aspect）中统一添加额外功能。

记忆（区别）方法：

连接点 = 全集，切入点 = 子集

连接点是“候选名单”，切入点是“最终名单

| 概念              | 通俗说法         | 技术含义                             |
| ----------------- | ---------------- | ------------------------------------ |
| 连接点 Join Point | 有哪些地方能被切 | 程序中可被拦截的点（主要是方法执行） |
| 切入点 Pointcut   | 我到底切哪些地方 | 从连接点中选出的具体匹配规则         |
| 通知 Advice       | 切进去后做什么   | 在切入点处执行的增强逻辑             |

### 动态代理

| 特点           | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| 代理类不是手写 | 由 JVM / 框架在运行时动态生成字节码，生成 .class 文件        |
| 通用性强       | 同一个代理工具可以为很多不同的接口/类生成代理                |
| 常用于 AOP     | Spring AOP 就是用动态代理来实现“在不改源码的情况下增强方法功能” |
| 两种主流实现   | JDK 动态代理（基于接口）、CGLIB（基于继承，可代理普通类）    |

动态代理就是：在程序运行过程中，“当场捏”出一个代理对象，让它帮你干活并顺便加点额外操作。

### 切入点表达式：`execution`

在 Spring AOP 里，切入点表达式写在 `@Pointcut(...)`注解里，决定了切面作用的“目标范围”。

语法骨架：

```
execution([修饰符] 返回值类型 包名.类名.方法名(参数列表) [throws 异常])
```

各部分含义：

| 部分       | 写法示例                      | 说明                             |
| ---------- | ----------------------------- | -------------------------------- |
| 修饰符     | `public`、`private`（可选）   | 一般不写，默认匹配任意访问修饰符 |
| 返回值类型 | `*`（任意）、`void`、`String` | `*`表示任意返回值                |
| 包名       | `com.example.service.*`       | `*`匹配一层，`..`匹配多层        |
| 类名       | `*Service`、`UserService`     | `*`匹配任意类名                  |
| 方法名     | `*`（任意）、`save*`、`login` | `*`匹配任意方法                  |
| 参数列表   | `()`、`(String)`、`(..)`      | `..`表示任意参数个数和类型       |
| 异常       | `throws Exception`（可选）    | 一般省略                         |

```java
// 匹配 com.example.service 包下所有类的所有方法
execution(* com.example.service.*.*(..))

// 匹配所有以 save 开头、任意参数的方法
execution(* com.example.service.*.save*(..))

// 匹配返回值为 String 的方法
execution(String com.example.service.UserService.getUsername(..))
```

可以用 `&&`（与）、`||`（或）、`!`（非）组合多个表达式。

```java
// 在 service 包中，且方法上有 @Log 注解
@Pointcut("within(com.example.service..*) && @annotation(com.example.annotation.Log)")
```

### JoinPoint

JoinPoint 是 Spring AOP 中所有方法执行点的抽象，是切入点的候选集，在通知中通过它可以获取方法签名、参数、目标对象等信息。

作用：在通知方法里声明 `JoinPoint joinPoint`，常用 API：

| 方法                  | 作用                                       |
| --------------------- | ------------------------------------------ |
| `getSignature()`      | 获取方法签名（返回类型、方法名、参数类型） |
| `getArgs()`           | 获取方法实参数组                           |
| `getTarget()`         | 获取被代理的**真实对象**（目标对象）       |
| `getThis()`           | 获取**代理对象本身**                       |
| `getSourceLocation()` | 获取源代码位置（行号等，调试用）           |

2026.3.31更新：

`joinPoint.getTarget()`得到的是“被增强的业务对象（Mapper/Service）”，

而 `joinPoint.getArgs()[0]`才是“方法调用时传入的实体对象”，

自动填充公共字段必须操作实体对象，因此不能直接使用 `getTarget()`。

------

今天终于完成了tlias项目的实现！现在就剩下原理篇，还剩下linux的配置，docker的部署

## 2026.3.26

配置文件优先级：properties>yml>yaml

+两种外部配置：命令行>java系统属性>properties>yml>yaml

### **部署 Java Web 应用（Spring Boot JAR 包）**

> 系统：CentOS 7+（使用 `yum`和 `systemctl`）
>
> 应用：Spring Boot 打包好的 `tlias-web-management.jar`
>
> 目标：部署到服务器，后台运行，开机自启，开放端口，日志可追踪

------

#### 一、准备环境

1. 更新系统 & 安装基础工具

```
yum update -y
yum install -y vim wget curl net-tools lsof
```

------

2. 安装 JDK 17

```python
cd /usr/local   #目录
wget https://download.oracle.com/java/17/latest/jdk-17_linux-x64_bin.tar.gz
```

> 如果 `wget`不能用，可在本机下载后 `scp`上传到服务器。
>
> 我选择直接把准备好的jdk文件拖动到了FinalShell底栏的文件列表对应的目录

解压并配置环境变量

```
tar -zxvf jdk-17_linux-x64_bin.tar.gz     #文件操作相关知识点
mv jdk-17.* jdk-17   #移动操作
```

编辑 `/etc/profile`

```
vim /etc/profile     #vim进行文本编辑，编辑对象为目录所指对象
```

在末尾添加：

```
export JAVA_HOME=/usr/local/jdk-17   
export PATH=$JAVA_HOME/bin:$PATH     #配置环境变量
```

使配置生效

```
source /etc/profile   #使环境变量配置生效
java -version  #检查jdk是否安装成功
```

 应输出 `java version "17.x.x"`。

------

#### 二、上传并放置应用 JAR

1. 创建应用目录

```
mkdir -p /usr/local/tlias-app   
cd /usr/local/tlias-app
```

2. 上传 JAR 包

```
scp /本地路径/tlias-web-management.jar root@服务器IP:/usr/local/tlias-app/
```

3. 查看文件

```
ls -lh
```

确认 `tlias-web-management.jar`存在。

------

#### 三、测试运行应用

前台启动（调试用）

```
java -jar tlias-web-management.jar
```

观察控制台输出是否有报错。

按 `Ctrl+C`停止。

------

#### 四、正式部署（后台运行 + 日志）

1. 后台运行并记录日志

```
nohup java -jar tlias-web-management.jar > tlias.log 2>&1 &
```

`nohup`：退出终端不中断进程

`> tlias.log 2>&1`：标准输出和错误都写入 `tlias.log`

`&`：后台运行

2. 查看进程

```
ps -ef | grep java
```

应看到类似：

```
root 12345 1 0 10:00 ? 00:00:30 java -jar tlias-web-management.jar
```

3. 查看实时日志

```
tail -f tlias.log
```

按 `Ctrl+C`退出跟踪。

------

#### 五、开放应用端口（后端8080，前端80）

1. 检查 firewalld 状态

```
systemctl status firewalld
```

若未运行：

```
systemctl start firewalld
systemctl enable firewalld
```

2. 开放 8080 端口

```
firewall-cmd --zone=public --add-port=8080/tcp --permanent
firewall-cmd --reload
firewall-cmd --zone=public --list-ports
```

输出应包含 `8080/tcp`。

```
nginx -t
systemctl start nginx
systemctl enable nginx
firewall-cmd --add-port=80/tcp --permanent
firewall-cmd --reload
```

------

#### 六、部署完成验证

浏览器访问：

```
http://服务器IP:8080
```

或通过 Nginx：

```
http://服务器IP
```

查看日志无报错：

```
tail -f /usr/local/tlias-app/tlias.log
```

