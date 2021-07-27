import { PluginBase } from './base.js';

let QuickInsert,
    SearchContext;

let dependenciesLoaded;


export class QuickInsertPlugin extends PluginBase {
  static init() {
    const module = game.modules.get('quick-insert');
    if (!module || !module.active) return false;
    dependenciesLoaded = this.loadDependencies();
    Hooks.on('MemeRenderEditor', QuickInsertPlugin.onRender);
    return true;
  }

  static async loadDependencies() {
    const dep = await import(/* webpackIgnore: true */ '/modules/quick-insert/quick-insert.js');
    QuickInsert = dep.QuickInsert;
    SearchContext = dep.SearchContext

    console.log('MEME | finished loading quick insert dependencies.');
    return dep;
  };

  static onRender(editor) {
    // work with the promise to make sure the code is only executed when everything is loaded.
    dependenciesLoaded.then(() => {
      editor.codemirror.on('keydown', (cm, ev) => {
        if (!QuickInsert.matchBoundKeyEvent(key)) return;
        ev.stopPropagation();
        const context = new SearchContext();
        context.spawnCSS = QuickInsertPlugin.spawnCSS(cm);
        context.onSubmit = (item) => {
          cm.replaceSelection(item.journalLink);
          cm.focus();
        };
        QuickInsert.open(context);
      });
    })
  }

  static spawnCSS(cm) {
    const lineHeight = 22; // taken from the css file for the search thingy
    const {left, right, top, bottom} = cm.cursorCoords(true, 'page');
    const centering = (bottom - top - lineHeight) / 2;
    const targetRect = cm.getWrapperElement().getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    return {
      // Make sure its inside the container! 300px is default width for quick insert
      left: Math.min(left, targetRect.right - Math.min(targetRect.width, 300)),
      bottom: bodyRect.height - bottom + centering,
      maxWidth: targetRect.width - 10
    }
  }
}
