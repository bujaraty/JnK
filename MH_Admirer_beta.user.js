// ==UserScript==
// @name         MH_Admirer_by_JnK_beta
// @namespace    https://github.com/bujaraty/JnK
// @version      1.2.1.2
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
const DEBUG_MODE = true;

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
const MAX_KR_RETRY = 5;

// // Scheduler time that will start automatically
const STATUS_GIFTS_AND_RAFFLES_INCOMPLETE = "Incomplete";
const STATUS_GIFTS_AND_RAFFLES_COMPLETE = "Complete";
var g_scheduledGiftsAndRafflesTime = "07:35";
var g_beginScheduledGiftsAndRafflesTime = new Date();
var g_scheduledResetTime = "07:02";
var g_beginScheduledResetTime = new Date();
var g_statusGiftsAndRaffles = STATUS_GIFTS_AND_RAFFLES_INCOMPLETE;

// == Basic User Preference Setting (End) ==

// == Advance User Preference Setting (Begin) ==
// // The variable in this section contain some advance option that will change the script behavior.
// // Edit this variable only if you know what you are doing
// // Reload MouseHunt page manually if edit this script while running it for immediate effect.

// // Time interval for script timer to update the time. May affect timer accuracy if set too high value. (in seconds)
const BOT_HORN_TIMER_COUNTDOWN_INTERVAL = 5;
const TRAP_CHECK_TIMER_COUNTDOWN_INTERVAL = 20;
const KR_SOLVER_COUNTDOWN_INTERVAL = 1;

// == Advance User Preference Setting (End) ==

// WARNING - Do not modify the code below unless you know how to read and write the script.

// All global variable declaration and default value
const BOT_PROCESS_IDLE = "idle";
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
var g_weaponNames = [];
var g_baseNames = [];
var g_baitNames = [];
var g_trinketNames = [];
var g_botProcess = BOT_PROCESS_IDLE;

// I have to re-define the default value of the following variables somewhere else
var g_isKingReward = false;
var g_baitCount;

// MH constant
const ID_HEADER_ELEMENT = 'envHeaderImg';
const HORNREADY_TXT = 'hornReady';
const CLASS_HORNBUTTON_ELEMENT = 'hornbutton';
const CLASS_HUNTERHORN_ELEMENT = 'mousehuntHud-huntersHorn-container';
const KR_SEPARATOR = "~";

// JnK constant
const HTTP_STR = 'https';
const MOUSEHUNTGAME_WEBSITE_HOME = HTTP_STR + "://www.mousehuntgame.com/";
const ID_BOT_HORN_TIME_DELAY_MIN_INPUT = "botHornTimeDelayMinInput";
const ID_BOT_HORN_TIME_DELAY_MAX_INPUT = "botHornTimeDelayMaxInput";
const ID_TRAP_CHECK_TIME_DELAY_MIN_INPUT = "trapCheckTimeDelayMinInput";
const ID_TRAP_CHECK_TIME_DELAY_MAX_INPUT = "trapCheckTimeDelayMaxInput";
const ID_AUTOSOLVE_KR_DELAY_MIN_INPUT = "autosolveKRDelayMinInput";
const ID_AUTOSOLVE_KR_DELAY_MAX_INPUT = "autosolveKRDelayMaxInput";
const ID_SCHEDULED_GIFTS_AND_RAFFLES_TIME_INPUT = "scheduledGiftAndRafflesTimeInput";
const ID_SCHEDULED_RESET_TIME_INPUT = "scheduledResetTimeInput";
const ID_BOT_PROCESS_TXT = "botProcessTxt";
const ID_BOT_STATUS_TXT = "botStatusTxt";
const ID_PREFERENCES_LINK = 'preferencesLink';
const ID_PREFERENCES_BOX = 'preferencesBox';
const ID_TIMER_PREFERENCES_TABLE = 'timerPreferencesTable';
const ID_TIMER_LINK = 'timerLink';
const ID_TR_SGA_SEASON_TRAP_SETUP = "trSGaSeasonTrapSetup";
const ID_SELECT_SGA_SEASON = "selectSGaSeason";
const ID_SELECT_SGA_WEAPON = "selectSGaWeapon";
const ID_SELECT_SGA_BASE = "selectSGaBase";
const ID_SELECT_SGA_BAIT = "selectSGaBait";
const ID_SELECT_SGA_TRINKET = "selectSGaTrinket";
const ID_TMP_KR_FRAME = 'tmpKRFrame';
const STORAGE_BOT_HORN_TIME_DELAY_MIN = "botHornTimeDelayMin";
const STORAGE_BOT_HORN_TIME_DELAY_MAX = "botHornTimeDelayMax";
const STORAGE_TRAP_CHECK_TIME_DELAY_MIN = "trapCheckTimeDelayMin";
const STORAGE_TRAP_CHECK_TIME_DELAY_MAX = "trapCheckTimeDelayMax";
const STORAGE_AUTOSOLVE_KR_DELAY_MIN = "autosolveKRDelayMin";
const STORAGE_AUTOSOLVE_KR_DELAY_MAX = "autosolveKRDelayMax";
const STORAGE_SCHEDULED_GIFTS_AND_RAFFLES_TIME = "scheduledGiftsAndRafflesTime";
const STORAGE_SCHEDULED_RESET_TIME = "scheduledResetTime";
const STORAGE_STATUS_GIFTS_AND_RAFFLES = "statusGiftsAndRaffles";
const STORAGE_WEAPON_NAMES = "weaponNames";
const STORAGE_BASE_NAMES = "baseNames";
const STORAGE_BAIT_NAMES = "baitNames";
const STORAGE_TRINKET_NAMES = "trinketNames";
const STORAGE_TRAP_SETUP_SGA = "trapSetupSG";
const IDX_WEAPON = 0;
const IDX_BASE = 1;
const IDX_BAIT = 2;
const IDX_TRINKET = 3;
const STYLE_CLASS_NAME_JNK_CAPTION = "JnKCaption";
const BOT_PROCESS_SCHEDULER = "Scheduler";
const BOT_PROCESS_Manual = "Manual";
const BOT_STATUS_IDLE = "Idle";
const SGA_SEASON_SPRING = "Spring";
const SGA_SEASON_SUMMER = "Summer";
const SGA_SEASON_AUTUMN = "Autumn";
const SGA_SEASON_WINTER = "Winter";
const SGA_SEASONS = [SGA_SEASON_SPRING, SGA_SEASON_SUMMER, SGA_SEASON_AUTUMN, SGA_SEASON_WINTER];
const POLICY_NAME_FORT_ROX = "Policy Fort Rox";
const POLICY_NAME_SEASONAL_GARDEN = "Policy Seasonal Garden";

// Policy description
class Policy {
    constructor() {
        this.trs = [];
    }
    setName(name) {
        this.name = name;
    }
    toString() {
        return "{  name : " + this.name + " }";
    }
}

