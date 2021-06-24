// ==UserScript==
// @name         MH_Admirer_by_JnK_beta
// @namespace    https://github.com/bujaraty/JnK
// @version      1.2.0.2
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

// // Extra delay time before sounding the horn. (in seconds)
// // Default: 10-15
var g_botHornTimeDelayMin = 10;
var g_botHornTimeDelayMax = 15;

// // Extra delay time to trap check. (in seconds)
// // Note: It only take effect if enableTrapCheck = true;
var g_trapCheckTimeDelayMin = 10;
var g_trapCheckTimeDelayMax = 60;

// // Extra delay time before solving KR. (in seconds)
// // Default: 3 - 10
var g_autosolveKRDelayMin = 3;
var g_autosolveKRDelayMax = 10;

// // Maximum retry of solving KR.
// // If KR solved more than this number, pls solve KR manually ASAP in order to prevent MH from caught in botting
var MAX_KR_RETRY = 5;

// // Scheduler time that will start doing automated process
var g_schedulerTime = "07:35";

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
var BOT_PROCESS_IDLE = "idle";
var g_nextBotHornTimeInSeconds;
var g_botHornTimeDelayInSeconds;
var g_nextTrapCheckTimeInSeconds = 0;
var g_nextTrapCheckTimeDelayInSeconds = 0;
var g_strScriptVersion = GM_info.script.version;
var g_nextBotHornTimeDisplay;
var g_nextTrapCheckTimeDisplay;
var g_nextBotHornTime;
var g_lastBotHornTimeRecorded = new Date();
var g_lastTrapCheckTimeRecorded = new Date();
var g_kingsRewardRetry = 0;
var g_botProcess = BOT_PROCESS_IDLE;

// I have to re-define the default value of the following variables somewhere else
var g_isKingReward = false;
var g_baitCount;

// MH constant
var ID_HEADER_ELEMENT = 'envHeaderImg';
var HORNREADY_TXT = 'hornReady';
var CLASS_HORNBUTTON_ELEMENT = 'hornbutton';
var CLASS_HUNTERHORN_ELEMENT = 'mousehuntHud-huntersHorn-container';
var KR_SEPARATOR = "~";

// JnK constant
var HTTP_STR = 'https';
var MOUSEHUNTGAME_WEBSITE_HOME = HTTP_STR + "://www.mousehuntgame.com/";
var ID_BOT_HORN_TIME_DELAY_MIN_INPUT = "botHornTimeDelayMinInput";
var ID_BOT_HORN_TIME_DELAY_MAX_INPUT = "botHornTimeDelayMaxInput";
var ID_TRAP_CHECK_TIME_DELAY_MIN_INPUT = "trapCheckTimeDelayMinInput";
var ID_TRAP_CHECK_TIME_DELAY_MAX_INPUT = "trapCheckTimeDelayMaxInput";
var ID_AUTOSOLVE_KR_DELAY_MIN_INPUT = "autosolveKRDelayMinInput";
var ID_AUTOSOLVE_KR_DELAY_MAX_INPUT = "autosolveKRDelayMaxInput";
var ID_SCHEDULER_TIME_INPUT = "schedulerTimeInput";
var ID_BOT_PROCESS_TXT = "botProcessTxt";
var ID_BOT_STATUS_TXT = "botStatusTxt";
var ID_PREFERENCES_LINK = 'preferencesLink';
var ID_PREFERENCES_BOX = 'preferencesBox';
var ID_TMP_KR_FRAME = 'tmpKRFrame';
var STORAGE_BOT_HORN_TIME_DELAY_MIN = "botHornTimeDelayMin";
var STORAGE_BOT_HORN_TIME_DELAY_MAX = "botHornTimeDelayMax";
var STORAGE_TRAP_CHECK_TIME_DELAY_MIN = "trapCheckTimeDelayMin";
var STORAGE_TRAP_CHECK_TIME_DELAY_MAX = "trapCheckTimeDelayMax";
var STORAGE_AUTOSOLVE_KR_DELAY_MIN = "autosolveKRDelayMin";
var STORAGE_AUTOSOLVE_KR_DELAY_MAX = "autosolveKRDelayMax";
var STORAGE_SCHEDULER_TIME = "schedulerTime";
var BOT_PROCESS_SCHEDULER = "Scheduler";
var BOT_STATUS_IDLE = "Idle";

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
    var tmpKRFrame = document.getElementById(ID_TMP_KR_FRAME);

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
        var tmpKRFrame = document.getElementById(ID_TMP_KR_FRAME);
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
        return;
    }

    var strTemp = '';
    var codeError = document.getElementsByClassName("mousehuntPage-puzzle-form-code-error");
    for (var i = 0; i < codeError.length; i++) {
        if (codeError[i].innerText.toLowerCase().indexOf("incorrect claim code") > -1) {
            retryKRSolver(false);
        }
    }
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
        var tmpKRFrame = document.getElementById(ID_TMP_KR_FRAME);
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
        if (!embedUIStructure()) {
            setTimeout(function () {
                reloadCampPage()
            }, 600*1000);
            return;
        }
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

    var krDelaySec = g_autosolveKRDelayMin + Math.floor(Math.random() * (g_autosolveKRDelayMax - g_autosolveKRDelayMin));

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
    frame.id = ID_TMP_KR_FRAME;
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

