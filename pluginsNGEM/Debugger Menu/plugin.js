// debugger.js

document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();

        let popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '20px';
        popup.style.left = '20px';
        popup.style.backgroundColor = '#222';
        popup.style.border = '1px solid #555';
        popup.style.padding = '15px';
        popup.style.zIndex = '10000';
        popup.style.width = '600px';
        popup.style.height = '500px';
        popup.style.overflow = 'auto';
        popup.style.color = '#ddd';

        popup.innerHTML = `
            <h2 style="color: #00bfff; margin-bottom: 10px;">Extension Debugger</h2>
            <p style="font-size: 14px; margin-bottom: 10px;">For fixing errors. Use with care!</p>
            <div id="debug-output" style="background-color: #333; padding: 10px; margin-bottom: 10px; font-family: monospace; font-size: 12px; overflow-wrap: break-word;">Loading...</div>
            <button id="close-debugger" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Close</button>
            <button id="reload-extension" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Reload Extension</button>
            <button id="clear-storage" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Clear Storage</button>
            <button id="reset-extension" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Reset Extension</button>
            <button id="check-permissions" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Check Permissions</button>
            <button id="log-manifest" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Log Manifest</button>
            <button id="log-browser-info" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Log Browser Info</button>
            <button id="simulate-error" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Simulate Error</button>
            <button id="log-all-tabs" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Log All Tabs</button>
            <button id="log-all-windows" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Log All Windows</button>
            <button id="log-runtime-id" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Log Runtime ID</button>
            <button id="log-local-storage" style="background-color: #555; color: #ddd; border: none; padding: 8px 12px; cursor: pointer;">Log Local Storage</button>
        `;

        document.body.appendChild(popup);

        document.getElementById('close-debugger').addEventListener('click', function() {
            popup.remove();
        });

        let debugOutput = document.getElementById('debug-output');
        debugOutput.innerHTML = "Debugger Loaded <br> Current URL: " + window.location.href;

        document.getElementById("reload-extension").addEventListener("click", function(){
            chrome.runtime.reload();
        });

        document.getElementById("clear-storage").addEventListener("click", function(){
            chrome.storage.local.clear(function(){
                debugOutput.innerHTML += "<br><br><b>Chrome Storage Cleared.</b>";
                chrome.storage.local.get(null, function(items){
                    debugOutput.innerHTML += "<br><br><b>Chrome Storage:</b><br>"+ JSON.stringify(items, null, 2);
                });
            });
        });

        window.addEventListener('error', function(event) {
            debugOutput.innerHTML += `<br><br><b>Error:</b> ${event.message}<br><b>File:</b> ${event.filename}<br><b>Line:</b> ${event.lineno}<br><b>Column:</b> ${event.colno}<br><b>Stack:</b> ${event.error ? event.error.stack : 'No stack trace'}`;
        });

        chrome.storage.local.get(null, function(items){
            debugOutput.innerHTML += "<br><br><b>Chrome Storage:</b><br>"+ JSON.stringify(items, null, 2);
        });

        chrome.tabs.getCurrent(function(tab){
            if(tab){
                debugOutput.innerHTML += "<br><br><b>Current Tab ID: </b>" + tab.id;
                chrome.tabs.get(tab.id, function(tabInfo){
                    debugOutput.innerHTML += "<br><br><b>Tab Information: </b>" + JSON.stringify(tabInfo, null, 2);
                });
            }
        });

        debugOutput.innerHTML += "<br><br><b>Extension Version: </b>" + chrome.runtime.getManifest().version;
        debugOutput.innerHTML += "<br><br><b>Current Time: </b>" + new Date().toLocaleTimeString();

        document.getElementById("reset-extension").addEventListener("click", function(){
            chrome.storage.local.clear();
            debugOutput.innerHTML += "<br><br><b>Extension Reset.</b>";
        });

        document.getElementById("check-permissions").addEventListener("click", function(){
            chrome.permissions.getAll(function(permissions){
                debugOutput.innerHTML += "<br><br><b>Permissions:</b><br>" + JSON.stringify(permissions, null, 2);
            });
        });

        document.getElementById("log-manifest").addEventListener("click", function(){
            debugOutput.innerHTML += "<br><br><b>Manifest:</b><br>" + JSON.stringify(chrome.runtime.getManifest(), null, 2);
        });

        document.getElementById("log-browser-info").addEventListener("click", function(){
            debugOutput.innerHTML += "<br><br><b>Browser Information:</b><br>" + navigator.userAgent;
        });

        document.getElementById("simulate-error").addEventListener("click", function(){
            try{
                throw new Error("Simulated Error!");
            } catch (e){
                debugOutput.innerHTML += `<br><br><b>Simulated Error:</b> ${e.message}<br><b>Stack:</b> ${e.stack}`;
            }
        });

        document.getElementById("log-all-tabs").addEventListener("click", function(){
            chrome.tabs.getAllInWindow(chrome.windows.WINDOW_ID_CURRENT, function(tabs){
                debugOutput.innerHTML += "<br><br><b>All Tabs:</b><br>" + JSON.stringify(tabs, null, 2);
            });
        });

        document.getElementById("log-all-windows").addEventListener("click", function(){
            chrome.windows.getAll({populate: true}, function(windows){
                debugOutput.innerHTML += "<br><br><b>All Windows:</b><br>" + JSON.stringify(windows, null, 2);
            });
        });

        document.getElementById("log-runtime-id").addEventListener("click", function(){
            debugOutput.innerHTML += "<br><br><b>Runtime ID:</b><br>" + chrome.runtime.id;
        });

        document.getElementById("log-local-storage").addEventListener("click", function(){
            debugOutput.innerHTML += "<br><br><b>Local Storage:</b><br>" + JSON.stringify(localStorage, null, 2);
        });
    }
});
