import EasyMDE from './easymde/easymde.js';




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
	let editor = $(`<div class="editor"><textarea class="editor-content" ${editable ? 'data-editable="true"' : ''} name="${target}" data-edit="${target}">${content}</textarea></div>`);

  // Append edit button
	if ( button && editable ) editor.append($('<a class="editor-edit"><i class="fas fa-edit"></i></a>'));
	
  return new Handlebars.SafeString(editor[0].outerHTML);
});



// class FVTTTokenizer extends marked.Tokenizer {
// }

(function() {
// 	let oldFun = FormApplication.prototype.activateListeners;
// 	FormApplication.prototype.activateListeners =  function(html) {
// 		oldFun.bind(this)(html);

// 		html[0].querySelectorAll('.editor').forEach(div => {
// 			console.log(div);
// 			const textarea = div.querySelector('textarea');
// 			const target = textarea.name;
// 			const editable = !!textarea.dataset.editable;
// 			let editorOptions = {
// 				element: textarea,
// 				forceSync: true,
// 			}
// 			if (!editable) editorOptions.toolbar = false;
// 			this.editors[target] = new EasyMDE(editorOptions);
// 			this.editors[target].codemirror.on('changes', (...args) => console.log(args));
// 			this.editors[target].togglePreview();
// 			div.querySelector('.editor-toolbar').style.display = 'none';

// 			const btn = div.querySelector('.editor-edit');
// 			if (btn)
// 				btn.addEventListener('click', ev => {
// 					ev.currentTarget.parentNode.querySelector('.editor-toolbar').style.display = null;
// 				})
// 		})
// 	};
	FormApplication.prototype._activateEditor =  function(textarea) {
		const div = textarea.parentNode;
		const target = textarea.name;
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
				"quote",
				"unordered-list",
				"ordered-list",
				"|",
				"code",
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
				"save": "Ctrl-S"
			},
			status: false,
			// renderingConfig: {
			// 	markedOptions: {
			// 		tokenizer: new marked.Tokenizer()
			// 	}
			// }
		}
		if (!editable) editorOptions.toolbar = false;
		this.editors[target] = new EasyMDE(editorOptions);
		this.editors[target].codemirror.on('change', (instance, changeObj) => {
			if (changeObj.text.find(e => e === '@')) {
				
				instance.showHint({
					hint: getEntityHints,
					// closeOnUnfocus: false
				});
			}
		});
		// this.editors[target].codemirror.on('shown', () => console.log("SHOWN!"));
		div.querySelector('.editor-toolbar').classList.add('hidden');
		this.editors[target].togglePreview();

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
Hooks.on('ready', () => game.journal.get('Gb3Z2SCBSDp1sEVe').sheet.render(true))

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
	var Pos = editor.constructor.Pos;
	var cur = editor.getCursor();
	const entities = CONST.ENTITY_LINK_TYPES.concat("Compendium");
	const word = editor.findWordAt(cur);
	const completions = {
		list: getCompletions(editor.getRange(word.anchor, word.head), entityTypes, options),
		from: word.head,
		to: word.anchor
	}
	editor.constructor.on(completions, 'pick', (completion) => {
		startEntityCompletion(editor, completion.displayText, {startAtStart: true});
	});
	return completions;
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
		from: word.head,
		to: word.anchor
	}
	return completions;
}