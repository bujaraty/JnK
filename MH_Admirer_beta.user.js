// ==UserScript==
// @name         MH_Admirer_by_JnK_beta
// @namespace    https://github.com/bujaraty/JnK
// @version      1.1.0.4
// @description  beta version of MH Admirer
// @author       JnK
// @icon         https://raw.githubusercontent.com/nobodyrandom/mhAutobot/master/resource/mice.png
// @require      https://code.jquery.com/jquery-2.2.2.min.js
// @require      https://greasyfork.org/scripts/16046-ocrad/code/OCRAD.js?version=100053
// @require      https://greasyfork.org/scripts/16036-mh-auto-kr-solver/code/MH%20Auto%20KR%20Solver.js?version=102270
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
// Issue list
// - Auto check manual horn
// - Auto change trap setting
// - Auto claim/send gifts and raffles
// - Check valid location

// == Basic User Preference Setting (Begin) ==
// // The variable in this section contain basic option will normally edit by most user to suit their own preference
// // Reload MouseHunt page manually if edit this script while running it for immediate effect.

// // ERROR CHECKING ONLY: Script debug
var DEBUG_MODE = true;
var ID_HEADER_ELEMENT = 'envHeaderImg';
var HORNREADY_TXT = 'hornReady';
var CLASS_HORNBUTTON_ELEMENT = 'hornbutton';
var CLASS_HUNTERHORN_ELEMENT = 'mousehuntHud-huntersHorn-container';
var KR_SEPARATOR = "~";

// // Extra delay time before sounding the horn. (in seconds)
// // Default: 10-15
var g_hornTimeDelayMin = 10;
var g_hornTimeDelayMax = 15;

// // Extra delay time to trap check. (in seconds)
// // Note: It only take effect if enableTrapCheck = true;
var g_trapCheckTimeDelayMin = 10;
var g_trapCheckTimeDelayMax = 60;

// // Extra delay time before solving KR. (in seconds)
// // Default: 3 - 10
var g_krDelayMin = 3;
var g_krDelayMax = 10;

// // Maximum retry of solving KR.
// // If KR solved more than this number, pls solve KR manually ASAP in order to prevent MH from caught in botting
var MAX_KR_RETRY = 5;

// == Basic User Preference Setting (End) ==

// == Advance User Preference Setting (Begin) ==
// // The variable in this section contain some advance option that will change the script behavior.
// // Edit this variable only if you know what you are doing
// // Reload MouseHunt page manually if edit this script while running it for immediate effect.

// // Time interval for script timer to update the time. May affect timer accuracy if set too high value. (in seconds)
var BOT_HORN_TIMER_COUNTDOWN_INTERVAL = 5;
var TRAP_CHECK_TIMER_COUNTDOWN_INTERVAL = 20;
var KR_SOLVER_COUNTDOWN_INTERVAL = 1;

// == Advance User Preference Setting (End) ==


// WARNING - Do not modify the code below unless you know how to read and write the script.

// All global variable declaration and default value
var HTTP_STR = 'https';
var g_nextBotHornTimeInSeconds;
var g_botHornTimeDelayInSeconds;
var g_nextTrapCheckTimeInSeconds = 0;
var g_nextTrapCheckTimeDelayInSeconds = 0;
var g_strScriptVersion = GM_info.script.version;
var g_nextBotHornTimeElement;
var g_nextTrapCheckTimeElement;
var g_nextBotHornTime;
var g_lastBotHornTimeRecorded = new Date();
var g_lastTrapCheckTimeRecorded = new Date();
var g_kingsRewardRetry = 0;


// I have to re-define the default value of the following variables somewhere else
var g_isKingReward = false;
var g_baitCount;

// Start executing script
window.addEventListener("message", processEventMsg, false);

if (DEBUG_MODE) console.log('STARTING SCRIPT - ver: ' + g_strScriptVersion);
if (window.top != window.self) {
    if (DEBUG_MODE) console.log('In IFRAME - may cause firefox to error, location: ' + window.location.href);
    //return;
} else {
    if (DEBUG_MODE) console.log('NOT IN IFRAME - will not work in fb MH');
}