function runScheduler() {
    prepareSendingGiftsAndRaffles();
    window.setTimeout(function () {
        reloadCampPage();
    }, 60 * 1000);
}

function countdownBotHornTimer() {
    // Update timer
    var dateNow = new Date();
    var intervalTime = timeElapsedInSeconds(g_lastBotHornTimeRecorded, dateNow);
    g_lastBotHornTimeRecorded = undefined;
    g_lastBotHornTimeRecorded = dateNow;

    g_nextBotHornTimeInSeconds -= intervalTime;
    intervalTime = undefined;

    var beginSchedulerTime = new Date();
    beginSchedulerTime.setHours(parseInt(g_schedulerTime.substring(0,2)), parseInt(g_schedulerTime.substring(3,5)), 0);
    var endSchedulerTime = new Date();
    endSchedulerTime.setHours(parseInt(g_schedulerTime.substring(0,2)), parseInt(g_schedulerTime.substring(3,5))+1, 0);

    if (g_nextBotHornTimeInSeconds <= 0) {
        soundHorn();
    } else {
        if (g_botProcess == BOT_PROCESS_IDLE && beginSchedulerTime < dateNow && endSchedulerTime > dateNow) {
            g_botProcess = BOT_PROCESS_SCHEDULER;
            document.getElementById(ID_BOT_PROCESS_TXT).innerHTML = g_botProcess;
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Running Scheduler";
            runScheduler();
        }
        updateTitleTxt("Horn: " + timeFormat(g_nextBotHornTimeInSeconds));
        updateNextBotHornTimeTxt(timeFormat(g_nextBotHornTimeInSeconds) + "  <i>(including " + timeFormat(g_botHornTimeDelayInSeconds) + " delay)</i>");

        // Check if user manaually sounded the horn
        //codeForCheckingIfUserManuallySoundedTheHorn();
        window.setTimeout(function () {
            countdownBotHornTimer()
        }, BOT_HORN_TIMER_COUNTDOWN_INTERVAL * 1000);
    }
    dateNow = undefined;
    beginSchedulerTime = undefined;
    endSchedulerTime = undefined;
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

        window.setTimeout(function () {
            countdownTrapCheckTimer()
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
    updateNextTrapCheckTimeTxt("Checking trap now...");

    // reload the page
    setTimeout(function () {
        reloadCampPage()
    }, 1000);
}

function reloadCampPage() {
    window.location.href = MOUSEHUNTGAME_WEBSITE_HOME;
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
            }, 2000);
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
            }, 2000);
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
            }, 10000);
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
    g_nextBotHornTimeDisplay.innerHTML = nextHornTimeTxt;
    nextHornTimeTxt = null;
}

function updateNextTrapCheckTimeTxt(trapCheckTimeTxt) {
    g_nextTrapCheckTimeDisplay.innerHTML = trapCheckTimeTxt;
    trapCheckTimeTxt = null;
}

function updateUI(titleTxt, nextHornTimeTxt, trapCheckTimeTxt) {
    updateTitleTxt(titleTxt);
    updateNextBotHornTimeTxt(nextHornTimeTxt);
    updateNextTrapCheckTimeTxt(trapCheckTimeTxt);
}

