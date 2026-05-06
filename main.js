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
        button.onClick(() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield onClick();
            }
            catch (e) {
                console.error("PDF Annotator: failed to open file", e);
            }
        }));
    }
    openExternal(file) {
        return __awaiter(this, void 0, void 0, function* () {
            if (obsidian.Platform.isDesktop) {
                yield this.app.openWithDefaultApp(file.path);
            }
            else {
                const encodedPath = encodeURIComponent(file.path);
                const url = `shortcuts://run-shortcut?name=obsidian-to-pdfexpert&input=text&text=${encodedPath}`;
                // anchor click は WKWebView でも URL スキームを確実に発火させる
                const a = document.createElement("a");
                a.href = url;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }
}

module.exports = PDFAnnotatorPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpudWxsLCJuYW1lcyI6WyJQbHVnaW4iLCJURmlsZSIsIkJ1dHRvbkNvbXBvbmVudCIsIlBsYXRmb3JtIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQW9HQTtBQUNPLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRTtBQUM3RCxJQUFJLFNBQVMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLE9BQU8sS0FBSyxZQUFZLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtBQUNoSCxJQUFJLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUMvRCxRQUFRLFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7QUFDbkcsUUFBUSxTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7QUFDdEcs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
