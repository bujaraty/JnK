// ==UserScript==
// @name         JnK_Autobot
// @namespace    https://github.com/bujaraty/JnK
// @version      0.0.1
// @description  Customized version of MH autobot
// @author       JnK
// @require      https://code.jquery.com/jquery-2.2.2.min.js
// @include      http://mousehuntgame.com/*
// @include      https://mousehuntgame.com/*
// @include      http://www.mousehuntgame.com/*
// @include      https://www.mousehuntgame.com/*
// @include      http://www.mousehuntgame.com/camp.php*
// @include      https://www.mousehuntgame.com/camp.php*
// @grant        unsafeWindow
// @grant        GM_info
// @run-at       document-end
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==
// == Basic User Preference Setting (Begin) ==
// // The variable in this section contain basic option will normally edit by most user to suit their own preference
// // Reload MouseHunt page manually if edit this script while running it for immediate effect.

// // ERROR CHECKING ONLY: Script debug
var DEBUG_MODE = true;
var ID_HEADER_ELEMENT = 'envHeaderImg';
var HORNREADY_TXT = 'hornReady';
var CLASS_HORNBUTTON_ELEMENT = 'hornbutton';
var CLASS_HUNTERHORN_ELEMENT = 'mousehuntHud-huntersHorn-container';

// // Extra delay time before sounding the horn. (in seconds)
// // Default: 10 - 360
var g_hornTimeDelayMin = 5;
var g_hornTimeDelayMax = 15;

// // Enable trap check once an hour. (true/false)
var g_enableTrapCheck = true;

// // Extra delay time to trap check. (in seconds)
// // Note: It only take effect if enableTrapCheck = true;
var g_trapCheckTimeDelayMin = 7;
var g_trapCheckTimeDelayMax = 15;

// // Auto solve KR
var g_isAutoSolve = true;

// // Extra delay time before solving KR. (in seconds)
// // Default: 10 - 30
var g_krDelayMin = 10;
var g_krDelayMax = 30;

// == Basic User Preference Setting (End) ==

// == Advance User Preference Setting (Begin) ==
// // The variable in this section contain some advance option that will change the script behavior.
// // Edit this variable only if you know what you are doing
// // Reload MouseHunt page manually if edit this script while running it for immediate effect.

// // Time interval for script timer to update the time. May affect timer accuracy if set too high value. (in seconds)
var g_timerRefreshInterval = 2;

// == Advance User Preference Setting (End) ==


// WARNING - Do not modify the code below unless you know how to read and write the script.

// All global variable declaration and default value
var HTTP_STR = 'https';
var g_nextBotHornTimeInSeconds;
var g_botHornTimeDelayInSeconds;
var g_nextTrapCheckTimeInSeconds = 0;
var g_nextTrapCheckTimeDelayInSeconds = 0;
var g_strScriptVersion = GM_info.script.version;
var g_nextHornTimeElement;
var g_trapCheckTimeElement;
var g_nextBotHornTime;
var g_lastDateRecorded = new Date();

// I have to re-define the default value of the following variables somewhere else
var g_isKingReward = false;
var g_baitCount = 100;

// Start executing script
if (DEBUG_MODE) console.log('STARTING SCRIPT - ver: ' + g_strScriptVersion);
if (window.top != window.self) {
    if (DEBUG_MODE) console.log('In IFRAME - may cause firefox to error, location: ' + window.location.href);
    //return;
} else {
    if (DEBUG_MODE) console.log('NOT IN IFRAME - will not work in fb MH');
}

execScript();

function execScript() {
    if (DEBUG_MODE) console.log('RUN %cexeScript()', 'color: #9cffbd');

    try {
        loadPreferenceSettingFromStorage();
        retrieveCampActiveData();
        //        // check the trap check setting first
        //        trapCheckTimeDiff = GetTrapCheckTime();
        //
        //        // check the trap check setting first
        //        if (trapCheckTimeDiff == 60) {
        //            trapCheckTimeDiff = 0;
        //        } else if (trapCheckTimeDiff < 0 || trapCheckTimeDiff > 60) {
        //            // invalid value, just disable the trap check
        //            enableTrapCheck = false;
        //        }
        embedUIStructure();
        operateBot();
    } catch (e) {
        if (DEBUG_MODE) console.log('exeScript error - ' + e)
    }
}

