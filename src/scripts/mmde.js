import EasyMDE from 'easymde';

const md = require('markdown-it')({
	html: true,
	linkify: true,
});
export const markdownIt = md;
require('codemirror/keymap/vim.js');

md.use(require('markdown-it-container'), 'secret', {
	validate: function (params) {
		return true;
	},
	marker: '$',
	render: function (tokens, idx) {
		if (tokens[idx].nesting > 0)
			// opening tag
			return '<section class="secret">';
		else return '</section>';
	},
});

md.renderer.rules['heading_open'] = function (tokens, idx /*, options, env */) {
	const token = tokens[idx],
		nextToken = tokens[idx + 1],
		link = nextToken.content; //.replace(/\s/g, '_');
	return `<${token.tag} name='${token.markup}${link}'>`;
};

export class Meme extends EasyMDE {
	constructor(options = {}) {
		super({ ...Meme.defaultOptions, ...options });
	}

	static get defaultOptions() {
		return {
			autoDownloadFontAwesome: false,
			forceSync: true,
			minHeight: '0px',
			status: false,
			spellChecker: false,
			toolbar: this.toolbar,
			owner: true,
		};
	}

	static get toolbar() {
		return [
			'bold',
			'italic',
			'strikethrough',
			'heading',
			'|',
			'ordered-list',
			'unordered-list',
			{
				name: 'secret',
				action: this.toggleSecretBlock,
				className: 'fas fa-user-secret',
				title: 'Make Secret block',
			},
			'quote',
			// "code",
			'table',
			'|',
			'link',
			{
				name: 'image',
				action: this.chooseImage,
				className: 'fa fa-image',
				title: 'Image',
			},
			'horizontal-rule',
			'|',
			'preview',
			'side-by-side',
			'fullscreen',
			'|',
			{
				name: 'plugins',
				title: 'Plugins',
				className: 'fas fa-list',
				children: [],
			},
			{
				name: 'save',
				action: this.save,
				className: 'fas fa-save',
				title: 'Save',
				noDisable: true,
			},
			'|',
			'guide',
		];
	}

	static toggleSecretBlock(editor) {
		const secretChars = '$$$';
		let cm = editor.codemirror;
		const text = cm.getSelection();
		let cur_start = cm.getCursor('start'),
			cur_end = cm.getCursor('end');

		if (cur_start.line !== cur_end.line || cur_start.ch !== cur_end.ch) {
			const start_line = cur_start.line,
				end_line = cur_end.line,
				end_text = cm.getLineHandle(end_line).text;
			const orig_text = cm.getRange({ line: cur_start.line, ch: 0 }, { line: cur_end.line, ch: end_text.length }),
				cap = rules.block.secret.exec(orig_text);
			let new_text = orig_text,
				head,
				anchor;
			// remove  $$$ from start and finish if whole selection encompasses exactly one secret block
			if (cap && cap[0].length === orig_text.length) {
				new_text = cap[3];
				head = { line: end_line - 2, ch: cm.getLineHandle(end_line - 1).text.length };
				anchor = { line: start_line, ch: 0 };
			} else {
				// Else add  $$$ at start and finish of block
				new_text = '\n' + secretChars + '\n' + orig_text + '\n' + secretChars + '\n';
				anchor = { line: start_line + 1, ch: 0 };
				head = { line: end_line + 3, ch: 3 };
			}
			cm.replaceRange(new_text, { line: cur_start.line, ch: 0 }, { line: cur_end.line, ch: end_text.length });
			cm.setSelection(anchor, head);
		} // no selection? just add secret block chars
		else cm.replaceSelection('\n' + secretChars + '\n' + text + '\n' + secretChars + '\n');

		cm.focus();
	}

	toggleSecretBlock() {
		this.constructor.toggleSecretBlock(this);
	}

	static chooseImage(editor) {
		const cm = editor.codemirror;
		const wrapper = cm.getWrapperElement();
		new FilePicker({
			type: 'image',
			callback: (path) => {
				cm.replaceSelection(`![](${path})`);
			},
			top: wrapper.style.position.top + 40,
			left: wrapper.style.position.left + 10,
		}).browse();
	}

	static save(editor) {
		const wrapper = editor.element.parentNode;
		const btn = wrapper.querySelector('.editor-edit');
		btn.style.display = '';
		if (!editor.isPreviewActive()) editor.togglePreview();
		wrapper.querySelector('.editor-toolbar').classList.add('hidden');

		if (editor.options.saveCallback) editor.options.saveCallback(editor.codemirror.getValue());
	}

	save() {
		this.constructor.name.save(this);
	}

