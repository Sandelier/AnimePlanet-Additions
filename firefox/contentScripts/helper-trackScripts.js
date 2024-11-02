


if (!document.getElementById("apfeatures-trackScripts")) {

    const apfeaturesEle = document.createElement('div');
    apfeaturesEle.id = 'apfeatures-injectedScripts';
    apfeaturesEle.style.display = 'none';
    apfeaturesEle.dataset.currentScripts = JSON.stringify([]);
    document.body.appendChild(apfeaturesEle);


    const script = document.createElement("script");
    script.id = "apfeatures-trackScripts";
    
    script.textContent = `
        window.addEventListener("message", (event) => {
            if (event.source !== window) return;
            
            const { action, name } = event.data;
            if (action === "injectedScript" && name) {
                
                const apfeaturesEle = document.getElementById("apfeatures-injectedScripts");
                if (apfeaturesEle) {
                    const currentScripts = JSON.parse(apfeaturesEle.dataset.currentScripts || "[]");

                    if (!currentScripts.includes(name)) {
                        currentScripts.push(name);
                        apfeaturesEle.dataset.currentScripts = JSON.stringify(currentScripts)
                    }
                }
            }
        });
    `;

    document.head.appendChild(script);
}

window.postMessage({ action: "injectedScript", name: "helper-trackScripts.js" });