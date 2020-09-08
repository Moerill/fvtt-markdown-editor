import { QuickInsertPlugin } from './quick-insert.js';

let plugins = {
  'quick-insert': QuickInsertPlugin
};

export class MemePluginsManager {
  static init() {
    Hooks.callAll('MemeRegisterPlugin', plugins);

    for (let key in plugins) {
      if (!plugins[key].init())
        delete plugins[key];
    }
  }

  static onRender(editor) {
    for (let key in plugins) {
      plugins[key].onRender(editor);
    }
  }
}