
# AnimePlanet Additions
Adding new features / fixing minor inconveniences that i've found in AnimePlanet.
Includes small list visualizer, but there's an button to export the data so you can make an better one if you want to.

![Features](Screenshots/Features.png?)
![Visualizer](Screenshots/Visualizer.png?)

## Installation

**Permissions:**
- You need to allow the extension to operate in Animeplanet's url so that we can inject content scripts.
- If you want to use the "Extra manga data" script then you need to also allow the extension to operate in mangaupdates api url.

### Firefox
Extension can be found in Mozilla's add-on page: [AnimePlanet Additions](https://addons.mozilla.org/en-US/firefox/addon/animeplanet-additions/)

### Chromium
Extension for chromium can currently only be installed as an temporary addon by downloading the zip file in releases. 
I will be uploading the extension to chrome webstore later on.

### Options page
You can enable/disable features on the options page of the addon. You can access it through clicking the popup

### Acknowledgements
* **Mangaupdates** ([https://api.mangaupdates.com/](https://api.mangaupdates.com/)): Mangaupdates api is used for "Extra manga data" feature to fetch manga data
* **Chart.js** ([https://www.chartjs.org/](https://www.chartjs.org/)): Chart.js is used to make charts lot easier in option page.


## Features

<details>
  <summary><strong>Entry Features</strong><br>- Mainly modifies the invidual entry page<br></summary>

1. **Custom Tags**  
   Allows creating and adding of custom tags to entries.

2. **Custom Entry Title**  
   Allows you to set the title of an entry..

3. **Extra Manga Data**  
   Adds a button to fetch Mangaupdate's data and add it to the manga page.

4. **Notes**  
   Allows you to add notes to any manga/anime.

5. **Still Left**  
   Shows episodes or chapters still left on entry.

6. **Cleaner Alt Titles**  
   Splits alt titles from commas into blocks.

7. **Character Grid**  
   Makes the character tab into a grid.

</details>

<details>
  <summary><strong>Filter Features</strong><br>- Mainly adds something into filtering<br></summary>

1. **Apply Button Shown**  
   Makes the apply button on filters to be always shown.

2. **Quick Apply**  
   New button to filter current mangas/animes in the page without loading next page.

3. **Tags Search**  
   Adds a search bar for tags.

4. **Chapter Filtering**  
   Adds chapter filtering in current page.

5. **Contains Filtering**  
   Filters entries that don't contain any of the tags defined in current page.

6. **Auto Filters**  
   Adds filters automatically.

7. **Show Filtering Options**  
   Shows filter options for screens that are smaller than 768px wide.

</details>

<details>
  <summary><strong>List Features</strong><br>- Mainly adds something into lists<br></summary>

1. **List Entry Remover**  
   Makes it that you can click the list to remove the entry from custom list in "Add to new custom list".

2. **List Multiselect**  
   Allows you to select multiple custom lists that you want to add the entry to.


</details>

<details>
 <summary><strong>Forum Features</strong><br>- Mainly adds something in forums<br></summary>
 
1. **Clickable Usernames**  
   Makes usernames clickable in forum profile.

</details>

<details>
  <summary><strong>Other Features</strong></summary>

1. **Scripts Loaded**  
   Adds an element to menu to show what scripts are loaded in current page. (excludes helper scripts)

2. **Extra Pages**  
   Allows you to load more mangas/animes into one page by loading extra pages.

2. **Sort by Random**  
   Adds a random button on the dropdown menu of sorting.

</details>


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.