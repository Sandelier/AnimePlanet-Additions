

(function() {

    injectedScripts.push("helper-interceptFetch.js");

    // Injecting the fetch interceptor to document.
	var script = document.createElement('script');

	script.textContent = `

        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
            
                if (args[0].startsWith('/api/custom_lists/applicable/') && response.status === 200) {

                    const clonedResponse = response.clone();
                
                    clonedResponse.text().then(body => {

                        // Posting an message so content script can get the body.
                        window.postMessage({
                            action: "userCustomLists",
                            body: body,
                            userId: window.AP_VARS.USER_ID,
                            entryInfo: window.AP_VARS.ENTRY_INFO,
                            token: TOKEN
                        }, "*");
                    
                    }).catch(error => {
                        console.error('Error reading response body:', error);
                    });
                }
            
                return response;
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        };
    `;
    
	document.head.appendChild(script);
})();


const originalFetch = window.fetch;
window.fetch = async (...args) => {
    try {
        const response = await originalFetch(...args);
    
        if (args[0].startsWith('/api/custom_lists/applicable/manga/') && response.status === 200) {
            const clonedResponse = response.clone();
        
            clonedResponse.text().then(body => {
                window.postMessage({
                    action: "userCustomLists",
                    body: body,
                    entryInfo: window.AP_VARS.ENTRY_INFO,
                }, "*");
            
            }).catch(error => {
                console.error('Error reading response body:', error);
            });
        }
    
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};