function processEventMsg(event) {
    var tmpKRFrame = document.getElementById('tmpKRFrame');

    if (DEBUG_MODE) console.debug("Event origin: " + event.origin);
    if (event.origin.indexOf("mhcdn") > -1 || event.origin.indexOf("mousehuntgame") > -1 || event.origin.indexOf("dropbox") > -1) {
        if (event.data.indexOf("~") > -1) {
            var possibleAns = event.data.substring(0, event.data.indexOf("~"));
            var processedImg = event.data.substring(event.data.indexOf("~") + 1, event.data.length);
            var strKR = "KR" + KR_SEPARATOR;
            strKR += Date.now() + KR_SEPARATOR;
            strKR += possibleAns + KR_SEPARATOR;
            strKR += "RETRY" + g_kingsRewardRetry;
            try {
                setStorage(strKR, processedImg);
            } catch (e) {
                console.perror('receiveMessage', e.message);
            }
            validateImageAnswer(possibleAns);
        } else if (event.data.indexOf("#") > -1) {
            alert("going with #");
        } else if (event.data.indexOf('Log_') > -1) {
            alert("going with Log_");
        }
        else if (event.data.indexOf('MHAKRS_') > -1) {
            alert("going with MHAKRS_");
        }
    }
}

function validateImageAnswer(possibleAns) {
    // If the answer is valid enough then submit, otherwise get a new one (if not yet exceed max retry)
    if (DEBUG_MODE) console.log("RUN validateImageAnswer()");
    if (DEBUG_MODE) console.log(possibleAns);

    if (possibleAns.length != 5) {
        // The length is too short, then get a new one.
        retryKRSolver(true);
    } else {
        if (DEBUG_MODE) console.log("Submitting captcha answer: " + possibleAns);

        //Submit answer
        var puzzleAns = document.getElementsByClassName("mousehuntPage-puzzle-form-code")[0];

        if (!puzzleAns) {
            if (DEBUG_MODE) console.plog("puzzleAns: " + puzzleAns);
            return;
        }
        puzzleAns.value = "";
        puzzleAns.value = possibleAns.toLowerCase();

        var puzzleSubmitButton = document.getElementsByClassName("mousehuntPage-puzzle-form-code-button")[0];

        if (!puzzleSubmitButton) {
            if (DEBUG_MODE) console.plog("puzzleSubmit: " + puzzleSubmitButton);
            return;
        }

        fireEvent(puzzleSubmitButton, 'click');
        g_kingsRewardRetry = 0;
        setStorage("KingsRewardRetry", g_kingsRewardRetry);
        var tmpKRFrame = document.getElementById('tmpKRFrame');
        if (tmpKRFrame) {
            document.body.removeChild(tmpKRFrame);
        }

        window.setTimeout(function () {
            checkKRAnswer();
        }, 5000);
    }
}

function checkKRAnswer() {
    var puzzleForm = document.getElementsByClassName("mousehuntPage-puzzle-formContainer")[0];
    if (puzzleForm.classList.contains("noPuzzle")) {
        // KR is solved clicking continue now
        location.reload(true)
        // resumeHuntAfterKRSolved();
        return;
    }

    var strTemp = '';
    var codeError = document.getElementsByClassName("mousehuntPage-puzzle-form-code-error");
    for (var i = 0; i < codeError.length; i++) {
        if (codeError[i].innerText.toLowerCase().indexOf("incorrect claim code") > -1) {
            retryKRSolver(false);
        }
    }
    /*
    window.setTimeout(function () {
        checkKRAnswer();
    }, 1000);
    */
}

function resumeHuntAfterKRSolved() {
}