function loadPreferenceSettingFromStorage() {
    g_botHornTimeDelayMin = getStorageVarInt(STORAGE_BOT_HORN_TIME_DELAY_MIN, g_botHornTimeDelayMin);
    g_botHornTimeDelayMax = getStorageVarInt(STORAGE_BOT_HORN_TIME_DELAY_MAX, g_botHornTimeDelayMax);

    g_trapCheckTimeDelayMin = getStorageVarInt(STORAGE_TRAP_CHECK_TIME_DELAY_MIN, g_trapCheckTimeDelayMin);
    g_trapCheckTimeDelayMax = getStorageVarInt(STORAGE_TRAP_CHECK_TIME_DELAY_MAX, g_trapCheckTimeDelayMax);

    g_autosolveKRDelayMin = getStorageVarInt(STORAGE_AUTOSOLVE_KR_DELAY_MIN, g_autosolveKRDelayMin);
    g_autosolveKRDelayMax = getStorageVarInt(STORAGE_AUTOSOLVE_KR_DELAY_MAX, g_autosolveKRDelayMax);

    var temp = getStorage(STORAGE_SCHEDULER_TIME);
    g_schedulerTime = (isNullOrUndefined(temp)) ? g_schedulerTime : temp;
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
    g_botHornTimeDelayInSeconds = g_botHornTimeDelayMin + Math.round(Math.random() * (g_botHornTimeDelayMax - g_botHornTimeDelayMin));
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

function clickAndArmWeapon(weaponCode) {
    function ArmWeapon(weaponCode) {
        var armableWeaponElements = document.getElementsByClassName('campPage-trap-itemBrowser-tagGroup default')[0].getElementsByClassName('canArm');
        if (armableWeaponElements) {
            alert("found defaultWeapon");
            alert(armableWeaponElements.length);
            for (var i = 0; i < armableWeaponElements.length; ++i) {
                alert(armableWeaponElements[i].getAttribute('class'));
                /*
                var attrs = armableWeaponElements[i].attributes;
                for (var j = 0; j < attrs.length; ++j) {
                    alert(attrs[j].name);
                }
                attrs = null;
                */
            }
        } else {
            alert("not found defaultWeapon");
        }
    }

    if (DEBUG_MODE) console.log("RUN clickAndArmWeapon()", "color: #bada55");
    alert("in function armWeapon()");
    var weaponElement = document.getElementsByClassName('campPage-trap-armedItem weapon');
    if (weaponElement) {
        window.setTimeout(function () {
            fireEvent(weaponElement[0], 'click');
        }, 1 * 1000);
        window.setTimeout(function () {
            ArmWeapon(weaponCode);
        }, 3 * 1000);
        /*
        window.setTimeout(function () {
            fireEvent(weaponElement[0], 'click');
        }, 10 * 1000);*/
    } else {
    }
}

function displayDocumentStyles() {
    alert("styling");
    //var autobotStyle = document.createElement("style");
    //alert("afdter document.createElement(\"style\");");
    //var header = document.getElementsByTagName('head');
    //alert("after getting head");
    //.appendChild(autobotStyle);
    //alert("afeter appending to head");
    var x = document.getElementsByTagName("STYLE");
    alert(x[0].lentgh);
    x[0].innerHTML = ".autoBotTxt { background-color: yellow; color: red; }";
    alert(x[0].innerHTML);
    for (var i=0; i<x.length; x++) {
        alert(x[i].tagName);
    }
    document.getElementById("demo").innerHTML = x[0].innerHTML;
}

function manualSendingGiftsAndRaffles() {
    document.getElementById(ID_BOT_PROCESS_TXT).innerHTML = "Manual Gifts&Raffles";
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual sending Gifts and Raffles";
    prepareSendingGiftsAndRaffles();
}

function prepareSendingGiftsAndRaffles() {
    function clickActionButton(actionButton) {
        fireEvent(actionButton.getElementsByClassName("userInteractionButtonsView-button")[0], "click");
        actionButton = null;
    }
    function sendGiftsAndRaffles(friendIndex, nGifts, nRaffles) {
        var buttonAttributes;
        var sendGiftButton;
        var sendBallotButton;
        var friendRow = friendRows[friendIndex];
        var friendName = friendRow.getElementsByClassName("friendsPage-friendRow-content")[0].getElementsByClassName("friendsPage-friendRow-titleBar")[0].getElementsByTagName('a')[0].text;
        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Sending a gift and a ballot ticket to " + friendName;
        var actionButtons = friendRow.getElementsByClassName("friendsPage-friendRow-actions")[0].getElementsByClassName("userInteractionButtonsView")[0].children;
        for (var i = 0; i < actionButtons.length; i++) {
            buttonAttributes = actionButtons[i].attributes
            for (var j = 0; j < buttonAttributes.length; j++) {
                if (buttonAttributes[j].value == "send_daily_gift") {
                    sendGiftButton = actionButtons[i]
                }
                if (buttonAttributes[j].value == "send_draw_ballot") {
                    sendBallotButton = actionButtons[i]
                }
            }
            buttonAttributes = null;
        }
        clickActionButton(sendGiftButton);
        if (friendIndex < nRaffles) {
            window.setTimeout(function () {
                clickActionButton(sendBallotButton);
            }, 0.75 * 1000);
        }
        friendName = null;
        friendRow = null;
        friendIndex++;
        if (friendIndex < nGifts) {
            window.setTimeout(function () {
                sendGiftsAndRaffles(friendIndex, nGifts, nRaffles);
            }, 1.5 * 1000);
        }
    }
    function gotoNextFriendList() {
        // Got to the second frield list page
        var nextFriendListLink = document.getElementsByClassName("next active pagerView-section")[0].getElementsByTagName("a")[0];
        fireEvent(nextFriendListLink, "click");

        // Go through all sendGift and sendRaffle buttons in the first page
        friendRows = document.getElementsByClassName("friendsPage-friendRow");
        window.setTimeout(function () {
            sendGiftsAndRaffles(0, 4, 0);
        }, 3 * 1000);
    }
    var friendRows;
    if (DEBUG_MODE) console.log('RUN sendRafflesAndGifts()');

    // Goto friend list page
    var friendListLink = document.getElementsByClassName("mousehuntHud-gameInfo")[0].getElementsByTagName("a")[0];
    fireEvent(friendListLink, "click");

    // Go through all sendGift and sendRaffle buttons in the first page
    friendRows = document.getElementsByClassName("friendsPage-friendRow");
    window.setTimeout(function () {
        sendGiftsAndRaffles(0, 20, 20);
    }, 3 * 1000);
    window.setTimeout(function () {
        gotoNextFriendList();
    }, 37 * 1000);
}

function listAttributes(obj) {
    var attrs = obj.attributes;
    var tmpTxt = "";
    for (var i = 0; i < attrs.length; i++) {
        tmpTxt += attrs[i].name + " : " + attrs[i].value + "\n";
    }
    alert(tmpTxt);
}

function test1() {
    //displayDocumentStyles();
    //clickAndArmWeapon();
}

function embedUIStructure() {
    // This function is to embed UI structure at the top of related pages
    // The UI consist of 3 parts
    // 1. timer
    // 2. timer preferences
    // 3. bot preferences in the circumstances that require a lot of attention

    function embedTimerDisplay() {
        var timerSection = document.createElement('div');
        var timerDisplayTable = document.createElement('table');
        timerDisplayTable.width = "100%";

        // The first row shows title and version (also some misc buttons)
        var firstRow = timerDisplayTable.insertRow();
        var timerDisplayTitle = firstRow.insertCell();
        timerDisplayTitle.colSpan = 2;
        timerDisplayTitle.innerHTML = "<b><a href=\"https://github.com/bujaraty/JnK/blob/main/MH_Admirer.user.js\" target=\"_blank\">J n K Admirer (version " + g_strScriptVersion + ")</a></b>";
        timerDisplayTitle = null;
        var miscButtonsCell = firstRow.insertCell();
        miscButtonsCell.style.textAlign = "right";
        var sendGiftsAndRafflesButton = document.createElement('button');
        sendGiftsAndRafflesButton.onclick = manualSendingGiftsAndRaffles
        sendGiftsAndRafflesButton.style.fontSize = "8px";
        var buttonTxt = document.createTextNode("Send Gifts & Raffles");
        sendGiftsAndRafflesButton.appendChild(buttonTxt);
        buttonTxt = null;
        miscButtonsCell.appendChild(sendGiftsAndRafflesButton);
        miscButtonsCell = null;
        firstRow = null;

        // The second row shows next bot horn time countdown
        var secondRow = timerDisplayTable.insertRow();
        var nextBotHornTimeCaptionCell = secondRow.insertCell();
        nextBotHornTimeCaptionCell.width = 20;
        nextBotHornTimeCaptionCell.style.fontWeight = "bold";
        nextBotHornTimeCaptionCell.innerHTML = "Next Hunter Horn Time : ";
        g_nextBotHornTimeDisplay = secondRow.insertCell();
        g_nextBotHornTimeDisplay.style.textAlign = "left";
        g_nextBotHornTimeDisplay.width = 260;
        g_nextBotHornTimeDisplay.innerHTML = "Loading...";
        nextBotHornTimeCaptionCell = null;
        secondRow = null;

        // The third row shows next trap check time countdown
        var thirdRow = timerDisplayTable.insertRow();
        var nextTrapCheckTimeCaptionCell = thirdRow.insertCell();
        nextTrapCheckTimeCaptionCell.style.fontWeight = "bold";
        nextTrapCheckTimeCaptionCell.innerHTML = "Next Trap Check Time :  ";
        g_nextTrapCheckTimeDisplay = thirdRow.insertCell();
        g_nextTrapCheckTimeDisplay.innerHTML = "Loading...";
        nextTrapCheckTimeCaptionCell = null;
        thirdRow = null;

        /*
        // The forth row is very temporary just for testing
        var forthRow = timerDisplayTable.insertRow();
        var testButton1CellElement = forthRow.insertCell();
        var testButton1Element = document.createElement('button');
        testButton1Element.onclick = test1
        testButton1Element.style.fontSize = "10px";
        var testbuttonTxt = document.createTextNode("test 1");
        testButton1Element.appendChild(testbuttonTxt);
        testButton1CellElement.appendChild(testButton1Element);
        var demoTxt = document.createTextNode("test 1");
        demoTxt.id = "demo";
        testButton1CellElement.appendChild(demoTxt);
        */

        timerSection.appendChild(timerDisplayTable);
        timerDisplayTable = null;

        return timerSection;
    }

    function embedPreferences() {
        function togglePreferences() {
            var toggleLink = document.getElementById(ID_PREFERENCES_LINK);
            var preferencesBox = document.getElementById(ID_PREFERENCES_BOX);
            if (toggleLink.innerHTML == '[Show Preferences]') {
                toggleLink.innerHTML = '[Hide Preferences]'
                preferencesBox.style.display = 'block';
            } else {
                toggleLink.innerHTML = '[Show Preferences]'
                preferencesBox.style.display = 'none';
            }
            toggleLink = null;
            preferencesBox = null;
        }

        function embedTimerPreferences() {
            function saveTimerPreferences() {
                try {
                    setStorage(STORAGE_BOT_HORN_TIME_DELAY_MIN, document.getElementById(ID_BOT_HORN_TIME_DELAY_MIN_INPUT).value);
                    setStorage(STORAGE_BOT_HORN_TIME_DELAY_MAX, document.getElementById(ID_BOT_HORN_TIME_DELAY_MAX_INPUT).value);
                    setStorage(STORAGE_TRAP_CHECK_TIME_DELAY_MIN, document.getElementById(ID_TRAP_CHECK_TIME_DELAY_MIN_INPUT).value);
                    setStorage(STORAGE_TRAP_CHECK_TIME_DELAY_MAX, document.getElementById(ID_TRAP_CHECK_TIME_DELAY_MAX_INPUT).value);
                    setStorage(STORAGE_AUTOSOLVE_KR_DELAY_MIN, document.getElementById(ID_AUTOSOLVE_KR_DELAY_MIN_INPUT).value);
                    setStorage(STORAGE_AUTOSOLVE_KR_DELAY_MAX, document.getElementById(ID_AUTOSOLVE_KR_DELAY_MAX_INPUT).value);
                    setStorage(STORAGE_SCHEDULER_TIME, document.getElementById(ID_SCHEDULER_TIME_INPUT).value);
                } catch (e) {
                    console.log(e);
                }
                reloadCampPage();
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

            var tmpTxt;
            var timerPreferencesTable = document.createElement('table');
            timerPreferencesTable.width = "100%";

            var emptyRow = timerPreferencesTable.insertRow();
            emptyRow.style.height="5px"
            emptyRow = null;

            var nextBotHornTimePreferencesRow = timerPreferencesTable.insertRow();
            nextBotHornTimePreferencesRow.style.height = "24px"
            var nextBotHornTimePreferencesCaption = nextBotHornTimePreferencesRow.insertCell();
            nextBotHornTimePreferencesCaption.style.fontWeight = "bold";
            nextBotHornTimePreferencesCaption.style.textAlign = "right";
            nextBotHornTimePreferencesCaption.innerHTML = "Bot Horn Time Delay :  ";
            nextBotHornTimePreferencesCaption.width = 250;
            nextBotHornTimePreferencesCaption = null;
            var nextBotHornTimePreferencesSettings = nextBotHornTimePreferencesRow.insertCell();
            nextBotHornTimePreferencesSettings.width = 250;
            var botHornTimeDelayMinInput = document.createElement('INPUT');
            botHornTimeDelayMinInput.type = "number";
            botHornTimeDelayMinInput.min = "0";
            botHornTimeDelayMinInput.max = "600";
            botHornTimeDelayMinInput.size = "5";
            botHornTimeDelayMinInput.id = ID_BOT_HORN_TIME_DELAY_MIN_INPUT;
            botHornTimeDelayMinInput.value = g_botHornTimeDelayMin;
            nextBotHornTimePreferencesSettings.appendChild(botHornTimeDelayMinInput);
            tmpTxt = document.createTextNode(" seconds ~  ");
            nextBotHornTimePreferencesSettings.appendChild(tmpTxt);
            tmpTxt = null;
            var botHornTimeDelayMaxInput = document.createElement('INPUT');
            botHornTimeDelayMaxInput.type = "number";
            botHornTimeDelayMaxInput.min = "1";
            botHornTimeDelayMaxInput.max = "600";
            botHornTimeDelayMaxInput.size = "5";
            botHornTimeDelayMaxInput.id = ID_BOT_HORN_TIME_DELAY_MAX_INPUT;
            botHornTimeDelayMaxInput.value = g_botHornTimeDelayMax;
            nextBotHornTimePreferencesSettings.appendChild(botHornTimeDelayMaxInput);
            tmpTxt = document.createTextNode(" seconds");
            nextBotHornTimePreferencesSettings.appendChild(tmpTxt);
            tmpTxt = null;
            botHornTimeDelayMinInput = null;
            botHornTimeDelayMaxInput = null;
            nextBotHornTimePreferencesSettings = null;
            nextBotHornTimePreferencesRow = null;

            var nextTrapCheckTimePreferencesRow = timerPreferencesTable.insertRow();
            nextTrapCheckTimePreferencesRow.style.height = "24px"
            var nextTrapCheckTimePreferencesCaption = nextTrapCheckTimePreferencesRow.insertCell();
            nextTrapCheckTimePreferencesCaption.style.fontWeight = "bold";
            nextTrapCheckTimePreferencesCaption.style.textAlign = "right";
            nextTrapCheckTimePreferencesCaption.innerHTML = "Trap Check Time Delay :  ";
            nextTrapCheckTimePreferencesCaption = null;
            var nextTrapCheckTimePreferencesSettings = nextTrapCheckTimePreferencesRow.insertCell();
            var trapCheckTimeDelayMinInput = document.createElement('INPUT');
            trapCheckTimeDelayMinInput.type = "number";
            trapCheckTimeDelayMinInput.min = "0";
            trapCheckTimeDelayMinInput.max = "360";
            trapCheckTimeDelayMinInput.size = "5";
            trapCheckTimeDelayMinInput.id = ID_TRAP_CHECK_TIME_DELAY_MIN_INPUT;
            trapCheckTimeDelayMinInput.value = g_trapCheckTimeDelayMin;
            nextTrapCheckTimePreferencesSettings.appendChild(trapCheckTimeDelayMinInput);
            tmpTxt = document.createTextNode(" seconds ~  ");
            nextTrapCheckTimePreferencesSettings.appendChild(tmpTxt);
            tmpTxt = null;
            var trapCheckTimeDelayMaxInput = document.createElement('INPUT');
            trapCheckTimeDelayMaxInput.type = "number";
            trapCheckTimeDelayMaxInput.min = "1";
            trapCheckTimeDelayMaxInput.max = "600";
            trapCheckTimeDelayMaxInput.size = "5";
            trapCheckTimeDelayMaxInput.id = ID_TRAP_CHECK_TIME_DELAY_MAX_INPUT;
            trapCheckTimeDelayMaxInput.value = g_trapCheckTimeDelayMax;
            nextTrapCheckTimePreferencesSettings.appendChild(trapCheckTimeDelayMaxInput);
            tmpTxt = document.createTextNode(" seconds");
            nextTrapCheckTimePreferencesSettings.appendChild(tmpTxt);
            tmpTxt = null;
            var trapCheckResetTimeButtonCell = nextTrapCheckTimePreferencesRow.insertCell();
            var trapCheckResetTimeButton = document.createElement('button');
            trapCheckResetTimeButton.onclick = resetTrapCheckTime
            trapCheckResetTimeButton.style.fontSize = "10px";
            tmpTxt = document.createTextNode("Reset Time");
            trapCheckResetTimeButton.appendChild(tmpTxt);
            tmpTxt = null;
            trapCheckResetTimeButtonCell.appendChild(trapCheckResetTimeButton);
            trapCheckResetTimeButtonCell = null;
            trapCheckResetTimeButton = null;
            trapCheckTimeDelayMinInput = null;
            trapCheckTimeDelayMaxInput = null;
            nextTrapCheckTimePreferencesSettings = null;
            nextTrapCheckTimePreferencesRow = null;

            var autosolveKRPreferencesRow = timerPreferencesTable.insertRow();
            autosolveKRPreferencesRow.style.height = "24px"
            var autosolveKRPreferencesCaption = autosolveKRPreferencesRow.insertCell();
            autosolveKRPreferencesCaption.style.fontWeight = "bold";
            autosolveKRPreferencesCaption.style.textAlign = "right";
            autosolveKRPreferencesCaption.innerHTML = "Auto Solve King Reward Delay :  ";
            autosolveKRPreferencesCaption = null;
            var autosolveKRPreferencesSettings = autosolveKRPreferencesRow.insertCell();
            var autosolveKRDelayMinInput = document.createElement('INPUT');
            autosolveKRDelayMinInput.type = "number";
            autosolveKRDelayMinInput.min = "0";
            autosolveKRDelayMinInput.max = "360";
            autosolveKRDelayMinInput.size = "5";
            autosolveKRDelayMinInput.id = ID_AUTOSOLVE_KR_DELAY_MIN_INPUT;
            autosolveKRDelayMinInput.value = g_autosolveKRDelayMin;
            autosolveKRPreferencesSettings.appendChild(autosolveKRDelayMinInput);
            tmpTxt = document.createTextNode(" seconds ~  ");
            autosolveKRPreferencesSettings.appendChild(tmpTxt);
            tmpTxt = null;
            var autosolveKRDelayMaxInput = document.createElement('INPUT');
            autosolveKRDelayMaxInput.type = "number";
            autosolveKRDelayMaxInput.min = "1";
            autosolveKRDelayMaxInput.max = "600";
            autosolveKRDelayMaxInput.size = "5";
            autosolveKRDelayMaxInput.id = ID_AUTOSOLVE_KR_DELAY_MAX_INPUT;
            autosolveKRDelayMaxInput.value = g_autosolveKRDelayMax;
            autosolveKRPreferencesSettings.appendChild(autosolveKRDelayMaxInput);
            tmpTxt = document.createTextNode(" seconds");
            autosolveKRPreferencesSettings.appendChild(tmpTxt);
            tmpTxt = null;
            autosolveKRDelayMinInput = null;
            autosolveKRDelayMaxInput = null;
            autosolveKRPreferencesSettings = null;
            autosolveKRPreferencesRow = null;

            var schedulerPreferencesRow = timerPreferencesTable.insertRow();
            schedulerPreferencesRow.style.height = "24px"
            var schedulerPreferencesCaption = schedulerPreferencesRow.insertCell();
            schedulerPreferencesCaption.style.fontWeight = "bold";
            schedulerPreferencesCaption.style.textAlign = "right";
            schedulerPreferencesCaption.innerHTML = "Scheduler Time :  ";
            schedulerPreferencesCaption = null;
            var schedulerPreferencesSettings = schedulerPreferencesRow.insertCell();
            var schedulerBeginTime = document.createElement('INPUT');
            schedulerBeginTime.type = "time";
            schedulerBeginTime.id = ID_SCHEDULER_TIME_INPUT;
            schedulerBeginTime.value = g_schedulerTime;
            schedulerPreferencesSettings.appendChild(schedulerBeginTime);

            var saveButtonRow = timerPreferencesTable.insertRow();
            var saveButtonCell = saveButtonRow.insertCell();
            saveButtonCell.colSpan = 3;
            saveButtonCell.style.textAlign = "right";
            tmpTxt = document.createTextNode("(Changes above this line only take place after user save the preference)  ");
            saveButtonCell.appendChild(tmpTxt);
            tmpTxt = null;
            var saveTimerPreferencesButton = document.createElement('button');
            saveTimerPreferencesButton.onclick = saveTimerPreferences
            saveTimerPreferencesButton.style.fontSize = "13px";
            tmpTxt = document.createTextNode("Save");
            saveTimerPreferencesButton.appendChild(tmpTxt);
            tmpTxt = null;
            saveButtonCell.appendChild(saveTimerPreferencesButton);
            tmpTxt = document.createTextNode("  ");
            saveButtonCell.appendChild(tmpTxt);
            tmpTxt = null;
            saveButtonRow = null;
            saveButtonCell = null;
            saveTimerPreferencesButton = null;

            return timerPreferencesTable;
        }

        function embedPreferencesHeaderTable() {
            var preferencesHeaderTable = document.createElement('table');
            preferencesHeaderTable.width = "100%";
            var preferencesHeaderRow = preferencesHeaderTable.insertRow();
            var botProcessCaptionCell = preferencesHeaderRow.insertCell();
            botProcessCaptionCell.width = 60;
            botProcessCaptionCell.style.fontWeight = "bold";
            botProcessCaptionCell.innerHTML = "Bot Process :  ";
            var botProcessTxtCell = preferencesHeaderRow.insertCell();
            botProcessTxtCell.width = 130;
            botProcessTxtCell.innerHTML = g_botProcess;
            botProcessTxtCell.id = ID_BOT_PROCESS_TXT;
            botProcessCaptionCell = null;
            botProcessTxtCell = null;
            var botStatusCaptionCell = preferencesHeaderRow.insertCell();
            botStatusCaptionCell.width = 45;
            botStatusCaptionCell.style.fontWeight = "bold";
            botStatusCaptionCell.innerHTML = "Status :  ";
            var botStatusTxtCell = preferencesHeaderRow.insertCell();
            botStatusTxtCell.innerHTML = BOT_STATUS_IDLE;
            botStatusTxtCell.id = ID_BOT_STATUS_TXT;
            botStatusCaptionCell = null;
            botStatusTxtCell = null;

            var preferencesHeaderCell = preferencesHeaderRow.insertCell();
            preferencesHeaderCell.style = 'text-align:right'
            var preferencesLink = document.createElement('a');
            preferencesLink.id = ID_PREFERENCES_LINK;
            preferencesLink.innerHTML = '[Show Preferences]';
            preferencesLink.style.fontWeight = "bold";
            preferencesLink.onclick = togglePreferences;
            preferencesHeaderCell.appendChild(preferencesLink);
            preferencesLink = null;
            preferencesHeaderCell = null;
            preferencesHeaderRow = null;

            return preferencesHeaderTable;
        }

        var preferencesSection = document.createElement('div');

        var preferencesHeaderTable = embedPreferencesHeaderTable();
        preferencesSection.appendChild(preferencesHeaderTable);
        preferencesHeaderTable = null;

        var preferencesBox = document.createElement('div');
        preferencesBox.id = "preferencesBox";
        preferencesBox.style.display = "none";

        var separationLine = document.createElement('div');
        separationLine.style.height = "3px";
        separationLine.style.borderBottom = "1px solid #ff0066";
        preferencesBox.appendChild(separationLine);
        separationLine = null;
        var blankLine = document.createElement('div');
        blankLine.style.height="8px"
        preferencesBox.appendChild(blankLine);
        blankLine = null;
        var tmpTitle = document.createElement('div');
        tmpTitle.style = 'text-align:center'
        tmpTitle.style.fontWeight = "bold";
        tmpTitle.style.fontSize = "small";
        tmpTitle.innerHTML = 'Timer configuration';
        preferencesBox.appendChild(tmpTitle);
        tmpTitle = null;

        var timerPreferencesTable = embedTimerPreferences();
        preferencesBox.appendChild(timerPreferencesTable);
        timerPreferencesTable = null;

        separationLine = document.createElement('div');
        separationLine.style.height = "3px";
        separationLine.style.borderBottom = "1px solid #ff0066";
        preferencesBox.appendChild(separationLine);
        separationLine = null;
        /*
        blankLine = document.createElement('div');
        blankLine.style.height="8px"
        preferencesBox.appendChild(blankLine);
        blankLine = null;
        tmpTitle = document.createElement('div');
        tmpTitle.style = 'text-align:center'
        tmpTitle.style.fontWeight = "bold";
        tmpTitle.style.fontSize = "small";
        tmpTitle.innerHTML = 'Location/event-based trap setup';
        preferencesBox.appendChild(tmpTitle);
        tmpTitle = null;
        */

        preferencesSection.appendChild(preferencesBox);

        return preferencesSection;
    }

    var overlayContainerElement = document.getElementById('overlayContainer');
    if (overlayContainerElement) {
        var autobotDiv = document.createElement('div');
        // autobotDiv.style.backgroundColor = "#fff2e6";
        autobotDiv.style.whiteSpace = "pre";

        var timerSection = embedTimerDisplay();
        autobotDiv.appendChild(timerSection);
        timerSection = null;

        var preferencesSection = embedPreferences();
        autobotDiv.appendChild(preferencesSection);
        preferencesSection = null;

        overlayContainerElement.parentNode.insertBefore(autobotDiv, overlayContainerElement);
        autobotDiv = null;
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

