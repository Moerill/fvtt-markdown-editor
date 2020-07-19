import EasyMDE from './easymde/easymde.js';

// Hooks.on('ready', () => game.journal.get('Gb3Z2SCBSDp1sEVe').sheet.render(true))


// FormApplication.prototype._createEditor = function(target, editorOptions, initialContent) {
// 	// console.log("lalalalal")
// 	// console.log(target, editorOptions, initialContent);
// 	// // const textarea = document.createElement('textarea');
// 	// // textarea.innerHTML = editorOptions.target.innerHTML;
// 	// // editorOptions.target.parentNode.replaceChild(textarea, editorOptions.target);
// 	// console.log(new EasyMDE({
// 	// 	element: editorOptions.target,
// 	// 	forceSync: true
// 	// }));
// }

Hooks.on('init', function() {
	game.settings.register('markdown-editor', 'vim-mode', {
		name: 'VIM Keybindings',
		hint: 'Enable VIM keybindings for the markdown editor',
		scope: 'user',
		default: false,
		type: Boolean,
		restricted: false,
		config: true
	})
});

Handlebars.registerHelper('editor', function(options) {
  let target = options.hash['target'],
      content = options.hash['content'] || "",
      button = Boolean(options.hash['button']),
      owner = Boolean(options.hash['owner']),
      editable = Boolean(options.hash['editable']);
  if ( !target ) throw new Error("You must define the name of a target field.");

  // Enrich the content
  content = TextEditor.enrichHTML(content, {secrets: owner, entities: true});

  // Construct the HTML
	// let editor = $(`<div class="editor ${owner ? 'no-secrets' : ''}"><textarea class="editor-content" ${editable ? 'data-editable="true"' : ''} name="${target}" data-dtype="String">${content}</textarea></div>`);
	let editor = $(`<div class="editor ${owner ? 'no-secrets' : ''}"><textarea class="editor-content" ${editable ? 'data-editable="true"' : ''} name="${target}" data-dtype="String"></textarea></div>`);

  // Append edit button
	if ( button && editable ) editor.append($('<a class="editor-edit"><i class="fas fa-edit"></i></a>'));
	console.log(duplicate(new Handlebars.SafeString(editor[0].outerHTML)))
  return new Handlebars.SafeString(editor[0].outerHTML);
});



(function() {
	const oldActivateListeners = FormApplication.prototype.activateListeners;
	FormApplication.prototype.activateListeners = function(html) {
		oldActivateListeners.bind(this)(html);
		html.find('.editor-content').each((i, div) => this._activateEditor(div));
	}

	FormApplication.prototype._activateEditor =  function(textarea) {
		const div = textarea.parentNode;
		const target = textarea.name;
		
		// Trying to avoid the strange handlebars partial indentation issues by just inserting the content now
		let content = getProperty(this.object.data, target);
		// Maybe the editor is used for something not adhering to the regular entity data structure, then try to get the data without the additional "data" key
		if (!content)
			content = getProperty(this.object, target);
		textarea.innerHTML = content;
		const editable = !!textarea.dataset.editable;
		let editorOptions = {
			element: textarea,
			forceSync: true,
			minHeight: "0px",
			toolbar: [
				"bold",
				"italic",
				"strikethrough",
				"heading",
				"|",
				"ordered-list",
				"unordered-list",
				{
					name: "secret",
					action: EasyMDE.toggleSecretBlock,
					className: "fas fa-user-secret",
					title: "Make Secret block"
				},
				"quote",
				// "code",
				"table",
				"|",
				"link",
				{
					name: "image",
					action: chooseImage.bind(this),
					className: "fa fa-image",
					title: "Image"
				},
				"horizontal-rule",
				"|",
				"preview",
				"side-by-side",
				"fullscreen",
				"|",
				{
					name: "save",
					action: saveEditor.bind(this),
					className: "fa fa-floppy-o",
					title: "Save"
				},
				"|",
				"guide"
			],
			shortcuts: {
				// "save": "Ctrl-S"
			},
			status: false,
			spellChecker: false
			// renderingConfig: {
			// 	markedOptions: {
			// 		tokenizer: new marked.Tokenizer()
			// 	}
			// }
		}
		if (!editable) editorOptions.toolbar = false;
		this.editors[target] = new EasyMDE(editorOptions);
		this.editors[target].togglePreview();

		if (!editable)
			return;
		div.querySelector('.editor-toolbar').classList.add('hidden');
		this.editors[target].codemirror.on('change', (instance, changeObj) => {
			// console.log(instance, changeObj)
			if (changeObj.text.find(e => e === '@')) {
				instance.showHint({
					hint: getEntityHints,
					// closeOnUnfocus: false
				});
			}
		});

		this.editors[target].codemirror.on('drop', (inst, ev) => {
			ev.preventDefault();
			const data = JSON.parse(event.dataTransfer.getData('text/plain'));
			if ( !data ) return;

			const insertIntoEditor = function(link) {
				inst.replaceSelection(link)
			}
			try {
				if (data.pack) {
					const pack = game.packs.get(data.pack);
					pack.getEntity(data.id).then(entity => 
						insertIntoEditor(`@Compendium[${data.pack}.${data.id}]{${entity.name}}`));
				} else {
					const entity = CONFIG[data.type].collection.instance.get(data.id);
					insertIntoEditor(`@${data.type}[${entity._id}]{${entity.name}}`);
				}
					
			} catch(e) {
				console.error("Dropped incorrect data!", data);
			}
		});
		// this.editors[target].codemirror.on('shown', () => console.log("SHOWN!"));

		const btn = div.querySelector('.editor-edit');
		if (btn)
			btn.addEventListener('click', ev => {
				ev.currentTarget.style.display = 'none';
				ev.currentTarget.parentNode.querySelector('.editor-toolbar').classList.remove('hidden');
				this.editors[target].togglePreview();
			})

	}

	// Stop the original enrichHTML method from replacing entity links, since we're doing this "on the fly", by leveraging marked-js
	const oldEnrichHTML = TextEditor.enrichHTML;
	TextEditor.enrichHTML = function(content, {secrets=false, entities=true, links=true, rolls=true, rollData=null}={}) {return oldEnrichHTML.bind(this)(content, {secrets, entities: false, links, rolls, rollData})}
}());

