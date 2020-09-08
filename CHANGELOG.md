# v0.4.2

- Fix HTML not parsing

# v0.4.1

- Fixed small issue with the plugin manager not breaking everything if quick insert is not installed/activated.

# v0.4.0

In my opinion this module is now feature complete and is now officially released!  

- Removed entity autocompletion, in favor of proper integration of @Sunspots [Quick Insert](https://gitlab.com/fvtt-modules-lab/quick-insert/) module! (You have to manually install the quick insert module, but it should work out of the box together with MEME)
- Improved and added compatibility with so many mods! Should be compatible with most modules now!
  - Added compatibility with [Foriens Quest Log](https://github.com/Forien/foundryvtt-forien-quest-log/)
  - [Emojule](https://github.com/Moerill/emojule/) support!
  - [Quick Insert](https://gitlab.com/fvtt-modules-lab/quick-insert/) 
- Restructured the whole code for better maintainability and extensibility
  - Added a PluginManager to allow for other modules to enhance MEMEs features. (Documentation still missing, take a look at the quick-insert integration as example)
- Switched renderer to use [markdown-it](https://github.com/markdown-it/markdown-it) instead of marked for easier and better extensibility
- Created a settings menu with some basic information and toggles for:
  - chat markdown support
  - rich text editor markdown support
- Removed the welcome screen popup by popular request. All the important information will now be shown in the settings menu. You now need to check the Changelog linked there yourself!
- When starting to edit the view will jump to the end of the document. (I decided to do this, since imo more often one wants to add stuff to the end instead of the beginning.)
- *FIX* dropped entity links not appearing at the shown position
- *FIX* entity links and not being rendered properly in some non MEME places
- *FIX* some visual bugs caused in tidy 5e sheet and some other places. 
- *FIX* Chat box shrinking with Ernies Modern UI


# v0.3.2
- *Fix* [PF2e] funky behaviour for item sheets. https://github.com/Moerill/fvtt-markdown-editor/issues/8
- *Fix* [DnD5e] Item sheet infinite width editor.

# v0.3.1
- *Fix* Changelog popup popping up again, even though checkbox is set per default.

# v0.3
- *NEW* chat input form now supports markdown as well!
  - Recalling last messages is moved from the default arrow keys to Page-Up/-Down. Leaving arrow keys 
- *Fix* VIM command line positioning

# v0.2.6
- *Fix* Users being able to see Entitie names they don't have access to using autocomplete.

# v0.2.5
Thanks to Github User @Atomdmac for providing this fix!
- *Fix* Editors bound to empty values showed 'undefined'.

# v0.2.4
Thanks to @Atomdmac  for helping this and last hotfix.
- Now unregistering the original editor handlebars helper before registering my own, just to be sure. 

# v0.2.3

- trying to fix some extra spaces added in cases where the rendered application does call the handlebars editor helper inside of a partial. (See https://github.com/Moerill/fvtt-markdown-editor/issues/1 )
- Fixed buttons being not readable in the dnd5e item sheet when using tidy5e

# v0.2.2
* removed debugging hook...

# v0.2.1
* Fixed secret block styling missing

# v0.2
* Added secret block button functionality