---
title: docker
date: 2026-03-27
summary: 主理解的ai文档，初步学习docker部署
category: 站点结构
tags:
  - docker
featured: false
---

### docker理解

我们可以把 Docker 想象成一种**“打包+快递+隔离送货”**的服务，用三个生活场景来理解：

#### 1. 「镜像」→ 预制好的“外卖套餐”

比如你要吃一份“宫保鸡丁盖饭”，餐厅提前把**鸡肉、花生、米饭、调料、烹饪步骤**都打包成一个“标准化套餐”（镜像）。这个套餐里包含了所有需要的“东西”（应用代码、运行环境、配置文件、依赖库等），拿到这个套餐，你就有了做/吃这份饭的全部条件。

对应到 Docker：镜像是**“打包好的应用+运行环境”**，比如 MySQL 镜像里，已经包含了 MySQL 软件、它的运行依赖、配置模板等，相当于“开箱即用”的软件包。

#### 2. 「容器」→ 打开套餐后的“用餐环境”

你拿到“宫保鸡丁套餐”后，会在自己的餐桌上（宿主机的某个空间）拆开，开始吃饭。这个“餐桌+餐具+你用餐的过程”就是**容器**——它是镜像运行起来的“隔离环境”。

对应到 Docker：容器是**“镜像运行时的实例”**，每个容器都有自己独立的空间（比如独立的文件系统、网络、进程），就像你在自己家吃饭，和邻居家的用餐环境互不干扰。即使你同时开了 3 个“宫保鸡丁容器”，它们的食材、用量也不会互相影响。

#### 3. 「镜像仓库」→ 外卖平台的“商家列表”

你需要点外卖时，会去美团、饿了么（镜像仓库，比如 DockerHub）找“宫保鸡丁商家”。仓库里存着无数个“预制套餐”（各种镜像，比如 MySQL、Python、Nginx 的镜像），你可以直接下载（拉取）别人做好的镜像来用。

对应到 Docker：镜像仓库是**“存储和分发镜像的平台”**，DockerHub 是最大的公共仓库，里面有各种现成的镜像，你也可以把自己的镜像传到私有仓库（比如公司内部的仓库）分享给别人。

------

**docker run 常见参数**：

`-d`：后台运行容器（ detached 模式，容器在后台默默工作，不占用当前终端）。

`--name`：给容器起唯一名字（方便后续管理，比如 `docker stop 名字`停止容器）。

`-e`：设置**环境变量**（给容器内的程序传递配置，比如 MySQL 的 root 密码、时区）。

`-p`：**端口映射**（把“宿主机的端口”和“容器内的端口”关联起来，让外部能访问容器内的服务）。

镜像名称结构：`Repository:TAG`

`Repository`：镜像名（比如 `mysql`是镜像名，代表 MySQL 这个软件的镜像）。

`TAG`：版本号（比如 `8`代表 MySQL 8 版本，默认是 `latest`即最新版）。

示例：

```
docker run -d \
  --name mysql8 \
  -p 3307:3306 \
  -e TZ=Asia/Shanghai \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8
```



### 端口映射理解

你去奶茶店买奶茶（访问服务），奶茶店的“制作间”（容器）里有奶茶机（服务）用的是 `8080`端口，但顾客不能直接进制作间。于是奶茶店在门口（宿主机）开了一个窗口，告诉顾客：“点单请拨窗口号 `9000`（宿主机端口），我们把订单转到制作间的 `8080`端口来制作”。这里 `9000:8080`就是端口映射，让顾客（外部）能通过窗口（宿主机端口）间接使用制作间的服务（容器端口）。

### Docker 常见命令

#### 1. 镜像相关

| 命令                        | 说明         | 实例                  |
| --------------------------- | ------------ | --------------------- |
| `docker pull <镜像名:标签>` | 拉取镜像     | `docker pull mysql:8` |
| `docker images`             | 查看本地镜像 | `docker images`       |
| `docker rmi <镜像ID/名>`    | 删除镜像     | `docker rmi mysql:8`  |

