export class PluginBase {
  /** Call on init hook 
   * @returns {Boolean} if initialization was successful
  **/
  static init() { return false; }

  /**
   * React on editor rendering and do stuff, like activating listeners.
   * @param {Meme} editor 
   */
  static onRender(editor) {}
}