import { App, Editor, MarkdownFileInfo, MarkdownView, Plugin, PluginSettingTab } from 'obsidian';
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

class FormattingSettingTab extends PluginSettingTab {
	plugin: ObsidianPrettier;

	constructor(app: App, plugin: ObsidianPrettier) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
	}
}
