(function () {
  "use strict";

  var state = { busy: false, outputPath: "" };
  var $ = function (id) { return document.getElementById(id); };

  function evalAE(code) {
    return new Promise(function (resolve) {
      window.__adobe_cep__.evalScript(code, function (result) { resolve(result); });
    });
  }

  function parseResult(value) {
    if (!value || value === "EvalScript error.") {
      throw new Error("AE 脚本没有返回结果。请确认扩展已完整安装后重启 AE。");
    }
    try { return JSON.parse(value); }
    catch (error) { throw new Error("无法解析 AE 返回结果：" + value); }
  }

  function setStatus(kind, title, detail) {
    $("statusBox").className = "status " + kind;
    $("statusTitle").textContent = title;
    $("statusDetail").textContent = detail || "";
  }

  function setLog(lines) {
    $("logOutput").textContent = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
  }

  function setBusy(value) {
    state.busy = value;
    $("exportButton").disabled = value;
    $("refreshButton").disabled = value;
  }

  function clampInt(value, min, max, fallback) {
    var n = parseInt(value, 10);
    if (!isFinite(n)) { return fallback; }
    return Math.max(min, Math.min(max, n));
  }

  async function refreshComp() {
    try {
      var info = parseResult(await evalAE("WebPExporter26.getActiveCompInfo()"));
      if (!info.ok) {
        $("compName").textContent = "未选择合成";
        $("compMeta").textContent = "请先在项目或时间轴中选择一个合成";
        return;
      }
      $("compName").textContent = info.name;
      $("compMeta").textContent = info.width + " × " + info.height + "  ·  " + info.fps + " fps  ·  " + info.duration + " 秒";
    } catch (error) {
      $("compName").textContent = "读取失败";
      $("compMeta").textContent = error.message;
    }
  }

  function nodeRequire(moduleName) {
    if (typeof require === "function") { return require(moduleName); }
    if (window.cep_node && typeof window.cep_node.require === "function") {
      return window.cep_node.require(moduleName);
    }
    throw new Error("CEP Node.js 未启用，无法启动 WebP 编码器。");
  }

  function extensionPath() {
    var raw = window.__adobe_cep__.getSystemPath("extension");
    return decodeURI(raw.replace(/^file:\/\//, ""));
  }

  function buildFrameArgs(frameFiles, frameDurationMs) {
    var args = [];
    var previous = 0;
    for (var i = 0; i < frameFiles.length; i += 1) {
      var next = Math.round((i + 1) * frameDurationMs);
      var duration = Math.max(1, next - previous);
      previous = next;
      args.push("-d", String(duration), frameFiles[i]);
    }
    return args;
  }

  function encoderBinary() {
    var path = nodeRequire("path");
    var os = nodeRequire("os");
    var platform = os.platform();
    var architecture = os.arch();
    var relativePath;

    if (platform === "darwin" && architecture === "arm64") {
      relativePath = ["bin", "macos-arm64", "img2webp"];
    } else if (platform === "darwin" && architecture === "x64") {
      relativePath = ["bin", "macos-x64", "img2webp"];
    } else if (platform === "win32" && architecture === "x64") {
      relativePath = ["bin", "windows-x64", "img2webp.exe"];
    } else {
      throw new Error("当前系统暂不支持：" + platform + " / " + architecture);
    }
    return path.join.apply(path, [extensionPath()].concat(relativePath));
  }

  function encodeWebP(renderResult, options) {
    var fs = nodeRequire("fs");
    var childProcess = nodeRequire("child_process");
    var os = nodeRequire("os");
    var binary = encoderBinary();

    if (!fs.existsSync(binary)) {
      throw new Error("找不到内置编码器：" + binary);
    }
    try { fs.chmodSync(binary, 0o755); } catch (_) {}

    var args = ["-loop", String(options.loop), "-m", "4"];
    if (options.lossless) {
      args.push("-lossless", "-q", String(options.quality));
    } else {
      args.push("-lossy", "-q", String(options.quality));
    }
    args = args.concat(buildFrameArgs(renderResult.frameFiles, renderResult.frameDurationMs));
    args.push("-o", renderResult.outputPath);

    var processResult = childProcess.spawnSync(binary, args, {
      cwd: renderResult.tempFolder,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024
    });

    if (processResult.error) { throw processResult.error; }
    if (processResult.status !== 0) {
      throw new Error("img2webp 退出代码 " + processResult.status + "\n" + (processResult.stderr || processResult.stdout || ""));
    }
    if (!fs.existsSync(renderResult.outputPath)) {
      throw new Error("编码器已结束，但没有找到输出文件。");
    }

    return {
      size: fs.statSync(renderResult.outputPath).size,
      platform: os.platform() + " / " + os.arch(),
      stdout: processResult.stdout || "",
      stderr: processResult.stderr || ""
    };
  }

  function safeCleanup(tempFolder) {
    var fs = nodeRequire("fs");
    var path = nodeRequire("path");
    var os = nodeRequire("os");
    function canonical(target) {
      try { return fs.realpathSync(target); }
      catch (_) { return path.resolve(target); }
    }
    var resolved = canonical(tempFolder);
    var tempRoot = canonical(os.tmpdir());
    var prefixOk = path.basename(resolved).indexOf("webp-exporter-26-") === 0;
    var insideTemp = resolved.indexOf(tempRoot + path.sep) === 0;
    if (!prefixOk || !insideTemp) {
      return "安全检查未通过，临时序列已保留：" + resolved;
    }
    function removeTree(target) {
      if (!fs.existsSync(target)) { return; }
      var stat = fs.lstatSync(target);
      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        fs.unlinkSync(target);
        return;
      }
      fs.readdirSync(target).forEach(function (name) {
        removeTree(path.join(target, name));
      });
      fs.rmdirSync(target);
    }
    removeTree(resolved);
    return "";
  }

  function revealFile(filePath) {
    try {
      var childProcess = nodeRequire("child_process");
      var platform = nodeRequire("os").platform();
      var command;
      var args;
      if (platform === "darwin") {
        command = "/usr/bin/open";
        args = ["-R", filePath];
      } else if (platform === "win32") {
        command = "explorer.exe";
        args = ["/select,", filePath];
      } else {
        return;
      }
      childProcess.spawn(command, args, {
        detached: true,
        stdio: "ignore"
      }).unref();
    } catch (_) {}
  }

  function humanSize(bytes) {
    if (bytes < 1024 * 1024) { return (bytes / 1024).toFixed(0) + " KB"; }
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  }

  function humanDuration(milliseconds) {
    if (milliseconds < 1000) { return milliseconds + " 毫秒"; }
    return (milliseconds / 1000).toFixed(2) + " 秒";
  }

  async function exportCurrentComp() {
    if (state.busy) { return; }
    setBusy(true);
    setLog("");
    var renderResult = null;

    try {
      var quality = clampInt($("qualityValue").value, 0, 100, 90);
      var lossless = quality === 100;
      var loop = clampInt($("loopCount").value, 0, 999999, 0);
      $("qualityValue").value = quality;
      $("quality").value = quality;
      $("loopCount").value = loop;

      setStatus("working", "选择保存位置", "随后 AE 会先渲染透明 PNG 序列");
      var pathResult = parseResult(await evalAE("WebPExporter26.chooseOutputPath()"));
      if (pathResult.cancelled) {
        setStatus("idle", "已取消", "没有生成任何文件");
        return;
      }
      if (!pathResult.ok) { throw new Error(pathResult.error); }
      state.outputPath = pathResult.path;

      var options = {
        outputPath: pathResult.path,
        useWorkArea: $("useWorkArea").checked,
        quality: quality,
        lossless: lossless,
        loop: loop
      };
      var encoded = encodeURIComponent(JSON.stringify(options));

      setStatus("working", "AE 正在渲染序列帧…", "渲染期间界面可能暂时没有响应，请等待完成");
      var renderStartedAt = Date.now();
      renderResult = parseResult(await evalAE('WebPExporter26.exportFrames("' + encoded + '")'));
      var renderElapsed = Date.now() - renderStartedAt;
      if (!renderResult.ok) { throw new Error(renderResult.error); }

      setStatus("working", "正在合成 WebP…", renderResult.frameFiles.length + " 帧 · 保留透明通道");
      var encodeStartedAt = Date.now();
      var encodeResult = encodeWebP(renderResult, options);
      var encodeElapsed = Date.now() - encodeStartedAt;
      var cleanupWarning = safeCleanup(renderResult.tempFolder);

      var logLines = [
        "输出：" + renderResult.outputPath,
        "合成：" + renderResult.compName,
        "帧数：" + renderResult.frameFiles.length,
        "帧率：" + renderResult.fps,
        "AE 渲染耗时：" + humanDuration(renderElapsed),
        "WebP 合成耗时：" + humanDuration(encodeElapsed),
        "运行平台：" + encodeResult.platform,
        "PNG 模板：" + renderResult.template,
        "编码：" + (options.lossless ? "lossless" : "lossy") + " / q=" + options.quality,
        encodeResult.stderr || encodeResult.stdout || "img2webp 完成"
      ];
      if (cleanupWarning) { logLines.push(cleanupWarning); }
      setLog(logLines);
      setStatus("success", "导出完成", humanSize(encodeResult.size) + (cleanupWarning ? " · 临时序列未清理" : "") + " · " + renderResult.outputPath);
      if ($("revealOutput").checked) { revealFile(renderResult.outputPath); }
    } catch (error) {
      var details = error && error.stack ? error.stack : String(error);
      if (renderResult && renderResult.tempFolder) {
        details += "\n临时序列保留在：" + renderResult.tempFolder;
      }
      setLog(details);
      $("logDetails").open = true;
      setStatus("error", "导出失败", error.message || String(error));
    } finally {
      setBusy(false);
      refreshComp();
    }
  }

  $("quality").addEventListener("input", function () { $("qualityValue").value = this.value; });
  $("qualityValue").addEventListener("input", function () { $("quality").value = clampInt(this.value, 0, 100, 90); });
  $("refreshButton").addEventListener("click", refreshComp);
  $("exportButton").addEventListener("click", exportCurrentComp);

  refreshComp();
}());
