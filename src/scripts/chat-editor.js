import EasyMDE from './easymde/easymde.js';

export const initChatEditor = function() {
	Hooks.on('renderChatLog', (app, html, options) => {
		const chat = html[0].querySelector('#chat-message');
		let editorOptions = {
			element: chat,
			forceSync: true,
			minHeight: "0px",
			status: false,
			spellChecker: false,
			toolbar: false,
			shortcuts: {
				'chatSendMessage': "Enter",
				'chatRecallMessageDown': "PageDown",
				'chatRecallMessageUp': "PageUp"
			}
		}
		app.editor = new EasyMDE(editorOptions);
	});
};