function saveEditor(editor) {
	editor.element.parentNode.querySelector('.editor-edit').style.display = null;
	// editor.element.parentNode.querySelector('.editor-toolbar').style.display = 'none';
	editor.element.parentNode.querySelector('.editor-toolbar').classList.add('hidden');
	if (!editor.isPreviewActive())
		editor.togglePreview();

	this.submit();
}

function chooseImage(editor) {
	new FilePicker({
		type: "image",
		callback: path => {
			const cm = editor.codemirror;
			const start = cm.getCursor('start');

			cm.replaceSelection(`![](${path})`);
		},
		top: this.position.top + 40,
		left: this.position.left + 10
	}).browse();
}

// const entityTypes = CONST.ENTITY_LINK_TYPES.concat("Compendium").map(e => {
// 	return {
// 		text: e + "[",
// 		displayText: e
// 	}
// });

const entityTypes = CONST.ENTITY_LINK_TYPES.map(e => {
	return {
		text: e + "[",
		displayText: e
	}
});



function getEntityHints(editor, options) {
	return new Promise(function(resolve) {
		var Pos = editor.constructor.Pos;
		var cur = editor.getCursor();
		// const entities = CONST.ENTITY_LINK_TYPES.concat("Compendium");
		const word = editor.findWordAt(cur);
		const completions = {
			list: getCompletions(editor.getRange(word.anchor, word.head), entityTypes, options),
			from: word.anchor,
			to: word.head
		}
		editor.constructor.on(completions, 'pick', (completion) => {
			startEntityCompletion(editor, completion.displayText, {startAtStart: true});
		});
		if (completions.list.length)
			resolve(completions);
		resolve(null);
	})
}

function getCompletions(token, keywords, options = {startAtStart: false}) {
	// keywords = keywords.map(e => {
	// 	return {
	// 		text: e + "[",
	// 		displayText: e
	// 	}
	// })
	if (token === "@" || token === "[")
		return keywords.map(e => {
			return {...e, ...{text: token + e.text}};
		});
	const regex = new RegExp(`${options.startAtStart ? '^' : ''}${token}`);
	return keywords.filter(e => regex.exec(e.text));
}

function startEntityCompletion(editor, type) {
	const coll = CONFIG[type].collection.instance;
	const collection = coll.entries.map(e => {
		return {
			text: e.id + "]{" + e.name + "}",
			displayText: e.name
		}
	});
	// const list = 
	editor.showHint({
		hint: (editor) => getEntityNameHints(editor, collection),
		// closeOnUnfocus: false
	});
}

function getEntityNameHints(editor, collection) {
	var Pos = editor.constructor.Pos;
	var cur = editor.getCursor();
	const word = editor.findWordAt(cur);

	const completions = {
		list: getCompletions(editor.getRange(word.anchor, word.head), collection, options),
		from: word.anchor,
		to: word.head
	}
	return completions;
}