function operateBot() {
    try {
        if (g_isKingReward) {
        } else if (g_baitCount == 0) {
        } else {
            window.setTimeout(function () {
                (countdownTimer)()
            }, g_timerRefreshInterval * 1000);
        }
    } catch (e) {
        console.log("operateBot() ERROR - " + e);
    }
}

function countdownTimer() {
    function timeElapsedInSeconds(dateA, dateB) {
        var elapsed = 0;

        var secondA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate(), dateA.getHours(), dateA.getMinutes(), dateA.getSeconds());
        var secondB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate(), dateB.getHours(), dateB.getMinutes(), dateB.getSeconds());
        elapsed = (secondB - secondA) / 1000;

        secondA = null;
        secondB = null;
        dateA = null;
        dateB = null;

        try {
            return (elapsed);
        } finally {
            elapsed = null;
        }
    }

    // Update timer
    var dateNow = new Date();
    var intervalTime = timeElapsedInSeconds(g_lastDateRecorded, dateNow);
    g_lastDateRecorded = undefined;
    g_lastDateRecorded = dateNow;
    dateNow = undefined;

    g_nextBotHornTimeInSeconds -= intervalTime;
    g_nextTrapCheckTimeInSeconds -= intervalTime;
    intervalTime = undefined;

    if (g_nextBotHornTimeInSeconds <= 0) {
        soundHorn();
    } else if (g_nextTrapCheckTimeInSeconds <= 0) {
        trapCheck();
    } else {

        updateUI("Horn: " + timeFormat(g_nextBotHornTimeInSeconds),
                 timeFormat(g_nextBotHornTimeInSeconds) + "  <i>(including " + timeFormat(g_botHornTimeDelayInSeconds) + " + 5 sec delay)</i>",
                 timeFormat(g_nextTrapCheckTimeInSeconds) + "  <i>(including " + timeFormat(g_nextTrapCheckTimeDelayInSeconds) + " delay)</i>");

        // Check if user manaually sounded the horn
        //codeForCheckingIfUserManuallySoundedTheHorn();
        window.setTimeout(function () {
            (countdownTimer)()
        }, g_timerRefreshInterval * 1000);
    }
}

function timeFormat(time) {
    var timeString;
    var hr = Math.floor(time / 3600);
    var min = Math.floor((time % 3600) / 60);
    var sec = (time % 3600 % 60) % 60;

    if (hr > 0) {
        timeString = hr.toString() + " hr " + min.toString() + " min " + sec.toString() + " sec";
    } else if (min > 0) {
        timeString = min.toString() + " min " + sec.toString() + " sec";
    } else {
        timeString = sec.toString() + " sec";
    }

    time = null;
    hr = null;
    min = null;
    sec = null;

    try {
        return (timeString);
    } finally {
        timeString = null;
    }
}

function trapCheck() {
    // Let user known that the script is going to check the trap
    updateUI("Checking The Trap...", "Checking trap now...", "Checking trap now...");

    // reload the page
    setTimeout(function () {
        reloadCampPage()
    }, 1000);
}

function reloadCampPage() {
    window.location.href = HTTP_STR + "://www.mousehuntgame.com/";
}

