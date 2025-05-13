
// https://www.anime-planet.com/forum/threads/add-grid-view-option-to-characters-tab.354442/ 

(function() {
    document.dispatchEvent(new CustomEvent("injectedScript", { detail: { name: "entry/characterGrid.js" } }));


    var style = document.createElement('style');
    style.textContent = `


    div.pure-1.sm-1-3.md-1-5 {
        display: none;
    }

    div.pure-1.md-4-5 {
        width: 100%;
        padding: 0;
    }

    .pure-table {
        margin-bottom: 2em;
    }

    .pure-table > tbody > tr {
        display: flex;
        flex-direction: column;
    }

    .pure-table > tbody > tr > td {
        background-color: #242424 !important;
    }

    .tableAvatar {
      width: 100%;
      min-width: 10vw;
      text-align: center;
    }

    .tableCharLove {
        display: none;
    }

    .tableActors {
        width: 100%;
        border-top: none !important;
    }


    /* Avatar footer (name + btns) */

    a.name {
        font-family: var(--ap-font-primary);
        color: white;
        font-weight: bold;
    }

    .infoContainer {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        position: relative;
        padding: 2px 0px 2px 0px;
    }

    .heartSwitch {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
    }

    .leftSwitch {
        left: 0
    }

    .rightSwitch {
        right: 0
    }


    /* Character layouts */

    .pure-table > tbody {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
    }
    
    .pure-table > tbody > tr {
        margin: calc(5 * 0.2857%);
    }
    
    @media (max-width: 1000px) {
        .pure-table > tbody > tr {
            grid-template-columns: repeat(4, 1fr);
            margin: calc(4 * 0.2857%);
        }
    }

    @media (max-width: 800px) {
        .pure-table > tbody > tr {
            grid-template-columns: repeat(3, 1fr);
            margin: calc(3 * 0.2857%);
        }
    }

    @media (max-width: 600px) {
        .pure-table > tbody > tr {
            grid-template-columns: repeat(2, 1fr);
            margin: calc(2 * 0.2857%);
        }
    }

    .toggleTags {
        width: 100%;
        margin: 5px 0px;
        padding: 0.1em;
    }
    
    `;

	document.head.appendChild(style);
    const avatars = document.querySelectorAll("tr > td.tableAvatar");

    avatars.forEach(avatar => {

        const container = document.createElement('div');
        container.classList.add('infoContainer');

        const charInfo = avatar.parentElement.querySelector('td.tableCharInfo');
        const characterName = charInfo.querySelector('a.name');


        /* like / dislike btns */
        const charLove = avatar.parentElement.querySelector('td.tableCharLove');

        const likeSpan = document.createElement('span');
        likeSpan.classList.add('heartSwitch', 'leftSwitch');
        likeSpan.appendChild(charLove.querySelector('span.heartSwitch > a.heartOn'));
        
        const dislikeSpan = document.createElement('span');
        dislikeSpan.classList.add('heartSwitch', 'rightSwitch');
        dislikeSpan.appendChild(charLove.querySelector('span.heartSwitch > a.heartOff'));


        container.appendChild(likeSpan);
        container.appendChild(characterName);
        container.appendChild(dislikeSpan);

        avatar.appendChild(container);

        if (avatar.parentElement.querySelector('td.tableActors div')) {
            avatar.style.borderBottom = "none";
        } else {
            if (avatar.parentElement.querySelector('td.tableActors')) {
                avatar.parentElement.querySelector('td.tableActors').style.display = "none";
            }
        }


        const tagsDiv = charInfo.querySelector('.tags');
        if (tagsDiv) {
            const tagsList = tagsDiv.querySelector('ul');
            const tagsTitle = tagsDiv.querySelector('h4');
            
            if (tagsList && tagsTitle) {
                tagsList.style.display = 'none';
                tagsList.style.height = '0';
                tagsList.style.opacity = '0';
                tagsList.style.transition = 'height 0.3s ease, opacity 0.3s ease';
                
                const toggleButton = document.createElement('button');
                toggleButton.textContent = tagsTitle.textContent;
                toggleButton.classList.add('toggleTags');
                
                toggleButton.addEventListener('click', () => {
                    const isClosed = tagsList.style.display === 'none' || tagsList.style.height === '0px';
                    if (isClosed) {
                        tagsList.style.display = 'block';
                        setTimeout(() => {
                            tagsList.style.height = tagsList.scrollHeight + 'px';
                            tagsList.style.opacity = '1';
                        }, 10);
                    } else {
                        tagsList.style.height = '0';
                        tagsList.style.opacity = '0';
                        setTimeout(() => {
                            tagsList.style.display = 'none';
                        }, 300);
                    }
                });
                
                tagsDiv.replaceChild(toggleButton, tagsTitle);
        
                if (avatar.parentElement.querySelector('td.tableActors')) {
                    tagsDiv.parentElement.style.borderBottom = "none";
                }
            } else {
                tagsDiv.style.display = "none";
            }
        } else {
            charInfo.style.display = "none";
        }
    });
})();