// ==UserScript==
// @name         JnK_Autobot
// @namespace    https://github.com/bujaraty/JnK
// @version      0.1
// @description  try to take over the world!
// @author       JnK
// @include      http://mousehuntgame.com/*
// @include      https://mousehuntgame.com/*
// @include      http://www.mousehuntgame.com/*
// @include      https://www.mousehuntgame.com/*
// @include      http://www.mousehuntgame.com/camp.php*
// @include      https://www.mousehuntgame.com/camp.php*
// @grant        none
// @run-at       document-end
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

// // Embed a timer in page to show next hunter horn timer, highly recommended to turn on. (true/false)
// // Note: You may not access some option like pause at invalid location if you turn this off.
var showTimerInPage = true;

execScript();

function execScript() {
    'use strict';
    alert('Hello World !');
    embedTimer(True);
}

function embedTimer(targetPage) {
    try {
        if (showTimerInPage) {
            headerElement = document.getElementById('overlayContainer');
            if (headerElement) {
                var timerDivElement = document.createElement('div');

                // show bot title and version
                var titleElement = document.createElement('div');
                titleElement.setAttribute('id', 'titleElement');
                titleElement.innerHTML = "<b><a href=\"https://github.com/bujaraty/JnK/blob/main/JnK_Autobot.user.js" target=\"_blank\">MouseHunt AutoBot UPDATED </b>";

                timerDivElement.appendChild(titleElement);
                titleElement = null;
            }
        }

    } catch (e) {
        if (debug) {
            for (var prop in e) {
                console.log("embedTimer error stack: " + prop + " value: [" + e[prop] + "]\n");
            }
        }

        if (debug) console.log('embedTimer error - ' + e);
        if (debug) console.log(e);
    }
}
