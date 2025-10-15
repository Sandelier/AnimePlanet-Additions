

(function() {

    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "filter/chapter.js" } }));

    
    document.addEventListener("responseAddEntryToFilterTab", (event) => {
        const { newFilterTab, advancedFilter } = event.detail;

        const filterChaptersInput = advancedFilter.querySelector('#from-chapters');
        const toChaptersInput = advancedFilter.querySelector('#to-chapters');

        function handleInputChange(event, datatype, prefix) {
            const value = event.target.value;
            
            if (/\d/.test(value) || value === undefined) {
                const pillBottleEle = document.querySelector('.pillBottle');

                const existingPill = pillBottleEle.querySelector(`.pill[data-type="${datatype}"]`);
                const text = `${prefix} ${value}`;

                if (value === "" || value <= 0) {
                    if (existingPill) {
                        existingPill.remove();
                    }

                    event.target.value = "";
                    return;
                }

                
                if (existingPill) {
                    existingPill.textContent = text;
                } else {
                    document.dispatchEvent(new CustomEvent("addEntryToPillBottle", {
                        detail: {
                            datatype,
                            text
                        }
                    }));
                    
                }
            }
        }
    
        // Animeplanet already handles "input" event so we only need to handle change
        filterChaptersInput.addEventListener('change', (event) => {
            handleInputChange(event, 'from-chapters', 'Chapters ≥');
        });

        toChaptersInput.addEventListener('change', (event) => {
            handleInputChange(event, 'to-chapters', 'Chapters ≤');
        });
    });



    const filterTab = `
    <li id="tab-chapters" role="tab" tabindex="-1" class="ui-tabs-tab ui-corner-top ui-state-default ui-tab" aria-controls="chapters" aria-labelledby="ui-id-25" aria-selected="false" aria-expanded="false">
      <a href="#chapters" tabindex="-1" class="ui-tabs-anchor" id="ui-id-25">Chapters</a>
    </li>
    `;
    
    const filterTabPanel = `
    <div class="tab af-inputRange ui-tabs-panel ui-corner-bottom ui-widget-content" id="chapters" aria-labelledby="ui-id-25" role="tabpanel" style="display: none;" aria-hidden="false">
      <input name="from-chapters" type="number" id="from-chapters" value="" data-name="Chapters ≥ " min="0" value="1" max="99999"> 
      	to 
      <input name="to-chapters" type="number" id="to-chapters" value="" data-name="Chapters ≤ " min="0" value="1" max="99999">
    </div>
    `;

    document.dispatchEvent(new CustomEvent("addEntryToFilterTab", {
        detail: {
            filterTab,
            filterTabPanel
        }
    }));

})();