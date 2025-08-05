
// Mangaupdates api calls. Used for "getMangaupdatesData.js"
// The background script can call the api without worrying about cors unlike if you were to do it in content script.



// After an long debugging session it seems you can't have an origin in your headers when you send an api request to mangaupdates or you will get 403 error.
// This removes the origin from headers.

if (chrome.declarativeNetRequest !== undefined) {
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            { "header": "Origin", "operation": "remove" }
          ]
        },
        condition: {
          urlFilter: "api.mangaupdates.com",
          resourceTypes: ["xmlhttprequest", "main_frame", "sub_frame"]
        }
      }
    ],
    removeRuleIds: [1]
  });
} else {
  browser.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
      const headers = details.requestHeaders.filter(header => header.name !== 'Origin');
      return { requestHeaders: headers };
    },
    { urls: ["https://api.mangaupdates.com/*"] },
    ["blocking", "requestHeaders"]
  );
}


// Search manga using id.
// We need to fetch again using the id we get from fetchmangabyname because the received data dosent contain like associations.
async function fetchMangaById(id) {
    const url = `https://api.mangaupdates.com/v1/series/${id}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
    }
  }

// Search manga using name.

async function fetchMangaByName(name, year, type) {
  const url = "https://api.mangaupdates.com/v1/series/search";
  const payload = {
    "search": name,
    "per_page": 2,
  };

  if (year !== undefined) {
    payload.year = year;
  }

  if (type !== undefined) {
    payload.type = type;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    

    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
  }
}




let lastCallTime = 0;

export async function getMangaInfo(mangaData) {

  const mangaName = mangaData.name;
  const mangaYear = mangaData.year;
  const mangaType = mangaData.type;

  const now = Date.now();
  
  // just an simple rate limit of 10s.
  if (now - lastCallTime < 10000) { 
    return JSON.stringify({ status: "rateLimit" });
  }
  
  lastCallTime = now;

  try {
    const searchData = await fetchMangaByName(mangaName, mangaYear, mangaType);

    if (!searchData) {
      console.log("Failed to fetch manga by name. Exiting...");
      return JSON.stringify({ status: "error" });
    }

    const firstMangaId = searchData.results[0]?.record.series_id;

    if (!firstMangaId) {
      console.log("No manga found with the given name.");
      return JSON.stringify({ status: "error" });
    }

    const mangaByIdData = await fetchMangaById(firstMangaId);

    console.log(mangaByIdData);

    return JSON.stringify({ status: "ok", data: mangaByIdData });

  } catch (error) {
    console.error('An error occurred:', error);
    return JSON.stringify({ status: "error" });
  }
}