function soundHorn() {
    var hornElement;
    if (DEBUG_MODE) console.log("RUN %csoundHorn()", "color: #FF7700");

    updateUI("Ready to Blow The Horn...", "Ready to Blow The Horn...", "Ready to Blow The Horn...");

    // safety mode, check the horn image is there or not before sound the horn
    var headerElement = document.getElementById(ID_HEADER_ELEMENT);

    if (headerElement) {
        alert("inside header");
        //        headerElement = headerElement.firstChild;
        var headerClass = headerElement.getAttribute('class');
        if (headerClass.indexOf(HORNREADY_TXT) !== -1) {
            alert("found the horn");
            // found the horn
            // simulate mouse click on the horn
            hornElement = document.getElementsByClassName(CLASS_HUNTERHORN_ELEMENT)[0].firstChild;
            fireEvent(hornElement, 'click');
            hornElement = null;

            // clean up
            headerElement = null;
            headerClass = null;

            // double check if the horn was already sounded
            window.setTimeout(function () {
                afterSoundingHorn()
            }, 5000);
        } else if (headerClass.indexOf("hornsounding") != -1 || headerClass.indexOf("hornsounded") != -1) {
            // some one just sound the horn...

            // update timer
            updateUI("Synchronizing Data...", "Someone had just sound the horn. Synchronizing data...", "Someone had just sound the horn. Synchronizing data...");

            // clean up
            headerElement = null;
            headerClass = null;
            /*
            // load the new data
            window.setTimeout(function () {
                afterSoundingHorn()
            }, 5000);
*/
        } else if (headerClass.indexOf("hornwaiting") != -1) {
            // the horn is not appearing, let check the time again

            // update timer
            updateUI("Synchronizing Data...", "Hunter horn is not ready yet. Synchronizing data...", "Hunter horn is not ready yet. Synchronizing data...");
            /*
            // sync the time again, maybe user already click the horn
            retrieveData();

            checkJournalDate();
*/
            // clean up
            headerElement = null;
            headerClass = null;
            /*
            // loop again
            window.setTimeout(function () {
                countdownTimer()
            }, timerRefreshInterval * 1000);
*/
        } else {
            // some one steal the horn!
            alert("horn not found");

            // update timer
            updateUI("Synchronizing Data...", "Hunter horn is missing. Synchronizing data...", "Hunter horn is missing. Synchronizing data...");
            /*
            // try to click on the horn
            hornElement = document.getElementsByClassName(hornButton)[0].firstChild;
            fireEvent(hornElement, 'click');
            hornElement = null;

            // clean up
            headerElement = null;
            headerStatus = null;

            // double check if the horn was already sounded
            window.setTimeout(function () {
                afterSoundingHorn()
            }, 5000);
*/
        }
    } else {
        // something wrong, can't even found the header...

        // clean up
        headerElement = null;

        // reload the page see if thing get fixed
        reloadCampPage();
    }
}

function fireEvent(element, event) {
    if (DEBUG_MODE) {
        console.log("RUN %cfireEvent() ON:", "color: #bada55");
        console.log(event);
        console.log(element);
    }

    var evt;
    // dispatch for firefox + others
    evt = document.createEvent("HTMLEvents");
    evt.initEvent(event, true, true); // event type,bubbling,cancelable

    try {
        return !element.dispatchEvent(evt);
    } finally {
        element = null;
        event = null;
        evt = null;
    }
}

function afterSoundingHorn() {
    if (DEBUG_MODE) console.log("RUN %cafterSoundingHorn()", "color: #bada55");
    // update timer
    updateUI("Horn sounded. Synchronizing Data...", "Horn sounded. Synchronizing data...", "Horn sounded. Synchronizing data...");

    // reload data
    retrieveCampActiveData();

    // script continue as normal
    window.setTimeout(function () {
        countdownTimer()
    }, g_timerRefreshInterval * 1000);
}


function updateUI(documentTitle, nextHornTimeTxt, trapCheckTimeTxt) {
    document.title = documentTitle;
    g_nextHornTimeElement.innerHTML = "<b>Next Hunter Horn Time:</b> " + nextHornTimeTxt;
    g_trapCheckTimeElement.innerHTML = "<b>Next Trap Check Time:</b> " + trapCheckTimeTxt;

    documentTitle = null;
    nextHornTimeTxt = null;
    trapCheckTimeTxt = null;
}

