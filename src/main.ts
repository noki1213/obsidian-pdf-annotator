import {
	App,
	ButtonComponent,
	FileSystemAdapter,
	MarkdownView,
	Platform,
	Plugin,
	TFile,
	type View,
} from "obsidian";

// Obsidian の内部 API（型定義が公開されていないため独自に定義）
interface AppWithDesktopInternalApi extends App {
	openWithDefaultApp(path: string): Promise<void>;
}

interface FileSystemAdapterWithInternalApi extends FileSystemAdapter {
	open(path: string): Promise<void>;
}

export default class PDFAnnotatorPlugin extends Plugin {
	async onload() {
		this.app.workspace.onLayoutReady(() => {
			this.addAnnotateButtons();
			// PDF が埋め込まれたビューを定期的にスキャンしてボタンを追加する
			this.registerInterval(
				window.setInterval(this.addAnnotateButtons.bind(this), 500),
			);
		});
	}

	async addAnnotateButtons() {
		// Markdown ビュー内に埋め込まれた PDF にボタンを追加
		const markdownViews = this.app.workspace.getLeavesOfType("markdown");
		for (const leaf of markdownViews) {
			await this.addButtonsToMarkdown(leaf.view as MarkdownView);
		}

		// PDF を直接開いているビューにボタンを追加
		const pdfViews = this.app.workspace.getLeavesOfType("pdf");
		for (const leaf of pdfViews) {
			await this.addButtonsToPDFView(leaf.view as View);
		}
	}

	async addButtonsToMarkdown(view: MarkdownView) {
		const pdfEmbeds = view.containerEl.querySelectorAll(".pdf-embed");

		for (const embed of Array.from(pdfEmbeds)) {
			const rightToolbar = embed.querySelector(".pdf-toolbar-right");
			if (!rightToolbar) continue;
			if (rightToolbar.querySelector(".pdf-expert-button")) continue;

			const pdfLink = embed.getAttribute("src");
			if (!pdfLink) continue;

			const currentNotePath = this.app.workspace.getActiveFile()?.path;
			if (!currentNotePath) continue;

			const pdfFile = this.app.metadataCache.getFirstLinkpathDest(
				pdfLink,
				currentNotePath,
			);
			if (!(pdfFile instanceof TFile)) continue;

			this.appendOpenButton(rightToolbar as HTMLElement, async () => {
				await this.openExternal(pdfFile);
			});
		}
	}

	async addButtonsToPDFView(view: View) {
		const toolbars = view.containerEl.getElementsByClassName("pdf-toolbar");
		for (let i = 0; i < toolbars.length; i++) {
			const toolbar = toolbars[i] as HTMLElement;
			if (toolbar.querySelector(".pdf-expert-button")) continue;

			// @ts-ignore
			const file: TFile | null = view.file ?? null;
			this.appendOpenButton(toolbar, async () => {
				if (file) {
					await this.openExternal(file);
				} else {
					// @ts-ignore
					this.app.commands.executeCommandById("open-with-default-app:open");
				}
			});
		}
	}

	appendOpenButton(toolbar: HTMLElement, onClick: () => Promise<void>) {
		const button = new ButtonComponent(toolbar);
		button.setIcon("external-link");
		button.setTooltip("Open in PDF Expert");
		button.setClass("pdf-expert-button");
		button.setClass("clickable-icon");
		button.onClick(async () => {
			try {
				await onClick();
			} catch (e) {
				console.error("PDF Annotator: failed to open file", e);
			}
		});
	}

	async openExternal(file: TFile) {
		if (Platform.isDesktop) {
			await (this.app as AppWithDesktopInternalApi).openWithDefaultApp(
				file.path,
			);
		} else {
			const encodedPath = encodeURIComponent(file.path);
			const url = `shortcuts://run-shortcut?name=obsidian-to-pdfexpert&input=text&text=${encodedPath}`;
			// anchor click は WKWebView でも URL スキームを確実に発火させる
			const a = document.createElement("a");
			a.href = url;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	}
}