------

#### 2. 容器生命周期

| 命令                         | 说明                     | 实例                                                         |
| ---------------------------- | ------------------------ | ------------------------------------------------------------ |
| `docker run [参数] <镜像>`   | 创建并启动容器           | `docker run -d --name mysql -p 3307:3306 -e MYSQL_ROOT_PASSWORD=123 mysql:8` |
| `docker start <容器名/ID>`   | 启动已停止容器           | `docker start mysql`                                         |
| `docker stop <容器名/ID>`    | 停止容器                 | `docker stop mysql`                                          |
| `docker restart <容器名/ID>` | 重启容器                 | `docker restart mysql`                                       |
| `docker rm <容器名/ID>`      | 删除容器                 | `docker rm mysql`                                            |
| `docker ps`                  | 查看运行中的容器         | `docker ps`                                                  |
| `docker ps -a`               | 查看所有容器（含已停止） | `docker ps -a`                                               |

------

#### 3. 容器操作

| 命令                                 | 说明             | 实例                         |
| ------------------------------------ | ---------------- | ---------------------------- |
| `docker exec -it <容器名/ID> <命令>` | 进入容器执行命令 | `docker exec -it mysql bash` |
| `docker logs <容器名/ID>`            | 查看容器日志     | `docker logs mysql`          |
| `docker logs -f <容器名/ID>`         | 实时查看日志     | `docker logs -f mysql`       |
| `docker inspect <容器名/ID>`         | 查看容器详细信息 | `docker inspect mysql`       |

### 数据卷命令速查表（含挂载方式）

#### 1. 数据卷管理

| 命令                           | 说明               | 实例                               |
| ------------------------------ | ------------------ | ---------------------------------- |
| `docker volume create <卷名>`  | 创建数据卷         | `docker volume create mysql_data`  |
| `docker volume ls`             | 查看所有数据卷     | `docker volume ls`                 |
| `docker volume inspect <卷名>` | 查看数据卷详情     | `docker volume inspect mysql_data` |
| `docker volume rm <卷名>`      | 删除数据卷         | `docker volume rm mysql_data`      |
| `docker volume prune`          | 清理未使用的数据卷 | `docker volume prune`              |

#### 3. 实用组合示例

**① 具名卷 + 端口映射**

```
docker run -d \
  --name mysql \
  -p 3307:3306 \
  -v mysql_data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=123 \
  mysql:8
```

**② 绑定挂载配置文件**

```
docker run -d \
  --name nginx \
  -p 80:80 \
  -v /home/user/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:latest
```

**③ 匿名卷 + 日志持久化**

```
docker run -d \
  --name redis \
  -v /var/log/redis \
  redis:7
```

## 2026.3.28

可以把 **Dockerfile 自定义镜像** 理解成：

👉 **给一台“空白小电脑”写一份“装机 + 配置 + 启动说明书”**，以后谁拿到这份说明书，都能一键复刻出一模一样的运行环境。

下面我用「生活类比 + 简单示例」给你讲清楚。

------

**一、先用一句话理解 Dockerfile**

> **Dockerfile = 镜像的源代码**
>
> **docker build = 按 Dockerfile 编译出一个镜像**
>
> **docker run = 用镜像启动一个容器（运行中的程序）**

------

**二、把 Dockerfile 想象成“做菜食谱”**

假设你要在服务器上跑一个 Python 程序：

你写一个 `Dockerfile`，相当于：

> “我要一台 Ubuntu 机器
>
> 装 Python 3.9
>
> 装 requests、flask
>
> 把我的代码放进去
>
> 启动时运行 app.py”

别人只要执行：

```
docker build -t myapp .
docker run myapp
```

 不管在哪台机器，**环境一模一样**

------

**三、Dockerfile 里每一行都在干嘛**

