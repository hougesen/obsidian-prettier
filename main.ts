import { App, Editor, Plugin, PluginSettingTab, Setting } from 'obsidian';
import type { RequiredOptions } from 'prettier';
import * as prettierPluginAcorn from 'prettier/plugins/acorn';
import * as prettierPluginAngular from 'prettier/plugins/angular';
import * as prettierPluginBabel from 'prettier/plugins/babel';
import * as prettierPluginEstree from 'prettier/plugins/estree';
import * as prettierPluginFlow from 'prettier/plugins/flow';
import * as prettierPluginGlimmer from 'prettier/plugins/glimmer';
import * as prettierPluginGraphql from 'prettier/plugins/graphql';
import * as prettierPluginHtml from 'prettier/plugins/html';
import * as prettierPluginMarkdown from 'prettier/plugins/markdown';
import * as prettierPluginMeriyah from 'prettier/plugins/meriyah';
import * as prettierPluginPostcss from 'prettier/plugins/postcss';
import * as prettierPluginTypeScript from 'prettier/plugins/typescript';
import * as prettierPluginYaml from 'prettier/plugins/yaml';
import * as prettier from 'prettier/standalone';

type PrettierSettings = Pick<
	RequiredOptions,
	| 'semi'
	| 'singleQuote'
	| 'jsxSingleQuote'
	| 'trailingComma'
	| 'bracketSpacing'
	| 'bracketSameLine'
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
	| 'vueIndentScriptAndStyle'
>;

const DEFAULT_SETTINGS: PrettierSettings = {
	semi: true,
	singleQuote: false,
	jsxSingleQuote: false,
	trailingComma: 'all',
	bracketSpacing: true,
	bracketSameLine: false,
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
	vueIndentScriptAndStyle: false,
};

async function formatText(text: string, settings: PrettierSettings): Promise<string> {
	return prettier.format(text, {
		...settings,
		parser: 'markdown',
		plugins: [
			prettierPluginMarkdown,
			prettierPluginAcorn,
			prettierPluginAngular,
			prettierPluginBabel,
			prettierPluginEstree,
			prettierPluginFlow,
			prettierPluginGlimmer,
			prettierPluginGraphql,
			prettierPluginHtml,
			prettierPluginMeriyah,
			prettierPluginPostcss,
			prettierPluginTypeScript,
			prettierPluginYaml,
		],
	});
}

async function formatSelection(editor: Editor, settings: PrettierSettings) {
	const content = editor.getSelection();
	const formatted = await formatText(content, settings);
	return editor.replaceSelection(formatted);
}

async function formatPage(editor: Editor, settings: PrettierSettings) {
	const content = editor.getValue();
	const formatted = await formatText(content, settings);
	return editor.setValue(formatted);
}

export default class ObsidianPrettier extends Plugin {
	settings: PrettierSettings;