function retryKRSolver(resetCaptcha) {
    if (DEBUG_MODE) console.log("RUN retryKRSolver()");

    if (g_kingsRewardRetry >= MAX_KR_RETRY) {
        g_kingsRewardRetry = 0;
        setStorage("KingsRewardRetry", g_kingsRewardRetry);
        var strTemp = 'Max ' + MAX_KR_RETRY + 'retries. Pls solve it manually ASAP.';
        updateTitleTxt(strTemp);
        updateNextBotHornTimeTxt(strTemp);
        console.perror(strTemp);
    } else {
        ++g_kingsRewardRetry;
        setStorage("KingsRewardRetry", g_kingsRewardRetry);
        if (resetCaptcha) {
            getNewKRCaptcha();
        }
        var tmpKRFrame = document.getElementById('tmpKRFrame');
        if (!isNullOrUndefined(tmpKRFrame)) {
            document.body.removeChild(tmpKRFrame);
        }
        window.setTimeout(function () {
            callKRSolver();
        }, 2000);
    }
    return;
}

function getNewKRCaptcha() {
    if (DEBUG_MODE) console.log("RUN getNewKRCaptcha()");

    var tagName = document.getElementsByTagName("a");
    for (var i = 0; i < tagName.length; i++) {
        if (tagName[i].innerText == "Click here to get a new one!") {
            // TODO IMPORTANT: Find another time to fetch new puzzle
            fireEvent(tagName[i], 'click');
        }
    }
}

execScript();

function execScript() {
    if (DEBUG_MODE) console.log('RUN %cexeScript()', 'color: #9cffbd');

    try {
        loadPreferenceSettingFromStorage();
        retrieveCampActiveData();
        if (isNullOrUndefined(g_baitCount)) {
            setTimeout(function () {
                reloadCampPage()
            }, 600*1000);
            return;
        }
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
            handleKingReward();
        } else if (g_baitCount == 0) {
            updateTitleTxt("No more cheese!");
            updateNextBotHornTimeTxt("Cannot hunt without the cheese...");
            updateNextTrapCheckTimeTxt("Cannot hunt without the cheese...");
        } else {
            window.setTimeout(function () {
                (countdownBotHornTimer)()
            }, 1000);
            window.setTimeout(function () {
                (countdownTrapCheckTimer)()
            }, 1000);
        }
    } catch (e) {
        console.log("operateBot() ERROR - " + e);
    }
}

function handleKingReward() {
    if (DEBUG_MODE) console.log("START AUTOSOLVE COUNTDOWN");

    var krDelaySec = g_krDelayMin + Math.floor(Math.random() * (g_krDelayMax - g_krDelayMin));

    kingRewardCountdownTimer(krDelaySec);
}

function kingRewardCountdownTimer(krDelaySec) {
    var strTemp = "Solve KR in ";
    strTemp += timeFormat(krDelaySec);
    strTemp += " second(s)";
    updateTitleTxt(strTemp);
    updateNextBotHornTimeTxt(strTemp);
    updateNextTrapCheckTimeTxt(strTemp);
    krDelaySec -= KR_SOLVER_COUNTDOWN_INTERVAL;
    if (krDelaySec < 0) {
        if (DEBUG_MODE) console.log("START AUTOSOLVE NOW");

        callKRSolver();
    } else {
        window.setTimeout(function () {
            kingRewardCountdownTimer(krDelaySec);
        }, KR_SOLVER_COUNTDOWN_INTERVAL * 1000);
    }
}

function callKRSolver() {
    if (DEBUG_MODE) console.log("RUN CallKRSolver()");

    var frame = document.createElement('iframe');
    frame.setAttribute("id", "tmpKRFrame");
    var img;

    img = document.getElementsByClassName('mousehuntPage-puzzle-form-captcha-image')[0];
    if (DEBUG_MODE) console.log("Captcha Image fetched:")
    if (DEBUG_MODE) console.log(img);

    frame.src = img.querySelector('img').src;
    document.body.appendChild(frame);
}

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

