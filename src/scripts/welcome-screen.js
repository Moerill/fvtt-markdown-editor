export const renderWelcomeScreen = function() {
	Hooks.on('ready', () => {
		// Edit next line to match module.
		const module = game.modules.get("markdown-editor");
		const title = module.data.title;
		const moduleVersion = module.data.version.split(".").splice(0,2).join(".");
		game.settings.register(title, 'version', {
			name: `${title} Version`,
			default: "0.0",
			type: String,
			scope: 'world',
		});
		const oldVersion = game.settings.get(title, "version");
		if (!isNewerVersion(moduleVersion, oldVersion))
			return;
		

		class WelcomeScreen extends Application {
			static get defaultOptions() {
				const options = super.defaultOptions;
				options.template = `modules/${module.id}/templates/welcome-screen.html`;
				options.resizable = true;
				options.width = 450;
				options.height = "auto";
				options.classes = ["welcome-screen"];
				options.title = `${title}`;
				return options;
			}

			activateListeners(html) {
				super.activateListeners(html);

				html.find('.show-again').on('change', ev => {
					let val = "0.0.0";
					if (ev.currentTarget.checked)
						val = moduleVersion;

					game.settings.set(title, "version", val);
				})
			}
		}

		(new WelcomeScreen()).render(true);
	});
}