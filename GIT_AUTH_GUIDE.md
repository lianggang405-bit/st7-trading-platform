# Git 推送认证配置指南

## 当前状态

✅ Git 已初始化
✅ 远程仓库已配置
✅ 代码已提交到本地
❌ 推送到 GitHub 需要认证

## 解决方案：创建 Personal Access Token

GitHub 已经不再支持密码登录，需要使用 Personal Access Token (PAT)。

### 步骤一：创建 Personal Access Token

1. 访问：https://github.com/settings/tokens

2. 点击 **"Generate new token"** → **"Generate new token (classic)"**

3. 配置 Token：
   - **Note**: ST7交易平台部署
   - **Expiration**: 选择有效期限（建议选择 90 days 或 No expiration）
   - **Select scopes**: 勾选 `repo`（全选）
     - repo:status
     - repo_deployment
     - public_repo
     - repo:invite
     - security_events

4. 点击 **"Generate token"**

5. **重要**：复制生成的 token（类似：`ghp_xxxxxxxxxxxxxxxxxxxxxx`）
   - ⚠️ token 只显示一次，请立即复制并保存！

### 步骤二：使用 Token 推送

在项目目录执行：

```bash
cd /workspace/projects

# 推送到 GitHub
git push -u origin main
```

系统会提示输入：
- **Username**: 输入您的 GitHub 账号（`lianggang405-bit`）
- **Password**: 粘贴刚才复制的 Personal Access Token

### 步骤三：保存认证信息（可选）

为了避免每次都输入 token，可以保存认证信息：

```bash
# 保存凭据
git config --global credential.helper store

# 再次推送（只需要输入一次）
git push -u origin main
```

---

## 选项 B：使用 SSH 密钥（推荐，更安全）

如果不想每次都输入 token，可以配置 SSH 密钥。

### 步骤一：生成 SSH 密钥

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "lianggang405-bit@github.com"

# 按回车使用默认路径
# 按回车不设置密码（或设置密码）
```

### 步骤二：查看并复制公钥

```bash
# 查看公钥内容
cat ~/.ssh/id_ed25519.pub
```

复制显示的内容（类似：`ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBm...`）

### 步骤三：添加 SSH 密钥到 GitHub

1. 访问：https://github.com/settings/keys
2. 点击 **"New SSH key"**
3. **Title**: 输入 `ST7交易平台部署`
4. **Key**: 粘贴刚才复制的公钥内容
5. 点击 **"Add SSH key"**

### 步骤四：测试 SSH 连接

```bash
# 测试 SSH 连接
ssh -T git@github.com
```

首次连接会提示：
```
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```
输入 `yes` 并回车

### 步骤五：修改远程仓库地址为 SSH

```bash
# 修改远程仓库地址
git remote set-url origin git@github.com:lianggang405-bit/st7-trading-platform.git

# 推送（不需要输入密码）
git push -u origin main
```

---

## 快速选择

### 推荐方案：Personal Access Token（简单）

**优点**：
- ✅ 设置快速
- ✅ 不需要配置 SSH
- ✅ 适合个人项目

**缺点**：
- ❌ Token 有过期时间
- ❌ 需要手动输入

**适用**：快速部署，不想配置 SSH

---

### 最佳方案：SSH 密钥（推荐）

**优点**：
- ✅ 更安全
- ✅ 不需要每次输入密码
- ✅ 永久有效（除非删除）
- ✅ 可以用于多个 GitHub 仓库

**缺点**：
- ❌ 需要额外配置步骤

**适用**：长期项目，频繁更新

---

## 我的选择建议

**如果系统还没安装好**：使用 **Personal Access Token**（最快）

**如果追求长期稳定**：配置 **SSH 密钥**（推荐）

---

## 验证推送成功

推送成功后，访问：
https://github.com/lianggang405-bit/st7-trading-platform

应该能看到所有项目文件！

---

## 下一步

推送成功后，就可以在服务器上部署了：

```bash
# 连接到服务器
ssh root@72.62.252.206

# 克隆项目
sudo git clone https://github.com/lianggang405-bit/st7-trading-platform.git

# 进入项目目录
cd st7-trading-platform

# 按照 GIT_SETUP_GUIDE.md 中的步骤继续部署
```

---

**请选择一种方式完成认证，然后推送代码！**