function loadPreferenceSettingFromStorage() {
    g_hornTimeDelayMin = getStorageVarInt("HornTimeDelayMin", g_hornTimeDelayMin);
    g_hornTimeDelayMax = getStorageVarInt("HornTimeDelayMax", g_hornTimeDelayMax);

    g_enableTrapCheck = getStorageVarBool("TrapCheck", g_enableTrapCheck);
    g_trapCheckTimeDelayMin = getStorageVarInt("TrapCheckTimeDelayMin", g_trapCheckTimeDelayMin);
    g_trapCheckTimeDelayMax = getStorageVarInt("TrapCheckTimeDelayMax", g_trapCheckTimeDelayMax);

    g_isAutoSolve = getStorageVarBool("AutoSolveKR", g_isAutoSolve);
    g_krDelayMin = getStorageVarInt("AutoSolveKRDelayMin", g_krDelayMin);
    g_krDelayMax = getStorageVarInt("AutoSolveKRDelayMax", g_krDelayMax);
}

function getStorage(name) {
    // Check if the web browser support HTML5 storage
    if ('localStorage' in window && !isNullOrUndefined(window.localStorage)) {
        return (window.localStorage.getItem(name));
    }
    name = undefined;
}

function getStorageVarBool(storageName, defaultBool) {
    var temp = getStorage(storageName);
    if (isNullOrUndefined(temp)) {
        setStorage(storageName, defaultBool.toString());
        return defaultBool;
    } else if (temp === true || temp.toLowerCase() == "true") {
        return true;
    } else {
        return false;
    }
}

function getStorageVarInt(storageName, defaultInt) {
    var temp = getStorage(storageName);
    var tempInt = defaultInt;
    if (temp == undefined || temp == null) {
        setStorage(storageName, defaultInt);
    } else {
        tempInt = parseInt(temp);
        if (Number.isNaN(tempInt)) {
            tempInt = defaultInt;
        }
    }
    return tempInt;
}

function setStorage(name, value) {
    // Check if the web browser support HTML5 storage
    if ('localStorage' in window && !isNullOrUndefined(window.localStorage)) {
        window.localStorage.setItem(name, value);
    }

    name = undefined;
    value = undefined;
}

function isNullOrUndefined(obj) {
    return (obj === null || obj === undefined || obj === 'null' || obj === 'undefined');
}

function retrieveCampActiveData() {
    // This function is to retrieve data from camp page that is actively changed, including
    // - next horn time
    // - king reward
    // - bait quantity
    if (DEBUG_MODE) console.log('RUN retrieveCampActiveData()');

    // Get MH horn time and use it to calculate next bot horn time
    var nextMHHornTimeInSeconds = parseInt(getPageVariable("user.next_activeturn_seconds"));
    g_botHornTimeDelayInSeconds = g_hornTimeDelayMin + Math.round(Math.random() * (g_hornTimeDelayMax - g_hornTimeDelayMin));
    g_nextBotHornTimeInSeconds = nextMHHornTimeInSeconds + g_botHornTimeDelayInSeconds + 5;
    if (g_nextBotHornTimeInSeconds <= 0){
        alert("g_nextActiveTime <= 0");
        // K_Todo_014
        //eventLocationCheck();
    }
    var trapCheckTimeOffsetInSeconds = getTrapCheckTime() * 60;
    var now = new Date();
    g_nextTrapCheckTimeInSeconds = trapCheckTimeOffsetInSeconds - (now.getMinutes() * 60 + now.getSeconds());
    g_nextTrapCheckTimeDelayInSeconds = g_trapCheckTimeDelayMin + Math.round(Math.random() * (g_trapCheckTimeDelayMax - g_trapCheckTimeDelayMin));
    g_nextTrapCheckTimeInSeconds = (g_nextTrapCheckTimeInSeconds <= 0) ? 3600 + g_nextTrapCheckTimeInSeconds : g_nextTrapCheckTimeInSeconds;
    g_nextTrapCheckTimeInSeconds += g_nextTrapCheckTimeDelayInSeconds;

    now = undefined;
}

