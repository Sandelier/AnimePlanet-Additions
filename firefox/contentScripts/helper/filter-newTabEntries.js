


(function() {

    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "helper/filter-newTabEntries.js" } }));

    // the tabsui has an set width at start so we have to change it since otherwise it will wrap if we add even one more extra entry..
    document.querySelector(".tabsUl").style.setProperty("width", "auto", "important");


    // There are way too many problems if we want to add an entry ourself if we dont remove the event listeners and define them ourself.
    const filterTabElements = document.querySelectorAll(".tabsUl > li");

    filterTabElements.forEach(li => {
        let filterTabElements = li.querySelectorAll("a");

        filterTabElements.forEach(a => {
            // basically removes the listeners since cloning dosent clone listeners
            const clonedNode = a.cloneNode(true);
            a.parentNode.replaceChild(clonedNode, a);
        });

        filterTabElements = li.querySelectorAll("a");

        filterTabElements.forEach(a => {
            addClickListenerToTabEntries(a);
        });
    });

    function addClickListenerToTabEntries(a) {
        a.addEventListener("click", function(event) {
        
            // #advancedFilter is in user list and .AdvancedFilter is in all list.
            const filterSelector = document.querySelector('#advancedFilter') ? '#advancedFilter' : '.AdvancedFilter';
        
            event.preventDefault();
        
            const allParentElements = document.querySelectorAll(".tabsUl > li > a");
            allParentElements.forEach(parent => {
                parent.parentElement.classList.remove("ui-tabs-active", "ui-state-active");
            });
        
            this.parentElement.classList.add("ui-tabs-active", "ui-state-active");
        
        
            const tabPanelElements = document.querySelectorAll(`${filterSelector} [role='tabpanel']`);
            tabPanelElements.forEach(panel => {
                panel.style.display = "none";
            });
            
            const clickedId = this.id;
            
            let correspondingPanel = document.querySelector(`${filterSelector} .ui-tabs-panel[aria-labelledby='${clickedId}']`);
        
            if (correspondingPanel) {
                correspondingPanel.style.display = "block";
            } 
        });
    }
    
    function addEntryToFilterTab(filterTab, filterTabPanel) {
        const tabsUl = document.querySelector('.tabsUl');
        const advancedFilter = document.querySelector('#advancedFilter');
    
        if (tabsUl && advancedFilter) {
            const tempTab = document.createElement('div');
            tempTab.innerHTML = filterTab;
            const newFilterTab = tempTab.firstElementChild;
        
            addClickListenerToTabEntries(newFilterTab.querySelector('a'));
        
            const tempPanel = document.createElement('div');
            tempPanel.innerHTML = filterTabPanel;
            const newFilterTabPanel = tempPanel.firstElementChild;
        
            tabsUl.appendChild(newFilterTab);
            advancedFilter.appendChild(newFilterTabPanel);
        
            return {newFilterTab, advancedFilter};
        } else {
            console.error('No element found with the selector: .tabsUl or #advancedFilter');
        }
    }
    
    
    function addEntryToPillBottle(datatype, text) {
    
        const pillBottleEle = document.querySelector('.pillBottle');
    
        const newEntry = document.createElement('a');
        
        newEntry.className = `pill ${datatype}`;
        newEntry.setAttribute('data-type', datatype);
        newEntry.textContent = text;
        
        pillBottleEle.insertBefore(newEntry, pillBottleEle.firstChild);
    
    
        // showing the filters if they are still hidden.
    
        if (pillBottleEle.parentElement.style.display = "none") {
            pillBottleEle.parentElement.style.display = "flex";
        }
    
        return newEntry;
    }


    document.addEventListener("addEntryToFilterTab", (event) => {
        const { filterTab, filterTabPanel } = event.detail;
        const result = addEntryToFilterTab(filterTab, filterTabPanel);
        document.dispatchEvent(new CustomEvent("responseAddEntryToFilterTab", {
            detail: result
        }));
    });
    
    document.addEventListener("addEntryToPillBottle", (event) => {
        const { datatype, text } = event.detail;
        const result = addEntryToPillBottle(datatype, text);
        document.dispatchEvent(new CustomEvent("responseAddEntryToPillBottle", {
            detail: result
        }));
    });
    

})();