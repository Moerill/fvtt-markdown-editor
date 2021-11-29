export class MemeSettings extends FormApplication {
  static init() {
    game.settings.registerMenu('markdown-editor', 'menu', {
      name: '',
      label: 'GM Settings',
      icon: 'fas fa-mug-hot',
      type: MemeSettings,
      restricted: true
    });

    game.settings.register('markdown-editor', 'world-settings', {
      name: 'Settings object for world level markdown editor settings',
      type: Object,
      default: {
        chat: true,
        richText: true,
        markdownItContainer: true
      },
      config: false,
      onChange: () => {
        new Dialog({
          content: `<p>Some settings have changed, that require a refresh of the page to be applied.</p>`,
          buttons: {
            yes: {
              icon: '<i class="fas fa-check"></i>',
              label: 'Refresh page.',
              callback: () => location.reload()
            },
            no: {
              icon: '<i class="fas fa-times"></i>',
              label: 'I\'ll refresh later.'
            }
          }
        }).render(true);
      }
    })

    game.settings.register('markdown-editor', 'vim-mode', {
      name: 'VIM Keybindings',
      hint: 'Enable VIM keybindings for the markdown editor. [User Setting]',
      scope: 'client',
      default: false,
      type: Boolean,
      restricted: false,
      config: true
    });
  }

  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      template: "modules/markdown-editor/html/settings.html",
      height: "auto",
      title: "MEME - Settings & Info",
      width: 600,
      classes: ["meme", "settings"],
      tabs: [
        {
          navSelector: '.tabs',
          contentSelector: 'form',
          initial: 'info'
        }
      ],
      submitOnClose: true
    }
  }

  static get isRichTextActive() {
    const settings = game.settings.get('markdown-editor', 'world-settings');
    return settings.richText;
  }

  static get isChatActive() {
    const settings = game.settings.get('markdown-editor', 'world-settings');
    return settings.chat;
  }

  static get isMarkdownItContainerActive() {
    const settings = game.settings.get('markdown-editor', 'world-settings');
    return settings.markdownItContainer;
  }

  constructor(object = {}, options) {
    super(object, options);
  }

  _getHeaderButtons() {
    let btns = super._getHeaderButtons();
    btns[0].label = "Save & Close";
    return btns;
  }

  getSettingsData() {
    return game.settings.get('markdown-editor', 'world-settings');
  }

  getData() {
    let data = super.getData();
    data.settings = this.getSettingsData();
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
  }

  _updateObject(ev, formData) {
    const data = expandObject(formData);
    game.settings.set('markdown-editor', 'world-settings', data);
  }
}