function getTrapCheckTime() {
    // I have to refactor the in this part as sometime, the TrapCheck time is incorrect
    // Check storage first
    var trapCheckTimeOffset = getStorageVarInt('TrapCheckTimeOffset', -1);
    if (trapCheckTimeOffset != -1) {
        return trapCheckTimeOffset;
    }
    return getTrapCheckTimeFromPage();
}

function getTrapCheckTimeFromPage() {
    try {
        var passiveElement = document.getElementsByClassName('passive');
        if (passiveElement.length > 0) {
            var time = passiveElement[0].textContent;
            time = time.substr(time.indexOf('m -') - 4, 2);
            var trapCheckTimeOffset = parseInt(time);
            setStorage("trapCheckTimeOffset", time);
            return trapCheckTimeOffset;
        } else {
            throw new Error('passiveElement not found');
        }
    } catch (e) {
        console.perror('GetTrapCheckTime', e.message);
        return null;
    }
}

function embedUIStructure() {
    // This function is to embed UI structure at the top of related pages
    // The UI consist of 3 parts
    // 1. timer
    // 2. timer preferences
    // 3. bot preferences in the circumstances that require a lot of attention

    function embedTimer() {
        var timerDivElement = document.createElement('div');

        // show bot title and version
        var titleElement = document.createElement('div');
        titleElement.setAttribute('id', 'titleElement');
        titleElement.innerHTML = "<b><a href=\"https://github.com/bujaraty/JnK/blob/main/JnK_Autobot.user.js\" target=\"_blank\">J n K AutoBot UPDATED (version " + g_strScriptVersion + ")</a></b>";
        timerDivElement.appendChild(titleElement);
        titleElement = null;

        g_nextHornTimeElement = document.createElement('div');
        g_nextHornTimeElement.setAttribute('id', 'nextHornTimeElement');
        g_nextHornTimeElement.innerHTML = "<b>Next Hunter Horn Time:</b> Loading...";
        timerDivElement.appendChild(g_nextHornTimeElement);

        g_trapCheckTimeElement = document.createElement('div');
        g_trapCheckTimeElement.setAttribute('id', 'trapCheckTimeElement');
        g_trapCheckTimeElement.innerHTML = "<b>Next Trap Check Time:</b> Loading...";
        timerDivElement.appendChild(g_trapCheckTimeElement);

        autobotDivElement.appendChild(timerDivElement);
        timerDivElement = null;
    }

    function embedPreferences() {
        var tempStr;
        var preferenceDivElement = document.createElement('div');

        var preferenceLinkElement = document.createElement('div');
        preferenceLinkElement.setAttribute('id', 'preferenceLinkElement');
        preferenceLinkElement.setAttribute('style', 'text-align:right');
        preferenceDivElement.appendChild(preferenceLinkElement);

        var preferenceSpanElement = document.createElement('span');
        var preferenceLinkStr = '<a id="preferenceLink" name="preferenceLink" onclick="' +
            'if (document.getElementById(\'preferenceLink\').innerHTML == \'<b>[Hide Preference]</b>\') {' +
            'document.getElementById(\'preferenceDiv\').style.display=\'none\';' +
            'document.getElementById(\'preferenceLink\').innerHTML=\'<b>[Show Preference]</b>\';' +
            '} else {' +
            'document.getElementById(\'preferenceDiv\').style.display=\'block\';' +
            'document.getElementById(\'preferenceLink\').innerHTML=\'<b>[Hide Preference]</b>\';' +
            'initEventAlgo();' +
            '}' +
            '">';
        preferenceLinkStr += '<b>[Show Preference]</b>';
        preferenceLinkStr += '</a>';
        preferenceLinkStr += '&nbsp;&nbsp;&nbsp;';
        preferenceSpanElement.innerHTML = preferenceLinkStr;
        preferenceLinkElement.appendChild(preferenceSpanElement);
        preferenceLinkStr = null;
        preferenceSpanElement = null;
        preferenceLinkElement = null;

        var preferenceHTMLStr = '<table border="0" width="100%">';

        preferenceHTMLStr += '<tr><td colspan="2" style="padding: 2px 0; border-bottom: 1px solid orange;"></td></tr>';
        preferenceHTMLStr += '<tr><td colspan="2" style="height: 5px;"></td></tr>';

        // Horn time
        preferenceHTMLStr += '<tr>';
        preferenceHTMLStr += '<td style="height:24px; text-align:right;">';
        preferenceHTMLStr += '<a title="Extra delay time before sounding the horn (in seconds)"><b>Horn Time Delay</b></a>&nbsp;&nbsp;:&nbsp;&nbsp;';
        preferenceHTMLStr += '</td>';
        preferenceHTMLStr += '<td style="height:24px">';
        preferenceHTMLStr += '<input type="number" id="HornTimeDelayMinInput" min="0" max="600" size="5" value="' + g_hornTimeDelayMin.toString() + '" > seconds ~ ';
        preferenceHTMLStr += '<input type="number" id="HornTimeDelayMaxInput" min="1" max="601" size="5" value="' + g_hornTimeDelayMax.toString() + '" > seconds';
        preferenceHTMLStr += '</td>';
        preferenceHTMLStr += '</tr>';

        // Trap check
        preferenceHTMLStr += '<tr>';
        preferenceHTMLStr += '<td style="height:24px; text-align:right;">';
        preferenceHTMLStr += '<a title="Enable trap check once an hour"><b>Trap Check Delay</b></a>&nbsp;&nbsp;:&nbsp;&nbsp;';
        preferenceHTMLStr += '</td>';
        preferenceHTMLStr += '<td style="height:24px">';
        preferenceHTMLStr += '<input type="number" id="TrapCheckTimeDelayMinInput" min="0" max="360" size="5" value="' + g_trapCheckTimeDelayMin.toString() + '" ' + tempStr + '> seconds ~ ';
        preferenceHTMLStr += '<input type="number" id="TrapCheckTimeDelayMaxInput" min="1" max="361" size="5" value="' + g_trapCheckTimeDelayMax.toString() + '" ' + tempStr + '> seconds';
        preferenceHTMLStr += '</td>';
        preferenceHTMLStr += '</tr>';

        // King reward autosolve
        preferenceHTMLStr += '<tr>';
        preferenceHTMLStr += '<td style="height:24px; text-align:right;">';
        preferenceHTMLStr += '<a title="Solve King Reward automatically"><b>Auto Solve King Reward Delay</b></a>&nbsp;&nbsp;:&nbsp;&nbsp;';
        preferenceHTMLStr += '</td>';
        preferenceHTMLStr += '<td style="height:24px">';
        preferenceHTMLStr += '<input type="number" id="AutoSolveKRDelayMinInput" min="0" max="360" size="5" value="' + g_krDelayMin.toString() + '" ' + tempStr + '> seconds ~ ';
        preferenceHTMLStr += '<input type="number" id="AutoSolveKRDelayMaxInput" min="1" max="361" size="5" value="' + g_krDelayMax.toString() + '" ' + tempStr + '> seconds';
        preferenceHTMLStr += '</td>';
        preferenceHTMLStr += '</tr>';


        preferenceHTMLStr += '<tr>';
        preferenceHTMLStr += '<td style="height:24px; text-align:right;" colspan="2">';
        preferenceHTMLStr += '(Changes above this line only take place after user save the preference) ';

        preferenceHTMLStr += '<input type="button" id="PreferenceSaveInput" value="Save" onclick="\n';
        preferenceHTMLStr += 'try{\n';
        preferenceHTMLStr += '\twindow.localStorage.setItem(\'HornTimeDelayMin\',\tdocument.getElementById(\'HornTimeDelayMinInput\').value);\n';
        preferenceHTMLStr += '\twindow.localStorage.setItem(\'HornTimeDelayMax\',\tdocument.getElementById(\'HornTimeDelayMaxInput\').value);\n';
        preferenceHTMLStr += '\twindow.localStorage.setItem(\'TrapCheckTimeDelayMin\',\tdocument.getElementById(\'TrapCheckTimeDelayMinInput\').value);\n';
        preferenceHTMLStr += '\twindow.localStorage.setItem(\'TrapCheckTimeDelayMax\',\tdocument.getElementById(\'TrapCheckTimeDelayMaxInput\').value);\n';
        preferenceHTMLStr += '\twindow.localStorage.setItem(\'AutoSolveKRDelayMin\',\tdocument.getElementById(\'AutoSolveKRDelayMinInput\').value);\n';
        preferenceHTMLStr += '\twindow.localStorage.setItem(\'AutoSolveKRDelayMax\',\tdocument.getElementById(\'AutoSolveKRDelayMaxInput\').value);\n';
        preferenceHTMLStr += '\tsetSessionToLocal();\n';
        preferenceHTMLStr += '} catch(e) {\n';
        preferenceHTMLStr += '\tconsole.log(e);\n';
        preferenceHTMLStr += '}\n';

        preferenceHTMLStr += 'window.location.href=\'' + HTTP_STR + '://www.mousehuntgame.com/\';';

        preferenceHTMLStr += '"/>&nbsp;&nbsp;&nbsp;</td>';

        preferenceHTMLStr += '</tr>';

        preferenceHTMLStr += '<tr>';
        preferenceHTMLStr += '<td style="height:24px" colspan="2">';
        preferenceHTMLStr += '<div style="width: 100%; height: 1px; background: #000000; overflow: hidden;">';
        preferenceHTMLStr += '</td>';
        preferenceHTMLStr += '</tr>';

        preferenceHTMLStr += '</table>';

        var preferenceDiv = document.createElement('div');
        preferenceDiv.setAttribute('id', 'preferenceDiv');
        preferenceDiv.setAttribute('style', 'display: none');
        preferenceDiv.innerHTML = preferenceHTMLStr;
        preferenceDivElement.appendChild(preferenceDiv);
        preferenceHTMLStr = null;

        var hr3Element = document.createElement('hr');
        preferenceDiv.appendChild(hr3Element);
        hr3Element = null;
        preferenceDiv = null;
        autobotDivElement.appendChild(preferenceDivElement);
        preferenceDivElement = null;
    }

    var overlayContainerElement = document.getElementById('overlayContainer');
    if (overlayContainerElement) {
        var autobotDivElement = document.createElement('div');
        embedTimer();
        embedPreferences();
        overlayContainerElement.parentNode.insertBefore(autobotDivElement, overlayContainerElement);
        autobotDivElement = null;
        overlayContainerElement = null;
        return true;
    } else {
        return false;
    }
}

/*
function retrieveData() {
    function loadTrapCheckTimeOffSet() {
        var TrapCheckTimeOffSet = getTrapCheckTimeOffSetFromPage();
        alert(TrapCheckTimeOffSet);
    }
    loadTrapCheckTimeOffSet();
}

function getTrapCheckTimeOffSetFromPage() {
    var passiveElement = document.getElementsByClassName('passive');
    if (passiveElement.length > 0) {
        var time = passiveElement[0].textContent;
        time = time.substr(time.indexOf('m -') - 4, 2);
        return parseInt(time);
    } else {
        console.log('passiveElement not found');
        return -1;
    }
}
*/
function getPageVariable(name) {
    if (DEBUG_MODE) console.log('RUN GPV(' + name + ')');
    try {
        if (name == "user.next_activeturn_seconds") {
            return unsafeWindow.user.next_activeturn_seconds;
        }
        if (DEBUG_MODE) console.log('GPV other: ' + name + ' not found.');
        return 'ERROR';
    } catch (e) {
        if (DEBUG_MODE) console.log('GPV ALL try block error: ' + e);
    } finally {
        name = undefined;
    }
}

