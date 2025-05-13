



(function() {

    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "helper/PC-Mode.js" } }));

    // If the browser was shutdown then we lose the webrequest modifier so we have to activate it again and reload the page.
    // Now i am sure there is an better way to do this but i just couldnt think of any in the moment
    if (document.body.classList.contains("mobile") && document.body.classList.contains("ie")) {

        document.dispatchEvent(new CustomEvent("sendToLocal", { 
            detail: { action: "PCMode", type: "", value: "true" } 
        }));
        
        location.reload();
        return;
    }

    // This script modifies the pc page to look the same as the mobile version.

    const styleElement = document.createElement('style');
    styleElement.textContent = `
    .ui-tooltip {
        display: none !important;
    }
    `;
    document.head.appendChild(styleElement);

    document.body.classList.remove("desktop");
    document.body.classList.add("mobile", "ie");


    // https://stackoverflow.com/a/67937949
    // Hides the title element while hovering.
    var anchors = document.querySelectorAll('a[title]');
    for (let i = anchors.length - 1; i >= 0; i--) {
    anchors[i].addEventListener('mouseenter', function(e){
        anchors[i].setAttribute('data-title', anchors[i].title);
        anchors[i].removeAttribute('title');
        
    });
    anchors[i].addEventListener('mouseleave', function(e){
        anchors[i].title = anchors[i].getAttribute('data-title');
        anchors[i].removeAttribute('data-title');
    });
}

})();