class PolicySGa extends Policy {
    constructor () {
        super();
        this.setName("Seasonal Garden");
        this.trs[0] = ID_TR_SGA_SEASON_TRAP_SETUP;
    }
    resetTrapSetups() {
        this.trapSetups = {};
        this.trapSetups[SGA_SEASON_SPRING] = [];
        this.trapSetups[SGA_SEASON_SUMMER] = [];
        this.trapSetups[SGA_SEASON_AUTUMN] = [];
        this.trapSetups[SGA_SEASON_WINTER] = [];
    }
    initSelectTrapSetup() {
        var tmpStorage;
        if (isNullOrUndefined(this.trapSetups)) {
            tmpStorage = getStorage(STORAGE_TRAP_SETUP_SGA, null);
            if (isNullOrUndefined(tmpStorage)) {
                this.resetTrapSetups();
            } else {
                this.trapSetups = tmpStorage;
            }
        }
        var currentSeason = document.getElementById(ID_SELECT_SGA_SEASON).value;
        document.getElementById(ID_SELECT_SGA_WEAPON).value = this.trapSetups[currentSeason][IDX_WEAPON];
        document.getElementById(ID_SELECT_SGA_BASE).value = this.trapSetups[currentSeason][IDX_BASE];
        document.getElementById(ID_SELECT_SGA_BAIT).value = this.trapSetups[currentSeason][IDX_BAIT];
        document.getElementById(ID_SELECT_SGA_TRINKET).value = this.trapSetups[currentSeason][IDX_TRINKET];
    }
}

class PolicyFR extends Policy {
    constructor () {
        super();
        this.setName("Fort Rox");
    }
    resetTrapSetups() {
        this.trapSetups = {};
    }
    initSelectTrapSetups() {
    }
}

const POLICY_DICT = {};
function initPolicyDict() {
    var tmpPolicy;
    tmpPolicy = new PolicyFR();
    POLICY_DICT[POLICY_NAME_FORT_ROX] = tmpPolicy;
    tmpPolicy = new PolicySGa();
    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN] = tmpPolicy;
}

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

function setBotDocumentStyle () {
    var docStyle = document.getElementsByTagName("STYLE")[0];
    var botStyle = "." + STYLE_CLASS_NAME_JNK_CAPTION + " { text-align: right; font-weight: bold; }";
    if (isNullOrUndefined(docStyle.length)) {
        docStyle.innerHTML = botStyle;
    } else {
        docStyle.innerHTML += "\n" + botStyle;
    }
}

execScript();