```
# 选基础镜像（相当于买一台裸机）
FROM python:3.9-slim

#  设置工作目录（相当于 cd 到某个文件夹）
WORKDIR /app

#  拷贝依赖清单
COPY requirements.txt .

# 安装依赖（pip install）
RUN pip install -r requirements.txt

#  拷贝代码
COPY . .

#  暴露端口（告诉别人我用了 80）
EXPOSE 80

# 启动命令（容器启动时干啥）
CMD ["python", "app.py"]
```

对应现实世界：

| Dockerfile | 现实生活           |
| ---------- | ------------------ |
| FROM       | 买什么系统的电脑   |
| WORKDIR    | 在哪个文件夹干活   |
| RUN        | 安装软件           |
| COPY       | 把文件拷进去       |
| CMD        | 开机自动运行的程序 |

------

**四、为什么要“自定义镜像”？**

因为官方镜像太“干净”了，只满足通用需求。

比如：

`python`镜像：只有 Python

没有你的代码

没有你的依赖

没有你的配置文件

 **自定义镜像 = 官方镜像 + 你的东西**

------

**五、镜像 vs 容器**

一句话区分：

> **镜像 = 模板（只读）**
>
> **容器 = 镜像跑起来后的实例**

类比：

镜像 = Windows 安装 ISO

容器 = 已经装好正在用的 Windows 系统

> **Dockerfile 就是告诉 Docker：
>
> 从一个干净系统开始，一步步把它变成我能直接跑的环境，并且这个环境可以随时复制、随处运行。**

------

#### docker自定义网络为什么能用容器名互相访问？

你住在一个小区里，有两户人家：

老王家,老李家

他们想互相串门，有两种方式：

1. **记门牌号**

   老王知道老李家是 **3栋502**，于是他每次都去 3栋502 找老李。

   → 这就像用 **IP 地址** 访问，能找到，但记数字很烦。

2. **喊名字**

   老王在小区里大喊：“老李！出来玩！”

   物业（小区广播）听到后，直接去把老李叫出来。

   → 这就像用 **容器名字** 访问，喊一声就行，不用管他住几栋几楼。

------

把“小区”换成 Docker 网络

**默认网络** 的小区：

没有物业广播，邻居之间只能靠“门牌号”找人，不能喊名字。

所以你要用 `ping 172.17.0.2`这种 IP 才能找到对方。

**自定义网络** 的小区：

有物业（内置 DNS），你一喊“老李”，物业马上告诉你老李的门牌号，然后你就能找到他。

所以在容器里，你直接 `ping 老李`就能通。

## 2026.3.29

###  Docker Compose 

------

**一、是什么**

用于**定义和运行多容器 Docker 应用**

通过 **docker-compose.yml** 统一管理服务、网络、数据卷

------

**二、核心概念**

**Project**：一组服务（默认以目录名命名）

**Service**：应用组件（Web、DB 等）

**Container**：服务实例

**Volume**：数据持久化

**Network**：服务间通信

------

**三、docker-compose.yml 结构**

```
version: '3.8'

services:
  web:
    image: nginx
    ports: ["80:80"]
    volumes: ["./html:/usr/share/nginx/html"]
    depends_on: [db]
    restart: unless-stopped
    networks: [app-net]

  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root
    volumes: [db_data:/var/lib/mysql]
    networks: [app-net]

volumes:
  db_data:

networks:
  app-net:
```

**常用配置项**

`image`/ `build`：镜像来源或构建

`ports`：端口映射

`volumes`：数据挂载

`environment`/ `env_file`：环境变量

`depends_on`：启动顺序

`restart`：重启策略

`networks`：网络归属

`healthcheck`：健康检查

------

**四、常用命令**

启停管理

```
docker-compose up -d       # 启动
docker-compose down        # 停止并清理
docker-compose restart     # 重启
docker-compose ps          # 查看状态
```

日志 & 调试

```
docker-compose logs -f
docker-compose logs web
docker-compose exec web sh
```

构建 & 维护

```
docker-compose build
docker-compose pull
docker-compose config
```

------

**六、多环境**

多文件叠加：

```
docker-compose -f base.yml -f prod.yml up
```

使用 `profiles`：

```
services:
  debug:
    profiles: ["dev"]
```




