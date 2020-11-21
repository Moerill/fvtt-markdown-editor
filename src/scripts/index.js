import { Meme, ChatMeme, markdownIt } from './mmde.js';

import { QuickInsertPlugin } from './plugins/quick-insert.js';

import { MemeSettings } from './settings.js';

window.MEME = {
	ChatMeme,
	markdownIt,
	BaseMeme: Meme,
};

// Hooks.on('ready', () => game.journal.get('Gb3Z2SCBSDp1sEVe').sheet.render(true))

Hooks.on('init', function () {
	MemeSettings.init();
	QuickInsertPlugin.init();

	if (MemeSettings.isRichTextActive) activateRichTextFeatures();

	if (MemeSettings.isChatActive)
		Hooks.on('renderChatLog', (app, html, options) => {
			const chat = html[0].querySelector('#chat-message');
			let editorOptions = {
				element: chat,
			};

			// Use this hook to modify e.g. the toolbar content or other options for invoking the editor
			Hooks.callAll('MemeActivateChat', editorOptions);
			app.editor = new MEME.ChatMeme(editorOptions);
		});
});

function activateRichTextFeatures() {
	Handlebars.unregisterHelper('editor');
	Handlebars.registerHelper('editor', function (options) {
		let target = options.hash['target'],
			content = options.hash['content'] || '',
			button = Boolean(options.hash['button']),
			owner = Boolean(options.hash['owner']),
			editable = Boolean(options.hash['editable']);
		if (!target) throw new Error('You must define the name of a target field.');

		let editor = $(
			`<div class="editor" ${owner ? 'data-owner="1"' : ''}><textarea class="editor-content" ${
				editable ? 'data-editable="true"' : ''
			} name="${target}" data-dtype="String"></textarea></div>`
		);

		// Append edit button
		if (button && editable) editor.append($('<a class="editor-edit"><i class="fas fa-edit"></i></a>'));

		return new Handlebars.SafeString(editor[0].outerHTML);
	});

	const oldActivateListeners = FormApplication.prototype.activateListeners;
	FormApplication.prototype.activateListeners = function (html) {
		oldActivateListeners.bind(this)(html);
		html.find('.editor-content').each((i, div) => this._activateEditor(div));
	};

	FormApplication.prototype._activateEditor = function (textarea) {
		const div = textarea.parentNode;
		const target = textarea.name;

		// Trying to avoid the strange handlebars partial indentation issues by just inserting the content now
		let content =
			getProperty(this.object.data, target) ||
			// Maybe the editor is used for something not adhering to the regular entity data structure, then try to get the data without the additional "data" key
			getProperty(this.object, target) ||
			// If all else fails, use an empty string.
			'';

		const editable = !!textarea.dataset.editable;
		let editorOptions = {
			element: textarea,
			owner: !!div.dataset.owner,
			saveCallback: (content) => this._onEditorSave(target, textarea, content),
			content,
			toolbar: MEME.BaseMeme.toolbar,
		};

		//		textarea.innerHTML = content;
		// Use this hook to modify e.g. the toolbar content or other options for invoking the editor
		Hooks.callAll('MemeActivateEditor', this, editorOptions);
		console.log(editorOptions);
		textarea.innerHTML = editorOptions.content;
		delete editorOptions.content;

		if (!editable) editorOptions.toolbar = false;
		this.editors[target] = new MEME.BaseMeme(editorOptions);

		if (!editable) {
			this.editors[target].makePreviewOnly();
			return;
		}

		this.editors[target].togglePreview();

		div.querySelector('.editor-toolbar').classList.add('hidden');

		const btn = div.querySelector('.editor-edit');
		if (btn)
			btn.addEventListener('click', (ev) => {
				ev.currentTarget.style.display = 'none';
				ev.currentTarget.parentNode.querySelector('.editor-toolbar').classList.remove('hidden');
				const cm = this.editors[target].codemirror;
				this.editors[target].togglePreview();
				// next 2 lines needed to avoid text sometimes not showing when starting to edit, until the editor is clicked on.
				cm.focus();
				// Jump to end of text
				cm.setCursor(cm.lineCount(), 0);
			});
	};

	FormApplication.prototype._onEditorSave = function (target, element, content) {
		let event = new Event('memesave');
		return this._onSubmit(event);
	};
}
