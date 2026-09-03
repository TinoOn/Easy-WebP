# Easy WebP v0.3.0

一个适用于 After Effects 2021–2026 的轻量级 animated WebP 导出面板。

A lightweight animated WebP exporter for After Effects 2021–2026.

**Created by Tino.Tian**

[中文说明](#中文说明) · [English](#english)

---

## 中文说明

### 项目简介

Easy WebP 可以直接从 After Effects 导出 animated WebP。插件会先通过 AE 渲染带 Alpha 通道的 PNG 序列，再调用内置的 Google WebP `img2webp` 编码器生成 WebP 文件。

安装包已内置三套编码器，无需另外安装命令行工具：

- macOS Apple Silicon（arm64）
- macOS Intel（x86-64）
- Windows 64 位（x64）

### 项目缘起

这个项目最初只是为了解决一个很具体的问题：原有的 WebP 导出插件无法在新版 After Effects 中正常使用，而在不同 AE 版本之间来回切换也并不方便。

于是我们从零做了 Easy WebP。目标始终很简单：界面尽量少，设置足够直观，并且让 Apple Silicon、Intel Mac 和 Windows 用户都能直接使用。它不是一个复杂的媒体转换工具，只专注于把 AE 合成可靠地导出为 animated WebP。

Easy WebP 由 Tino.Tian 设计并发起，在与 ChatGPT 的持续协作中完成开发、排错和跨平台适配。

### 兼容性

| 项目 | 支持情况 |
| --- | --- |
| After Effects | 2021–2026（主机版本 18.0 及以上） |
| macOS | Apple Silicon、Intel |
| Windows | 64 位 x64 |
| Windows ARM | 暂不支持 |
| Alpha 透明通道 | 支持 |
| 音频 | animated WebP 不支持音频 |

已实测环境包括：

- Apple Silicon Mac + After Effects 2026
- Intel iMac 2017 + macOS Ventura 13.7.8 + After Effects 2021（18.2.0）

### macOS 安装

1. 完全退出 After Effects。
2. 右键点击 `安装 Easy WebP.command`，选择“打开”。
3. 安装完成后重新打开 AE。
4. 进入 `窗口 → 扩展（旧版）→ Easy WebP`。

如果 macOS 第一次阻止脚本，请进入“系统设置 → 隐私与安全性”，允许后再右键打开安装脚本。

### Windows 安装

1. 完全退出 After Effects。
2. 双击 `安装 Easy WebP.bat`。
3. 重新打开 AE。
4. 进入 `窗口 → 扩展（旧版）→ Easy WebP`。

### 使用方法

1. 在项目或时间轴中选择一个合成。
2. 设置画质、循环次数与导出区间。
3. 点击“导出 WebP”，选择保存位置。
4. 等待 AE 渲染 PNG 序列并完成 WebP 编码。

画质规则：

- `0–99`：有损编码
- `100`：无损编码
- 默认值：`90`

导出成功后，临时 PNG 序列会自动删除；如果导出失败，序列会保留，并在详细日志中显示所在位置，方便排查。

### 当前限制

- AE 渲染阶段为同步操作，期间扩展面板可能暂时无响应。
- 插件使用 AE 内置的隐藏 PNG Alpha 输出模板；如果个别 AE 语言版本的模板结构不同，日志会显示相应错误。
- animated WebP 不包含声音。
- Windows ARM 暂未支持。

### 安全设计

- 临时目录只会创建在系统临时目录中，名称以 `webp-exporter-26-` 开头。
- 删除临时文件前会同时验证目录位置和名称，不会删除桌面、输出目录或其父目录。
- 编码器通过 Node 子进程直接启动，不打开 Terminal，也不拼接 shell 命令。
- 覆盖安装时，旧版本会在 CEP 扩展目录旁自动备份，不会直接删除。

### 版本记录

#### v0.3.0

- 插件正式命名为 Easy WebP。

#### v0.2.2

- 最低 AE 主机版本从 23.0 调整为 18.0，支持 After Effects 2021–2026。
- AE 2021 的 Intel Mac 会自动使用 macOS x86-64 编码器。

#### v0.2.1

- 内置 macOS ARM64、macOS x86-64 与 Windows x64 三套官方 `img2webp` 编码器。
- 根据操作系统与 CPU 架构自动选择编码器。
- 新增 Windows 安装与卸载脚本。
- 导出完成后，在 macOS 使用 Finder 定位，在 Windows 使用资源管理器定位。

#### v0.2.0

- 简化为单一画质选项：0–99 有损，100 无损，默认 90。
- 编码方法从最高压缩级别 6 调整为 libwebp 默认级别 4，改善合成速度。
- 日志分别记录 AE PNG 渲染与 WebP 合成耗时。
- 插件名称改为 WebP Exporter，移除界面中的版本号与硬件字样。
- 当前合成信息改为紧凑单行布局。
- “仅导出工作区间”改为“仅导出时间轴工作区间”。

#### v0.1.2

- 修复 macOS `/var` 与 `/private/var` 指向同一目录时，临时目录安全检查误判的问题。
- 清理失败不再把已经生成成功的 WebP 标记为导出失败。
- 根据 AE 工程色深优先选择对应的 8-bit 或 16-bit PNG Alpha 模板，避免色深警告。
- 无损模式固定使用 100 压缩强度；画面质量始终无损，该数值只影响编码时间和文件体积。

#### v0.1.1

- 修复 AE 26 ExtendScript 环境没有全局 `JSON` 对象时，导出参数无法解析的问题。

### 编码器与许可

项目内置 Google WebP `img2webp` 编码器。相关许可文件位于 [`licenses`](./licenses) 目录。

---

## English

### Overview

Easy WebP exports animated WebP files directly from After Effects. It first renders a PNG sequence with alpha through AE, then uses the bundled Google WebP `img2webp` encoder to assemble the final WebP file.

Three encoder builds are included, so no additional command-line tools are required:

- macOS Apple Silicon (arm64)
- macOS Intel (x86-64)
- Windows 64-bit (x64)

### Why this exists

This project began with a very specific problem: an existing WebP export plugin no longer worked reliably in newer versions of After Effects, and switching between AE versions just to export a file was not a practical solution.

So we built Easy WebP from scratch. The goal has always been simple: keep the interface minimal, make the settings easy to understand, and support Apple Silicon, Intel Mac, and Windows from one package. It is not intended to be a complex media conversion suite—it focuses on exporting AE compositions to animated WebP reliably.

Easy WebP was initiated and designed by Tino.Tian, then developed, debugged, and adapted across platforms through continuous collaboration with ChatGPT.

### Compatibility

| Item | Support |
| --- | --- |
| After Effects | 2021–2026 (host version 18.0 or later) |
| macOS | Apple Silicon and Intel |
| Windows | 64-bit x64 |
| Windows ARM | Not currently supported |
| Alpha transparency | Supported |
| Audio | Not supported by animated WebP |

Tested configurations include:

- Apple Silicon Mac + After Effects 2026
- 2017 Intel iMac + macOS Ventura 13.7.8 + After Effects 2021 (18.2.0)

### macOS installation

1. Quit After Effects completely.
2. Right-click `安装 Easy WebP.command` and choose **Open**.
3. Reopen After Effects after installation completes.
4. Go to `Window → Extensions (Legacy) → Easy WebP`.

If macOS blocks the script the first time, open **System Settings → Privacy & Security**, allow it, then right-click the installer and choose **Open** again.

### Windows installation

1. Quit After Effects completely.
2. Double-click `安装 Easy WebP.bat`.
3. Reopen After Effects.
4. Go to `Window → Extensions (Legacy) → Easy WebP`.

### Usage

1. Select a composition in the Project panel or Timeline.
2. Set the quality, loop count, and export range.
3. Click **Export WebP** and choose an output location.
4. Wait for AE to render the PNG sequence and complete WebP encoding.

Quality behavior:

- `0–99`: lossy encoding
- `100`: lossless encoding
- Default: `90`

After a successful export, the temporary PNG sequence is deleted automatically. If the export fails, the sequence is preserved and its location is shown in the detailed log for troubleshooting.

### Current limitations

- AE rendering is synchronous, so the extension panel may appear unresponsive during this stage.
- The extension uses AE's built-in hidden PNG Alpha output templates. If a localized AE release uses a different template structure, the log will report the resulting error.
- Animated WebP does not contain audio.
- Windows ARM is not currently supported.

### Safety design

- Temporary folders are created only inside the system temporary directory and use the `webp-exporter-26-` prefix.
- Both the folder location and name are validated before cleanup. The desktop, output folder, and their parent directories are never cleanup targets.
- The encoder is launched directly as a Node child process. The extension does not open Terminal or construct shell commands.
- During an overwrite installation, the previous version is backed up next to the CEP extension directory instead of being deleted directly.

### Changelog

#### v0.3.0

- Renamed the extension to Easy WebP.

#### v0.2.2

- Lowered the minimum AE host version from 23.0 to 18.0, supporting After Effects 2021–2026.
- Intel Macs running AE 2021 automatically use the macOS x86-64 encoder.

#### v0.2.1

- Bundled official `img2webp` builds for macOS ARM64, macOS x86-64, and Windows x64.
- Added automatic encoder selection based on the operating system and CPU architecture.
- Added Windows install and uninstall scripts.
- Added Finder reveal on macOS and File Explorer reveal on Windows after export.

#### v0.2.0

- Simplified quality to a single control: 0–99 is lossy, 100 is lossless, and 90 is the default.
- Changed the encoding method from maximum compression level 6 to libwebp's default level 4 for faster assembly.
- Added separate timing logs for AE PNG rendering and WebP assembly.
- Renamed the extension to WebP Exporter and removed version and hardware labels from the panel.
- Changed composition information to a compact single-line layout.
- Renamed the work-area option for clarity.

#### v0.1.2

- Fixed a temporary-folder safety check on macOS where `/var` and `/private/var` resolve to the same location.
- A cleanup failure no longer marks an otherwise successful WebP export as failed.
- Added automatic selection of 8-bit or 16-bit PNG Alpha templates based on AE project depth.
- Set lossless mode to compression strength 100. Image quality remains lossless; the value only affects encoding time and file size.

#### v0.1.1

- Fixed export parameter parsing in AE 26 ExtendScript environments without a global `JSON` object.

### Encoder and licenses

The project bundles Google's WebP `img2webp` encoder. Relevant license files are available in the [`licenses`](./licenses) directory.