function countdownBotHornTimer() {
    // Update timer
    var dateNow = new Date();
    var intervalTime = timeElapsedInSeconds(g_lastBotHornTimeRecorded, dateNow);
    g_lastBotHornTimeRecorded = undefined;
    g_lastBotHornTimeRecorded = dateNow;
    dateNow = undefined;

    g_nextBotHornTimeInSeconds -= intervalTime;
    intervalTime = undefined;

    if (g_nextBotHornTimeInSeconds <= 0) {
        soundHorn();
    } else {
        updateTitleTxt("Horn: " + timeFormat(g_nextBotHornTimeInSeconds));
        updateNextBotHornTimeTxt(timeFormat(g_nextBotHornTimeInSeconds) + "  <i>(including " + timeFormat(g_botHornTimeDelayInSeconds) + " delay)</i>");

        // Check if user manaually sounded the horn
        //codeForCheckingIfUserManuallySoundedTheHorn();
        window.setTimeout(function () {
            (countdownBotHornTimer)()
        }, BOT_HORN_TIMER_COUNTDOWN_INTERVAL * 1000);
    }
}

function countdownTrapCheckTimer() {
    // Update timer
    var dateNow = new Date();
    var intervalTime = timeElapsedInSeconds(g_lastTrapCheckTimeRecorded, dateNow);
    g_lastTrapCheckTimeRecorded = undefined;
    g_lastTrapCheckTimeRecorded = dateNow;
    dateNow = undefined;

    g_nextTrapCheckTimeInSeconds -= intervalTime;
    intervalTime = undefined;

    if (g_nextTrapCheckTimeInSeconds <= 0) {
        trapCheck();
    } else {
        updateNextTrapCheckTimeTxt(timeFormat(g_nextTrapCheckTimeInSeconds) + "  <i>(including " + timeFormat(g_nextTrapCheckTimeDelayInSeconds) + " delay)</i>");

        // Check if user manaually sounded the horn
        //codeForCheckingIfUserManuallySoundedTheHorn();
        window.setTimeout(function () {
            (countdownTrapCheckTimer)()
        }, TRAP_CHECK_TIMER_COUNTDOWN_INTERVAL * 1000);
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
    updateTitleTxt("Checking The Trap...");
    updateNextBotHornTimeTxt("Checking trap now...");

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

    updateTitleTxt("Ready to Blow The Horn...");
    updateNextBotHornTimeTxt("Ready to Blow The Horn...");

    // safety mode, check the horn image is there or not before sound the horn
    var headerElement = document.getElementById(ID_HEADER_ELEMENT);

    if (headerElement) {
        var headerClass = headerElement.getAttribute('class');
        if (headerClass.indexOf(HORNREADY_TXT) !== -1) {
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
            updateTitleTxt("Synchronizing Data...");
            updateNextBotHornTimeTxt("Someone had just sound the horn. Synchronizing data...");

            // clean up
            headerElement = null;
            headerClass = null;

            // load the new data
            window.setTimeout(function () {
                afterSoundingHorn()
            }, 5000);
        } else if (headerClass.indexOf("hornwaiting") != -1) {
            // the horn is not appearing, let check the time again

            // update timer
            updateTitleTxt("Synchronizing Data...");
            updateNextBotHornTimeTxt("Hunter horn is not ready yet. Synchronizing data...");
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

            // update timer
            updateTitleTxt("Synchronizing Data...");
            updateNextBotHornTimeTxt("Hunter horn is missing. Synchronizing data...");

            // clean up
            headerElement = null;
            headerClass = null;

            // I should double check if the horn was already sounded (not yet)
            window.setTimeout(function () {
                reloadCampPage();
            }, 1000);
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
    updateTitleTxt("Horn sounded. Synchronizing Data...");
    updateNextBotHornTimeTxt("Horn sounded. Synchronizing Data...");

    // reload data
    retrieveCampActiveData();

    // script continue as normal
    window.setTimeout(function () {
        countdownBotHornTimer()
    }, BOT_HORN_TIMER_COUNTDOWN_INTERVAL * 1000);
}

function updateTitleTxt(titleTxt) {
    document.title = titleTxt;
    titleTxt = null;
}

function updateNextBotHornTimeTxt(nextHornTimeTxt) {
    g_nextBotHornTimeElement.innerHTML = "<b>Next Hunter Horn Time:</b> " + nextHornTimeTxt;
    nextHornTimeTxt = null;
}

function updateNextTrapCheckTimeTxt(trapCheckTimeTxt) {
    g_nextTrapCheckTimeElement.innerHTML = "<b>Next Trap Check Time:</b> " + trapCheckTimeTxt;
    trapCheckTimeTxt = null;
}

function updateUI(titleTxt, nextHornTimeTxt, trapCheckTimeTxt) {
    updateTitleTxt(titleTxt);
    updateNextBotHornTimeTxt(nextHornTimeTxt);
    updateNextTrapCheckTimeTxt(trapCheckTimeTxt);
}

function loadPreferenceSettingFromStorage() {
    g_hornTimeDelayMin = getStorageVarInt("HornTimeDelayMin", g_hornTimeDelayMin);
    g_hornTimeDelayMax = getStorageVarInt("HornTimeDelayMax", g_hornTimeDelayMax);

    g_trapCheckTimeDelayMin = getStorageVarInt("TrapCheckTimeDelayMin", g_trapCheckTimeDelayMin);
    g_trapCheckTimeDelayMax = getStorageVarInt("TrapCheckTimeDelayMax", g_trapCheckTimeDelayMax);

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
    return (obj === null || obj === undefined || obj === 'null' || obj === 'undefined' || obj === NaN);
}

function retrieveCampActiveData() {
    // This function is to retrieve data from camp page that is actively changed, including
    // - next horn time
    // - king reward
    // - bait quantity
    if (DEBUG_MODE) console.log('RUN retrieveCampActiveData()');

    // Set time stamp for when the other time stamps are queried
    g_lastBotHornTimeRecorded = new Date();

    // Get MH horn time and use it to calculate next bot horn time
    var nextMHHornTimeInSeconds = parseInt(getPageVariable("user.next_activeturn_seconds"));
    g_botHornTimeDelayInSeconds = g_hornTimeDelayMin + Math.round(Math.random() * (g_hornTimeDelayMax - g_hornTimeDelayMin));
    g_nextBotHornTimeInSeconds = nextMHHornTimeInSeconds + g_botHornTimeDelayInSeconds;
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

    // Check if there is King Reward ongoing
    g_isKingReward = getPageVariable("user.has_puzzle");

    g_baitCount = getPageVariable("user.bait_quantity");

    nextMHHornTimeInSeconds = undefined;
    trapCheckTimeOffsetInSeconds = undefined;
    now = undefined;
}

function getTrapCheckTime() {
    // I have to refactor the in this part as sometime, the TrapCheck time is incorrect
    // Check storage first
    var trapCheckTimeOffset = getStorageVarInt('trapCheckTimeOffset', -1);
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

function resetTrapCheckTime() {
    // No idea what to do at the moment
    // The original purpose was to correct the trap check time in case that it's not correct
    // But now it's always correct so I'll leave this function do nothing at the moment
    /*
    var tmp = getTrapCheckTimeFromPage();
    alert(tmp);
    */
}

function test1() {
    alert("test1");
    var itemEle = document.getElementsByClassName('campPage-trap-armedItem weapon');
    if (itemEle) {
        window.setTimeout(function () {
            fireEvent(itemEle[0], 'click');
        }, 5 * 1000);

        window.setTimeout(function () {
            fireEvent(itemEle[0], 'click');
        }, 10 * 1000);
    } else {
    }
    var nameElement;
    //    var arrName = (Array.isArray(name)) ? name.slice() : [name];
    /*
    if (sort == 'best' || sort == 'any')
        name = name[0];
*/
    if (itemEle.length > 0) {
        alert("length > 0");
        //        console.plog('Trying to arm ' + name);
        for (var i = 0; i < itemEle.length; i++) {
            //            nameElement = itemEle[i].getElementsByClassName('campPage-trap-itemBrowser-item-name')[0].textContent;
            //            alert(nameElement);
            /*
            if (nameElement.indexOf(name) === 0) {
                if (itemEle[i].getAttribute('class').indexOf('canArm') > -1)
                    fireEvent(itemEle[i].getElementsByClassName('campPage-trap-itemBrowser-item-armButton')[0], 'click');
                else
                    closeTrapSelector(trap);
                if (objTrapList[trap].indexOf(nameElement) < 0) {
                    objTrapList[trap].unshift(nameElement);
                    setStorage("TrapList" + capitalizeFirstLetter(trap), objTrapList[trap].join(","));
                }
                console.plog(name + ' armed');
                return ARMED;
            }
            */
        }
        /*
        console.plog(name, 'not found');
        for (var i = 0; i < objTrapList[trap].length; i++) {
            if (objTrapList[trap][i].indexOf(name) === 0) {
                objTrapList[trap].splice(i, 1);
                setStorage("TrapList" + capitalizeFirstLetter(trap), objTrapList[trap].join(","));
                break;
            }
        }
        if (sort == 'best' || sort == 'any') {
            arrName.shift();
            if (arrName.length > 0)
                return armTrapNewUI(sort, trap, arrName);
            else
                return NOT_FOUND;
        }
        else
            return NOT_FOUND;
            */
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
        var timerTableElement = document.createElement('table');

        // First row show title and version
        var firstRow = timerTableElement.insertRow();
        var titleElement = firstRow.insertCell();
        titleElement.setAttribute('id', 'titleElement');
        titleElement.innerHTML = "<b><a href=\"https://github.com/bujaraty/JnK/blob/main/MH_Admirer.user.js\" target=\"_blank\">J n K Admirer (version " + g_strScriptVersion + ")</a></b>";
        titleElement = null;
        firstRow = null;

        var secondRow = timerTableElement.insertRow();
        g_nextBotHornTimeElement = secondRow.insertCell();
        g_nextBotHornTimeElement.setAttribute('id', 'nextBotHornTimeElement');
        g_nextBotHornTimeElement.innerHTML = "<b>Next Hunter Horn Time:</b> Loading...";
        secondRow = null;

        var thirdRow = timerTableElement.insertRow();
        g_nextTrapCheckTimeElement = thirdRow.insertCell();
        g_nextTrapCheckTimeElement.setAttribute('id', 'nextTrapCheckTimeElement');
        g_nextTrapCheckTimeElement.innerHTML = "<b>Next Trap Check Time:</b> Loading...";
        g_nextTrapCheckTimeElement.width = 400;

        var trapCheckButtonCellElement = thirdRow.insertCell();
        var trapCheckButtonElement = document.createElement('button');
        trapCheckButtonElement.setAttribute('id', 'trapCheckButtonElement');
        trapCheckButtonElement.onclick = resetTrapCheckTime
        trapCheckButtonElement.style.fontSize = "10px";
        var buttonTxt = document.createTextNode("Reset Time");
        trapCheckButtonElement.appendChild(buttonTxt);
        trapCheckButtonCellElement.appendChild(trapCheckButtonElement);
        thirdRow = null;
        /*
        var forthRow = timerTableElement.insertRow();
        var testButton1CellElement = forthRow.insertCell();
        var testButton1Element = document.createElement('button');
        testButton1Element.setAttribute('id', 'testButton1Element');
        testButton1Element.onclick = test1
        testButton1Element.style.fontSize = "10px";
        var testbuttonTxt = document.createTextNode("test 1");
        testButton1Element.appendChild(testbuttonTxt);
        testButton1CellElement.appendChild(testButton1Element);
*/
        timerDivElement.appendChild(timerTableElement);
        timerTableElement = null;

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

function getPageVariable(name) {
    if (DEBUG_MODE) console.log('RUN GPV(' + name + ')');
    try {
        if (name == "user.next_activeturn_seconds") {
            return unsafeWindow.user.next_activeturn_seconds;
        } else if (name == "user.has_puzzle") {
            return unsafeWindow.user.has_puzzle;
        } else if (name == "user.bait_quantity") {
            return unsafeWindow.user.bait_quantity;
        }

        if (DEBUG_MODE) console.log('GPV other: ' + name + ' not found.');
        return 'ERROR';
    } catch (e) {
        if (DEBUG_MODE) console.log('GPV ALL try block error: ' + e);
    } finally {
        name = undefined;
    }
}

