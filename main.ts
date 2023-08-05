import { App, Editor, MarkdownFileInfo, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { RequiredOptions } from 'prettier';
import * as prettierPluginMarkdown from 'prettier/plugins/markdown';
import * as prettier from 'prettier/standalone';

type PrettierSettings = Pick<
	RequiredOptions,
	| 'semi'
	| 'singleQuote'
	| 'jsxSingleQuote'
	| 'trailingComma'
	| 'bracketSpacing'
	| 'bracketSameLine'
	| 'jsxBracketSameLine'
	| 'proseWrap'
	| 'arrowParens'
	| 'htmlWhitespaceSensitivity'
	| 'endOfLine'
	| 'quoteProps'
	| 'embeddedLanguageFormatting'
	| 'singleAttributePerLine'
	| 'printWidth'
	| 'tabWidth'
	| 'useTabs'
>;

const DEFAULT_SETTINGS: PrettierSettings = {
	semi: true,
	singleQuote: false,
	jsxSingleQuote: false,
	trailingComma: 'all',
	bracketSpacing: true,
	bracketSameLine: false,
	jsxBracketSameLine: false,
	proseWrap: 'preserve',
	arrowParens: 'always',
	htmlWhitespaceSensitivity: 'css',
	endOfLine: 'lf',
	quoteProps: 'as-needed',
	embeddedLanguageFormatting: 'auto',
	singleAttributePerLine: false,
	printWidth: 80,
	tabWidth: 2,
	useTabs: false,
};

async function formatText(text: string, settings: PrettierSettings): Promise<string> {
	return prettier.format(text, { ...settings, parser: 'markdown', plugins: [prettierPluginMarkdown] });
}

export default class ObsidianPrettier extends Plugin {
	settings: PrettierSettings;

	async onload() {
		console.info('load');

		await this.loadSettings();

		this.addCommand({
			id: 'format-selection',
			name: 'Format Selection',
			editorCallback: async (editor: Editor) =>
				editor.replaceSelection(await formatText(editor.getSelection(), this.settings)),
		});

		this.addCommand({
			id: 'format-page',
			name: 'Format Page',
			editorCallback: async (editor: Editor, _ctx: MarkdownView | MarkdownFileInfo) =>
				editor.setValue(await formatText(editor.getValue(), this.settings)),
		});

		this.addSettingTab(new FormattingSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class FormattingSettingTab
	extends PluginSettingTab
	implements Partial<Record<keyof PrettierSettings, (containerEl: HTMLElement) => Setting>>
{
	plugin: ObsidianPrettier;

	constructor(app: App, plugin: ObsidianPrettier) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		this.printWidth(containerEl);
	}

	printWidth(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Print width')
			.setDesc('Specify the line length that the printer will wrap on.')
			.addText((text) =>
				text
					.setPlaceholder('80')
					.setValue(
						Number.isNaN(this.plugin.settings.printWidth) ? '' : this.plugin.settings.printWidth.toString(),
					)
					.onChange(async (value) => {
						const trimmedInput = value?.trim();

						const printWidthInput = trimmedInput.length ? parseInt(trimmedInput, 10) : 80;

						if (Number.isNaN(printWidthInput)) return;

						this.plugin.settings.printWidth = printWidthInput;

						await this.plugin.saveSettings();
					}),
			);
	}
}