	async onload() {
		await this.loadSettings();

		this.formatSelectionCommand();

		this.formatPageCommand();

		this.addSettingTab(new FormattingSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	formatSelectionCommand() {
		return this.addCommand({
			id: 'format-page',
			name: 'Format Page',
			editorCallback: async (editor) => formatPage(editor, this.settings),
		});
	}

	formatPageCommand() {
		return this.addCommand({
			id: 'format-selection',
			name: 'Format Selection',
			editorCallback: async (editor) => formatSelection(editor, this.settings),
		});
	}
}

class FormattingSettingTab
	extends PluginSettingTab
	implements Record<keyof PrettierSettings, (containerEl: HTMLElement) => Setting>
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
		this.proseWrap(containerEl);
		this.useTabs(containerEl);
		this.tabWidth(containerEl);
		this.endOfLine(containerEl);
		this.semi(containerEl);
		this.singleQuote(containerEl);
		this.jsxSingleQuote(containerEl);
		this.quoteProps(containerEl);
		this.trailingComma(containerEl);
		this.bracketSpacing(containerEl);
		this.bracketSameLine(containerEl);
		this.arrowParens(containerEl);
		this.htmlWhitespaceSensitivity(containerEl);
		this.singleAttributePerLine(containerEl);
		this.vueIndentScriptAndStyle(containerEl);
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
					this.plugin.settings.useTabs = value === true;
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
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ auto: 'auto', off: 'off' })
					.setValue(this.plugin.settings.embeddedLanguageFormatting)
					.onChange(async (value) => {
						this.plugin.settings.embeddedLanguageFormatting = value === 'auto' ? 'auto' : 'off';
						await this.plugin.saveSettings();
					}),
			);
	}

	endOfLine(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('End of Line')
			.setDesc('')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ auto: 'auto', lf: 'lf', crlf: 'crlf', cr: 'cr' })
					.setValue(this.plugin.settings.endOfLine || DEFAULT_SETTINGS.endOfLine)
					.onChange(async (value: PrettierSettings['endOfLine']) => {
						const options: Array<PrettierSettings['endOfLine']> = ['auto', 'lf', 'cr', 'crlf'];

						this.plugin.settings.endOfLine = options.includes(value) ? value : DEFAULT_SETTINGS.endOfLine;

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
					this.plugin.settings.semi = value === true;
					await this.plugin.saveSettings();
				}),
			);
	}

	singleQuote(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Prefer single quote')
			.setDesc('Use single quotes instead of double quotes.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.singleQuote === true).onChange(async (value) => {
					this.plugin.settings.singleQuote = value === true;
					await this.plugin.saveSettings();
				}),
			);
	}

	jsxSingleQuote(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('JSX prefer single quote')
			.setDesc('Use single quotes instead of double quotes in JSX.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.jsxSingleQuote === true).onChange(async (value) => {
					this.plugin.settings.jsxSingleQuote = value === true;
					await this.plugin.saveSettings();
				}),
			);
	}

	quoteProps(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Quote Props')
			.setDesc('')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ 'as-needed': 'as-needed', consistent: 'consistent', preserve: 'preserve' })
					.setValue(this.plugin.settings.quoteProps || DEFAULT_SETTINGS.quoteProps)
					.onChange(async (value: PrettierSettings['quoteProps']) => {
						const options: Array<PrettierSettings['quoteProps']> = ['as-needed', 'consistent', 'preserve'];

						this.plugin.settings.quoteProps = options.includes(value) ? value : DEFAULT_SETTINGS.quoteProps;

						await this.plugin.saveSettings();
					}),
			);
	}

	trailingComma(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Trailing Commas')
			.setDesc(
				'Print trailing commas wherever possible in multi-line comma-separated syntactic structures. (A single-line array, for example, never gets trailing commas.)',
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ all: 'all', es5: 'es5', none: 'none' })
					.setValue(this.plugin.settings.trailingComma || DEFAULT_SETTINGS.trailingComma)
					.onChange(async (value: PrettierSettings['trailingComma']) => {
						const options: Array<PrettierSettings['trailingComma']> = ['all', 'es5', 'none'];

						this.plugin.settings.trailingComma = options.includes(value)
							? value
							: DEFAULT_SETTINGS.trailingComma;

						await this.plugin.saveSettings();
					}),
			);
	}

	bracketSpacing(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Bracket Spacing')
			.setDesc('Print spaces between brackets in object literals.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.bracketSpacing === true).onChange(async (value) => {
					this.plugin.settings.bracketSpacing = value === true;
					await this.plugin.saveSettings();
				}),
			);
	}

	bracketSameLine(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Bracket Line')
			.setDesc(
				'Put the > of a multi-line HTML (HTML, JSX, Vue, Angular) element at the end of the last line instead of being alone on the next line (does not apply to self closing elements).',
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.bracketSameLine === true).onChange(async (value) => {
					this.plugin.settings.bracketSameLine = value === true;
					await this.plugin.saveSettings();
				}),
			);
	}

	arrowParens(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Arrow Function Parentheses')
			.setDesc('Include parentheses around a sole arrow function parameter.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ always: 'always', avoid: 'avoid' })
					.setValue(this.plugin.settings.arrowParens || DEFAULT_SETTINGS.arrowParens)
					.onChange(async (value: PrettierSettings['arrowParens']) => {
						const options: Array<PrettierSettings['arrowParens']> = ['always', 'avoid'];

						this.plugin.settings.arrowParens = options.includes(value)
							? value
							: DEFAULT_SETTINGS.arrowParens;

						await this.plugin.saveSettings();
					}),
			);
	}

	proseWrap(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Prose wrap')
			.setDesc(
				'By default, Prettier will not change wrapping in markdown text since some services use a linebreak-sensitive renderer, e.g. GitHub comments and BitBucket. To have Prettier wrap prose to the print width, change this option to "always". If you want Prettier to force all prose blocks to be on a single line and rely on editor/viewer soft wrapping instead, you can use "never".',
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ always: 'always', never: 'never', preserve: 'preserve' })
					.setValue(this.plugin.settings.proseWrap || DEFAULT_SETTINGS.proseWrap)
					.onChange(async (value: PrettierSettings['proseWrap']) => {
						const options: Array<PrettierSettings['proseWrap']> = ['always', 'never', 'preserve'];

						this.plugin.settings.proseWrap = options.includes(value) ? value : DEFAULT_SETTINGS.proseWrap;

						await this.plugin.saveSettings();
					}),
			);
	}

	htmlWhitespaceSensitivity(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('HTML Whitespace Sensitivity')
			.setDesc('Specify the global whitespace sensitivity for HTML, Vue, Angular, and Handlebars.')
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ css: 'css', strict: 'strict', ignore: 'ignore' })
					.setValue(this.plugin.settings.htmlWhitespaceSensitivity)
					.onChange(async (value: PrettierSettings['htmlWhitespaceSensitivity']) => {
						const options: Array<PrettierSettings['htmlWhitespaceSensitivity']> = [
							'css',
							'strict',
							'ignore',
						];

						this.plugin.settings.htmlWhitespaceSensitivity = options.includes(value)
							? value
							: DEFAULT_SETTINGS.htmlWhitespaceSensitivity;

						await this.plugin.saveSettings();
					}),
			);
	}

	singleAttributePerLine(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Single Attribute Per Line')
			.setDesc('Enforce single attribute per line in HTML, Vue and JSX.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.singleAttributePerLine === true).onChange(async (value) => {
					this.plugin.settings.singleAttributePerLine = value === true;
					await this.plugin.saveSettings();
				}),
			);
	}

	vueIndentScriptAndStyle(containerEl: HTMLElement): Setting {
		return new Setting(containerEl)
			.setName('Vue files script and style tags indentation')
			.setDesc('Whether or not to indent the code inside <script> and <style> tags in Vue files.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.vueIndentScriptAndStyle === true).onChange(async (value) => {
					this.plugin.settings.vueIndentScriptAndStyle = value === true;
					await this.plugin.saveSettings();
				}),
			);
	}
}
