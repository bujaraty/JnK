// ==UserScript==
// @name         JnK_Autobot
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       JnK
// @match        https://github.com/bujaraty/JnK
// @grant        none
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

$(document).ready(function() {  $('.athing:odd').css('background-color', '#EEE');});

(function() {
    'use strict';

    alert('Hello World !');
})();


