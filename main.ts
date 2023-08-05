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

		this.embeddedLanguageFormatting(containerEl);

		this.useTabs(containerEl);

		this.tabWidth(containerEl);

		this.semi(containerEl);
	}

	printWidth(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Print width')
			.setDesc('Specify the line length that the printer will wrap on.')
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.printWidth.toString())
					.setValue(
						Number.isNaN(this.plugin.settings.printWidth) ? '' : this.plugin.settings.printWidth.toString(),
					)
					.onChange(async (value) => {
						const trimmedInput = value?.trim();

						const printWidthInput = trimmedInput.length
							? parseInt(trimmedInput, 10)
							: DEFAULT_SETTINGS.printWidth;

						if (Number.isNaN(printWidthInput)) return;

						this.plugin.settings.printWidth = printWidthInput;

						await this.plugin.saveSettings();
					}),
			);
	}

	useTabs(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Prefer tabs')
			.setDesc('Indent lines with tabs instead of spaces.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.useTabs === true).onChange(async (value) => {
					this.plugin.settings.useTabs = value;
					await this.plugin.saveSettings();
				}),
			);
	}

	tabWidth(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Tab width')
			.setDesc('Specify the number of spaces per indentation-level.')
			.addText((input) =>
				input
					.setPlaceholder(DEFAULT_SETTINGS.tabWidth.toString())
					.setValue(
						Number.isNaN(this.plugin.settings.tabWidth) ? '' : this.plugin.settings.tabWidth.toString(),
					)
					.onChange(async (value) => {
						const trimmedInput = value?.trim();

						const tabWidthInput = trimmedInput.length
							? parseInt(trimmedInput, 10)
							: DEFAULT_SETTINGS.tabWidth;

						if (Number.isNaN(tabWidthInput)) return;

						this.plugin.settings.printWidth = tabWidthInput;

						await this.plugin.saveSettings();
					}),
			);
	}

	embeddedLanguageFormatting(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Embedded Language Formatting')
			.setDesc('Control whether Prettier formats quoted code embedded in the file.')
			.addDropdown((drop) =>
				drop
					.addOptions({ auto: 'auto', off: 'off' })
					.setValue(this.plugin.settings.embeddedLanguageFormatting)
					.onChange(async (value) => {
						this.plugin.settings.embeddedLanguageFormatting = value === 'auto' ? 'auto' : 'off';
						await this.plugin.saveSettings();
					}),
			);
	}

	semi(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Semicolons')
			.setDesc('Print semicolons at the ends of code statements.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.semi === true).onChange(async (value) => {
					this.plugin.settings.semi = value;
					await this.plugin.saveSettings();
				}),
			);
	}
}
