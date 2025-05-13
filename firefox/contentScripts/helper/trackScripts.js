


(function() {

    if (!document.getElementById("apfeatures-injectedScripts")) {

        const apfeaturesEle = document.createElement('div');
        apfeaturesEle.id = 'apfeatures-injectedScripts';
        apfeaturesEle.style.display = 'none';
        apfeaturesEle.dataset.currentScripts = JSON.stringify([]);
        document.body.appendChild(apfeaturesEle);



        document.addEventListener("injectedScript", (event) => {
            const { name } = event.detail;
            if (!name) return;
        
            const currentScripts = JSON.parse(apfeaturesEle.dataset.currentScripts || "[]");
    
            if (!currentScripts.includes(name)) {
                currentScripts.push(name);
                apfeaturesEle.dataset.currentScripts = JSON.stringify(currentScripts);
            }

            document.dispatchEvent(new CustomEvent("newScriptInjected", { detail: { name: name } }));
        });
    }
    
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "helper/trackScripts.js" } }));
})();