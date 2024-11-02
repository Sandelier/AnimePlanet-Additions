


(function() {

    window.postMessage({ action: "injectedScript", name: "filter-chapter.js" });

    const filterTab = `
    <li id="tab-chapters" role="tab" tabindex="-1" class="ui-tabs-tab ui-corner-top ui-state-default ui-tab" aria-controls="chapters" aria-labelledby="ui-id-11" aria-selected="false" aria-expanded="false">
      <a href="#chapters" tabindex="-1" class="ui-tabs-anchor" id="ui-id-11">Chapters</a>
    </li>
    `;
    
    const filterTabPanel = `
    <div class="tab af-inputRange ui-tabs-panel ui-corner-bottom ui-widget-content" id="chapters" aria-labelledby="ui-id-11" role="tabpanel" style="display: none;" aria-hidden="false">
      <input name="chapters" type="number" id="filter-chapters" value="" data-name="Chapters ≥ " min="1" max="99999"> 
      	to 
      <input name="to_chapters" type="number" id="to-chapters" value="" data-name="Chapters ≤ " min="1" max="99999">
    </div>
    `;
    
    function main() {
    	const {newFilterTab, advancedFilter} = addEntryToFilterTab(filterTab, filterTabPanel);
    
    	const filterChaptersInput = advancedFilter.querySelector('#filter-chapters');
        const toChaptersInput = advancedFilter.querySelector('#to-chapters');

        function handleInputChange(event, datatype, prefix) {
            const value = event.target.value;
            if (/\d/.test(value)) {
                const pillBottleEle = document.querySelector('.pillBottle');
                const existingPill = pillBottleEle.querySelector(`.pill[data-type="${datatype}"]`);
                const text = `${prefix} ${value}`;
                
                if (existingPill) {
                    existingPill.textContent = text;
                } else {
                    addEntryToPillBottle(datatype, text);
                }
            }
        }
    
        filterChaptersInput.addEventListener('change', (event) => {
            handleInputChange(event, 'chapters-filters-from', 'Chapters ≥');
        });
    
        toChaptersInput.addEventListener('change', (event) => {
            handleInputChange(event, 'chapters-filters-to', 'Chapters ≤');
        });
    }

    main();

})();