'use strict';

var obsidian = require('obsidian');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class PDFAnnotatorPlugin extends obsidian.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.workspace.onLayoutReady(() => {
                this.addAnnotateButtons();
                // PDF が埋め込まれたビューを定期的にスキャンしてボタンを追加する
                this.registerInterval(window.setInterval(this.addAnnotateButtons.bind(this), 500));
            });
        });
    }
    addAnnotateButtons() {
        return __awaiter(this, void 0, void 0, function* () {
            // Markdown ビュー内に埋め込まれた PDF にボタンを追加
            const markdownViews = this.app.workspace.getLeavesOfType("markdown");
            for (const leaf of markdownViews) {
                yield this.addButtonsToMarkdown(leaf.view);
            }
            // PDF を直接開いているビューにボタンを追加
            const pdfViews = this.app.workspace.getLeavesOfType("pdf");
            for (const leaf of pdfViews) {
                yield this.addButtonsToPDFView(leaf.view);
            }
        });
    }
    addButtonsToMarkdown(view) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const pdfEmbeds = view.containerEl.querySelectorAll(".pdf-embed");
            for (const embed of Array.from(pdfEmbeds)) {
                const rightToolbar = embed.querySelector(".pdf-toolbar-right");
                if (!rightToolbar)
                    continue;
                if (rightToolbar.querySelector(".pdf-expert-button"))
                    continue;
                const pdfLink = embed.getAttribute("src");
                if (!pdfLink)
                    continue;
                const currentNotePath = (_a = this.app.workspace.getActiveFile()) === null || _a === void 0 ? void 0 : _a.path;
                if (!currentNotePath)
                    continue;
                const pdfFile = this.app.metadataCache.getFirstLinkpathDest(pdfLink, currentNotePath);
                if (!(pdfFile instanceof obsidian.TFile))
                    continue;
                this.appendOpenButton(rightToolbar, () => __awaiter(this, void 0, void 0, function* () {
                    yield this.openExternal(pdfFile);
                }));
            }
        });
    }
    addButtonsToPDFView(view) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const toolbars = view.containerEl.getElementsByClassName("pdf-toolbar");
            for (let i = 0; i < toolbars.length; i++) {
                const toolbar = toolbars[i];
                if (toolbar.querySelector(".pdf-expert-button"))
                    continue;
                // @ts-ignore
                const file = (_a = view.file) !== null && _a !== void 0 ? _a : null;
                this.appendOpenButton(toolbar, () => __awaiter(this, void 0, void 0, function* () {
                    if (file) {
                        yield this.openExternal(file);
                    }
                    else {
                        // @ts-ignore
                        this.app.commands.executeCommandById("open-with-default-app:open");
                    }
                }));
            }
        });
    }
    appendOpenButton(toolbar, onClick) {
        const button = new obsidian.ButtonComponent(toolbar);
        button.setIcon("external-link");
        button.setTooltip("Open in PDF Expert");
        button.setClass("pdf-expert-button");
        button.setClass("clickable-icon");
        button.onClick((evt) => __awaiter(this, void 0, void 0, function* () {
            evt.preventDefault();
            evt.stopPropagation();
            try {
                yield onClick();
            }
            catch (e) {
                console.error("PDF Annotator: failed to open file", e);
            }
        }));
    }
    getAbsolutePath(file) {
        const adapter = this.app.vault.adapter;
        if (adapter instanceof obsidian.FileSystemAdapter) {
            return adapter.getBasePath() + "/" + file.path;
        }
        // モバイル（iOS/Android）では FileSystemAdapter ではなく内部 API で basePath を取る
        // @ts-ignore
        const basePath = adapter.basePath;
        if (basePath) {
            return basePath + "/" + file.path;
        }
        // basePath が取れない場合はボルト相対パスをそのまま返す（フォールバック）
        return file.path;
    }
    openExternal(file) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (obsidian.Platform.isDesktopApp) {
                yield this.app.openWithDefaultApp(file.path);
            }
            else {
                const absolutePath = this.getAbsolutePath(file);
                const encodedPath = encodeURIComponent(absolutePath);
                const url = `shortcuts://run-shortcut?name=obsidian-to-pdfexpert&input=text&text=${encodedPath}`;
                if (obsidian.Platform.isMobileApp && obsidian.Platform.isIosApp) {
                    window.location.href = url;
                }
                else {
                    // Obsidian 内部の URL オープナー → Capacitor → Web API の順で試みる
                    if (this.app.openUrl) {
                        this.app.openUrl(url);
                    }
                    else if ((_b = (_a = window.Capacitor) === null || _a === void 0 ? void 0 : _a.Plugins) === null || _b === void 0 ? void 0 : _b.App) {
                        window.Capacitor.Plugins.App.openUrl({ url });
                    }
                    else {
                        window.open(url);
                    }
                }
            }
        });
    }
}

module.exports = PDFAnnotatorPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpudWxsLCJuYW1lcyI6WyJQbHVnaW4iLCJURmlsZSIsIkJ1dHRvbkNvbXBvbmVudCIsIkZpbGVTeXN0ZW1BZGFwdGVyIiwiUGxhdGZvcm0iXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBb0dBO0FBQ08sU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFO0FBQzdELElBQUksU0FBUyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsT0FBTyxLQUFLLFlBQVksQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVLE9BQU8sRUFBRSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO0FBQ2hILElBQUksT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsVUFBVSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQy9ELFFBQVEsU0FBUyxTQUFTLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtBQUNuRyxRQUFRLFNBQVMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxD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
