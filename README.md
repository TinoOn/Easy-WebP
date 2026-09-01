# Easy WebP v0.3.0 — 跨平台测试版

Created by Tino

适用于 After Effects 2021–2026 的 animated WebP 导出面板。当前安装包内置 macOS arm64、macOS x86-64 与 Windows x64 编码器。

## macOS 安装

1. 完全退出 After Effects。
2. 右键点击 `安装 Easy WebP.command`，选择“打开”。
3. 安装完成后重新打开 AE。
4. 进入 `窗口 → 扩展（旧版）→ Easy WebP`。

如果 macOS 第一次阻止脚本，进入“系统设置 → 隐私与安全性”，允许后再右键打开。

## Windows 安装

1. 完全退出 After Effects。
2. 双击 `安装 Easy WebP.bat`。
3. 重新打开 AE。
4. 进入 `窗口 → 扩展（旧版）→ Easy WebP`。

## 使用

1. 在项目或时间轴中选择一个合成。
2. 设置画质、循环次数与导出区间。画质 0–99 为有损，100 自动使用无损编码。
3. 点击“导出 WebP”，选择保存位置。
4. AE 会在系统临时目录渲染带 Alpha 的 PNG 序列，然后使用内置 `img2webp` 合成 WebP。
5. 成功后临时序列会自动删除；失败时会保留序列并在日志中显示位置。

## 当前限制

- 支持 Apple Silicon Mac、Intel Mac 与 64 位 Windows；Windows ARM 暂未支持。
- AE 渲染阶段为同步操作，期间扩展面板可能暂时无响应。
- 首版沿用 AE 内置的隐藏 PNG Alpha 输出模板。如果 AE 26 的模板结构在特定语言版本中不同，日志会给出错误，需根据测试结果调整。
- animated WebP 不包含声音。

## v0.1.1

- 修复 AE 26 ExtendScript 环境没有全局 `JSON` 对象时，导出参数无法解析的问题。

## v0.1.2

- 修复 macOS `/var` 与 `/private/var` 指向同一目录时，临时目录安全检查误判的问题。
- 清理失败不再把已经生成成功的 WebP 标记为导出失败。
- 根据 AE 工程色深优先选择对应的 8-bit 或 16-bit PNG Alpha 模板，避免色深警告。
- 无损模式固定使用 100 压缩强度；画面质量始终为无损，100 只影响编码时间与文件体积。

## v0.2.0

- 简化为单一画质选项：0–99 有损，100 无损，默认 90。
- 编码方法从最高压缩级别 6 调整为 libwebp 默认级别 4，改善合成速度。
- 日志分别记录 AE PNG 渲染与 WebP 合成耗时。
- 插件名称改为 WebP Exporter，移除界面中的版本号与硬件字样。
- 当前合成信息改为紧凑单行布局。
- “仅导出工作区间”改为“仅导出时间轴工作区间”。

## v0.2.1

- 内置 macOS ARM64、macOS x86-64 与 Windows x64 三套官方 `img2webp` 编码器。
- 根据操作系统与 CPU 架构自动选择编码器。
- 新增 Windows 安装与卸载脚本。
- 导出完成后，在 macOS 使用 Finder 定位，在 Windows 使用资源管理器定位。

## v0.2.2

- 最低 AE 主机版本从 23.0 调整为 18.0，支持 After Effects 2021–2026。
- AE 2021 的 Intel Mac 将自动使用 macOS x86-64 编码器。

## v0.3.0

- 插件正式命名为 Easy WebP。

## 安全设计

- 临时目录固定创建在 macOS 系统临时目录下，名称以 `webp-exporter-26-` 开头。
- 清理前同时验证目录位置和名称；不会删除桌面、输出目录或其父目录。
- 编码器通过 Node 子进程直接启动，不打开 Terminal，也不拼接 shell 命令。
- 覆盖安装时旧版本会在 CEP 扩展目录旁自动备份，不会直接删除。

## 编码器

内置 Google WebP `img2webp` 1.6.0 macOS arm64 官方预编译版本。许可文件位于 `licenses` 目录。
