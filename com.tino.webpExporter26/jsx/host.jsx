/* global app, CompItem, File, Folder, RQItemStatus */
var WebPExporter26 = (function () {
    function quoteJSON(value) {
        var text = String(value === undefined || value === null ? "" : value);
        return '"' + text
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t") + '"';
    }

    function objectJSON(obj) {
        if (typeof JSON !== "undefined" && JSON.stringify) {
            return JSON.stringify(obj);
        }
        var parts = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var value = obj[key];
                if (typeof value === "number" || typeof value === "boolean") {
                    parts.push(quoteJSON(key) + ":" + String(value));
                } else if (value instanceof Array) {
                    var items = [];
                    for (var i = 0; i < value.length; i++) { items.push(quoteJSON(value[i])); }
                    parts.push(quoteJSON(key) + ":[" + items.join(",") + "]");
                } else {
                    parts.push(quoteJSON(key) + ":" + quoteJSON(value));
                }
            }
        }
        return "{" + parts.join(",") + "}";
    }

    function result(obj) { return objectJSON(obj); }

    function parseOptions(encodedOptions) {
        var source = decodeURIComponent(encodedOptions);
        // ExtendScript in AE 26 may not expose the standard JSON object.
        // The source is produced internally by this extension, URI-encoded,
        // and contains only the export options object.
        return eval("(" + source + ")");
    }

    function activeComp() {
        var item = app.project ? app.project.activeItem : null;
        return item && item instanceof CompItem ? item : null;
    }

    function cleanFilename(name) {
        return String(name || "animation").replace(/[\\\/:*?"<>|]/g, "_");
    }

    function getActiveCompInfo() {
        var comp = activeComp();
        if (!comp) { return result({ ok: false }); }
        return result({
            ok: true,
            name: comp.name,
            width: comp.width,
            height: comp.height,
            fps: Math.round(comp.frameRate * 1000) / 1000,
            duration: Math.round(comp.duration * 1000) / 1000
        });
    }

    function chooseOutputPath() {
        var comp = activeComp();
        if (!comp) { return result({ ok: false, error: "请先选择一个合成。" }); }

        var defaultFile = new File(Folder.desktop.fsName + "/" + cleanFilename(comp.name) + ".webp");
        var selected = defaultFile.saveDlg("导出动画 WebP");
        if (!selected) { return result({ ok: false, cancelled: true }); }

        var path = selected.fsName;
        if (!/\.webp$/i.test(path)) { path += ".webp"; }
        return result({ ok: true, path: path });
    }

    function storeQueueState(queue) {
        var states = [];
        var rendering = false;
        for (var i = 1; i <= queue.numItems; i++) {
            var item = queue.item(i);
            if (item.status === RQItemStatus.RENDERING) { rendering = true; }
            var enabled = false;
            try { enabled = item.render; } catch (_) {}
            states.push({ item: item, render: enabled });
            try {
                if (item.status === RQItemStatus.QUEUED) { item.render = false; }
            } catch (_) {}
        }
        return { states: states, rendering: rendering };
    }

    function restoreQueueState(backup) {
        if (!backup) { return; }
        for (var i = 0; i < backup.states.length; i++) {
            try {
                var entry = backup.states[i];
                if (entry.item.status === RQItemStatus.QUEUED || entry.item.status === RQItemStatus.UNQUEUED) {
                    entry.item.render = entry.render;
                }
            } catch (_) {}
        }
    }

    function choosePNGTemplate(outputModule, projectDepth) {
        var templates = outputModule.templates;
        var preferred = null;
        var preferredScore = -1;
        var fallback = templates.length ? templates[templates.length - 1] : null;
        var desiredDepth = projectDepth > 8 ? 16 : 8;
        var depthPattern = new RegExp("(^|[^0-9])" + desiredDepth + "([^0-9]|$)");
        for (var i = 0; i < templates.length; i++) {
            var name = String(templates[i]);
            var score = 0;
            if (/x-factor/i.test(name)) { score += 50; }
            if (depthPattern.test(name)) { score += 30; }
            if (/premul/i.test(name)) { score += 10; }
            if (/png/i.test(name) && /alpha|premul|rgba/i.test(name)) { score += 5; }
            if (score > 0 && score > preferredScore) {
                preferredScore = score;
                preferred = name;
            }
        }
        return preferred || fallback;
    }

    function listFrames(folder) {
        var files = folder.getFiles(function (entry) {
            return entry instanceof File && /\.png$/i.test(entry.name);
        });
        files.sort(function (a, b) {
            var an = a.name.toLowerCase();
            var bn = b.name.toLowerCase();
            return an < bn ? -1 : (an > bn ? 1 : 0);
        });
        var names = [];
        for (var i = 0; i < files.length; i++) { names.push(files[i].name); }
        return names;
    }

    function exportFrames(encodedOptions) {
        var comp = activeComp();
        if (!comp) { return result({ ok: false, error: "请先选择一个合成。" }); }

        var options;
        try { options = parseOptions(encodedOptions); }
        catch (error) { return result({ ok: false, error: "导出参数无效：" + error.toString() }); }

        var unique = String(new Date().getTime()) + "-" + String(Math.floor(Math.random() * 1000000));
        var tempFolder = new Folder(Folder.temp.fsName + "/webp-exporter-26-" + unique);
        if (!tempFolder.create()) {
            return result({ ok: false, error: "无法创建临时目录：" + tempFolder.fsName });
        }

        var queue = app.project.renderQueue;
        var backup = null;
        var renderItem = null;
        var originalResolution = [comp.resolutionFactor[0], comp.resolutionFactor[1]];
        var templateName = "";

        try {
            backup = storeQueueState(queue);
            if (backup.rendering) { throw new Error("渲染队列正在工作，请等待当前渲染完成后再试。"); }

            comp.resolutionFactor = [1, 1];
            renderItem = queue.items.add(comp);
            renderItem.render = true;
            if (options.useWorkArea) {
                renderItem.timeSpanStart = comp.workAreaStart;
                renderItem.timeSpanDuration = comp.workAreaDuration;
            } else {
                renderItem.timeSpanStart = 0;
                renderItem.timeSpanDuration = comp.duration;
            }

            var outputModule = renderItem.outputModule(1);
            templateName = choosePNGTemplate(outputModule, app.project.bitsPerChannel);
            if (!templateName) { throw new Error("没有找到可用的 PNG 输出模板。"); }
            outputModule.applyTemplate(templateName);
            try {
                var outputSettings = { "Use Comp Frame Number": false, "Starting #": "0" };
                if (app.project.bitsPerChannel <= 8) {
                    outputSettings["Depth"] = "Millions of Colors+";
                } else {
                    outputSettings["Depth"] = "Trillions of Colors+";
                }
                outputModule.setSettings(outputSettings);
            } catch (_) {}
            outputModule.file = new File(tempFolder.fsName + "/frame_[#####].png");

            queue.showWindow(false);
            queue.render();

            var frameFiles = listFrames(tempFolder);
            if (!frameFiles.length) {
                throw new Error("AE 没有生成 PNG 序列。可能是输出模板在当前 AE 版本中发生了变化。");
            }

            return result({
                ok: true,
                compName: comp.name,
                fps: Math.round(comp.frameRate * 1000) / 1000,
                frameDurationMs: comp.frameDuration * 1000,
                frameFiles: frameFiles,
                tempFolder: tempFolder.fsName,
                outputPath: options.outputPath,
                template: templateName
            });
        } catch (error) {
            return result({
                ok: false,
                error: error.toString(),
                tempFolder: tempFolder.fsName
            });
        } finally {
            try { if (renderItem) { renderItem.remove(); } } catch (_) {}
            restoreQueueState(backup);
            try { comp.resolutionFactor = originalResolution; } catch (_) {}
        }
    }

    return {
        getActiveCompInfo: getActiveCompInfo,
        chooseOutputPath: chooseOutputPath,
        exportFrames: exportFrames
    };
}());