function execScript() {
    if (DEBUG_MODE) console.log('RUN %cexeScript()', 'color: #9cffbd');

    try {
        initPolicyDict();
        setBotDocumentStyle();
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
            // Run counddown Trap Check Timer anyway
            window.setTimeout(function () {
                (countdownTrapCheckTimer)()
            }, 1000);
            // If the horn image exist, sound it, otherwise, countdown the timer
            if (hornExist()) {
                window.setTimeout(function () {
                    soundHorn()
                }, 500);
            } else {
                window.setTimeout(function () {
                    (countdownBotHornTimer)()
                }, 1000);
            }
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

function runScheduledGiftsAndRaffles() {
    function getGiftsAndRafflesStatus() {
        function gettingGiftsAndRafflesStatus() {
            var sendActionRemaining = parseInt(document.getElementsByClassName("giftSelectorView-numSendActionsRemaining")[0].innerHTML);
            if (sendActionRemaining <= 2) {
                g_statusGiftsAndRaffles = STATUS_GIFTS_AND_RAFFLES_COMPLETE;
                setStorage(STORAGE_STATUS_GIFTS_AND_RAFFLES, g_statusGiftsAndRaffles);
            }
        }
        var giftButton = document.getElementsByClassName("freeGifts")[0];
        fireEvent(giftButton, "click");
        window.setTimeout(function () {
            gettingGiftsAndRafflesStatus()
        }, 4.5 * 1000);
    }
    // Lock bot
    g_botProcess = BOT_PROCESS_SCHEDULER;
    document.getElementById(ID_BOT_PROCESS_TXT).innerHTML = g_botProcess;
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Scheduled Gifts and Raffles";
    // Send gifts and raffles
    prepareSendingGiftsAndRaffles();
    // Check if the sending is complete
    window.setTimeout(function () {
        getGiftsAndRafflesStatus();
    }, 90 * 1000);
    // Unlock bot
    window.setTimeout(function () {
        reloadCampPage();
    }, 100 * 1000);
}

function resetSchedule() {
    // Lock bot
    g_botProcess = BOT_PROCESS_SCHEDULER;
    document.getElementById(ID_BOT_PROCESS_TXT).innerHTML = g_botProcess;
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Resetting Scheduler";
    // Actual reset schedule
    g_statusGiftsAndRaffles = STATUS_GIFTS_AND_RAFFLES_INCOMPLETE;
    setStorage(STORAGE_STATUS_GIFTS_AND_RAFFLES, g_statusGiftsAndRaffles);
    // Unlock bot
    window.setTimeout(function () {
        reloadCampPage();
    }, 60 * 1000);
}

function checkSchedule() {
    var dateNow = new Date();
    var g_endScheduledResetTime = new Date();
    g_endScheduledResetTime.setHours(g_beginScheduledResetTime.getHours(), g_beginScheduledResetTime.getMinutes() + 1, 0);

    if (g_beginScheduledResetTime < dateNow && g_endScheduledResetTime > dateNow) {
        resetSchedule();
    } else if (g_beginScheduledGiftsAndRafflesTime < dateNow && g_statusGiftsAndRaffles == STATUS_GIFTS_AND_RAFFLES_INCOMPLETE) {
        runScheduledGiftsAndRaffles();
    }
    dateNow = null;
}

function countdownBotHornTimer() {
    // Update timer
    var dateNow = new Date();
    var intervalTime = timeElapsedInSeconds(g_lastBotHornTimeRecorded, dateNow);
    g_lastBotHornTimeRecorded = undefined;
    g_lastBotHornTimeRecorded = dateNow;

    g_nextBotHornTimeInSeconds -= intervalTime;
    intervalTime = undefined;

    if (g_nextBotHornTimeInSeconds <= 0) {
        prepareSoundingHorn();
    } else {

        if (g_botProcess == BOT_PROCESS_IDLE) {
            checkSchedule();
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

function hornExist() {
    var headerElement = document.getElementById(ID_HEADER_ELEMENT);
    if (headerElement) {
        var headerClass = headerElement.getAttribute('class');
        if (headerClass.indexOf(HORNREADY_TXT) !== -1) {
            headerElement = null;
            headerClass = null;
            return true;
        }
    }
    return false;
}

function soundHorn() {
    var hornElement = document.getElementsByClassName(CLASS_HUNTERHORN_ELEMENT)[0].firstChild;
    fireEvent(hornElement, 'click');
    hornElement = null;

    // double check if the horn was already sounded
    window.setTimeout(function () {
        afterSoundingHorn()
    }, 1000);
}

function prepareSoundingHorn() {
    if (DEBUG_MODE) console.log("RUN %csoundHorn()", "color: #FF7700");
    if (hornExist()) {
        soundHorn();
    } else {
        // The horn is missing
        updateTitleTxt("Synchronizing Data...");
        updateNextBotHornTimeTxt("Hunter horn is missing. Synchronizing data...");

        window.setTimeout(function () {
            reloadCampPage();
        }, 10000);
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
    }, 0.5 * 1000);
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

    g_scheduledGiftsAndRafflesTime = getStorage(STORAGE_SCHEDULED_GIFTS_AND_RAFFLES_TIME, g_scheduledGiftsAndRafflesTime);
    g_beginScheduledGiftsAndRafflesTime.setHours(parseInt(g_scheduledGiftsAndRafflesTime.substring(0,2)), parseInt(g_scheduledGiftsAndRafflesTime.substring(3,5)), 0);
    g_scheduledResetTime = getStorage(STORAGE_SCHEDULED_RESET_TIME, g_scheduledResetTime);
    g_beginScheduledResetTime.setHours(parseInt(g_scheduledResetTime.substring(0,2)), parseInt(g_scheduledResetTime.substring(3,5)), 0);
    g_statusGiftsAndRaffles = getStorage(STORAGE_STATUS_GIFTS_AND_RAFFLES, g_statusGiftsAndRaffles);
    g_weaponNames = getStorage(STORAGE_WEAPON_NAMES, g_weaponNames);
    g_baseNames = getStorage(STORAGE_BASE_NAMES, g_baseNames);
    g_baitNames = getStorage(STORAGE_BAIT_NAMES, g_baitNames);
    g_trinketNames = getStorage(STORAGE_TRINKET_NAMES, g_trinketNames);
}

function getStorage(name, defaultValue) {
    var temp = JSON.parse(window.localStorage.getItem(name));
    if (isNullOrUndefined(temp)) {
        return defaultValue;
    } else {
        return temp;
    }
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
    window.localStorage.setItem(name, JSON.stringify(value));
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

function listAttributes(obj) {
    var attrs = obj.attributes;
    var tmpTxt = "";
    for (var i = 0; i < attrs.length; i++) {
        tmpTxt += attrs[i].name + " : " + attrs[i].value + "\n";
    }
    alert(tmpTxt);
}

function manualUpdatingTraps() {
    document.getElementById(ID_BOT_PROCESS_TXT).innerHTML = BOT_PROCESS_Manual;
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual updating Bases";
    prepareUpdatingTraps();
}

function prepareUpdatingTraps() {
    function updateTrinkets() {
        function getCampPageTrinketNames() {
            var trinketName;
            g_trinketNames = [];
            var campageTrinkets = document.getElementsByClassName('campPage-trap-itemBrowser-item trinket');
            for (var i = 0; i < campageTrinkets.length; ++i) {
                trinketName = campageTrinkets[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                if (g_trinketNames.indexOf(trinketName) == -1) {
                    g_trinketNames[g_trinketNames.length] = trinketName;
                }
                trinketName = null;
            }
            campageTrinkets = null;
            g_trinketNames.sort();
            setStorage(STORAGE_TRINKET_NAMES, g_trinketNames);
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish updating Trinkets";;
        }
        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual updating Trinkets";
        var currentTrinket = document.getElementsByClassName('campPage-trap-armedItem trinket')[0];
        fireEvent(currentTrinket, 'click');
        window.setTimeout(function () {
            getCampPageTrinketNames();
        }, 4.5 * 1000);
    }
    updateTrinkets();
}

function testSaveObjToStorage() {
    alert("in saveObjToStorage");
    var myObj = {"key1": ['a', 'b', 'c']};
    //alert(myObj.key1);

    for (var i = 0; i < myObj.key1.length; i++) {
        alert(myObj.key1[i]);
    }
    setStorage("testObj", JSON.stringify(myObj));
}

function testLoadObjFromStorage() {
    alert("in loadObjFromStorage");
    var myObj = JSON.parse(getStorage("testObj"));
    for (var i = 0; i < myObj.key1.length; i++) {
        alert(myObj.key1[i]);
    }
}

function testSetDropDownList () {
    var testRow = document.getElementById("test row");
    var testDropDownListCell = testRow.insertCell();
    var itemList = g_trinketNames;
    //var itemList = ["a", "b", "c"];
    var dropDownList = document.createElement('select');
    dropDownList.id = "test dropDownList";
    dropDownList.style.width = "120px";
    for (var i = 0; i < itemList.length; i++) {
        var itemOption = document.createElement("option");
        itemOption.value = itemList[i];
        itemOption.text = itemList[i];
        dropDownList.appendChild(itemOption);
        itemOption = null;
    }
    testDropDownListCell.appendChild(dropDownList);
    testDropDownListCell = null;
    itemList = null;
    dropDownList = null;
    testRow = null;
}

function testSelectDropDownList() {
    alert(document.getElementById("test dropDownList").value);
}

function testDict() {
    var tmpPolicy = POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN];
    alert(tmpPolicy.trapSetups[SGA_SEASON_SPRING].weapon);
    /*
    for (const [key, value] of Object.entries(POLICY_DICT)) {
        alert(key + ": " + value);
    }
    */
}

function test1() {
    testDict();
    //testSaveObjToStorage();
    //manualUpdatingTraps();
    //testSetDropDownList();
    //displayDocumentStyles();
    //clickAndArmWeapon();
}

function test2() {
    //testSelectDropDownList();
    //testLoadObjFromStorage();
}

function manualClaimingYesterdayGifts() {
    document.getElementById(ID_BOT_PROCESS_TXT).innerHTML = BOT_PROCESS_Manual;
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual claiming yesterday Gifts";
    prepareClaimingGifts(false);
}

function manualClaimingTodayGifts() {
    document.getElementById(ID_BOT_PROCESS_TXT).innerHTML = BOT_PROCESS_Manual;
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual claiming today Gifts";
    prepareClaimingGifts(true);
}

function prepareClaimingGifts(fromTop) {
    function claimGifts(fromTop) {
        function claimingGifts(fromTop, giftIndex) {
            var giftRow;
            if (fromTop) {
                giftRow = giftRows[giftIndex];
            } else {
                giftRow = giftRows[nGiftRows-giftIndex-1];
            }
            var senderName = giftRow.getElementsByClassName("giftSelectorView-inbox-gift-details")[0].getElementsByTagName("a")[0].text;
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Claiming a gift from " + senderName;
            var actionButton = giftRow.getElementsByClassName("giftSelectorView-inbox-gift-actions")[0].getElementsByClassName("claim mousehuntActionButton")[0];
            if (!actionButton.classList.contains("disabled")) {
                fireEvent(actionButton, "click");
            }
            giftIndex++;
            if (giftIndex < 15 && giftIndex < nGiftRows) {
                window.setTimeout(function () {
                    claimingGifts(fromTop, giftIndex);
                }, 1 * 1000);
            }
        }
        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Retrieving gift list";
        var giftRows = document.getElementsByClassName("giftSelectorView-inbox-giftContainer")[0].getElementsByClassName("giftSelectorView-inbox-giftRow");
        var nGiftRows = giftRows.length
        var giftIndex = 0;
        window.setTimeout(function () {
            claimingGifts(fromTop, giftIndex);
        }, 0.5 * 1000);
    }
    var giftButton = document.getElementsByClassName("freeGifts")[0];
    fireEvent(giftButton, "click");
    window.setTimeout(function () {
        claimGifts(fromTop)
    }, 4.5 * 1000);
}

function manualSendingGiftsAndRaffles() {
    document.getElementById(ID_BOT_PROCESS_TXT).innerHTML = BOT_PROCESS_Manual;
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual sending Gifts and Raffles";
    prepareSendingGiftsAndRaffles();
}

function prepareSendingGiftsAndRaffles() {
    function clickActionButton(actionButton) {
        fireEvent(actionButton.getElementsByClassName("userInteractionButtonsView-button")[0], "click");
        actionButton = null;
    }
    function sendGiftsAndRaffles(friendIndex, nGifts, nRaffles) {
        function sendingGiftsAndRaffles(friendIndex, nGifts, nRaffles) {
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
                }, 1 * 1000);
            }
            friendName = null;
            friendRow = null;
            friendIndex++;
            if (friendIndex < nGifts) {
                window.setTimeout(function () {
                    sendingGiftsAndRaffles(friendIndex, nGifts, nRaffles);
                }, 2 * 1000);
            }
        }
        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Retrieving friend list";
        var friendRows = document.getElementsByClassName("friendsPage-friendRow");
        window.setTimeout(function () {
            sendingGiftsAndRaffles(friendIndex, nGifts, nRaffles);
        }, 0.5 * 1000);
    }
    function gotoNextFriendList() {
        // Got to the second frield list page
        var nextFriendListLink = document.getElementsByClassName("next active pagerView-section")[0].getElementsByTagName("a")[0];
        fireEvent(nextFriendListLink, "click");

        // Go through all sendGift and sendRaffle buttons in the first page
        window.setTimeout(function () {
            sendGiftsAndRaffles(0, 4, 0);
        }, 5 * 1000);
    }
    var friendRows;
    if (DEBUG_MODE) console.log('RUN sendRafflesAndGifts()');

    // Goto friend list page
    var friendListLink = document.getElementsByClassName("mousehuntHud-gameInfo")[0].getElementsByTagName("a")[0];
    fireEvent(friendListLink, "click");
    window.setTimeout(function () {
        sendGiftsAndRaffles(0, 20, 20);
    }, 5 * 1000);

    // Go through all sendGift and sendRaffle buttons in the first page
    window.setTimeout(function () {
        gotoNextFriendList();
    }, 60 * 1000);
}

function embedUIStructure() {
    // This function is to embed UI structure at the top of related pages
    // The UI consist of 3 parts
    // 1. timer
    // 2. timer preferences
    // 3. policy preferences for setting up trap based on location and/or event

    function embedStatusTable() {
        var tmpTxt;
        var statusSection = document.createElement('div');
        var statusDisplayTable = document.createElement('table');
        statusDisplayTable.width = "100%";

        // The first row shows title and version (also some misc buttons)
        var trFirst = statusDisplayTable.insertRow();
        var statusDisplayTitle = trFirst.insertCell();
        statusDisplayTitle.colSpan = 2;
        statusDisplayTitle.innerHTML = "<b><a href=\"https://github.com/bujaraty/JnK/blob/main/MH_Admirer.user.js\" target=\"_blank\">J n K Admirer (version " + g_strScriptVersion + ")</a></b>";
        statusDisplayTitle = null;
        var miscStatusCell = trFirst.insertCell();
        miscStatusCell.style.fontSize = "9px";
        tmpTxt = document.createTextNode("Gifts & Raffles status : " + g_statusGiftsAndRaffles + "  ");
        miscStatusCell.appendChild(tmpTxt);
        tmpTxt = null;
        var miscButtonsCell = trFirst.insertCell();
        miscButtonsCell.style.textAlign = "right";
        var sendGiftsAndRafflesButton = document.createElement('button');
        sendGiftsAndRafflesButton.onclick = manualSendingGiftsAndRaffles
        sendGiftsAndRafflesButton.style.fontSize = "8px";
        var buttonTxt = document.createTextNode("Send Gifts & Raffles");
        sendGiftsAndRafflesButton.appendChild(buttonTxt);
        buttonTxt = null;
        miscButtonsCell.appendChild(sendGiftsAndRafflesButton);
        var claimYesterdayGiftsButton = document.createElement('button');
        claimYesterdayGiftsButton.onclick = manualClaimingYesterdayGifts
        claimYesterdayGiftsButton.style.fontSize = "8px";
        buttonTxt = document.createTextNode("Claim yesterday gifts");
        claimYesterdayGiftsButton.appendChild(buttonTxt);
        buttonTxt = null;
        miscButtonsCell.appendChild(claimYesterdayGiftsButton);
        var claimTodayGiftsButton = document.createElement('button');
        claimTodayGiftsButton.onclick = manualClaimingTodayGifts
        claimTodayGiftsButton.style.fontSize = "8px";
        buttonTxt = document.createTextNode("Claim today gifts");
        claimTodayGiftsButton.appendChild(buttonTxt);
        buttonTxt = null;
        miscButtonsCell.appendChild(claimTodayGiftsButton);
        miscButtonsCell = null;
        trFirst = null;

        // The second row shows next bot horn time countdown
        var trSecond = statusDisplayTable.insertRow();
        var nextBotHornTimeCaptionCell = trSecond.insertCell();
        nextBotHornTimeCaptionCell.width = 20;
        nextBotHornTimeCaptionCell.style.fontWeight = "bold";
        nextBotHornTimeCaptionCell.innerHTML = "Next Hunter Horn Time : ";
        g_nextBotHornTimeDisplay = trSecond.insertCell();
        g_nextBotHornTimeDisplay.style.textAlign = "left";
        g_nextBotHornTimeDisplay.width = 260;
        g_nextBotHornTimeDisplay.innerHTML = "Loading...";
        nextBotHornTimeCaptionCell = null;
        trSecond = null;

        // The third row shows next trap check time countdown
        var trThird = statusDisplayTable.insertRow();
        var nextTrapCheckTimeCaptionCell = trThird.insertCell();
        nextTrapCheckTimeCaptionCell.style.fontWeight = "bold";
        nextTrapCheckTimeCaptionCell.innerHTML = "Next Trap Check Time :  ";
        g_nextTrapCheckTimeDisplay = trThird.insertCell();
        g_nextTrapCheckTimeDisplay.innerHTML = "Loading...";
        nextTrapCheckTimeCaptionCell = null;
        trThird = null;

        /*
        // The forth row is very temporary just for testing
        var trForth = statusDisplayTable.insertRow();
        trForth.id = "test row";
        var testButtonsCell = trForth.insertCell();
        var test1Button = document.createElement('button');
        test1Button.onclick = test1
        test1Button.style.fontSize = "10px";
        tmpTxt = document.createTextNode("test 1");
        test1Button.appendChild(tmpTxt);
        tmpTxt = null;
        testButtonsCell.appendChild(test1Button);
        var test2Button = document.createElement('button');
        test2Button.onclick = test2
        test2Button.style.fontSize = "10px";
        tmpTxt = document.createTextNode("test 2");
        test2Button.appendChild(tmpTxt);
        tmpTxt = null;
        testButtonsCell.appendChild(test2Button);
        */

        statusSection.appendChild(statusDisplayTable);
        statusDisplayTable = null;

        return statusSection;
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

        function toggleTimerPreferencesTable() {
            var toggleLink = document.getElementById(ID_TIMER_LINK);
            var preferencesTable = document.getElementById(ID_TIMER_PREFERENCES_TABLE);
            if (toggleLink.innerHTML == '[Show]') {
                toggleLink.innerHTML = '[Hide]'
                preferencesTable.style.display = 'table';
            } else {
                toggleLink.innerHTML = '[Show]'
                preferencesTable.style.display = 'none';
            }
        }

        function embedPreferencesHeaderTable() {
            var preferencesHeaderTable = document.createElement('table');
            preferencesHeaderTable.width = "100%";
            var preferencesHeaderRow = preferencesHeaderTable.insertRow();
            var botProcessCaption = preferencesHeaderRow.insertCell();
            botProcessCaption.width = 60;
            botProcessCaption.style.fontWeight = "bold";
            botProcessCaption.innerHTML = "Bot Process :  ";
            var botProcessTxt = preferencesHeaderRow.insertCell();
            botProcessTxt.width = 130;
            botProcessTxt.innerHTML = g_botProcess;
            botProcessTxt.id = ID_BOT_PROCESS_TXT;
            botProcessCaption = null;
            botProcessTxt = null;
            var botStatusCaption = preferencesHeaderRow.insertCell();
            botStatusCaption.width = 45;
            botStatusCaption.style.fontWeight = "bold";
            botStatusCaption.innerHTML = "Status :  ";
            var botStatusTxt = preferencesHeaderRow.insertCell();
            botStatusTxt.innerHTML = BOT_STATUS_IDLE;
            botStatusTxt.id = ID_BOT_STATUS_TXT;
            botStatusCaption = null;
            botStatusTxt = null;

            var preferencesHeaderCell = preferencesHeaderRow.insertCell();
            preferencesHeaderCell.style.textAlign = "right";
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

        function embedTimerPreferences() {
            function saveTimerPreferences() {
                try {
                    setStorage(STORAGE_BOT_HORN_TIME_DELAY_MIN, document.getElementById(ID_BOT_HORN_TIME_DELAY_MIN_INPUT).value);
                    setStorage(STORAGE_BOT_HORN_TIME_DELAY_MAX, document.getElementById(ID_BOT_HORN_TIME_DELAY_MAX_INPUT).value);
                    setStorage(STORAGE_TRAP_CHECK_TIME_DELAY_MIN, document.getElementById(ID_TRAP_CHECK_TIME_DELAY_MIN_INPUT).value);
                    setStorage(STORAGE_TRAP_CHECK_TIME_DELAY_MAX, document.getElementById(ID_TRAP_CHECK_TIME_DELAY_MAX_INPUT).value);
                    setStorage(STORAGE_AUTOSOLVE_KR_DELAY_MIN, document.getElementById(ID_AUTOSOLVE_KR_DELAY_MIN_INPUT).value);
                    setStorage(STORAGE_AUTOSOLVE_KR_DELAY_MAX, document.getElementById(ID_AUTOSOLVE_KR_DELAY_MAX_INPUT).value);
                    setStorage(STORAGE_SCHEDULED_GIFTS_AND_RAFFLES_TIME, document.getElementById(ID_SCHEDULED_GIFTS_AND_RAFFLES_TIME_INPUT).value);
                    setStorage(STORAGE_SCHEDULED_RESET_TIME, document.getElementById(ID_SCHEDULED_RESET_TIME_INPUT).value);
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
            var captionCell;
            var timerPreferencesTable = document.createElement('table');
            timerPreferencesTable.id = ID_TIMER_PREFERENCES_TABLE;
            timerPreferencesTable.width = "100%";

            var trEmpty = timerPreferencesTable.insertRow();
            trEmpty.style.height = "4px"
            trEmpty = null;

            var trNextBotHornTimePreferences = timerPreferencesTable.insertRow();
            trNextBotHornTimePreferences.style.height = "21px"
            captionCell = trNextBotHornTimePreferences.insertCell();
            captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
            captionCell.innerHTML = "Bot Horn Time Delay :  ";
            captionCell.width = 270;
            captionCell = null;
            var nextBotHornTimePreferencesSettings = trNextBotHornTimePreferences.insertCell();
            nextBotHornTimePreferencesSettings.width = 250;
            var botHornTimeDelayMinInput = document.createElement('INPUT');
            botHornTimeDelayMinInput.type = "number";
            botHornTimeDelayMinInput.style.fontSize = "12px";
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
            botHornTimeDelayMaxInput.style.fontSize = "12px";
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
            trNextBotHornTimePreferences = null;

            var trNextTrapCheckTimePreferences = timerPreferencesTable.insertRow();
            trNextTrapCheckTimePreferences.style.height = "21px"
            captionCell = trNextTrapCheckTimePreferences.insertCell();
            captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
            captionCell.innerHTML = "Trap Check Time Delay :  ";
            captionCell = null;
            var nextTrapCheckTimePreferencesSettings = trNextTrapCheckTimePreferences.insertCell();
            var trapCheckTimeDelayMinInput = document.createElement('INPUT');
            trapCheckTimeDelayMinInput.type = "number";
            trapCheckTimeDelayMinInput.style.fontSize = "12px";
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
            trapCheckTimeDelayMaxInput.style.fontSize = "12px";
            trapCheckTimeDelayMaxInput.min = "1";
            trapCheckTimeDelayMaxInput.max = "600";
            trapCheckTimeDelayMaxInput.size = "5";
            trapCheckTimeDelayMaxInput.id = ID_TRAP_CHECK_TIME_DELAY_MAX_INPUT;
            trapCheckTimeDelayMaxInput.value = g_trapCheckTimeDelayMax;
            nextTrapCheckTimePreferencesSettings.appendChild(trapCheckTimeDelayMaxInput);
            tmpTxt = document.createTextNode(" seconds");
            nextTrapCheckTimePreferencesSettings.appendChild(tmpTxt);
            tmpTxt = null;
            var trapCheckResetTimeButtonCell = trNextTrapCheckTimePreferences.insertCell();
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
            trNextTrapCheckTimePreferences = null;

            var trAutosolveKRPreferences = timerPreferencesTable.insertRow();
            trAutosolveKRPreferences.style.height = "24px"
            captionCell = trAutosolveKRPreferences.insertCell();
            captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
            captionCell.innerHTML = "Auto Solve King Reward Delay :  ";
            captionCell = null;
            var autosolveKRPreferencesSettings = trAutosolveKRPreferences.insertCell();
            var autosolveKRDelayMinInput = document.createElement('INPUT');
            autosolveKRDelayMinInput.type = "number";
            autosolveKRDelayMinInput.style.fontSize = "12px";
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
            autosolveKRDelayMaxInput.style.fontSize = "12px";
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
            trAutosolveKRPreferences = null;

            var trSchedulerTitle = timerPreferencesTable.insertRow();
            trSchedulerTitle.style.height = "20px"
            var schedulerTitle = trSchedulerTitle.insertCell();
            schedulerTitle.colSpan = 3;
            schedulerTitle.innerHTML = "Scheduler time";
            schedulerTitle.style.fontWeight = "bold";
            schedulerTitle.style.fontSize = "12px";
            schedulerTitle.style.textAlign = "center";

            var trScheduledGiftAndRafflesPreferences = timerPreferencesTable.insertRow();
            trScheduledGiftAndRafflesPreferences.style.height = "24px"
            captionCell = trScheduledGiftAndRafflesPreferences.insertCell();
            captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
            captionCell.innerHTML = "Sending Gifts and Raffles :  ";
            captionCell = null;
            var scheduledGiftsAndRafflesPreferencesSettings = trScheduledGiftAndRafflesPreferences.insertCell();
            var scheduledGiftsAndRafflesBeginTime = document.createElement('INPUT');
            scheduledGiftsAndRafflesBeginTime.type = "time";
            scheduledGiftsAndRafflesBeginTime.style.fontSize = "12px";
            scheduledGiftsAndRafflesBeginTime.id = ID_SCHEDULED_GIFTS_AND_RAFFLES_TIME_INPUT;
            scheduledGiftsAndRafflesBeginTime.value = g_scheduledGiftsAndRafflesTime;
            scheduledGiftsAndRafflesPreferencesSettings.appendChild(scheduledGiftsAndRafflesBeginTime);
            scheduledGiftsAndRafflesBeginTime = null;
            scheduledGiftsAndRafflesPreferencesSettings = null;
            trScheduledGiftAndRafflesPreferences = null;

            var trScheduledResetPreferences = timerPreferencesTable.insertRow();
            trScheduledResetPreferences.style.height = "21px"
            captionCell = trScheduledResetPreferences.insertCell();
            captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
            captionCell.innerHTML = "New Date :  ";
            captionCell = null;
            var scheduledResetPreferencesSettings = trScheduledResetPreferences.insertCell();
            var scheduledResetTime = document.createElement('INPUT');
            scheduledResetTime.type = "time";
            scheduledResetTime.style.fontSize = "12px";
            scheduledResetTime.id = ID_SCHEDULED_RESET_TIME_INPUT;
            scheduledResetTime.value = g_scheduledResetTime;
            scheduledResetPreferencesSettings.appendChild(scheduledResetTime);
            scheduledResetTime = null;
            scheduledResetPreferencesSettings = null;
            trScheduledResetPreferences = null;

            var trLastRow = timerPreferencesTable.insertRow();
            var saveButtonCell = trLastRow.insertCell();
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
            trLastRow = null;
            saveButtonCell = null;
            saveTimerPreferencesButton = null;

            return timerPreferencesTable;
        }

        function embedPolicyPreferences() {
            function savePolicyPreferences() {
                try {
                } catch (e) {
                    console.log(e);
                }
                reloadCampPage();
            }

            function onChangePolicy(event) {
                var tmpDisplay;
                var tmpPolicy
                if (event.target.value == "Select policy") {
                    return;
                }
                for (const [key, policyObj] of Object.entries(POLICY_DICT)) {
                    tmpDisplay = (event.target.value == policyObj.name)? "table-row" : "none";
                    tmpPolicy = POLICY_DICT[key];
                    for (const tr of tmpPolicy.trs){
                        document.getElementById(tr).style.display = tmpDisplay;
                    }
                    if (tmpDisplay == "table-row" && isNullOrUndefined(tmpPolicy.initSelectTrapSetup)) {
                        alert("Cannot find function initSelectTrapSetup for policy: " + policyObj.name);
                    } else if (tmpDisplay == "table-row") {
                        tmpPolicy.initSelectTrapSetup();
                    }
                    tmpPolicy = null;
                    tmpDisplay = null;
                }
            }

            function updateTraps() {
                function updateWeapons() {
                    function getCampPageWeaponNames() {
                        //var itemId;
                        var weaponName;
                        g_weaponNames = [];
                        var campageWeapons = document.getElementsByClassName('campPage-trap-itemBrowser-item weapon');
                        for (var i = 0; i < campageWeapons.length; ++i) {
                            //itemId = campageWeapons[i].getAttribute("data-item-id");
                            weaponName = campageWeapons[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                            if (g_weaponNames.indexOf(weaponName) == -1) {
                                g_weaponNames[g_weaponNames.length] = weaponName;
                            }
                            //itemId = null;
                            weaponName = null;
                        }
                        campageWeapons = null;
                        g_weaponNames.sort();
                        setStorage(STORAGE_WEAPON_NAMES, g_weaponNames);
                        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Updating Weapons";;
                    }
                    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual Updating Weapons";
                    var currentWeapon = document.getElementsByClassName('campPage-trap-armedItem weapon')[0];
                    fireEvent(currentWeapon, 'click');
                    window.setTimeout(function () {
                        getCampPageWeaponNames();
                    }, 4.5 * 1000);
                }

                function updateBases() {
                    function getCampPageBaseNames() {
                        var baseName;
                        g_baseNames = [];
                        var campageBases = document.getElementsByClassName('campPage-trap-itemBrowser-item base');
                        for (var i = 0; i < campageBases.length; ++i) {
                            baseName = campageBases[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                            if (g_baseNames.indexOf(baseName) == -1) {
                                g_baseNames[g_baseNames.length] = baseName;
                            }
                            baseName = null;
                        }
                        campageBases = null;
                        g_baseNames.sort();
                        setStorage(STORAGE_BASE_NAMES, g_baseNames);
                        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Updating Bases";;
                    }
                    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual Updating Bases";
                    var currentBase = document.getElementsByClassName('campPage-trap-armedItem base')[0];
                    fireEvent(currentBase, 'click');
                    window.setTimeout(function () {
                        getCampPageBaseNames();
                    }, 4.5 * 1000);
                }

                function updateBaits() {
                    function getCampPageBaitNames() {
                        var baitName;
                        g_baitNames = [];
                        var campageBaits = document.getElementsByClassName('campPage-trap-itemBrowser-item bait');
                        for (var i = 0; i < campageBaits.length; ++i) {
                            baitName = campageBaits[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                            if (g_baitNames.indexOf(baitName) == -1) {
                                g_baitNames[g_baitNames.length] = baitName;
                            }
                            baitName = null;
                        }
                        campageBaits = null;
                        g_baitNames.sort();
                        setStorage(STORAGE_BAIT_NAMES, g_baitNames);
                        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Updating Baits";;
                    }
                    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual Updating Baits";
                    var currentBait = document.getElementsByClassName('campPage-trap-armedItem bait')[0];
                    fireEvent(currentBait, 'click');
                    window.setTimeout(function () {
                        getCampPageBaitNames();
                    }, 4.5 * 1000);
                }

                function updateTrinkets() {
                    function getCampPageTrinketNames() {
                        var trinketName;
                        g_trinketNames = [];
                        var campageTrinkets = document.getElementsByClassName('campPage-trap-itemBrowser-item trinket');
                        for (var i = 0; i < campageTrinkets.length; ++i) {
                            trinketName = campageTrinkets[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                            if (g_trinketNames.indexOf(trinketName) == -1) {
                                g_trinketNames[g_trinketNames.length] = trinketName;
                            }
                            trinketName = null;
                        }
                        campageTrinkets = null;
                        g_trinketNames.sort();
                        setStorage(STORAGE_TRINKET_NAMES, g_trinketNames);
                        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Updating Trinkets";;
                    }
                    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual Updating Trinkets";
                    var currentTrinket = document.getElementsByClassName('campPage-trap-armedItem trinket')[0];
                    fireEvent(currentTrinket, 'click');
                    window.setTimeout(function () {
                        getCampPageTrinketNames();
                    }, 4.5 * 1000);
                }

                document.getElementById(ID_BOT_PROCESS_TXT).innerHTML = BOT_PROCESS_Manual;
                window.setTimeout(function () {
                    updateWeapons();
                }, 0.5 * 1000);
                window.setTimeout(function () {
                    updateBases();
                }, 7 * 1000);
                window.setTimeout(function () {
                    updateBaits();
                }, 13 * 1000);
                window.setTimeout(function () {
                    updateTrinkets();
                }, 19 * 1000);
                window.setTimeout(function () {
                    reloadCampPage();
                }, 25 * 1000);
            }

            function getSelectWeapon() {
                var itemOption;
                var selectWeapon = document.createElement('select');
                selectWeapon.style.width = "80px";
                for (var i = 0; i < g_weaponNames.length; i++) {
                    itemOption = document.createElement("option");
                    itemOption.value = g_weaponNames[i];
                    itemOption.text = g_weaponNames[i];
                    selectWeapon.appendChild(itemOption);
                    itemOption = null;
                }
                selectWeapon.selectedIndex = -1;
                return selectWeapon;
            }

            function getSelectBase() {
                var itemOption;
                var selectBase = document.createElement('select');
                selectBase.style.width = "80px";
                for (var i = 0; i < g_baseNames.length; i++) {
                    itemOption = document.createElement("option");
                    itemOption.value = g_baseNames[i];
                    itemOption.text = g_baseNames[i];
                    selectBase.appendChild(itemOption);
                    itemOption = null;
                }
                selectBase.selectedIndex = -1;
                return selectBase;
            }

            function getSelectBait() {
                var itemOption;
                var selectBait = document.createElement('select');
                selectBait.style.width = "80px";
                for (var i = 0; i < g_baitNames.length; i++) {
                    itemOption = document.createElement("option");
                    itemOption.value = g_baitNames[i];
                    itemOption.text = g_baitNames[i];
                    selectBait.appendChild(itemOption);
                    itemOption = null;
                }
                selectBait.selectedIndex = -1;
                return selectBait;
            }

            function getSelectTrinket() {
                var itemOption;
                var selectTrinket = document.createElement('select');
                selectTrinket.style.width = "80px";
                for (var i = 0; i < g_trinketNames.length; i++) {
                    itemOption = document.createElement("option");
                    itemOption.value = g_trinketNames[i];
                    itemOption.text = g_trinketNames[i];
                    selectTrinket.appendChild(itemOption);
                    itemOption = null;
                }
                selectTrinket.selectedIndex = -1;
                return selectTrinket;
            }

            function insertSelectPolicyRow() {
                var captionCell;
                var itemOption;
                var trSelectPolicy = policyPreferencesTable.insertRow();
                trSelectPolicy.style.height = "24px"
                captionCell = trSelectPolicy.insertCell();
                captionCell.width = 270;
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Select Location :  ";
                captionCell = null;
                var selectPolicyCell = trSelectPolicy.insertCell();
                var selectPolicy = document.createElement('select');
                selectPolicy.style.width = "120px";
                selectPolicy.onchange = onChangePolicy;
                itemOption = document.createElement("option");
                itemOption.value = "Select policy";
                itemOption.text = "Select policy";
                selectPolicy.appendChild(itemOption);
                itemOption = null;
                for (const [key, policyObj] of Object.entries(POLICY_DICT)) {
                    itemOption = document.createElement("option");
                    itemOption.value = policyObj.name;
                    itemOption.text = policyObj.name;
                    selectPolicy.appendChild(itemOption);
                    itemOption = null;
                }
                selectPolicyCell.appendChild(selectPolicy);
                selectPolicy = null;
                selectPolicyCell = null;
                trSelectPolicy = null;
            }

            function insertSGaPolicyPreferences() {
                function onChangeSGaSelectSeason(event) {
                    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].initSelectTrapSetup();
                }

                function saveSGaWeapon(event) {
                    var currentSeason = document.getElementById(ID_SELECT_SGA_SEASON).value;
                    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups[currentSeason][IDX_WEAPON] = event.target.value;
                    currentSeason = null;
                    setStorage(STORAGE_TRAP_SETUP_SGA, POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups);
                }

                function saveSGaBase(event) {
                    var currentSeason = document.getElementById(ID_SELECT_SGA_SEASON).value;
                    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups[currentSeason][IDX_BASE] = event.target.value;
                    currentSeason = null;
                    setStorage(STORAGE_TRAP_SETUP_SGA, POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups);
                }

                function saveSGaBait(event) {
                    var currentSeason = document.getElementById(ID_SELECT_SGA_SEASON).value;
                    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups[currentSeason][IDX_BAIT] = event.target.value;
                    currentSeason = null;
                    setStorage(STORAGE_TRAP_SETUP_SGA, POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups);
                }

                function saveSGaTrinket(event) {
                    var currentSeason = document.getElementById(ID_SELECT_SGA_SEASON).value;
                    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups[currentSeason][IDX_TRINKET] = event.target.value;
                    currentSeason = null;
                    setStorage(STORAGE_TRAP_SETUP_SGA, POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups);
                }

                function resetSGaTrapSetup() {
                    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].resetTrapSetups();
                    setStorage(STORAGE_TRAP_SETUP_SGA, POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups);
                }

                var captionCell;
                var tmpTxt;
                var itemOption;
                var trSGaSeasonTrapSetup = policyPreferencesTable.insertRow();
                trSGaSeasonTrapSetup.id = ID_TR_SGA_SEASON_TRAP_SETUP;
                trSGaSeasonTrapSetup.style.height = "24px";
                trSGaSeasonTrapSetup.style.display = "none";
                captionCell = trSGaSeasonTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for ";
                var selectSGaSeason = document.createElement('select');
                selectSGaSeason.id = ID_SELECT_SGA_SEASON;
                selectSGaSeason.style.width = "70px";
                selectSGaSeason.onchange = onChangeSGaSelectSeason;
                for (const season of SGA_SEASONS){
                    itemOption = document.createElement("option");
                    itemOption.value = season
                    itemOption.text = season
                    selectSGaSeason.appendChild(itemOption);
                    itemOption = null;
                }
                captionCell.appendChild(selectSGaSeason);
                tmpTxt = document.createTextNode(" :  ");
                captionCell.appendChild(tmpTxt);
                captionCell = null;
                tmpTxt = null;
                selectSGaSeason = null;
                var trapSetupCell = trSGaSeasonTrapSetup.insertCell();
                var selectWeapon = getSelectWeapon();
                selectWeapon.id = ID_SELECT_SGA_WEAPON;
                selectWeapon.onchange = saveSGaWeapon;
                trapSetupCell.appendChild(selectWeapon);
                selectWeapon = null;
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                tmpTxt = null;
                var selectBase = getSelectBase();
                selectBase.id = ID_SELECT_SGA_BASE;
                selectBase.onchange = saveSGaBase;
                trapSetupCell.appendChild(selectBase);
                selectBase = null;
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                tmpTxt = null;
                var selectBait = getSelectBait();
                selectBait.id = ID_SELECT_SGA_BAIT;
                selectBait.onchange = saveSGaBait;
                trapSetupCell.appendChild(selectBait);
                selectBait = null;
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                tmpTxt = null;
                var selectTrinket = getSelectTrinket();
                selectTrinket.id = ID_SELECT_SGA_TRINKET;
                selectTrinket.onchange = saveSGaTrinket;
                trapSetupCell.appendChild(selectTrinket);
                selectTrinket = null;
                tmpTxt = document.createTextNode("   ");
                trapSetupCell.appendChild(tmpTxt);
                tmpTxt = null;
                var resetButton = document.createElement('button');
                resetButton.onclick = resetSGaTrapSetup;
                resetButton.style.fontSize = "10px";
                tmpTxt = document.createTextNode("Reset & Reload");
                resetButton.appendChild(tmpTxt);
                tmpTxt = null;
                trapSetupCell.appendChild(resetButton);
                trSGaSeasonTrapSetup = null;
            }

            var tmpTxt;
            var policyPreferencesTable = document.createElement('table');
            policyPreferencesTable.width = "100%";

            var trEmpty = policyPreferencesTable.insertRow();
            trEmpty.style.height = "4px"
            trEmpty = null;

            insertSelectPolicyRow();
            insertSGaPolicyPreferences();

            var trLastRow = policyPreferencesTable.insertRow();
            var updateTrapsButtonCell = trLastRow.insertCell();
            var updateTrapsButton = document.createElement('button');
            updateTrapsButton.onclick = updateTraps
            updateTrapsButton.style.fontSize = "10px";
            tmpTxt = document.createTextNode("Update traps");
            updateTrapsButton.appendChild(tmpTxt);
            tmpTxt = null;
            updateTrapsButtonCell.appendChild(updateTrapsButton);
            var applyButtonCell = trLastRow.insertCell();
            applyButtonCell.style.textAlign = "right";
            var applyPolicyPreferencesButton = document.createElement('button');
            applyPolicyPreferencesButton.onclick = savePolicyPreferences
            applyPolicyPreferencesButton.style.fontSize = "13px";
            tmpTxt = document.createTextNode("Apply & Reload");
            applyPolicyPreferencesButton.appendChild(tmpTxt);
            tmpTxt = null;
            applyButtonCell.appendChild(applyPolicyPreferencesButton);
            tmpTxt = document.createTextNode("  ");
            applyButtonCell.appendChild(tmpTxt);
            tmpTxt = null;
            trLastRow = null;
            applyButtonCell = null;
            applyPolicyPreferencesButton = null;

            return policyPreferencesTable;
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
        //separationLine.style.borderBottom = "1px solid #ff0066";
        separationLine.style.borderBottom = "1px solid #F122F6";
        preferencesBox.appendChild(separationLine);
        separationLine = null;
        var blankLine = document.createElement('div');
        blankLine.style.height="2px"
        preferencesBox.appendChild(blankLine);
        blankLine = null;
        var tmpTitle = document.createElement('div');
        tmpTitle.style.textAlign = "center";
        tmpTitle.style.fontWeight = "bold";
        tmpTitle.style.fontSize = "12px";
        tmpTitle.innerHTML = 'Timer configuration ';
        preferencesBox.appendChild(tmpTitle);
        var timerLink = document.createElement('a');
        timerLink.id = ID_TIMER_LINK;
        timerLink.innerHTML = '[Show]';
        timerLink.style.fontWeight = "bold";
        timerLink.onclick = toggleTimerPreferencesTable;
        tmpTitle.appendChild(timerLink);
        timerLink = null;
        tmpTitle = null;

        var timerPreferencesTable = embedTimerPreferences();
        preferencesBox.appendChild(timerPreferencesTable);
        timerPreferencesTable.style.display = "none";
        timerPreferencesTable = null;

        separationLine = document.createElement('div');
        separationLine.style.height = "3px";
        //separationLine.style.borderBottom = "1px solid #ff0066";
        separationLine.style.borderBottom = "1px solid #F122F6";
        preferencesBox.appendChild(separationLine);
        separationLine = null;

        blankLine = document.createElement('div');
        blankLine.style.height="2px"
        preferencesBox.appendChild(blankLine);
        blankLine = null;
        tmpTitle = document.createElement('div');
        tmpTitle.style.textAlign = "center";
        tmpTitle.style.fontWeight = "bold";
        tmpTitle.style.fontSize = "12px";
        tmpTitle.innerHTML = 'Location/event-based trap setup';
        preferencesBox.appendChild(tmpTitle);
        tmpTitle = null;

        var policyPreferencesTable = embedPolicyPreferences();
        preferencesBox.appendChild(policyPreferencesTable);
        policyPreferencesTable = null;

        preferencesSection.appendChild(preferencesBox);

        return preferencesSection;
    }

    var overlayContainerElement = document.getElementById('overlayContainer');
    if (overlayContainerElement) {
        var autobotDiv = document.createElement('div');
        // autobotDiv.style.backgroundColor = "#fff2e6";
        autobotDiv.style.whiteSpace = "pre";
        autobotDiv.style.fontSize = "200%";

        var statusSection = embedStatusTable();
        autobotDiv.appendChild(statusSection);
        statusSection = null;

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