	makePreviewOnly() {
		const cm = this.codemirror;
		const wrapper = cm.getWrapperElement();
		const preview = wrapper.lastChild;
		if (!preview || !preview.classList.contains('editor-preview-full')) this.togglePreview();
		wrapper.classList.add('preview-only');
	}

	render() {
		super.render();

		this.codemirror.on('drop', this._onDrop);

		if (game.settings.get('markdown-editor', 'vim-mode')) {
			delete this.codemirror.options.extraKeys['Esc'];
			this.codemirror.setOption('vimMode', true);
		}

		Hooks.callAll('MemeRenderEditor', this, this.options.parent);
	}

	_onDrop(inst, ev) {
		let data;
		try {
			// catch stuff that is not correctly formatted.. like  accidently dropping "just plain text drags"
			data = JSON.parse(event.dataTransfer.getData('text/plain'));
		} catch (e) {
			return;
		}
		if (!data) return;
		ev.preventDefault();
		const insertIntoEditor = function (link) {
			const pos = inst.coordsChar({ left: ev.clientX, top: ev.clientY });
			inst.setCursor(pos);
			inst.replaceSelection(link);
			inst.focus();
		};
		try {
			if (data.pack) {
				const pack = game.packs.get(data.pack);
				pack.getEntity(data.id).then((entity) => insertIntoEditor(`@Compendium[${data.pack}.${data.id}]{${entity.name}}`));
			} else {
				const entity = CONFIG[data.type].collection.instance.get(data.id);
				insertIntoEditor(`@${data.type}[${entity._id}]{${entity.name}}`);
			}
		} catch (e) {
			console.error('Dropped incorrect data!', data);
		}
	}
	/**
	 * @override
	 */
	markdown(text) {
		return TextEditor.enrichHTML(md.render(text), { secrets: this.options.owner, documents: true });
	}

	createToolbar(items) {
		const bar = super.createToolbar(items);
		console.log(bar);
		const pluginBtn = bar.querySelector('.plugins');
		const btns = Array.from(pluginBtn.querySelectorAll('.easymde-dropdown-content button'));
		if (btns.length === 0) pluginBtn.remove();
		else {
			for (let btn of btns) {
				btn.appendChild(document.createTextNode(btn.title));
			}
		}
		return bar;
	}
}

export class ChatMeme extends Meme {
	constructor(options) {
		super({ ...ChatMeme.defaultOptions, ...options });
	}

	static get defaultOptions() {
		return {
			toolbar: false,
		};
	}

	render() {
		super.render();

		// remove enter to new line
		this.codemirror.options.extraKeys['Enter'] = this._sendChatMessage.bind(this);

		this.codemirror.options.extraKeys['PageDown'] = this._chatRecallMessageDown.bind(this);
		this.codemirror.options.extraKeys['PageUp'] = this._chatRecallMessageUp.bind(this);

		// Emojule integration without plugin manager.. cause easier this way
		Hooks.on('emojuleSelectEmoji', (emojiCode) => {
			const word = this.codemirror.findWordAt(this.codemirror.getCursor());
			this.codemirror.replaceRange(emojiCode.substring(1), word.anchor, word.head);
			return false;
		});
	}

	/**
	 * @override
	 * Do not do enrichHTML for text messages, since that will be done "anyway" when processing the message
	 * @param {*} text
	 */
	markdown(text) {
		return md.render(text);
	}

	/**
	 * Sends the content of the textarea to chat.
	 */
	_sendChatMessage() {
		const editor = this;
		const textarea = editor.element;
		if (!editor.value()) return;
		let message = editor.value();
		// if rollcommand, leave it be
		let [command, match] = ui.chat.constructor.parse(message);
		// on whisper, move the whisper target outside of the parsed tetx
		if (command === 'whisper') {
			message = match[1] + match[2] + ' ' + this.markdown(match[3]).replace(/\n/g, '');
			// similar for ooc, iic, emote
		} else if (['ic', 'ooc', 'emote'].includes(command)) {
			message = match[1] + ' ' + this.markdown(match[2]).replace(/\n/g, '');
		} else if (command === 'none') message = this.markdown(message).replace(/\n/g, '');

		// Prepare chat message data and handle result
		ui.chat
			.processMessage(message)
			.then(() => {
				ui.chat._remember(editor.value());
				textarea.value = '';
				editor.value('');
			})
			.catch((error) => {
				ui.notifications.error(error);
				throw error;
			});
	}

	_chatRecallMessageUp() {
		this.value(ui.chat._recall(1));
	}

	_chatRecallMessageDown() {
		this.value(ui.chat._recall(-1));
	}
}
