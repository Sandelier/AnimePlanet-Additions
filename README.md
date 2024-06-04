
# AnimePlanet Additions
Adding new features / fixing minor inconveniences that i have found in animeplanet. 

## Installation

**Permissions:**
- You need to allow the extension to operate in Animeplanet's url so that we can inject content scripts.
- If you want to use the "Extra manga data" script then you need to also allow the extension to operate in mangaupdates api url.

### Firefox
Extension can be found in Mozilla's add-on page: [AnimePlanet Additions](https://github.com/Sandelier/AnimePlanet-Additions)

### Chromium (Chrome, brave, etc)
1. Download the zip file from [Releases](https://github.com/Sandelier/AnimePlanet-Additions/releases/latest).
2. Manually add the zip file to your extension manager. You can typically find the extension manager in "browser://extensions/". You might need to enable developer mode to manually install zip files.

(I would want to add it to Google's web store, but they want me to pay them for me to give them software I made for free for everyone to use so maybe some other day i might add it.)


### Options page
You can disable/enable features in the options page of the addon. Options page in firefox is at about:addons and in chromium its browser://extensions.
Options page is gonna be redesigned sooner or later.

### Acknowledgements
* **Mangaupdates** ([https://api.mangaupdates.com/](https://api.mangaupdates.com/)): Mangaupdates api is used for "Extra manga data" feature to fetch manga data


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


<details>
  <summary><h2>Current Features</h2></summary>

  <details>
    <summary>Extra pages</summary>
    Allows you to load more mangas/animes into one page by loading extra pages.
  </details>

  <details>
    <summary>Apply button shown</summary>
    Makes the apply button on filters to be always shown.
  </details>

  <details>
    <summary>Quick apply</summary>
    New button to filter current mangas/animes in the page without loading next page.
  </details>

  <details>
    <summary>Tags search</summary>
    Adds an search bar for tags.
  </details>

  <details>
    <summary>Clickable usernames</summary>
    Makes usernames clickable in forum profile
  </details>

  <details>
    <summary>Chapter filtering</summary>
    Adds chapter filtering in current page.
  </details>

  <details>
    <summary>Contains filtering</summary>
    Filters entries that dont contain any of the tags defined.
  </details>

  <details>
    <summary>List entry remover</summary>
    Makes it that you can click the list to remove the entry from custom list in "Add to new custom list"
  </details>

  <details>
    <summary>Auto filters</summary>
    Automatically adds filters
  </details>

  <details>
    <summary>Extra manga data</summary>
    Adds an button to fetch mangaupdate's data and add it to the manga page. In example description or alternative titles since animeplanet usually doesn't say the raw name
  </details>

</details>