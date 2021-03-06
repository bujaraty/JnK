// ==UserScript==
// @name         MH_Admirer_by_JnK
// @namespace    https://github.com/bujaraty/JnK
// @version      1.3.1.0
// @description  Customized version of MH autobot
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
// - Add getMiceInfo to be used with Active Quest feature
// - Add Active Quest Preferences, which will override checklocation and automatically Travel as needed. Possible Quests include
//   - QUEST_NO_QUEST, default, basically, only do the checkLocation
//   - Queso Canyon area
//   - Treasure Map
//   - Living Garden area
//   - Farming Realm Ripper
// - Auto change trap setting
//   - VVaGESPolicy
//   - RodZToPolicy 2nd half
//   - RodIcePolicy and test
//   - SDeFWaPolicy

// == Basic User Preference Setting (Begin) ==
// // The variable in this section contain basic option will normally edit by most user to suit their own preference
// // Reload MouseHunt page manually if edit this script while running it for immediate effect.

// // ERROR CHECKING ONLY: Script debug
const DEBUG_MODE = true;

// // Extra delay time before sounding the horn. (in seconds)
// // Default: 5-15
let g_botHornTimeDelayMin = 5;
let g_botHornTimeDelayMax = 15;

// // Extra delay time to trap check. (in seconds)
// // Note: It only take effect if enableTrapCheck = true;
let g_trapCheckTimeDelayMin = 10;
let g_trapCheckTimeDelayMax = 60;

// // Extra delay time before solving KR. (in seconds)
// // Default: 3 - 10
let g_autosolveKRDelayMin = 3;
let g_autosolveKRDelayMax = 10;

// // Maximum retry of solving KR.
// // If KR solved more than this number, pls solve KR manually ASAP in order to prevent MH from caught in botting
const MAX_KR_RETRY = 7;

// // Scheduler time that will start automatically
const STATUS_INCOMPLETE = "Incomplete";
const STATUS_COMPLETE = "Complete";
let g_scheduledGiftingAndBallotingTime = "07:35";
let g_beginScheduledGiftingAndBallotingTime = new Date();
let g_scheduledResetTime = "07:02";
let g_beginScheduledResetTime = new Date();
let g_statusGifting = STATUS_INCOMPLETE;
let g_statusBalloting = STATUS_INCOMPLETE;

// == Basic User Preference Setting (End) ==

// == Advance User Preference Setting (Begin) ==
// // The variable in this section contain some advance option that will change the script behavior.
// // Edit this variable only if you know what you are doing
// // Reload MouseHunt page manually if edit this script while running it for immediate effect.

// // Time interval for script timer to update the time. May affect timer accuracy if set too high value. (in seconds)
const TRAP_CHECK_TIMER_COUNTDOWN_INTERVAL = 20;
const KR_SOLVER_COUNTDOWN_INTERVAL = 1;

// == Advance User Preference Setting (End) ==

// WARNING - Do not modify the code below unless you know how to read and write the script.

// All global variable declaration and default value
const BOT_PROCESS_IDLE = "idle";
let g_nextHuntTime;
let g_botCountdownDelay;
let g_botCountdownInterval;
let g_nextTrapCheckTime;
let g_trapCheckCountdownDelay;
let g_strScriptVersion = GM_info.script.version;
let g_kingsRewardRetry = 0;
let g_trapInfo;
let g_friendInfo;
let g_mouseInfo;
let g_botProcess = BOT_PROCESS_IDLE;

// I have to re-define the default value of the following variables somewhere else
let g_isKingReward = false;
let g_baitCount;

// MH constant
const ID_HEADER_ELEMENT = 'envHeaderImg';
const HORNREADY_TXT = 'hornReady';
const CLASS_HORNBUTTON_ELEMENT = 'hornbutton';
const CLASS_HUNTERHORN_ELEMENT = 'mousehuntHud-huntersHorn-container';
const USER_NEXT_ACTIVETURN_SECONDS = "user.next_activeturn_seconds";
const USER_HAS_PUZZLE = "user.has_puzzle";
const KR_SEPARATOR = "~";

// JnK constant
const HTTP_STR = 'https';
const MOUSEHUNTGAME_WEBSITE_HOME = HTTP_STR + "://www.mousehuntgame.com/";
const HUNTER_TITLES = ["Novice", "Recruit", "Apprentice", "Initiate", "Journeyman", "Journeywoman", "Master", "Grandmaster", "Legendary", "Hero", "Knight",
                       "Lord", "Lady", "Baron", "Baroness", "Count", "Countess", "Duke", "Duchess", "Grand Duke", "Grand Duchess", "Archduke", "Archduchess",
                       "Viceroy", "Elder", "Sage", "Fabled"];
const BASE_CHEESECAKE = "Cheesecake Base";
const BASE_CHOCOLATE_BAR = "Chocolate Bar Base";
const BASE_CLAW_SHOT = "Claw Shot Base";
const BASE_DEEP_FREEZE = "Deep Freeze Base";
const BASE_FORECASTER = "Forecaster Base";
const BASE_HEARTHSTONE = "Hearthstone Base";
const BASE_MAGNET = "Magnet Base";
const BASE_REMOTE_DETONATOR = "Remote Detonator Base";
const BASE_SPIKED = "Spiked Base";
const BASE_THIEF = "Thief Base";
const BASE_WOODEN_BASE_WITH_TARGET = "Wooden Base with Target";
const BAIT_BRIE = "Brie Cheese";
const BAIT_CHECKMATE = "Checkmate Cheese";
const BAIT_CRESCENT = "Crescent Cheese";
const BAIT_GOUDA = "Gouda Cheese";
const BAIT_MOON = "Moon Cheese";
const BAIT_RADIOACTIVE_BLUE = "Radioactive Blue Cheese";
const BAIT_RUNIC = "Runic Cheese";
const TRINKET_ATTRACTION = "Attraction Charm";
const TRINKET_CACTUS_CHARM = "Cactus Charm";
const TRINKET_POWER = "Power Charm";
const TRINKET_PROSPECTORS = "Prospector's Charm";
const TRINKET_ROOK_CRUMBLE = "Rook Crumble Charm";
const TRINKET_SMALL_POWER = "Small Power Charm";
const TRINKET_STICKY = "Sticky Charm";
const TRINKET_SUPER_POWER = "Super Power Charm"
const TRINKET_VALENTINE = "Valentine Charm";
const TRINKET_WAX = "Wax Charm";
const WEAPON_MYSTIC_PAWN_PINCHER = "Mystic Pawn Pincher";
const WEAPON_TECHNIC_PAWN_PINCHER = "Technic Pawn Pincher";
const WEAPON_BLACKSTONE_PASS = "Blackstone Pass";
const WEAPON_OBVIOUS_AMBUSH = "Obvious Ambush";
const WEAPON_OASIS_WATER_NODE = "Oasis Water Node";
const WEAPON_STEAM_LASER_MK_III = "Steam Laser Mk. III";
const CLASSIFICATION_WEAPON = "weapon";
const CLASSIFICATION_BASE = "base";
const CLASSIFICATION_BAIT = "bait";
const CLASSIFICATION_TRINKET = "trinket";
const ID_NEXT_HUNT_TIME_TXT = "nextHuntTimeTxt";
const ID_BOT_COUNTDOWN_TXT = "botCountdownTxt";
const ID_BOT_INTERVAL_TXT = "botIntervalTxt";
const ID_NEXT_TRAP_CHECK_TIME_TXT = "nextTrapCheckTimeTxt";
const ID_TRAP_CHECK_COUNTDOWN_TXT = "trapCheckCountDownTxt";
const ID_INPUT_BOT_HORN_TIME_DELAY_MIN = "inputBotHornTimeDelayMin";
const ID_INPUT_BOT_HORN_TIME_DELAY_MAX = "inputBotHornTimeDelayMax";
const ID_INPUT_TRAP_CHECK_TIME_DELAY_MIN = "inputTrapCheckTimeDelayMin";
const ID_INPUT_TRAP_CHECK_TIME_DELAY_MAX = "inputTrapCheckTimeDelayMax";
const ID_INPUT_AUTOSOLVE_KR_DELAY_MIN = "inputAutosolveKRDelayMin";
const ID_INPUT_AUTOSOLVE_KR_DELAY_MAX = "inputAutosolveKRDelayMax";
const ID_INPUT_SCHEDULED_GIFTING_AND_BALLOTING_TIME = "inputScheduledGiftingAndBallotingTime";
const ID_INPUT_SCHEDULED_RESET_TIME = "inputScheduledResetTime";
const ID_BOT_PROCESS_TXT = "botProcessTxt";
const ID_BOT_STATUS_TXT = "botStatusTxt";
const ID_PREFERENCES_LINK = 'preferencesLink';
const ID_PREFERENCES_BOX = 'preferencesBox';
const ID_TIMER_PREFERENCES_TABLE = 'timerPreferencesTable';
const ID_TIMER_LINK = 'timerLink';
const ID_POLICY_TXT = "policyTxt";
const ID_BOTTON_UPDATE_TRAPS = "btnUpdateTtraps";
const ID_BOTTON_UPDATE_FRIENDS = "btnUpdateFriends";
const ID_TR_SINGLE_TRAP_SETUP = "trSingleTrapSetup";
const ID_SELECT_SINGLE_WEAPON = "selectSingleWeapon";
const ID_SELECT_SINGLE_BASE = "selectSingleBase";
const ID_SELECT_SINGLE_BAIT = "selectSingleBait";
const ID_SELECT_SINGLE_TRINKET = "selectSingleTrinket";
const ID_TR_SELECTABLE_TRAP_SETUP = "trSelectableTrapSetup";
const ID_SELECT_SELECTABLE_TRAP_SETUP = "selectSelectableTrapSetup";
const ID_SELECT_SELECTABLE_WEAPON = "selectSelectableWeapon";
const ID_SELECT_SELECTABLE_BASE = "selectSelectableBase";
const ID_SELECT_SELECTABLE_BAIT = "selectSelectableBait";
const ID_SELECT_SELECTABLE_TRINKET = "selectSelectableTrinket";
const ID_TR_GNAMOU_ATM_SMASH = "trGnaMouAtmSmash";
const ID_CBX_GNAMOU_ATM_SMASH = "cbxGnaMouAtmSmash";
const ID_TR_GNAMOU_ATM_SWITCH_CHARM = "trGnaMouAtmSwitchCharm";
const ID_CBX_GNAMOU_ATM_SWITCH_CHARM = "cbxGnaMouAtmSwitchCharm";
const ID_TR_VVACSC_ATM_POSTER = "trVVaCSCAtmPoster";
const ID_CBX_VVACSC_ATM_POSTER = "cbxVVaCSCAtmPoster";
const ID_TR_VVACSC_ATM_CACTUS_CHARM = "trVVaCSCAtmCactusCharm";
const ID_CBX_VVACSC_ATM_CACTUS_CHARM = "cbxVVaCSCAtmCactusCharm";
const ID_TR_VVAFRO_PHASES_TRAP_SETUP = "trVVaFRoPhasesTrapSetup";
const ID_SELECT_VVAFRO_PHASE = "selectVVaFRoPhase";
const ID_SELECT_VVAFRO_WEAPON = "selectVVaFRoWeapon";
const ID_SELECT_VVAFRO_BASE = "selectVVaFRoBase";
const ID_SELECT_VVAFRO_BAIT = "selectVVaFRoBait";
const ID_SELECT_VVAFRO_TRINKET = "selectVVaFRoTrinket";
const ID_SELECT_VVAFRO_TOWER = "selectVVaFRoTower";
const ID_TR_VVAFRO_ATM_DEACTIVATE = "trVVaFRoAtmDeactivate";
const ID_CBX_VVAFRO_ATM_DEACTIVATE = "cbxVVaFRoAtmDeactivate";
const ID_TR_VVAFRO_ATM_RETREAT = "trVVaFRoAtmRetreat";
const ID_CBX_VVAFRO_ATM_RETREAT = "cbxVVaFRoAtmRetreat";
const ID_INPUT_VVAFRO_REQUIRED_HOWLITE = "inputVVaFRoRequiredHowlite";
const ID_INPUT_VVAFRO_REQUIRED_BLOODSTONE = "inputVVaFRoRequiredBloodstone";
const ID_TR_RODZTO_STRATEGY = "trRodZToStrategy";
const ID_SELECT_RODZTO_STRATEGY = "selectRodZToStrategy";
const ID_TR_RODCLI_ATM_CATALOG_MICE = "trRodCLiAtmCatalogMice";
const ID_CBX_RODCLI_ATM_CATALOG_MICE = "cbxRodCLiAtmCatalogMice";
const ID_TR_SELECT_SDEFWA_WAVE = "trSelectSDeFWaWave";
const ID_SELECT_SDEFWA_WAVE = "selectSDeFWaWave";
const ID_TR_SDEFWA_POWER_TYPES_TRAP_SETUP = "trSDeFWaPowerTypesTrapSetup";
const ID_SELECT_SDEFWA_POWER_TYPE = "selectSDeFWaPowerType";
const ID_SELECT_SDEFWA_SOLDIER_WEAPON = "selectSDeFWaSoldierWeapon";
const ID_SELECT_SDEFWA_SOLDIER_BASE = "selectSDeFWaSoldierBase";
const ID_TR_SELECT_SDEFWA_TARGET_POPULATION = "trSelectSDeFWaTargetPopulation";
const ID_SELECT_SDEFWA_TARGET_POPULATION = "selectSDeFWaTargetPopulation";
const ID_TR_SDEFWA_STREAKS_TRAP_SETUP = "trSDeFWaStreaksTrapSetup";
const ID_SELECT_SDEFWA_STREAK = "selectSDeFWaStreak";
const ID_SELECT_SDEFWA_STREAK_BAIT = "selectSDeFWaStreakBait";
const ID_SELECT_SDEFWA_STREAK_CHARM_TYPE = "selectSDeFWaStreakCharmType";
const ID_SELECT_SDEFWA_STREAK_SOLDIER_TYPE = "selectSDeFWaStreakSoldierType";
const ID_TR_SDEFWA_LAST_SOLDIER_TRAP_SETUP = "trSDeFWaLastSoldierTrapSetup";
const ID_SELECT_SDEFWA_LAST_SOLDIER_BAIT = "selectSDeFWaLastSoldierBait";
const ID_SELECT_SDEFWA_LAST_SOLDIER_CHARM_TYPE = "selectSDeFWaLastSoldierCharmType";
const ID_TR_SDEFWA_WHEN_SUPPORT_RETREAT = "trSDeFWaWhenSupportRetreat";
const ID_SELECT_SDEFWA_ARMING_WARPATH_CHARM = "selectSDeFWaArmingWarpathCharm";
const ID_TR_SDEFWA_WAVE4_TRAP_SETUP = "trSDeFWaWave4TrapSetup";
const ID_SELECT_SDEFWA_BEFORE_AFTER_WARDENS = "selectSDeFWaBeforeAfterWardens";
const ID_SELECT_SDEFWA_WAVE4_WEAPON = "selectSDeFWaWave4Weapon";
const ID_SELECT_SDEFWA_WAVE4_BASE = "selectSDeFWaWave4Base";
const ID_SELECT_SDEFWA_WAVE4_BAIT = "selectSDeFWaWave4Bait";
const ID_SELECT_SDEFWA_WAVE4_TRINKET = "selectSDeFWaWave4Trinket";
const ID_TMP_KR_FRAME = 'tmpKRFrame';
const STORAGE_BOT_HORN_TIME_DELAY_MIN = "botHornTimeDelayMin";
const STORAGE_BOT_HORN_TIME_DELAY_MAX = "botHornTimeDelayMax";
const STORAGE_TRAP_CHECK_TIME_DELAY_MIN = "trapCheckTimeDelayMin";
const STORAGE_TRAP_CHECK_TIME_DELAY_MAX = "trapCheckTimeDelayMax";
const STORAGE_AUTOSOLVE_KR_DELAY_MIN = "autosolveKRDelayMin";
const STORAGE_AUTOSOLVE_KR_DELAY_MAX = "autosolveKRDelayMax";
const STORAGE_SCHEDULED_GIFTING_AND_BALLOTING_TIME = "scheduledGiftingAndBallotingTime";
const STORAGE_SCHEDULED_RESET_TIME = "scheduledResetTime";
const STORAGE_STATUS_GIFTING = "statusGifting";
const STORAGE_STATUS_BALLOTING = "statusBalloting";
const STORAGE_TRAP_INFO = "trapInfo";
const STORAGE_TRAP_SETUP_GNAHAR = "trapSetupGnaHar";
const STORAGE_TRAP_SETUP_GNAMOU = "trapSetupGnaMou";
const STORAGE_TRAP_SETUP_WWOCCL = "trapSetupWWoCCl";
const STORAGE_TRAP_SETUP_WWOGGT = "trapSetupWWoGGT";
const STORAGE_TRAP_SETUP_BURMOU = "trapSetupBurMou";
const STORAGE_TRAP_SETUP_BWOCAT = "trapSetupBWoCat";
const STORAGE_TRAP_SETUP_BWOARE = "trapSetupBWoARe";
const STORAGE_TRAP_SETUP_TISDDU = "trapSetupTIsDDu";
const STORAGE_TRAP_SETUP_TISJOD = "trapSetupTIsJoD";
const STORAGE_TRAP_SETUP_VVACSC = "trapSetupVVaCSC";
const STORAGE_TRAP_SETUP_VVAFRO = "trapSetupVVaFRo";
const STORAGE_TRAP_SETUP_RODSGA = "trapSetupRodSGa";
const STORAGE_TRAP_SETUP_RODZTO = "trapSetupRodZTo";
const STORAGE_TRAP_SETUP_RODCLI = "trapSetupRodCLi";
const STORAGE_TRAP_SETUP_RODSSH = "trapSetupRodSSh";
const STORAGE_TRAP_SETUP_RODICE = "trapSetupRodIce";
const STORAGE_TRAP_SETUP_SDEFWA = "trapSetupSDeFWa";
const STORAGE_TRAP_SETUP_SDEMMA = "trapSetupSDeMMa";
const STORAGE_FRIEND_INFO = "friendInfo";
const DATA_TYPE_STRING = "string";
const DATA_TYPE_OBJECT = "object";
const IDX_WEAPON = 0;
const IDX_BASE = 1;
const IDX_BAIT = 2;
const IDX_TRINKET = 3;
const IDX_TOWER = 4;
const IDX_CHARM_TYPE = 4;
const IDX_SOLDIER_TYPE = 5;
const POWER_TYPE_ARCANE = "Arcane";
const POWER_TYPE_DRACONIC = "Draconic";
const POWER_TYPE_FORGOTTEN = "Forgotten";
const POWER_TYPE_HYDRO = "Hydro";
const POWER_TYPE_LAW = "Law";
const POWER_TYPE_PHYSICAL = "Physical";
const POWER_TYPE_RIFT = "Rift";
const POWER_TYPE_SHADOW = "Shadow";
const POWER_TYPE_TACTICAL = "Tactical";
const POWER_TYPE_OVERALL = "Overall";
const ITEM_ARM = "Arm";
const ITEM_DISARM = "Disarm";
const ITEM_ARMING = [ITEM_ARM, ITEM_DISARM];
const ITEM_OTHER = "Other";
const ITEM_IGNORE = "Ignore";
const STATUS_BEFORE = "Before";
const STATUS_AFTER = "After";
const STATUSES = [STATUS_BEFORE, STATUS_AFTER];
const STYLE_CLASS_NAME_JNK_CAPTION = "JnKCaption";
const BOT_PROCESS_POLICY = "Policy";
const BOT_PROCESS_SCHEDULER = "Scheduler";
const BOT_PROCESS_TIMER = "Timer";
const BOT_PROCESS_MANUAL = "Manual";
const BOT_STATUS_IDLE = "Idle";
const GNAMOU_ATM_SWITCH_CHARM = "Automatic Switch Charm";
const GNAMOU_ATM_SMASH = "Automatic Smash";
const VVACSC_PHASE_LAWLESS = "lawless";
const VVACSC_PHASE_NEED_POSTER = "need_poster";
const VVACSC_PHASE_HAS_POSTER = "has_poster";
const VVACSC_PHASE_ACTIVE_POSTER = "active_poster";
const VVACSC_PHASE_HAS_REWARD = "has_reward";
const VVACSC_PHASES = [VVACSC_PHASE_LAWLESS, VVACSC_PHASE_NEED_POSTER, VVACSC_PHASE_ACTIVE_POSTER];
const VVACSC_ATM_POSTER = "Automatic Poster";
const VVACSC_ATM_CACTUS_CHARM = "Automatic Cactus Charm";
const VVAFRO_PHASE_DAY = "Day";
const VVAFRO_PHASE_TWILIGHT = "Twilight";
const VVAFRO_PHASE_MIDNIGHT = "Midnight";
const VVAFRO_PHASE_PITCH = "Pitch";
const VVAFRO_PHASE_UTTER_DARKNESS = "Utter Darkness";
const VVAFRO_PHASE_FIRST_LIGHT = "First Light";
const VVAFRO_PHASE_DAWN = "Dawn";
const VVAFRO_PHASES = [VVAFRO_PHASE_DAY, VVAFRO_PHASE_TWILIGHT, VVAFRO_PHASE_MIDNIGHT, VVAFRO_PHASE_PITCH, VVAFRO_PHASE_UTTER_DARKNESS, VVAFRO_PHASE_FIRST_LIGHT,
                       VVAFRO_PHASE_DAWN];
const VVAFRO_TOWER_ACTIVATE = "Activate";
const VVAFRO_TOWER_DEACTIVATE = "Deactivate";
const VVAFRO_TOWER_ACTIVATION = [VVAFRO_TOWER_ACTIVATE, VVAFRO_TOWER_DEACTIVATE];
const VVAFRO_ATM_DEACTIVATE = "Automatic Deactivate";
const VVAFRO_ATM_RETREAT = "Automatic Retreat";
const VVAFRO_REQUIRED_HOWLITE = "Required Howlite";
const VVAFRO_REQUIRED_BLOODSTONE = "Required Bloodstone";
const RODSGA_SEASON_SPRING = "Spring";
const RODSGA_SEASON_SUMMER = "Summer";
const RODSGA_SEASON_AUTUMN = "Autumn";
const RODSGA_SEASON_WINTER = "Winter";
const RODSGA_SEASONS = [RODSGA_SEASON_SPRING, RODSGA_SEASON_SUMMER, RODSGA_SEASON_AUTUMN, RODSGA_SEASON_WINTER];
const RODZTO_STRATEGY_MYSTIC_ONLY = "Mystic Only";
const RODZTO_STRATEGY_TECHNIC_ONLY = "Technic Only";
const RODZTO_STRATEGY_MYSTIC_FIRST = "Mystic First";
const RODZTO_STRATEGY_TECHNIC_FIRST = "Technic First";
const RODZTO_STRATEGY = "RodZTo Strategy"
const RODZTO_STRATEGIES = [RODZTO_STRATEGY_MYSTIC_ONLY, RODZTO_STRATEGY_TECHNIC_ONLY, RODZTO_STRATEGY_MYSTIC_FIRST, RODZTO_STRATEGY_TECHNIC_FIRST];
const RODZTO_CHESS_MYSTIC_PAWN = "Mystic Pawn";
const RODZTO_CHESS_MYSTIC_KNIGHT = "Mystic Knight";
const RODZTO_CHESS_MYSTIC_BISHOP = "Mystic Bishop";
const RODZTO_CHESS_MYSTIC_ROOK = "Mystic Rook";
const RODZTO_CHESS_MYSTIC_QUEEN = "Mystic Queen";
const RODZTO_CHESS_MYSTIC_KING = "Mystic King";
const RODZTO_CHESS_MYSTIC = [RODZTO_CHESS_MYSTIC_PAWN, RODZTO_CHESS_MYSTIC_KNIGHT, RODZTO_CHESS_MYSTIC_BISHOP, RODZTO_CHESS_MYSTIC_ROOK, RODZTO_CHESS_MYSTIC_QUEEN,
                             RODZTO_CHESS_MYSTIC_KING];
const RODZTO_CHESS_TECHNIC_PAWN = "Technic Pawn";
const RODZTO_CHESS_TECHNIC_KNIGHT = "Technic Knight";
const RODZTO_CHESS_TECHNIC_BISHOP = "Technic Bishop";
const RODZTO_CHESS_TECHNIC_ROOK = "Technic Rook";
const RODZTO_CHESS_TECHNIC_QUEEN = "Technic Queen";
const RODZTO_CHESS_TECHNIC_KING = "Technic King";
const RODZTO_CHESS_TECHNIC = [RODZTO_CHESS_TECHNIC_PAWN, RODZTO_CHESS_TECHNIC_KNIGHT, RODZTO_CHESS_TECHNIC_BISHOP, RODZTO_CHESS_TECHNIC_ROOK,
                              RODZTO_CHESS_TECHNIC_QUEEN, RODZTO_CHESS_TECHNIC_KING];
const RODZTO_CHESS_MASTER = "Chess Master";
const RODZTO_CHESS_PROGRESS = [RODZTO_CHESS_MYSTIC_PAWN, RODZTO_CHESS_MYSTIC_KNIGHT, RODZTO_CHESS_MYSTIC_BISHOP, RODZTO_CHESS_MYSTIC_ROOK, RODZTO_CHESS_MYSTIC_QUEEN,
                               RODZTO_CHESS_MYSTIC_KING, RODZTO_CHESS_TECHNIC_PAWN, RODZTO_CHESS_TECHNIC_KNIGHT, RODZTO_CHESS_TECHNIC_BISHOP, RODZTO_CHESS_TECHNIC_ROOK,
                               RODZTO_CHESS_TECHNIC_QUEEN, RODZTO_CHESS_TECHNIC_KING, RODZTO_CHESS_MASTER];
const RODCLI_ATM_CATALOG_MICE = "Automatic Catalog Mice";
const RODICE_SUBLOCATION_ICEBERG_GENERAL = "Iceberg General";
const RODICE_SUBLOCATION_TREACHEROUS_TUNNELS = "Treacherous Tunnels";
const RODICE_SUBLOCATION_BRUTAL_BULWARK = "Brutal Bulwark";
const RODICE_SUBLOCATION_BOMBING_RUN = "Bombing Run";
const RODICE_SUBLOCATION_THE_MAD_DEPTHS = "The Mad Depths";
const RODICE_SUBLOCATION_ICEWINGS_LAIR = "Icewing's Lair";
const RODICE_SUBLOCATION_HIDDEN_DEPTHS = "Hidden Depths";
const RODICE_SUBLOCATION_THE_DEEP_LAIR = "The Deep Lair";
const RODICE_SUBLOCATIONS = [RODICE_SUBLOCATION_ICEBERG_GENERAL, RODICE_SUBLOCATION_TREACHEROUS_TUNNELS, RODICE_SUBLOCATION_BRUTAL_BULWARK,
                             RODICE_SUBLOCATION_BOMBING_RUN, RODICE_SUBLOCATION_THE_MAD_DEPTHS, RODICE_SUBLOCATION_ICEWINGS_LAIR,
                             RODICE_SUBLOCATION_HIDDEN_DEPTHS, RODICE_SUBLOCATION_THE_DEEP_LAIR];
const SDEFWA_WAVE1 = "Wave 1";
const SDEFWA_WAVE2 = "Wave 2";
const SDEFWA_WAVE3 = "Wave 3";
const SDEFWA_WAVE4 = "Wave 4";
const SDEFWA_WAVES = [SDEFWA_WAVE1, SDEFWA_WAVE2, SDEFWA_WAVE3, SDEFWA_WAVE4];
const SDEFWA_POWER_TYPES = [POWER_TYPE_ARCANE, POWER_TYPE_HYDRO, POWER_TYPE_PHYSICAL, POWER_TYPE_TACTICAL];
const SDEFWA_TARGET_POPULATION_LOWEST = "Lowest";
const SDEFWA_TARGET_POPULATION_HIGHEST = "Highest";
const SDEFWA_TARGET_POPULATIONS = [SDEFWA_TARGET_POPULATION_LOWEST, SDEFWA_TARGET_POPULATION_HIGHEST];
const SDEFWA_POPULATION_PRIORITY = "Population Priority";
const SDEFWA_MAX_STREAKS = 9;
const SDEFWA_CHARM_TYPE_WARPATH = "Warpath";
const SDEFWA_CHARM_TYPE_SUPER_WARPATH = "Super Warpath";
const SDEFWA_CHARM_TYPES = [SDEFWA_CHARM_TYPE_WARPATH, SDEFWA_CHARM_TYPE_SUPER_WARPATH];
const SDEFWA_STREAK_SOLDIER_TYPE_SOLIDER = "Soldier";
const SDEFWA_STREAK_SOLDIER_TYPE_COMMANDER = "Commander";
const SDEFWA_STREAK_SOLDIER_TYPE_GARGANTUA = "Gargantua";
const SDEFWA_STREAK_SOLDIER_TYPES = [SDEFWA_STREAK_SOLDIER_TYPE_SOLIDER, SDEFWA_STREAK_SOLDIER_TYPE_COMMANDER, SDEFWA_STREAK_SOLDIER_TYPE_GARGANTUA];
const SDEFWA_LAST_SOLDIER = "Last Soldier";
const SDEFWA_ARMING_CHARM_SUPPORT_RETREAT = "Arming Charm";
const LOCATION_HARBOUR = "Harbour";
const LOCATION_MOUNTAIN = "Mountain";
const LOCATION_CALM_CLEARING = "Calm Clearing";
const LOCATION_GREAT_GNARLED_TREE = "Great Gnarled Tree";
const LOCATION_MOUSOLEUM = "Mousoleum";
const LOCATION_CATACOMBS = "Catacombs";
const LOCATION_ACOLYTE_REALM = "Acolyte Realm";
const LOCATION_DERR_DUNES = "Derr Dunes";
const LOCATION_JUNGLE_OF_DREAD = "Jungle of Dread";
const LOCATION_CLAW_SHOT_CITY = "Claw Shot City";
const LOCATION_FORT_ROX = "Fort Rox";
const LOCATION_SEASONAL_GARDEN = "Seasonal Garden";
const LOCATION_ZUGZWANGS_TOWER = "Zugzwang's Tower";
const LOCATION_CRYSTAL_LIBRARY = "Crystal Library";
const LOCATION_SLUSHY_SHORELINE = "Slushy Shoreline";
const LOCATION_ICEBERG = "Iceberg";
const LOCATION_FIERY_WARPATH = "Fiery Warpath";
const LOCATION_MURIDAE_MARKET = "Muridae Market";
const POLICY_NAME_NONE = "None";
const POLICY_NAME_HARBOUR = "Harbour";
const POLICY_NAME_MOUNTAIN = "Mountain";
const POLICY_NAME_CALM_CLEARING = "Calm Clearing";
const POLICY_NAME_GREAT_GNARLED_TREE = "Great Gnarled Tree";
const POLICY_NAME_MOUSOLEUM = "Mousoleum";
const POLICY_NAME_CATACOMBS = "Catacombs";
const POLICY_NAME_ACOLYTE_REALM = "Acolyte Realm";
const POLICY_NAME_DERR_DUNES = "Derr Dunes";
const POLICY_NAME_JUNGLE_OF_DREAD = "Jungle of Dread";
const POLICY_NAME_CLAW_SHOT_CITY = "Claw Shot City";
const POLICY_NAME_FORT_ROX = "Fort Rox";
const POLICY_NAME_SEASONAL_GARDEN = "Seasonal Garden";
const POLICY_NAME_ZUGZWANGS_TOWER = "Zugzwang's Tower";
const POLICY_NAME_CRYSTAL_LIBRARY = "Crystal Library";
const POLICY_NAME_SLUSHY_SHORELINE = "Slushy Shoreline";
const POLICY_NAME_ICEBERG = "Iceberg";
const POLICY_NAME_FIERY_WARPATH = "Fiery Warpath";
const POLICY_NAME_MURIDAE_MARKET = "Muridae Market";

// Policy description
class Policy {
    constructor() {
        this.trs = [];
        this.bestPowerWeapons = {};
        this.bestLuckWeapons = {};
    }

    resetTrapSetups() {
        this._trapSetups = [];
    }

    setSingleTrapSetup(trapSetup) {
        document.getElementById(ID_SELECT_SINGLE_WEAPON).value = trapSetup[IDX_WEAPON];
        document.getElementById(ID_SELECT_SINGLE_BASE).value = trapSetup[IDX_BASE];
        document.getElementById(ID_SELECT_SINGLE_BAIT).value = trapSetup[IDX_BAIT];
        document.getElementById(ID_SELECT_SINGLE_TRINKET).value = trapSetup[IDX_TRINKET];
    }

    setSelectableTrapSetup(trapSetups) {
        const currentSelection = document.getElementById(ID_SELECT_SELECTABLE_TRAP_SETUP).value;
        document.getElementById(ID_SELECT_SELECTABLE_WEAPON).value = trapSetups[currentSelection][IDX_WEAPON];
        document.getElementById(ID_SELECT_SELECTABLE_BASE).value = trapSetups[currentSelection][IDX_BASE];
        document.getElementById(ID_SELECT_SELECTABLE_BAIT).value = trapSetups[currentSelection][IDX_BAIT];
        document.getElementById(ID_SELECT_SELECTABLE_TRINKET).value = trapSetups[currentSelection][IDX_TRINKET];
    }

    getBestBase() {
        const baseInfo = getBaseInfo();
        if (isNullOrUndefined(this.bestBase)) {
            const bestBases = Object.entries(baseInfo)
            .sort(([,a], [,b]) => b.power - a.power)
            .sort(([,a], [,b]) => b.luck - a.luck)
            .map(x => x[1].name);
            const hunterTitle = getPageVariable("user.title_name");
            if (HUNTER_TITLES.indexOf(hunterTitle) > 16 && bestBases.includes(BASE_THIEF)) {
                this.bestBase = BASE_THIEF;
            } else {
                for (const base of bestBases){
                    if (base != BASE_THIEF && base != BASE_FORECASTER) {
                        this.bestBase = base;
                        break;
                    }
                }
            }
        }
        return this.bestBase;
    }

    getBestPowerWeapon(powerType) {
        const weaponInfo = getWeaponInfo();
        if (isNullOrUndefined(this.bestPowerWeapons[powerType])) {
            this.bestPowerWeapons[powerType] = Object.entries(weaponInfo)
                .filter(([key, value]) => value.powerType === powerType)
                .sort(([,a], [,b]) => b.luck - a.luck)
                .sort(([,a], [,b]) => b.power - a.power)
                .map(x => x[1].name)[0];
        }
        return this.bestPowerWeapons[powerType];
    }

    getBestLuckWeapon(powerType) {
        const weaponInfo = getWeaponInfo();
        if (isNullOrUndefined(this.bestLuckWeapons[powerType])) {
            if (powerType == POWER_TYPE_OVERALL) {
                this.bestLuckWeapons[powerType] = Object.entries(weaponInfo)
                    .sort(([,a], [,b]) => b.power - a.power)
                    .sort(([,a], [,b]) => b.luck - a.luck)
                    .map(x => x[1].name)[0];
            } else {
                this.bestLuckWeapons[powerType] = Object.entries(weaponInfo)
                    .filter(([key, value]) => value.powerType === powerType)
                    .sort(([,a], [,b]) => b.power - a.power)
                    .sort(([,a], [,b]) => b.luck - a.luck)
                    .map(x => x[1].name)[0];
            }
        }
        return this.bestLuckWeapons[powerType];
    }

    getTrapSetups(storageName) {
        if (isNullOrUndefined(this._trapSetups)) {
            const tmpStorage = getStorage(storageName, undefined);
            if (isNullOrUndefined(tmpStorage)) {
                this.resetTrapSetups();
            } else {
                this._trapSetups = tmpStorage;
            }
        }
        return this._trapSetups;
    }

    getDefaultTrapSetup(trapSetup, baitName, trinketName) {
        trapSetup[IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_OVERALL);
        trapSetup[IDX_BASE] = this.getBestBase();
        if ( !isNullOrUndefined(baitName)) {
            trapSetup[IDX_BAIT] = baitName;
        }
        if ( !isNullOrUndefined(trinketName)) {
            trapSetup[IDX_TRINKET] = trinketName;
        }
    }

    getArcaneTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_ARCANE);
    }

    getDraconicTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_DRACONIC);
    }

    getForgottenTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_FORGOTTEN);
    }

    getHydroTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_HYDRO);
    }

    getLawTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_LAW);
    }

    getPhysicalTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_PHYSICAL);
    }

    getRiftTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_RIFT);
    }

    getShadowTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_SHADOW);
    }

    getTacticalTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_TACTICAL);
    }
}

class PolicySingleTrapSetup extends Policy {
    constructor () {
        super();
        this.trs[0] = ID_TR_SINGLE_TRAP_SETUP;
    }

    initSelectTrapSetup() {
        this.setSingleTrapSetup(this.trapSetups);
    }

    recommendTrapSetup() {
        const baitName = getBaitNames().includes(BAIT_BRIE)? BAIT_BRIE: undefined;
        this.getDefaultTrapSetup(this.trapSetups, baitName);
        this.initSelectTrapSetup();
    }
}

class PolicyGnaHar extends PolicySingleTrapSetup {
    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_GNAHAR);
    }
}

class PolicyGnaMou extends PolicySingleTrapSetup {
    constructor () {
        super();
        this.trs[0] = ID_TR_GNAMOU_ATM_SMASH;
        this.trs[1] = ID_TR_GNAMOU_ATM_SWITCH_CHARM;
        this.trs[2] = ID_TR_SINGLE_TRAP_SETUP;
    }

    resetTrapSetups() {
        this._trapSetups = {};
        this._trapSetups[GNAMOU_ATM_SMASH] = true;
        this._trapSetups[GNAMOU_ATM_SWITCH_CHARM] = true;
    }

    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_GNAMOU);
    }

    initSelectTrapSetup() {
        const trapSetups = this.trapSetups;
        this.setSingleTrapSetup(trapSetups);
        document.getElementById(ID_CBX_GNAMOU_ATM_SMASH).checked = trapSetups[GNAMOU_ATM_SMASH];
        document.getElementById(ID_CBX_GNAMOU_ATM_SWITCH_CHARM).checked = trapSetups[GNAMOU_ATM_SWITCH_CHARM];
    }
}

class PolicyWWoCCl extends PolicySingleTrapSetup {
    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_WWOCCL);
    }
}

class PolicyWWoGGT extends PolicySingleTrapSetup {
    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_WWOGGT);
    }

    recommendTrapSetup() {
        this.getTacticalTrapSetup(this.trapSetups);
        this.initSelectTrapSetup();
    }
}

class PolicyBurMou extends PolicySingleTrapSetup {
    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_BURMOU);
    }

    recommendTrapSetup() {
        const baitName = getBaitNames().includes(BAIT_RADIOACTIVE_BLUE)? BAIT_RADIOACTIVE_BLUE: undefined;
        this.getArcaneTrapSetup(this.trapSetups, baitName);
        this.initSelectTrapSetup();
    }
}

class PolicyBWoCat extends PolicySingleTrapSetup {
    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_BWOCAT);
    }

    recommendTrapSetup() {
        const baitName = getBaitNames().includes(BAIT_RADIOACTIVE_BLUE)? BAIT_RADIOACTIVE_BLUE: undefined;
        this.getArcaneTrapSetup(this.trapSetups, baitName);
        this.initSelectTrapSetup();
    }
}

class PolicyBWoARe extends PolicySingleTrapSetup {
    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_BWOARE);
    }

    recommendTrapSetup() {
        if (getBaitNames().includes(BAIT_RUNIC)) {
            this.getForgottenTrapSetup(this.trapSetups, BAIT_RUNIC);
        } else {
            this.getArcaneTrapSetup(this.trapSetups);
        }
        this.initSelectTrapSetup();
    }
}

class PolicyTIsDDu extends PolicySingleTrapSetup {
    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_TISDDU);
    }

    recommendTrapSetup() {
        const baitName = getBaitNames().includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;
        this.getPhysicalTrapSetup(this.trapSetups, baitName);
        this.initSelectTrapSetup();
    }
}

class PolicyTIsJoD extends PolicySingleTrapSetup {
    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_TISJOD);
    }

    recommendTrapSetup() {
        const baitName = getBaitNames().includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;
        this.getShadowTrapSetup(this.trapSetups, baitName);
        this.initSelectTrapSetup();
    }
}

class PolicyVVaCSC extends Policy {
    constructor () {
        super();
        this.trs[0] = ID_TR_VVACSC_ATM_POSTER;
        this.trs[1] = ID_TR_VVACSC_ATM_CACTUS_CHARM;
        this.trs[2] = ID_TR_SELECTABLE_TRAP_SETUP;
        this.selectableValues = VVACSC_PHASES;
    }

    resetTrapSetups() {
        this._trapSetups = {};
        for (const phase of VVACSC_PHASES){
            this._trapSetups[phase] = [];
        }
        this._trapSetups[VVACSC_ATM_POSTER] = true;
        this._trapSetups[VVACSC_ATM_CACTUS_CHARM] = true;
    }

    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_VVACSC);
    }

    initSelectTrapSetup() {
        const trapSetups = this.trapSetups;
        this.setSelectableTrapSetup(trapSetups);
        document.getElementById(ID_CBX_VVACSC_ATM_POSTER).checked = trapSetups[VVACSC_ATM_POSTER];
        document.getElementById(ID_CBX_VVACSC_ATM_CACTUS_CHARM).checked = trapSetups[VVACSC_ATM_CACTUS_CHARM];
    }

    recommendTrapSetup() {
        function getVVaCSCTrapSetup(trapSetup) {
            trapSetup[IDX_WEAPON] = bestWeapon;
            trapSetup[IDX_BASE] = clawShotBase;
            trapSetup[IDX_BAIT] = brieCheese;
            trapSetup[IDX_TRINKET] = prospectorsCharm;
        }

        const trapSetups = this.trapSetups;
        const bestWeapon = this.getBestLuckWeapon(POWER_TYPE_LAW);
        const clawShotBase = getBaseNames().includes(BASE_CLAW_SHOT)? BASE_CLAW_SHOT: this.getBestBase();;
        const brieCheese = getBaitNames().includes(BAIT_BRIE)? BAIT_BRIE: undefined;
        const prospectorsCharm = getTrinketNames().includes(TRINKET_PROSPECTORS)? TRINKET_PROSPECTORS: undefined;
        if (isNullOrUndefined(trapSetups[VVACSC_PHASE_LAWLESS])) {
            trapSetups[VVACSC_PHASE_LAWLESS] = [];
        }
        getVVaCSCTrapSetup(trapSetups[VVACSC_PHASE_LAWLESS]);
        getVVaCSCTrapSetup(trapSetups[VVACSC_PHASE_NEED_POSTER]);
        getVVaCSCTrapSetup(trapSetups[VVACSC_PHASE_ACTIVE_POSTER]);
        trapSetups[VVACSC_ATM_POSTER] = true;
        trapSetups[VVACSC_ATM_CACTUS_CHARM] = true;
        this.initSelectTrapSetup();
    }
}

class PolicyVVaFRo extends Policy {
    constructor () {
        super();
        this.trs[0] = ID_TR_VVAFRO_PHASES_TRAP_SETUP;
        this.trs[1] = ID_TR_VVAFRO_ATM_DEACTIVATE;
        this.trs[2] = ID_TR_VVAFRO_ATM_RETREAT;
    }

    resetTrapSetups() {
        this._trapSetups = {};
        for (const phase of VVAFRO_PHASES){
            this._trapSetups[phase] = [];
        }
        this._trapSetups[VVAFRO_ATM_DEACTIVATE] = true;
        this._trapSetups[VVAFRO_ATM_RETREAT] = false;
        this._trapSetups[VVAFRO_REQUIRED_HOWLITE] = 0;
        this._trapSetups[VVAFRO_REQUIRED_BLOODSTONE] = 0;
    }

    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_VVAFRO);
    }

    initSelectTrapSetup() {
        const trapSetups = this.trapSetups;
        const currentPhase = document.getElementById(ID_SELECT_VVAFRO_PHASE).value;
        document.getElementById(ID_SELECT_VVAFRO_WEAPON).value = trapSetups[currentPhase][IDX_WEAPON];
        document.getElementById(ID_SELECT_VVAFRO_BASE).value = trapSetups[currentPhase][IDX_BASE];
        document.getElementById(ID_SELECT_VVAFRO_BAIT).value = trapSetups[currentPhase][IDX_BAIT];
        document.getElementById(ID_SELECT_VVAFRO_TRINKET).value = trapSetups[currentPhase][IDX_TRINKET];
        if (isNullOrUndefined(trapSetups[currentPhase][IDX_TOWER])) {
            trapSetups[currentPhase][IDX_TOWER] = VVAFRO_TOWER_DEACTIVATE;
        }
        document.getElementById(ID_SELECT_VVAFRO_TOWER).value = trapSetups[currentPhase][IDX_TOWER];
        document.getElementById(ID_CBX_VVAFRO_ATM_DEACTIVATE).checked = trapSetups[VVAFRO_ATM_DEACTIVATE];
        document.getElementById(ID_CBX_VVAFRO_ATM_RETREAT).checked = trapSetups[VVAFRO_ATM_RETREAT];
        document.getElementById(ID_INPUT_VVAFRO_REQUIRED_HOWLITE).value = trapSetups[VVAFRO_REQUIRED_HOWLITE];
        document.getElementById(ID_INPUT_VVAFRO_REQUIRED_HOWLITE).disabled = !trapSetups[VVAFRO_ATM_RETREAT];
        document.getElementById(ID_INPUT_VVAFRO_REQUIRED_BLOODSTONE).value = trapSetups[VVAFRO_REQUIRED_BLOODSTONE];
        document.getElementById(ID_INPUT_VVAFRO_REQUIRED_BLOODSTONE).disabled = !trapSetups[VVAFRO_ATM_RETREAT];
    }

    recommendTrapSetup() {
        const trapSetups = this.trapSetups;
        const baitNames = getBaitNames();
        const brieCheese = baitNames.includes(BAIT_BRIE)? BAIT_BRIE: undefined;
        const baitName = baitNames.includes(BAIT_MOON)? BAIT_MOON: baitNames.includes(BAIT_CRESCENT)? BAIT_CRESCENT: undefined;
        this.getLawTrapSetup(trapSetups[VVAFRO_PHASE_DAY], brieCheese, ITEM_DISARM);
        this.getShadowTrapSetup(trapSetups[VVAFRO_PHASE_TWILIGHT], baitName);
        this.getShadowTrapSetup(trapSetups[VVAFRO_PHASE_MIDNIGHT], baitName);
        this.getArcaneTrapSetup(trapSetups[VVAFRO_PHASE_PITCH], baitName);
        this.getArcaneTrapSetup(trapSetups[VVAFRO_PHASE_UTTER_DARKNESS], baitName);
        this.getArcaneTrapSetup(trapSetups[VVAFRO_PHASE_FIRST_LIGHT], baitName);
        this.getArcaneTrapSetup(trapSetups[VVAFRO_PHASE_DAWN], baitName);
        trapSetups[VVAFRO_ATM_DEACTIVATE] = true;
        trapSetups[VVAFRO_ATM_RETREAT] = trapSetups[VVAFRO_REQUIRED_HOWLITE] > 0 || trapSetups[VVAFRO_REQUIRED_BLOODSTONE] > 0;
        this.initSelectTrapSetup();
    }
}

class PolicyRodSGa extends Policy {
    constructor () {
        super();
        this.trs[0] = ID_TR_SELECTABLE_TRAP_SETUP;
        this.selectableValues = RODSGA_SEASONS;
    }

    resetTrapSetups() {
        this._trapSetups = {};
        for (const season of RODSGA_SEASONS){
            this._trapSetups[season] = [];
        }
    }

    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_RODSGA);
    }

    initSelectTrapSetup() {
        this.setSelectableTrapSetup(this.trapSetups);
    }

    recommendTrapSetup() {
        const trapSetups = this.trapSetups;
        const baitName = getBaitNames().includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;
        this.getPhysicalTrapSetup(trapSetups[RODSGA_SEASON_SPRING], baitName, ITEM_DISARM);
        this.getTacticalTrapSetup(trapSetups[RODSGA_SEASON_SUMMER], baitName, ITEM_DISARM);
        this.getShadowTrapSetup(trapSetups[RODSGA_SEASON_AUTUMN], baitName, ITEM_DISARM);
        this.getHydroTrapSetup(trapSetups[RODSGA_SEASON_WINTER], baitName, ITEM_DISARM);
        this.initSelectTrapSetup();
    }
}

class PolicyRodZTo extends Policy {
    constructor () {
        super();
        this.trs[0] = ID_TR_RODZTO_STRATEGY;
        this.trs[1] = ID_TR_SELECTABLE_TRAP_SETUP;
        this.selectableValues = RODZTO_CHESS_PROGRESS;
    }

    resetTrapSetups() {
        this._trapSetups = {};
        for (const chessPiece of RODZTO_CHESS_PROGRESS){
            this._trapSetups[chessPiece] = [];
        }
        this._trapSetups[RODZTO_STRATEGY] = RODZTO_STRATEGY_MYSTIC_ONLY;
    }

    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_RODZTO);
    }

    initSelectTrapSetup() {
        const trapSetups = this.trapSetups;
        this.setSelectableTrapSetup(trapSetups);
        document.getElementById(ID_SELECT_RODZTO_STRATEGY).value = trapSetups[RODZTO_STRATEGY];
    }

    recommendTrapSetup() {
        function getRodZToTrapSetup(trapSetup, weaponName, baseName, baitName, trinketName) {
            trapSetup[IDX_WEAPON] = weaponName;
            trapSetup[IDX_BASE] = baseName;
            trapSetup[IDX_BAIT] = baitName;
            trapSetup[IDX_TRINKET] = trinketName;
        }

        const trapSetups = this.trapSetups;
        const weaponNames = getWeaponNames();
        const baseNames = getBaseNames();
        const baitNames = getBaitNames();
        const trinketNames = getTrinketNames();
        const bestBase = this.getBestBase();
        const bestTacticalWeapon = this.getBestLuckWeapon(POWER_TYPE_TACTICAL);
        const mysticPawnWeapon = weaponNames.includes(WEAPON_MYSTIC_PAWN_PINCHER)? WEAPON_MYSTIC_PAWN_PINCHER: bestTacticalWeapon;
        const mysticOnlyWeapon = weaponNames.includes(WEAPON_BLACKSTONE_PASS)? WEAPON_BLACKSTONE_PASS: bestTacticalWeapon;
        const technicPawnWeapon = weaponNames.includes(WEAPON_TECHNIC_PAWN_PINCHER)? WEAPON_TECHNIC_PAWN_PINCHER: bestTacticalWeapon;
        const technicOnlyWeapon = weaponNames.includes(WEAPON_OBVIOUS_AMBUSH)? WEAPON_OBVIOUS_AMBUSH: bestTacticalWeapon;
        const attractionBase = baseNames.includes(BASE_CHEESECAKE)? BASE_CHEESECAKE: baseNames.includes(BASE_WOODEN_BASE_WITH_TARGET)? BASE_WOODEN_BASE_WITH_TARGET: bestBase;
        const attractionCharm = trinketNames.includes(TRINKET_VALENTINE)? TRINKET_VALENTINE: trinketNames.includes(TRINKET_ATTRACTION)? TRINKET_ATTRACTION: undefined;
        const powerCharm = trinketNames.includes(TRINKET_POWER)? TRINKET_POWER: attractionCharm;
        const rookCrumbleCharm = trinketNames.includes(TRINKET_ROOK_CRUMBLE)? TRINKET_ROOK_CRUMBLE: powerCharm;
        const checkmateCheese = baitNames.includes(BAIT_CHECKMATE)? BAIT_CHECKMATE: undefined;
        const baitName = baitNames.includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;

        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_MYSTIC_PAWN], mysticPawnWeapon, attractionBase, baitName, attractionCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_MYSTIC_KNIGHT], mysticOnlyWeapon, bestBase, baitName, powerCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_MYSTIC_BISHOP], mysticOnlyWeapon, bestBase, baitName, powerCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_MYSTIC_ROOK], mysticOnlyWeapon, bestBase, baitName, rookCrumbleCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_MYSTIC_QUEEN], mysticOnlyWeapon, bestBase, baitName, powerCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_MYSTIC_KING], mysticOnlyWeapon, attractionBase, baitName, attractionCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_TECHNIC_PAWN], technicPawnWeapon, attractionBase, baitName, attractionCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_TECHNIC_KNIGHT], technicOnlyWeapon, bestBase, baitName, powerCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_TECHNIC_BISHOP], technicOnlyWeapon, bestBase, baitName, powerCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_TECHNIC_ROOK], technicOnlyWeapon, bestBase, baitName, rookCrumbleCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_TECHNIC_QUEEN], technicOnlyWeapon, bestBase, baitName, powerCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_TECHNIC_KING], technicOnlyWeapon, attractionBase, baitName, attractionCharm);
        getRodZToTrapSetup(trapSetups[RODZTO_CHESS_MASTER], bestTacticalWeapon, bestBase, checkmateCheese, powerCharm);
        this.initSelectTrapSetup();
    }
}

class PolicyRodCLi extends PolicySingleTrapSetup {
    constructor () {
        super();
        this.trs[0] = ID_TR_RODCLI_ATM_CATALOG_MICE;
        this.trs[1] = ID_TR_SINGLE_TRAP_SETUP;
    }

    resetTrapSetups() {
        this._trapSetups = {};
        this._trapSetups[RODCLI_ATM_CATALOG_MICE] = false;
    }

    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_RODCLI);
    }

    initSelectTrapSetup() {
        const trapSetups = this.trapSetups;
        this.setSingleTrapSetup(trapSetups);
        document.getElementById(ID_CBX_RODCLI_ATM_CATALOG_MICE).checked = trapSetups[RODCLI_ATM_CATALOG_MICE];
    }
}

class PolicyRodSSh extends PolicySingleTrapSetup {
    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_RODSSH);
    }

    recommendTrapSetup() {
        const baitName = getBaitNames().includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;
        this.getHydroTrapSetup(this.trapSetups, baitName);
        this.initSelectTrapSetup();
    }
}

class PolicyRodIce extends Policy {
    constructor () {
        super();
        this.trs[0] = ID_TR_SELECTABLE_TRAP_SETUP;
        this.selectableValues = RODICE_SUBLOCATIONS;
    }

    resetTrapSetups() {
        this._trapSetups = {};
        for (const sublocation of RODICE_SUBLOCATIONS){
            this._trapSetups[sublocation] = [];
        }
    }

    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_RODICE);
    }

    initSelectTrapSetup() {
        this.setSelectableTrapSetup(this.trapSetups);
    }

    recommendTrapSetup() {
        function getRodIceTrapSetup(trapSetup, baseName, baitName, trinketName) {
            trapSetup[IDX_WEAPON] = weaponName;
            trapSetup[IDX_BASE] = baseName;
            trapSetup[IDX_BAIT] = baitName;
            trapSetup[IDX_TRINKET] = trinketName;
        }

        const trapSetups = this.trapSetups;
        const weaponNames = getWeaponNames();
        const baseNames = getBaseNames();
        const baitNames = getBaitNames();
        const trinketNames = getTrinketNames();
        const bestBase = this.getBestBase();
        const bestHydroWeapon = this.getBestLuckWeapon(POWER_TYPE_HYDRO);
        const deepFreezeBase = baseNames.includes(BASE_DEEP_FREEZE)? BASE_DEEP_FREEZE: bestBase;
        const hearthstoneBase = baseNames.includes(BASE_HEARTHSTONE)? BASE_HEARTHSTONE: bestBase;
        const magnetBase = baseNames.includes(BASE_MAGNET)? BASE_MAGNET: bestBase;
        const remoteDetonatorBase = baseNames.includes(BASE_REMOTE_DETONATOR)? BASE_REMOTE_DETONATOR: bestBase;
        const spikedBase = baseNames.includes(BASE_SPIKED)? BASE_SPIKED: bestBase;
        const brieCheese = baitNames.includes(BAIT_BRIE)? BAIT_BRIE: undefined;
        const powerCharm = trinketNames.includes(TRINKET_POWER)? TRINKET_POWER: undefined;
        const stickyCharm = trinketNames.includes(TRINKET_STICKY)? TRINKET_STICKY: undefined;
        const waxCharm = trinketNames.includes(TRINKET_WAX)? TRINKET_WAX: undefined;
        const weaponName = (weaponNames.includes(WEAPON_STEAM_LASER_MK_III) && bestHydroWeapon == WEAPON_OASIS_WATER_NODE)? WEAPON_STEAM_LASER_MK_III: bestHydroWeapon;
        const baitName = baitNames.includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;
        const trinketName = weaponNames.indexOf(bestHydroWeapon) < 2? waxCharm: stickyCharm;

        getRodIceTrapSetup(trapSetups[RODICE_SUBLOCATION_ICEBERG_GENERAL], bestBase, baitName, powerCharm);
        getRodIceTrapSetup(trapSetups[RODICE_SUBLOCATION_TREACHEROUS_TUNNELS], magnetBase, baitName, trinketName);
        getRodIceTrapSetup(trapSetups[RODICE_SUBLOCATION_BRUTAL_BULWARK], spikedBase, baitName, trinketName);
        getRodIceTrapSetup(trapSetups[RODICE_SUBLOCATION_BOMBING_RUN], remoteDetonatorBase, baitName, trinketName);
        getRodIceTrapSetup(trapSetups[RODICE_SUBLOCATION_THE_MAD_DEPTHS], hearthstoneBase, baitName, trinketName);
        getRodIceTrapSetup(trapSetups[RODICE_SUBLOCATION_ICEWINGS_LAIR], deepFreezeBase, baitName, powerCharm);
        getRodIceTrapSetup(trapSetups[RODICE_SUBLOCATION_HIDDEN_DEPTHS], bestBase, baitName, powerCharm);
        getRodIceTrapSetup(trapSetups[RODICE_SUBLOCATION_THE_DEEP_LAIR], bestBase, baitName, powerCharm);
        this.initSelectTrapSetup();
    }
}

class PolicySDeFWa extends Policy {
    constructor () {
        super();
        this.trs[0] = ID_TR_SELECT_SDEFWA_WAVE;
        this.trs[1] = ID_TR_SDEFWA_POWER_TYPES_TRAP_SETUP;
        this.trs[2] = ID_TR_SELECT_SDEFWA_TARGET_POPULATION;
        this.trs[3] = ID_TR_SDEFWA_STREAKS_TRAP_SETUP;
        this.trs[4] = ID_TR_SDEFWA_LAST_SOLDIER_TRAP_SETUP;
        this.trs[5] = ID_TR_SDEFWA_WHEN_SUPPORT_RETREAT;
        this.trs[6] = ID_TR_SDEFWA_WAVE4_TRAP_SETUP;
    }

    resetTrapSetups() {
        this._trapSetups = {};
        for (const powerType of SDEFWA_POWER_TYPES){
            this._trapSetups[powerType] = [];
        }
        this._trapSetups[SDEFWA_LAST_SOLDIER] = [];
        this._trapSetups[SDEFWA_ARMING_CHARM_SUPPORT_RETREAT] = ITEM_DISARM;
        for (const wave of SDEFWA_WAVES){
            this._trapSetups[wave] = {};
            if (wave == SDEFWA_WAVE4) {
                this._trapSetups[wave][STATUS_BEFORE] = [];
                this._trapSetups[wave][STATUS_AFTER] = [];
            } else {
                for (let steak = 0; steak <= SDEFWA_MAX_STREAKS; steak++) {
                    this._trapSetups[wave][steak] = [];
                }
                this._trapSetups[wave][SDEFWA_POPULATION_PRIORITY] = SDEFWA_TARGET_POPULATION_LOWEST;
            }
        }
    }

    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_SDEFWA);
    }

    initSelectTrapSetup() {
        function hideShowSDeFWaRows() {
            const currentWave = document.getElementById(ID_SELECT_SDEFWA_WAVE).value;
            const WAVE4_DISPLAY = currentWave == SDEFWA_WAVE4? "table-row": "none";
            const WAVE123_DISPLAY = currentWave == SDEFWA_WAVE4? "none": "table-row";
            for (const tr of g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trs){
                if (tr == ID_TR_SELECT_SDEFWA_WAVE) {
                    continue;
                }
                document.getElementById(tr).style.display = tr == ID_TR_SDEFWA_WAVE4_TRAP_SETUP? WAVE4_DISPLAY : WAVE123_DISPLAY;
            }
        }

        const trapSetups = this.trapSetups;
        const currentPowerType = document.getElementById(ID_SELECT_SDEFWA_POWER_TYPE).value;
        document.getElementById(ID_SELECT_SDEFWA_SOLDIER_WEAPON).value = trapSetups[currentPowerType][IDX_WEAPON];
        document.getElementById(ID_SELECT_SDEFWA_SOLDIER_BASE).value = trapSetups[currentPowerType][IDX_BASE];
        document.getElementById(ID_SELECT_SDEFWA_LAST_SOLDIER_BAIT).value = trapSetups[SDEFWA_LAST_SOLDIER][IDX_BAIT];
        document.getElementById(ID_SELECT_SDEFWA_LAST_SOLDIER_CHARM_TYPE).value = trapSetups[SDEFWA_LAST_SOLDIER][IDX_CHARM_TYPE];
        document.getElementById(ID_SELECT_SDEFWA_ARMING_WARPATH_CHARM).value = trapSetups[SDEFWA_ARMING_CHARM_SUPPORT_RETREAT];
        const currentWave = document.getElementById(ID_SELECT_SDEFWA_WAVE).value;
        if (currentWave == SDEFWA_WAVE4) {
            const currentStatus = document.getElementById(ID_SELECT_SDEFWA_BEFORE_AFTER_WARDENS).value;
            document.getElementById(ID_SELECT_SDEFWA_WAVE4_WEAPON).value = trapSetups[currentWave][currentStatus][IDX_WEAPON];
            document.getElementById(ID_SELECT_SDEFWA_WAVE4_BASE).value = trapSetups[currentWave][currentStatus][IDX_BASE];
            document.getElementById(ID_SELECT_SDEFWA_WAVE4_BAIT).value = trapSetups[currentWave][currentStatus][IDX_BAIT];
            document.getElementById(ID_SELECT_SDEFWA_WAVE4_TRINKET).value = trapSetups[currentWave][currentStatus][IDX_TRINKET];
        } else {
            const currentSteak = document.getElementById(ID_SELECT_SDEFWA_STREAK).value;
            document.getElementById(ID_SELECT_SDEFWA_STREAK_BAIT).value = trapSetups[currentWave][currentSteak][IDX_BAIT];
            document.getElementById(ID_SELECT_SDEFWA_STREAK_CHARM_TYPE).value = trapSetups[currentWave][currentSteak][IDX_CHARM_TYPE];
            document.getElementById(ID_SELECT_SDEFWA_STREAK_SOLDIER_TYPE).value = trapSetups[currentWave][currentSteak][IDX_SOLDIER_TYPE];
            document.getElementById(ID_SELECT_SDEFWA_TARGET_POPULATION).value = trapSetups[currentWave][SDEFWA_POPULATION_PRIORITY];
        }
        hideShowSDeFWaRows();
    }

    recommendTrapSetup() {
        const trapSetups = this.trapSetups;
        const bestBase = this.getBestBase();
        const bestArcaneWeapon = this.getBestLuckWeapon(POWER_TYPE_ARCANE);
        const baitName = getBaitNames().includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;
        trapSetups[POWER_TYPE_ARCANE][IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_ARCANE);;
        trapSetups[POWER_TYPE_ARCANE][IDX_BASE] = bestBase;
        trapSetups[POWER_TYPE_HYDRO][IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_HYDRO);;
        trapSetups[POWER_TYPE_HYDRO][IDX_BASE] = bestBase;
        trapSetups[POWER_TYPE_PHYSICAL][IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_PHYSICAL);;
        trapSetups[POWER_TYPE_PHYSICAL][IDX_BASE] = bestBase;
        trapSetups[POWER_TYPE_TACTICAL][IDX_WEAPON] = this.getBestLuckWeapon(POWER_TYPE_TACTICAL);;
        trapSetups[POWER_TYPE_TACTICAL][IDX_BASE] = bestBase;
        trapSetups[SDEFWA_LAST_SOLDIER][IDX_BAIT] = baitName;
        trapSetups[SDEFWA_LAST_SOLDIER][IDX_CHARM_TYPE] = ITEM_DISARM;
        for (const wave of SDEFWA_WAVES){
            if (wave == SDEFWA_WAVE4) {
                for (const status of STATUSES){
                    this.getPhysicalTrapSetup(trapSetups[wave][status], baitName);
                }
            } else {
                if (wave == SDEFWA_WAVE3) {
                    trapSetups[wave][SDEFWA_POPULATION_PRIORITY] = SDEFWA_TARGET_POPULATION_HIGHEST;
                    for (let steak = 0; steak <= SDEFWA_MAX_STREAKS; steak++) {
                        trapSetups[wave][steak][IDX_BAIT] = baitName;
                        if (steak > 5) {
                            trapSetups[wave][steak][IDX_CHARM_TYPE] = SDEFWA_CHARM_TYPE_SUPER_WARPATH;
                            trapSetups[wave][steak][IDX_SOLDIER_TYPE] = SDEFWA_STREAK_SOLDIER_TYPE_COMMANDER;
                        } else if (steak > 2) {
                            trapSetups[wave][steak][IDX_CHARM_TYPE] = SDEFWA_CHARM_TYPE_SUPER_WARPATH;
                            trapSetups[wave][steak][IDX_SOLDIER_TYPE] = SDEFWA_STREAK_SOLDIER_TYPE_SOLIDER;
                        } else {
                            trapSetups[wave][steak][IDX_CHARM_TYPE] = SDEFWA_CHARM_TYPE_WARPATH;
                            trapSetups[wave][steak][IDX_SOLDIER_TYPE] = SDEFWA_STREAK_SOLDIER_TYPE_SOLIDER;
                        }
                    }
                } else {
                    trapSetups[wave][SDEFWA_POPULATION_PRIORITY] = SDEFWA_TARGET_POPULATION_LOWEST;
                    for (let steak = 0; steak <= SDEFWA_MAX_STREAKS; steak++) {
                        trapSetups[wave][steak][IDX_BAIT] = baitName;
                        trapSetups[wave][steak][IDX_CHARM_TYPE] = SDEFWA_CHARM_TYPE_WARPATH;
                        trapSetups[wave][steak][IDX_SOLDIER_TYPE] = SDEFWA_STREAK_SOLDIER_TYPE_SOLIDER;
                    }
                }
            }
        }
        this.initSelectTrapSetup();
    }
}

class PolicySDeMMa extends PolicySingleTrapSetup {
    get trapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_SDEMMA);
    }

    recommendTrapSetup() {
        const baitName = getBaitNames().includes(BAIT_BRIE)? BAIT_BRIE: undefined;
        this.getPhysicalTrapSetup(this.trapSetups, baitName);
        this.initSelectTrapSetup();
    }
}

class Policies {
    constructor() {
        this._policyDict = {}
        this.list = [];
        this.list.push(POLICY_NAME_HARBOUR);
        this.list.push(POLICY_NAME_MOUNTAIN);
        this.list.push(POLICY_NAME_CALM_CLEARING);
        this.list.push(POLICY_NAME_GREAT_GNARLED_TREE);
        this.list.push(POLICY_NAME_MOUSOLEUM);
        this.list.push(POLICY_NAME_CATACOMBS);
        this.list.push(POLICY_NAME_ACOLYTE_REALM);
        this.list.push(POLICY_NAME_DERR_DUNES);
        this.list.push(POLICY_NAME_JUNGLE_OF_DREAD);
        this.list.push(POLICY_NAME_CLAW_SHOT_CITY);
        this.list.push(POLICY_NAME_FORT_ROX);
        this.list.push(POLICY_NAME_SEASONAL_GARDEN);
        this.list.push(POLICY_NAME_ZUGZWANGS_TOWER);
        this.list.push(POLICY_NAME_CRYSTAL_LIBRARY);
        this.list.push(POLICY_NAME_SLUSHY_SHORELINE);
        this.list.push(POLICY_NAME_ICEBERG);
        this.list.push(POLICY_NAME_FIERY_WARPATH);
        this.list.push(POLICY_NAME_MURIDAE_MARKET);
    }

    getPolicy(policyName) {
        if (!(policyName in this._policyDict)) {
            switch(policyName) {
                case POLICY_NAME_HARBOUR:
                    this._policyDict[policyName] = new PolicyGnaHar();
                    break;
                case POLICY_NAME_MOUNTAIN:
                    this._policyDict[policyName] = new PolicyGnaMou();
                    break;
                case POLICY_NAME_CALM_CLEARING:
                    this._policyDict[policyName] = new PolicyWWoCCl();
                    break;
                case POLICY_NAME_GREAT_GNARLED_TREE:
                    this._policyDict[policyName] = new PolicyWWoGGT();
                    break;
                case POLICY_NAME_MOUSOLEUM:
                    this._policyDict[policyName] = new PolicyBurMou();
                    break;
                case POLICY_NAME_CATACOMBS:
                    this._policyDict[policyName] = new PolicyBWoCat();
                    break;
                case POLICY_NAME_ACOLYTE_REALM:
                    this._policyDict[policyName] = new PolicyBWoARe();
                    break;
                case POLICY_NAME_DERR_DUNES:
                    this._policyDict[policyName] = new PolicyTIsDDu();
                    break;
                case POLICY_NAME_JUNGLE_OF_DREAD:
                    this._policyDict[policyName] = new PolicyTIsJoD();
                    break;
                case POLICY_NAME_CLAW_SHOT_CITY:
                    this._policyDict[policyName] = new PolicyVVaCSC();
                    break;
                case POLICY_NAME_FORT_ROX:
                    this._policyDict[policyName] = new PolicyVVaFRo();
                    break;
                case POLICY_NAME_SEASONAL_GARDEN:
                    this._policyDict[policyName] = new PolicyRodSGa();
                    break;
                case POLICY_NAME_ZUGZWANGS_TOWER:
                    this._policyDict[policyName] = new PolicyRodZTo();
                    break;
                case POLICY_NAME_CRYSTAL_LIBRARY:
                    this._policyDict[policyName] = new PolicyRodCLi();
                    break;
                case POLICY_NAME_SLUSHY_SHORELINE:
                    this._policyDict[policyName] = new PolicyRodSSh();
                    break;
                case POLICY_NAME_ICEBERG:
                    this._policyDict[policyName] = new PolicyRodIce();
                    break;
                case POLICY_NAME_FIERY_WARPATH:
                    this._policyDict[policyName] = new PolicySDeFWa();
                    break;
                case POLICY_NAME_MURIDAE_MARKET:
                    this._policyDict[policyName] = new PolicySDeMMa();
                    break;
                default:
            }
        }
        return this._policyDict[policyName];
    }
}

const g_policies = new Policies();
function loadTrapInfo() {
    g_trapInfo = getStorage(STORAGE_TRAP_INFO, undefined);
}

function getWeaponInfo() {
    if (isNullOrUndefined(g_trapInfo)) {
        loadTrapInfo();
    }
    if (isNullOrUndefined(g_trapInfo)) {
        return undefined;
    } else {
        return g_trapInfo.weapon.info;
    }
}

function getBaseInfo() {
    if (isNullOrUndefined(g_trapInfo)) {
        loadTrapInfo();
    }
    if (isNullOrUndefined(g_trapInfo)) {
        return undefined;
    } else {
        return g_trapInfo.base.info;
    }
}

function getBaitInfo() {
    if (isNullOrUndefined(g_trapInfo)) {
        loadTrapInfo();
    }
    if (isNullOrUndefined(g_trapInfo)) {
        return undefined;
    } else {
        return g_trapInfo.bait.info;
    }
}

function getTrinketInfo() {
    if (isNullOrUndefined(g_trapInfo)) {
        loadTrapInfo();
    }
    if (isNullOrUndefined(g_trapInfo)) {
        return undefined;
    } else {
        return g_trapInfo.trinket.info;
    }
}

function getWeaponNames() {
    if (isNullOrUndefined(g_trapInfo)) {
        loadTrapInfo();
    }
    if (isNullOrUndefined(g_trapInfo)) {
        return [];
    } else {
        return g_trapInfo.weapon.names;
    }
}

function getBaseNames() {
    if (isNullOrUndefined(g_trapInfo)) {
        loadTrapInfo();
    }
    if (isNullOrUndefined(g_trapInfo)) {
        return [];
    } else {
        return g_trapInfo.base.names;
    }
}

function getBaitNames() {
    if (isNullOrUndefined(g_trapInfo)) {
        loadTrapInfo();
    }
    if (isNullOrUndefined(g_trapInfo)) {
        return [];
    } else {
        return g_trapInfo.bait.names;
    }
}

function getTrinketNames() {
    if (isNullOrUndefined(g_trapInfo)) {
        loadTrapInfo();
    }
    if (isNullOrUndefined(g_trapInfo)) {
        return [];
    } else {
        return g_trapInfo.trinket.names;
    }
}

function getFriendInfo() {
    if (isNullOrUndefined(g_friendInfo)) {
        g_friendInfo = getStorage(STORAGE_FRIEND_INFO, undefined);
        if (isNullOrUndefined(g_friendInfo)) {
            document.getElementById(ID_BOTTON_UPDATE_FRIENDS).click();
            return;
        }
    }
    return g_friendInfo;
}

// Start executing script
window.addEventListener("message", processEventMsg, false);

if (DEBUG_MODE) console.log('STARTING SCRIPT - ver: ' + g_strScriptVersion);
if (window.top != window.self) {
    if (DEBUG_MODE) console.log('In IFRAME - may cause firefox to error, location: ' + window.location.href);
} else {
    if (DEBUG_MODE) console.log('NOT IN IFRAME - will not work in fb MH');
}

function processEventMsg(event) {
    const tmpKRFrame = document.getElementById(ID_TMP_KR_FRAME);

    if (DEBUG_MODE) console.debug("Event origin: " + event.origin);
    if (event.origin.indexOf("mhcdn") > -1 || event.origin.indexOf("mousehuntgame") > -1 || event.origin.indexOf("dropbox") > -1) {
        if (event.data.indexOf("~") > -1) {
            const possibleAns = event.data.substring(0, event.data.indexOf("~"));
            const processedImg = event.data.substring(event.data.indexOf("~") + 1, event.data.length);
            let strKR = "KR" + KR_SEPARATOR;
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
        const puzzleAns = document.getElementsByClassName("mousehuntPage-puzzle-form-code")[0];

        if (!puzzleAns) {
            if (DEBUG_MODE) console.plog("puzzleAns: " + puzzleAns);
            return;
        }
        puzzleAns.value = possibleAns.toLowerCase();

        const puzzleSubmitButton = document.getElementsByClassName("mousehuntPage-puzzle-form-code-button")[0];

        if (!puzzleSubmitButton) {
            if (DEBUG_MODE) console.plog("puzzleSubmit: " + puzzleSubmitButton);
            return;
        }

        fireEvent(puzzleSubmitButton, 'click');
        g_kingsRewardRetry = 0;
        setStorage("KingsRewardRetry", g_kingsRewardRetry);
        const tmpKRFrame = document.getElementById(ID_TMP_KR_FRAME);
        if (tmpKRFrame) {
            document.body.removeChild(tmpKRFrame);
        }

        window.setTimeout(function () {
            checkKRAnswer();
        }, 5000);
    }
}

function checkKRAnswer() {
    const puzzleForm = document.getElementsByClassName("mousehuntPage-puzzle-formContainer")[0];
    if (puzzleForm.classList.contains("noPuzzle")) {
        // KR is solved clicking continue now
        location.reload(true)
        return;
    }

    const codeError = document.getElementsByClassName("mousehuntPage-puzzle-form-code-error");
    for (let i = 0; i < codeError.length; i++) {
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
        const strTemp = 'Max ' + MAX_KR_RETRY + 'retries. Pls solve it manually ASAP.';
        updateTitleTxt(strTemp);
        updateNextHuntTxt(strTemp);
        console.perror(strTemp);
    } else {
        ++g_kingsRewardRetry;
        setStorage("KingsRewardRetry", g_kingsRewardRetry);
        if (resetCaptcha) {
            getNewKRCaptcha();
        }
        const tmpKRFrame = document.getElementById(ID_TMP_KR_FRAME);
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

    const tagName = document.getElementsByTagName("a");
    for (let i = 0; i < tagName.length; i++) {
        if (tagName[i].innerText == "Click here to get a new one!") {
            // TODO IMPORTANT: Find another time to fetch new puzzle
            fireEvent(tagName[i], 'click');
        }
    }
}

function setBotDocumentStyle () {
    const docStyle = document.getElementsByTagName("STYLE")[0];
    const botStyle = "." + STYLE_CLASS_NAME_JNK_CAPTION + " { text-align: right; font-weight: bold; font-size:48%; }";
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
        if (g_baitCount == 0) {
            updateTitleTxt("No more cheese!");
            updateNextHuntTxt("Cannot hunt without the cheese...");
            updateNextTrapCheckTxt("Cannot hunt without the cheese...");
        } else {
            // Run counddown Trap Check Timer anyway
            window.setTimeout(function () {
                (countdownTrapCheckTimer)()
            }, 1000);
            if (g_isKingReward) {
                handleKingReward();
            }
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

    const krDelaySec = g_autosolveKRDelayMin + Math.floor(Math.random() * (g_autosolveKRDelayMax - g_autosolveKRDelayMin));

    kingRewardCountdownTimer(krDelaySec);
}

function kingRewardCountdownTimer(krDelaySec) {
    const strTemp = "Solve KR in " + timeFormat(krDelaySec) + " second(s)";
    updateTitleTxt(strTemp);
    updateNextHuntTxt(strTemp);
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

    const frame = document.createElement('iframe');
    frame.id = ID_TMP_KR_FRAME;
    const img = document.getElementsByClassName('mousehuntPage-puzzle-form-captcha-image')[0];

    if (DEBUG_MODE) console.log("Captcha Image fetched:")
    if (DEBUG_MODE) console.log(img);

    frame.src = img.querySelector('img').src;
    document.body.appendChild(frame);
}

function timeElapsedInSeconds(dateA, dateB) {
    const secondA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate(), dateA.getHours(), dateA.getMinutes(), dateA.getSeconds());
    const secondB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate(), dateB.getHours(), dateB.getMinutes(), dateB.getSeconds());

    return (secondB - secondA) / 1000;
}

function lockBot(processName) {
    if ((g_botProcess != BOT_PROCESS_IDLE) && (g_botProcess != processName)) {
        return false;
    }
    g_botProcess = processName;
    if (g_botProcess == processName) {
        document.getElementById(ID_BOT_PROCESS_TXT).innerHTML = g_botProcess;
        return true;
    }
    return false;
}

function runScheduledGiftingAndBalloting() {
    if (!lockBot(BOT_PROCESS_SCHEDULER)) {
        return;
    }
    if (g_statusGifting == STATUS_INCOMPLETE) {
        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Scheduled Gifting";
        prepareSendingGifts();
    } else {
        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Scheduled Balloting";
        prepareSendingBallots();
    }
}

function resetSchedule() {
    if (!lockBot(BOT_PROCESS_SCHEDULER)) {
        return;
    }
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Resetting Scheduler";
    // Actual reset schedule
    g_statusGifting = STATUS_INCOMPLETE;
    setStorage(STORAGE_STATUS_GIFTING, g_statusGifting);
    g_statusBalloting = STATUS_INCOMPLETE;
    setStorage(STORAGE_STATUS_BALLOTING, g_statusBalloting);
    // Unlock bot
    window.setTimeout(function () {
        reloadCampPage();
    }, 60 * 1000);
}

function checkSchedule() {
    const dateNow = new Date();
    const g_endScheduledResetTime = new Date();
    g_endScheduledResetTime.setHours(g_beginScheduledResetTime.getHours(), g_beginScheduledResetTime.getMinutes() + 1, 0);

    if (g_beginScheduledResetTime < dateNow && g_endScheduledResetTime > dateNow) {
        resetSchedule();
    } else if (g_beginScheduledGiftingAndBallotingTime < dateNow && (g_statusGifting == STATUS_INCOMPLETE || g_statusBalloting == STATUS_INCOMPLETE)) {
        runScheduledGiftingAndBalloting();
    }
}

function countdownBotHornTimer() {
    const nextBotHuntTime = new Date(g_nextHuntTime.getTime() + (g_botCountdownDelay * 1000));
    const currentTime = new Date();
    const nextHuntTimeTxt = g_nextHuntTime.toLocaleTimeString().endsWith("M")? g_nextHuntTime.toLocaleTimeString().slice(0,-3): g_nextHuntTime.toLocaleTimeString();
    document.getElementById(ID_NEXT_HUNT_TIME_TXT).innerHTML = nextHuntTimeTxt;

    if (nextBotHuntTime.getTime() < currentTime.getTime()) {
        prepareSoundingHorn();
    } else {
        const countdownInSeconds = (nextBotHuntTime.getTime() - currentTime.getTime()) / 1000;
        const countdownTxt = timeFormat(Math.floor(countdownInSeconds));
        updateTitleTxt("Horn: " + countdownTxt);
        document.getElementById(ID_BOT_COUNTDOWN_TXT).innerHTML = countdownTxt + "  <i>(incl " + timeFormat(g_botCountdownDelay) + " delay)</i>";
        if (g_botProcess == BOT_PROCESS_IDLE) {
            checkSchedule();
        }
        //g_botCountdownInterval
        if (countdownInSeconds > 60) {
            g_botCountdownInterval = 20;
        } else if (countdownInSeconds > 12) {
            g_botCountdownInterval = 10;
        } else if (countdownInSeconds > 7) {
            g_botCountdownInterval = 5;
        } else if (countdownInSeconds > 3) {
            g_botCountdownInterval = 2;
        } else {
            g_botCountdownInterval = 1;
        }
        document.getElementById(ID_BOT_INTERVAL_TXT).innerHTML = parseInt(g_botCountdownInterval) + " sec";
        // Check if user manaually sounded the horn
        //codeForCheckingIfUserManuallySoundedTheHorn();
        window.setTimeout(function () {
            countdownBotHornTimer()
        }, g_botCountdownInterval * 1000);
    }
}

function countdownTrapCheckTimer() {
    const nextTrapCheckTime = new Date(g_nextTrapCheckTime.getTime() + (g_trapCheckCountdownDelay * 1000));
    const currentTime = new Date();
    const nextTrapCheckTimeTxt = g_nextTrapCheckTime.toLocaleTimeString().endsWith("M")? g_nextTrapCheckTime.toLocaleTimeString().slice(0,-3): g_nextTrapCheckTime.toLocaleTimeString();
    document.getElementById(ID_NEXT_TRAP_CHECK_TIME_TXT).innerHTML = nextTrapCheckTimeTxt;

    if ((nextTrapCheckTime.getTime() < currentTime.getTime()) && lockBot(BOT_PROCESS_TIMER)) {
        trapCheck();
    } else {
        checkLocation();
        const countdownTxt = timeFormat(Math.floor((nextTrapCheckTime.getTime() - currentTime.getTime()) / 1000));
        document.getElementById(ID_TRAP_CHECK_COUNTDOWN_TXT).innerHTML = countdownTxt + "  <i>(incl " + timeFormat(g_trapCheckCountdownDelay) + " delay)</i>";
        window.setTimeout(function () {
            countdownTrapCheckTimer()
        }, TRAP_CHECK_TIMER_COUNTDOWN_INTERVAL * 1000);
    }
}

function timeFormat(time) {
    const hr = Math.floor(time / 3600);
    const min = Math.floor((time % 3600) / 60);
    const sec = (time % 3600 % 60) % 60;

    if (hr > 0) {
        return hr.toString() + " hr " + min.toString() + " min " + sec.toString() + " sec";
    } else if (min > 0) {
        return min.toString() + " min " + sec.toString() + " sec";
    } else {
        return sec.toString() + " sec";
    }
}

function trapCheck() {
    // Let user known that the script is going to check the trap
    updateTitleTxt("Checking The Trap...");
    document.getElementById(ID_TRAP_CHECK_COUNTDOWN_TXT).innerHTML = "Checking trap now...";

    // reload the page
    setTimeout(function () {
        reloadCampPage()
    }, 1000);
}

function reloadCampPage() {
    window.location.href = MOUSEHUNTGAME_WEBSITE_HOME;
}

function hornExist() {
    const headerElement = document.getElementById(ID_HEADER_ELEMENT);
    if (headerElement) {
        const headerClass = headerElement.getAttribute('class');
        if (headerClass.indexOf(HORNREADY_TXT) !== -1) {
            return true;
        }
    }
    return false;
}

function soundHorn() {
    function afterSoundingHorn() {
        function checkKRPrompt() {
            if (parseInt(getPageVariable(USER_NEXT_ACTIVETURN_SECONDS)) == 0 ||
                getPageVariable(USER_HAS_PUZZLE)) {
                updateTitleTxt("KR found. Prepare to Solve...");
                updateNextHuntTxt("KR found. Prepare to Solve...");
                window.setTimeout(function () {
                    reloadCampPage()
                }, 0.5 * 1000);
            }
        }

        if (DEBUG_MODE) console.log("RUN %cafterSoundingHorn()", "color: #bada55");
        checkKRPrompt();
        // update timer
        updateTitleTxt("Horn sounded. Synchronizing Data...");
        updateNextHuntTxt("Horn sounded. Synchronizing Data...");

        // reload data
        retrieveCampActiveData();

        // script continue as normal
        window.setTimeout(function () {
            countdownBotHornTimer()
        }, 0.5 * 1000);
    }

    const hornElement = document.getElementsByClassName(CLASS_HUNTERHORN_ELEMENT)[0].firstChild;
    fireEvent(hornElement, 'click');

    // double check if the horn was already sounded
    window.setTimeout(function () {
        afterSoundingHorn()
    }, 4000);
}

function prepareSoundingHorn() {
    if (DEBUG_MODE) console.log("RUN %csoundHorn()", "color: #FF7700");
    if (hornExist()) {
        soundHorn();
    } else {
        // The horn is missing
        updateTitleTxt("Synchronizing Data...");
        updateNextHuntTxt("Hunter horn is missing. Synchronizing data...");

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

    const evt = document.createEvent("HTMLEvents");
    evt.initEvent(event, true, true);

    return !element.dispatchEvent(evt);
}

function updateTitleTxt(titleTxt) {
    document.title = titleTxt;
}

function updateNextHuntTxt(nextHornTimeTxt) {
    document.getElementById(ID_BOT_COUNTDOWN_TXT).innerHTML = nextHornTimeTxt;
}

function updateNextTrapCheckTxt(trapCheckTimeTxt) {
    document.getElementById(ID_TRAP_CHECK_COUNTDOWN_TXT).innerHTML = trapCheckTimeTxt;
}

function loadPreferenceSettingFromStorage() {
    g_botHornTimeDelayMin = getStorageVarInt(STORAGE_BOT_HORN_TIME_DELAY_MIN, g_botHornTimeDelayMin);
    g_botHornTimeDelayMax = getStorageVarInt(STORAGE_BOT_HORN_TIME_DELAY_MAX, g_botHornTimeDelayMax);

    g_trapCheckTimeDelayMin = getStorageVarInt(STORAGE_TRAP_CHECK_TIME_DELAY_MIN, g_trapCheckTimeDelayMin);
    g_trapCheckTimeDelayMax = getStorageVarInt(STORAGE_TRAP_CHECK_TIME_DELAY_MAX, g_trapCheckTimeDelayMax);

    g_autosolveKRDelayMin = getStorageVarInt(STORAGE_AUTOSOLVE_KR_DELAY_MIN, g_autosolveKRDelayMin);
    g_autosolveKRDelayMax = getStorageVarInt(STORAGE_AUTOSOLVE_KR_DELAY_MAX, g_autosolveKRDelayMax);

    g_scheduledGiftingAndBallotingTime = getStorage(STORAGE_SCHEDULED_GIFTING_AND_BALLOTING_TIME, g_scheduledGiftingAndBallotingTime);
    g_beginScheduledGiftingAndBallotingTime.setHours(parseInt(g_scheduledGiftingAndBallotingTime.substring(0,2)), parseInt(g_scheduledGiftingAndBallotingTime.substring(3,5)), 0);
    g_scheduledResetTime = getStorage(STORAGE_SCHEDULED_RESET_TIME, g_scheduledResetTime);
    g_beginScheduledResetTime.setHours(parseInt(g_scheduledResetTime.substring(0,2)), parseInt(g_scheduledResetTime.substring(3,5)), 0);
    g_statusGifting = getStorage(STORAGE_STATUS_GIFTING, g_statusGifting);
    g_statusBalloting = getStorage(STORAGE_STATUS_BALLOTING, g_statusBalloting);
}

function getStorage(name, defaultValue) {
    const temp = JSON.parse(window.localStorage.getItem(name));
    if (isNullOrUndefined(temp)) {
        return defaultValue;
    } else {
        return temp;
    }
}

function getStorageVarBool(storageName, defaultBool) {
    const temp = getStorage(storageName);
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
    const temp = getStorage(storageName);
    let tempInt = defaultInt;
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
}

function isNullOrUndefined(obj) {
    return (obj === null || obj === undefined || obj === 'null' || obj === 'undefined' || obj === NaN);
}

function retrieveCampActiveData() {
    function getActualNextHuntTime() {
        const timeBefore = new Date();
        ajaxPost(window.location.origin + '/managers/ajax/pages/page.php',
                 getAjaxHeader({"page_class": "Camp", "last_read_journal_entry_id": getPageVariable("lastReadJournalEntryId")}),
                 function (data) {
            g_nextHuntTime = new Date();
            g_nextHuntTime.setTime(g_nextHuntTime.getTime() + data.user.next_activeturn_seconds*1000 + timeBefore.getTime() - g_nextHuntTime.getTime());
        }, function (error) {
            console.error('ajax:', error);
        });
    }

    // This function is to retrieve data from camp page that is actively changed, including
    // - next horn time
    // - trap check time (likely from storage), only from camp page at the very first time using this bot
    // - king reward
    // - bait quantity
    if (DEBUG_MODE) console.log('RUN retrieveCampActiveData()');

    // Check if there is King Reward ongoing
    g_isKingReward = getPageVariable(USER_HAS_PUZZLE);

    // get MH horn time
    g_nextHuntTime = new Date(); //For temporary, just in case if the Ajax response doesn't come fast enough.
    g_nextHuntTime.setSeconds(g_nextHuntTime.getSeconds() + getPageVariable(USER_NEXT_ACTIVETURN_SECONDS));
    if (!g_isKingReward) {
        getActualNextHuntTime();
    }
    g_botCountdownDelay = g_botHornTimeDelayMin + Math.round(Math.random() * (g_botHornTimeDelayMax - g_botHornTimeDelayMin));

    const trapCheckTimeOffset = getTrapCheckTime();
    g_nextTrapCheckTime = new Date();
    if (g_nextTrapCheckTime.getMinutes() >= trapCheckTimeOffset) {
        g_nextTrapCheckTime.setHours(g_nextTrapCheckTime.getHours()+1, trapCheckTimeOffset, 0, 0)
    } else {
        g_nextTrapCheckTime.setHours(g_nextTrapCheckTime.getHours(), trapCheckTimeOffset, 0, 0)
    }
    g_trapCheckCountdownDelay = g_trapCheckTimeDelayMin + Math.round(Math.random() * (g_trapCheckTimeDelayMax - g_trapCheckTimeDelayMin));

    g_baitCount = getPageVariable("user.bait_quantity");
}

function getTrapCheckTime() {
    // Check storage first
    const trapCheckTimeOffset = getStorageVarInt('trapCheckTimeOffset', -1);
    if (trapCheckTimeOffset != -1) {
        return trapCheckTimeOffset;
    }
    return getTrapCheckTimeFromPage();
}

function getTrapCheckTimeFromPage() {
    try {
        const passiveElement = document.getElementsByClassName('passive');
        if (passiveElement.length > 0) {
            let time = passiveElement[0].textContent;
            time = time.substr(time.indexOf('m -') - 4, 2);
            const trapCheckTimeOffset = parseInt(time);
            setStorage("trapCheckTimeOffset", time);
            return trapCheckTimeOffset;
        } else {
            throw new Error('passiveElement not found');
        }
    } catch (e) {
        console.perror('GetTrapCheckTime', e.message);
        return undefined;
    }
}

function isAtCampPage() {
    if (window.location.href == "http://www.mousehuntgame.com/" ||
        window.location.href == "https://www.mousehuntgame.com/" ||
        window.location.href == "http://www.mousehuntgame.com/#" ||
        window.location.href == "https://www.mousehuntgame.com/#" ||
        window.location.href == "http://www.mousehuntgame.com/?switch_to=standard" ||
        window.location.href == "https://www.mousehuntgame.com/?switch_to=standard" ||
        window.location.href == "http://www.mousehuntgame.com/index.php" ||
        window.location.href == "https://www.mousehuntgame.com/index.php" ||
        window.location.href == "http://www.mousehuntgame.com/camp.php" ||
        window.location.href == "https://www.mousehuntgame.com/camp.php" ||
        window.location.href == "http://www.mousehuntgame.com/camp.php#" ||
        window.location.href == "https://www.mousehuntgame.com/camp.php#") {
        return true;
    }
    return false;
}

function checkLocation() {
    function runDefaultLocation() {
        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_NONE;
    }

    function getCurrentWeaponItemId() {
        return getPageVariable("user.weapon_item_id");
    }

    function getCurrentBaseItemId() {
        return getPageVariable("user.base_item_id");
    }

    function getCurrentBaitItemId() {
        return getPageVariable("user.bait_item_id");
    }

    function getCurrentTrinketItemId() {
        return getPageVariable("user.trinket_item_id");
    }

    function armItem(classification, itemType) {
        const objData = {};
        objData.sn = 'Hitgrab';
        objData.hg_is_ajax = 1;
        objData[classification] = itemType;
        objData.uh = getPageVariable('user.unique_hash');
        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Policy arming " + classification;
        ajaxPost(window.location.origin + '/managers/ajax/users/changetrap.php', objData, function (data) {
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish arming " + classification;
        }, function (error) {
            console.error('ajax:', error);
            alert("error arming " + classification);
        });
    }

    function checkArmedItem(currentItemId, policyItemName, itemInfo) {
        // This function check if the currently armed item has the same itemId as the Policy item
        // If yes it return itemType (item code to be used later with Ajax)
        for (const [itemType, info] of Object.entries(itemInfo)) {
            if (policyItemName == info.name && currentItemId != info.itemId) {
                return itemType;
            } else if (policyItemName == info.name && currentItemId == info.itemId) {
                return;
            }
        }
    }

    function checkThenArmItem(classification, policyItemName) {
        if (isNullOrUndefined(policyItemName) || policyItemName == ITEM_IGNORE || policyItemName == ITEM_OTHER) {
            return;
        }
        let currentItemId;
        let itemInfo;
        if (classification == CLASSIFICATION_WEAPON) {
            currentItemId = getCurrentWeaponItemId();
            itemInfo = getWeaponInfo();
        } else if (classification == CLASSIFICATION_BASE) {
            currentItemId = getCurrentBaseItemId();
            itemInfo = getBaseInfo();
        } else if (classification == CLASSIFICATION_BAIT) {
            currentItemId = getCurrentBaitItemId();
            itemInfo = getBaitInfo();
        } else if (classification == CLASSIFICATION_TRINKET) {
            currentItemId = getCurrentTrinketItemId();
            itemInfo = getTrinketInfo();
        }
        let targetItemType;
        if (classification == CLASSIFICATION_TRINKET &&
            policyItemName == ITEM_DISARM &&
            !isNullOrUndefined(currentItemId)) {
            targetItemType = policyItemName.toLowerCase();
        } else if (classification == CLASSIFICATION_TRINKET &&
                   !isNullOrUndefined(policyItemName) &&
                   policyItemName != ITEM_DISARM) {
            targetItemType = checkArmedItem(currentItemId, policyItemName, itemInfo);
        } else if (classification != CLASSIFICATION_TRINKET) {
            targetItemType = checkArmedItem(currentItemId, policyItemName, itemInfo);
        }
        if (!isNullOrUndefined(targetItemType) &&
            (classification == CLASSIFICATION_BAIT || classification == CLASSIFICATION_TRINKET) &&
            targetItemType != "disarm") {
            // In case of Cheese or Charm, the quantity of the item have to be checked,
            // so that it'll not keep trying to arm the non-existed item
            ajaxPost(window.location.origin + '/managers/ajax/users/gettrapcomponents.php',
                     getAjaxHeader({"classification": classification}),
                     function (data) {
                for (const component of data.components){
                    if (component.name == policyItemName && component.quantity > 0) {
                        // the item does exist, so arm the item !!
                        if (!lockBot(BOT_PROCESS_POLICY)) {
                            return;
                        }
                        armItem(classification, targetItemType);
                        window.setTimeout(function () {
                            reloadCampPage();
                        }, 1 * 1000);
                        return;
                    }
                }
                document.getElementById(ID_BOTTON_UPDATE_TRAPS).click();
            }, function (error) {
                console.error('ajax:', error);
                alert("error checking item quantity");
            });
        } else if (!isNullOrUndefined(targetItemType) && lockBot(BOT_PROCESS_POLICY)) {
            // Same as the previous if condition but this apply to only Weapon and Base, which are hard to disappear
            // So no Ajax checking need, just go straight to the arming process
            armItem(classification, targetItemType);
            return targetItemType;
        }
    }

    function armTrap(trapSetup) {
        let delayTime = 0;
        if (!isNullOrUndefined(checkThenArmItem(CLASSIFICATION_WEAPON, trapSetup[IDX_WEAPON]))) {
            delayTime += 1;
        }
        if (!isNullOrUndefined(checkThenArmItem(CLASSIFICATION_BASE, trapSetup[IDX_BASE]))) {
            delayTime += 1;
        }
        if (!isNullOrUndefined(checkThenArmItem(CLASSIFICATION_BAIT, trapSetup[IDX_BAIT]))) {
            delayTime += 1;
        }
        if (!isNullOrUndefined(checkThenArmItem(CLASSIFICATION_TRINKET, trapSetup[IDX_TRINKET]))) {
            delayTime += 1;
        }
        if (delayTime > 0) {
            window.setTimeout(function () {
                reloadCampPage();
            }, delayTime * 1000);
        }
    }

    function runSingleTrapSetupPolicy(policyName) {
        document.getElementById(ID_POLICY_TXT).innerHTML = policyName;
        const trapSetups = g_policies.getPolicy(policyName).trapSetups;
        armTrap(trapSetups);
    }

    function runGnaHarPolicy() {
        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_HARBOUR;
        const harbourInfo = getPageVariable("user.quests.QuestHarbour");
        switch(harbourInfo.status) {
            case "noShip":
                break;
            case "canBeginSearch":
                fireEvent(document.getElementsByClassName("harbourHUD-beginSearch")[0], "click");
                break;
            case "searchStarted":
                if (harbourInfo.can_claim) {
                    fireEvent(document.getElementsByClassName("harbourHUD-claimBootyButton active")[0], "click");
                }
                break;
            default:
        }
        const trapSetups = g_policies.getPolicy(POLICY_NAME_HARBOUR).trapSetups;
        armTrap(trapSetups);
    }

    function runGnaMouPolicy() {
        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_MOUNTAIN;
        const mountainInfo = getPageVariable("user.quests.QuestMountain");
        const trapSetups = g_policies.getPolicy(POLICY_NAME_MOUNTAIN).trapSetups;
        if (trapSetups[GNAMOU_ATM_SMASH] && mountainInfo.boulder_hp == 0 && lockBot(BOT_PROCESS_POLICY)) {
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Smashing the boulder";
            ajaxPost(window.location.origin + '/managers/ajax/environment/mountain.php',
                     getAjaxHeader({"action": "claim_reward", "last_read_journal_entry_id": getPageVariable("lastReadJournalEntryId")}),
                     function (data) {
                window.setTimeout(function () {
                    reloadCampPage();
                }, 2 * 1000);
            }, function (error) {
                console.error('ajax:', error);
                alert("error Smashing the boulder");
            });
        }
        if (trapSetups[GNAMOU_ATM_SWITCH_CHARM]) {
            if (mountainInfo.boulder_hp > 300) {
                if (parseInt(mountainInfo.items.super_power_trinket.quantity) > 0) {
                    trapSetups[IDX_TRINKET] = TRINKET_SUPER_POWER;
                } else if (parseInt(mountainInfo.items.power_trinket.quantity) > 0) {
                    trapSetups[IDX_TRINKET] = TRINKET_POWER;
                } else if (parseInt(mountainInfo.items.weak_power_trinket.quantity) > 0) {
                    trapSetups[IDX_TRINKET] = TRINKET_SMALL_POWER;
                }
            } else if (mountainInfo.boulder_hp > 60) {
                if (parseInt(mountainInfo.items.power_trinket.quantity) > 0) {
                    trapSetups[IDX_TRINKET] = TRINKET_POWER;
                } else if (parseInt(mountainInfo.items.weak_power_trinket.quantity) > 0) {
                    trapSetups[IDX_TRINKET] = TRINKET_SMALL_POWER;
                }
            } else if (parseInt(mountainInfo.items.weak_power_trinket.quantity) > 0) {
                trapSetups[IDX_TRINKET] = TRINKET_SMALL_POWER;
            } else if (parseInt(mountainInfo.items.power_trinket.quantity) > 0) {
                trapSetups[IDX_TRINKET] = TRINKET_POWER;
            }
        }
        armTrap(trapSetups);
    }

    function runVVaCSCPolicy() {
        function claimReward() {
            function openChest() {
                const openButton = document.getElementsByClassName("mousehuntActionButton openReward")[0];
                fireEvent(openButton, "click");
            }

            const claimButton = document.getElementsByClassName("mousehuntActionButton treasureMapView-claimRewardButton")[0];
            fireEvent(claimButton, "click");
            window.setTimeout(function () {
                openChest();
            }, 5 * 1000);
        }

        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_CLAW_SHOT_CITY;
        let poster;
        const phase = getPageVariable("user.quests.QuestClawShotCity.phase");
        const trapSetups = g_policies.getPolicy(POLICY_NAME_CLAW_SHOT_CITY).trapSetups;
        if (trapSetups[VVACSC_ATM_CACTUS_CHARM] &&
            getTrinketNames().includes(TRINKET_CACTUS_CHARM)) {
            trapSetups[phase][IDX_TRINKET] = TRINKET_CACTUS_CHARM;
        }
        switch(phase) {
            case VVACSC_PHASE_LAWLESS:
                armTrap(trapSetups[phase]);
                break;
            case VVACSC_PHASE_NEED_POSTER:
                armTrap(trapSetups[phase]);
                break;
            case VVACSC_PHASE_HAS_POSTER:
                if (!trapSetups[VVACSC_ATM_POSTER]) {
                    return;
                }
                poster = document.getElementsByClassName("open has_poster")[0];
                fireEvent(poster, "click");
                window.setTimeout(function () {
                    reloadCampPage();
                }, 5 * 1000);
                break;
            case VVACSC_PHASE_ACTIVE_POSTER:
                armTrap(trapSetups[phase]);
                break;
            case VVACSC_PHASE_HAS_REWARD:
                if (!trapSetups[VVACSC_ATM_POSTER] || !lockBot(BOT_PROCESS_POLICY)) {
                    return;
                }
                poster = document.getElementsByClassName("open has_reward")[0];
                fireEvent(poster, "click");
                window.setTimeout(function () {
                    claimReward();
                }, 5 * 1000);
                window.setTimeout(function () {
                    reloadCampPage();
                }, 25 * 1000);
                break;
            default:
        }
        poster = undefined;
    }

    function runVVaFRoPolicy() {
        function deactivateTower() {
            if (fortRoxInfo.tower_status == "normal active") {
                fireEvent(document.getElementsByClassName("fortRoxHUD-spellTowerButton normal active")[0], "click");
            }
        }

        function activateTower() {
            if (fortRoxInfo.tower_status == "normal inactive") {
                fireEvent(document.getElementsByClassName("fortRoxHUD-spellTowerButton normal inactive")[0], "click");
            }
        }

        function checkFortRoxTrapSetup(trapSetup) {
            if (trapSetup[IDX_TOWER] == VVAFRO_TOWER_DEACTIVATE) {
                deactivateTower();
            } else if (!trapSetups[VVAFRO_ATM_DEACTIVATE] || fortRoxInfo.hp_percent != 100) {
                activateTower();
            }
            armTrap(trapSetup);
        }

        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_FORT_ROX;
        const fortRoxInfo = getPageVariable("user.quests.QuestFortRox");
        const trapSetups = g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups;
        if (fortRoxInfo.current_phase != "day" &&
            trapSetups[VVAFRO_ATM_RETREAT] &&
            parseInt(fortRoxInfo.items.howlite_stat_item.quantity) >= trapSetups[VVAFRO_REQUIRED_HOWLITE] &&
            parseInt(fortRoxInfo.items.blood_stone_stat_item.quantity) >= trapSetups[VVAFRO_REQUIRED_BLOODSTONE] &&
            lockBot(BOT_PROCESS_POLICY)) {
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Retreating ";
            ajaxPost(window.location.origin + '/managers/ajax/environment/fort_rox.php',
                     getAjaxHeader({"action": "retreat", "last_read_journal_entry_id": getPageVariable("lastReadJournalEntryId")}),
                     function (data) {
                window.setTimeout(function () {
                    reloadCampPage();
                }, 2 * 1000);
            }, function (error) {
                console.error('ajax:', error);
                alert("error retreating from Fort Rox");
            });
        } else {
            if (trapSetups[VVAFRO_ATM_DEACTIVATE] && fortRoxInfo.hp_percent == 100) {
                deactivateTower();
            }
            switch(fortRoxInfo.current_phase) {
                case "day":
                    checkFortRoxTrapSetup(trapSetups[VVAFRO_PHASE_DAY]);
                    break;
                case "night":
                    switch(fortRoxInfo.current_stage) {
                        case "stage_one":
                            checkFortRoxTrapSetup(trapSetups[VVAFRO_PHASE_TWILIGHT]);
                            break;
                        case "stage_two":
                            checkFortRoxTrapSetup(trapSetups[VVAFRO_PHASE_MIDNIGHT]);
                            break;
                        case "stage_three":
                            checkFortRoxTrapSetup(trapSetups[VVAFRO_PHASE_PITCH]);
                            break;
                        case "stage_four":
                            checkFortRoxTrapSetup(trapSetups[VVAFRO_PHASE_UTTER_DARKNESS]);
                            break;
                        case "stage_five":
                            checkFortRoxTrapSetup(trapSetups[VVAFRO_PHASE_FIRST_LIGHT]);
                            break;
                        default:
                    }
                    break;
                case "dawn":
                    checkFortRoxTrapSetup(trapSetups[VVAFRO_PHASE_DAWN]);
                    break;
                default:
            }
        }
    }

    function runRodSGaPolicy() {
        function getRodSGaSeason() {
            const nTimeStamp = Date.parse(new Date()) / 1000;
            const nFirstSeasonTimeStamp = 1283328000;
            const nSeasonLength = 288000; // 80hr
            const seasonIdx = Math.floor((nTimeStamp - nFirstSeasonTimeStamp) / nSeasonLength) % RODSGA_SEASONS.length;
            return RODSGA_SEASONS[seasonIdx];
        }

        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_SEASONAL_GARDEN;
        const currentSeason = getRodSGaSeason();
        const trapSetups = g_policies.getPolicy(POLICY_NAME_SEASONAL_GARDEN).trapSetups;
        armTrap(trapSetups[currentSeason]);
    }

    function runRodZToPolicy() {
        function getTowerProgress() {
            const towerProgress = {};
            for (const chess of RODZTO_CHESS_MYSTIC){
                towerProgress[chess] = 0;
            }
            for (const chess of RODZTO_CHESS_TECHNIC){
                towerProgress[chess] = 0;
            }
            towerProgress[NEXT_MYSTIC_TARGET] = RODZTO_CHESS_MYSTIC_PAWN;
            towerProgress[NEXT_TECHNIC_TARGET] = RODZTO_CHESS_TECHNIC_PAWN;
            towerProgress[UNLOCK_CHESS_MASTER] = false;

            const progressMagic = document.getElementsByClassName("zuzwangsTowerHUD-progress magic")[0].children;
            for (const item of progressMagic){
                if (item.src.indexOf("pawn") > -1) {
                    towerProgress[RODZTO_CHESS_MYSTIC_PAWN] += 1
                } else if (item.src.indexOf("knight") > -1) {
                    towerProgress[RODZTO_CHESS_MYSTIC_KNIGHT] += 1
                } else if (item.src.indexOf("bishop") > -1) {
                    towerProgress[RODZTO_CHESS_MYSTIC_BISHOP] += 1
                } else if (item.src.indexOf("rook") > -1) {
                    towerProgress[RODZTO_CHESS_MYSTIC_ROOK] += 1
                } else if (item.src.indexOf("queen") > -1) {
                    towerProgress[RODZTO_CHESS_MYSTIC_QUEEN] += 1
                } else if (item.src.indexOf("king") > -1) {
                    towerProgress[RODZTO_CHESS_MYSTIC_KING] += 1
                }
            }
            const progressTechnic = document.getElementsByClassName("zuzwangsTowerHUD-progress tech")[0].children;
            for (const item of progressTechnic){
                if (item.src.indexOf("pawn") > -1) {
                    towerProgress[RODZTO_CHESS_TECHNIC_PAWN] += 1
                } else if (item.src.indexOf("knight") > -1) {
                    towerProgress[RODZTO_CHESS_TECHNIC_KNIGHT] += 1
                } else if (item.src.indexOf("bishop") > -1) {
                    towerProgress[RODZTO_CHESS_TECHNIC_BISHOP] += 1
                } else if (item.src.indexOf("rook") > -1) {
                    towerProgress[RODZTO_CHESS_TECHNIC_ROOK] += 1
                } else if (item.src.indexOf("queen") > -1) {
                    towerProgress[RODZTO_CHESS_TECHNIC_QUEEN] += 1
                } else if (item.src.indexOf("king") > -1) {
                    towerProgress[RODZTO_CHESS_TECHNIC_KING] += 1
                }
            }
            if (towerProgress[RODZTO_CHESS_MYSTIC_KING] == 1) {
                towerProgress[NEXT_MYSTIC_TARGET] = RODZTO_CHESS_MASTER;
                towerProgress[UNLOCK_CHESS_MASTER] = true;
            } else if (towerProgress[RODZTO_CHESS_MYSTIC_QUEEN] == 1) {
                towerProgress[NEXT_MYSTIC_TARGET] = RODZTO_CHESS_MYSTIC_KING;
            } else if (towerProgress[RODZTO_CHESS_MYSTIC_ROOK] == 2) {
                towerProgress[NEXT_MYSTIC_TARGET] = RODZTO_CHESS_MYSTIC_QUEEN;
            } else if (towerProgress[RODZTO_CHESS_MYSTIC_BISHOP] == 2) {
                towerProgress[NEXT_MYSTIC_TARGET] = RODZTO_CHESS_MYSTIC_ROOK;
            } else if (towerProgress[RODZTO_CHESS_MYSTIC_KNIGHT] == 2) {
                towerProgress[NEXT_MYSTIC_TARGET] = RODZTO_CHESS_MYSTIC_BISHOP;
            } else if (towerProgress[RODZTO_CHESS_MYSTIC_PAWN] == 8) {
                towerProgress[NEXT_MYSTIC_TARGET] = RODZTO_CHESS_MYSTIC_KNIGHT;
            }
            if (towerProgress[RODZTO_CHESS_TECHNIC_KING] == 1) {
                towerProgress[NEXT_TECHNIC_TARGET] = RODZTO_CHESS_MASTER;
                towerProgress[UNLOCK_CHESS_MASTER] = true;
            } else if (towerProgress[RODZTO_CHESS_TECHNIC_QUEEN] == 1) {
                towerProgress[NEXT_TECHNIC_TARGET] = RODZTO_CHESS_TECHNIC_KING;
            } else if (towerProgress[RODZTO_CHESS_TECHNIC_ROOK] == 2) {
                towerProgress[NEXT_TECHNIC_TARGET] = RODZTO_CHESS_TECHNIC_QUEEN;
            } else if (towerProgress[RODZTO_CHESS_TECHNIC_BISHOP] == 2) {
                towerProgress[NEXT_TECHNIC_TARGET] = RODZTO_CHESS_TECHNIC_ROOK;
            } else if (towerProgress[RODZTO_CHESS_TECHNIC_KNIGHT] == 2) {
                towerProgress[NEXT_TECHNIC_TARGET] = RODZTO_CHESS_TECHNIC_BISHOP;
            } else if (towerProgress[RODZTO_CHESS_TECHNIC_PAWN] == 8) {
                towerProgress[NEXT_TECHNIC_TARGET] = RODZTO_CHESS_TECHNIC_KNIGHT;
            }
            return towerProgress;
        }

        const NEXT_MYSTIC_TARGET = "Next Mystic Target";
        const NEXT_TECHNIC_TARGET = "Next Technic Target";
        const UNLOCK_CHESS_MASTER = "Unlock Chess Master";
        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_ZUGZWANGS_TOWER;
        const towerProgress = getTowerProgress();
        const trapSetups = g_policies.getPolicy(POLICY_NAME_ZUGZWANGS_TOWER).trapSetups;
        switch(trapSetups[RODZTO_STRATEGY]) {
            case RODZTO_STRATEGY_MYSTIC_ONLY:
                armTrap(trapSetups[towerProgress[NEXT_MYSTIC_TARGET]]);
                break;
            case RODZTO_STRATEGY_TECHNIC_ONLY:
                armTrap(trapSetups[towerProgress[NEXT_TECHNIC_TARGET]]);
                break;
            case RODZTO_STRATEGY_MYSTIC_FIRST:
                break;
            case RODZTO_STRATEGY_TECHNIC_FIRST:
                break;
            default:
        }
    }

    function runRodCLiPolicy() {
        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_CRYSTAL_LIBRARY;
        const trapSetups = g_policies.getPolicy(POLICY_NAME_CRYSTAL_LIBRARY).trapSetups;
        const libraryInfo = getPageVariable("user.quests.QuestZugzwangLibrary");
        if (trapSetups[RODCLI_ATM_CATALOG_MICE] &&
            isNullOrUndefined(libraryInfo.hasResearchQuest) &&
            parseInt(libraryInfo.secondsRemainingUntilUserCanAcceptQuest) == 0 &&
            lockBot(BOT_PROCESS_POLICY)) {
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Getting Assignment";
            ajaxPost(window.location.origin + '/managers/ajax/environment/zugzwanglibrary.php',
                     getAjaxHeader({"action": "purchase",
                                    "last_read_journal_entry_id": getPageVariable("lastReadJournalEntryId"),
                                    "convertible_item_type": "library_intro_research_assignment_convertible"}),
                     function (data) {
                window.setTimeout(function () {
                    reloadCampPage();
                }, 2 * 1000);
            }, function (error) {
                console.error('ajax:', error);
                alert("error getting Library Assignment");
            });
        }
        armTrap(trapSetups);
    }

    function runSDeFWaPolicy() {
        function getLowestPopulation(warpathMice) {
            return Object.entries(warpathMice)
                .filter(([key, value]) => value.powerType !== POWER_TYPE_ARCANE)
                .sort(([,a], [,b]) => a.quantity - b.quantity)
                .map(x => x[0])[0];
        }

        function getHighestPopulation(warpathMice) {
            return Object.entries(warpathMice)
                .filter(([key, value]) => value.powerType !== POWER_TYPE_ARCANE)
                .sort(([,a], [,b]) => b.quantity - a.quantity)
                .map(x => x[0])[0];
        }

        function isLastWave(warpathMice) {
            return Object.entries(warpathMice)
                .filter(([key, value]) => value.quantity !== 0)
                .length == 1;
        }

        function runWave123Policy(wave, warpathMice) {
            if (isNullOrUndefined(trapSetups) ||
                isNullOrUndefined(trapSetups[wave]) ||
                isNullOrUndefined(trapSetups[wave][SDEFWA_POPULATION_PRIORITY])) {
                return;
            }
            // Count how many mice left in the wave
            for (const [mouseName, mouseInfo] of Object.entries(warpathInfo.mice)) {
                if (mouseName == "desert_general" || mouseName == "desert_supply") {
                    continue;
                }
                warpathMice[mouseName].quantity = mouseInfo.quantity;
            }
            if (isLastWave(warpathMice)) {
                // Charm used here are any typical charms (like Regal or Ancient)
                // This part also checks Soldier Type of the Streak and arm the Gargantua Charm, if it's needed
            } else {
                const SDEFWA_TARGET_POPULATION_LOWEST = "Lowest";
                const SDEFWA_TARGET_POPULATION_HIGHEST = "Highest";
                const targetMouse = trapSetups[wave][SDEFWA_POPULATION_PRIORITY] == SDEFWA_TARGET_POPULATION_LOWEST? getLowestPopulation(warpathMice): getHighestPopulation(warpathMice);
                const streak = warpathInfo.streak_type == targetMouse? warpathInfo.streak_quantity: 0;
                const trapSetup = [];
                trapSetup[IDX_WEAPON] = trapSetups[warpathMice[targetMouse].powerType][IDX_WEAPON];
                trapSetup[IDX_BASE] = trapSetups[warpathMice[targetMouse].powerType][IDX_BASE];
                trapSetup[IDX_BAIT] = trapSetups[wave][streak][IDX_BAIT];
                let warpathCharm = "";
                let superWarpathCharm = "";
                switch(trapSetups[wave][streak][IDX_SOLDIER_TYPE]) {
                    case SDEFWA_STREAK_SOLDIER_TYPE_SOLIDER:
                        break;
                    case SDEFWA_STREAK_SOLDIER_TYPE_COMMANDER:
                        warpathCharm == trinketNames.includes(WARPATH_COMMANDERS_CHARM)? WARPATH_COMMANDERS_CHARM: undefined;
                        superWarpathCharm == trinketNames.includes(SUPER_WARPATH_COMMANDERS_CHARM)? SUPER_WARPATH_COMMANDERS_CHARM: WARPATH_COMMANDERS_CHARM;
                        break;
                    case SDEFWA_STREAK_SOLDIER_TYPE_GARGANTUA:
                        if (trinketNames.includes(GARGANTUA_CHARM)) {
                            trapSetup[IDX_BAIT] = GARGANTUA_CHARM;
                        }
                        break;
                    default:
                }
                alert(trapSetup);
            }
            /*
            const IDX_CHARM_TYPE = 4;
const IDX_SOLDIER_TYPE = 5;
        const WARPATH_COMMANDERS_CHARM = "Warpath Commander's Charm";
        const SUPER_WARPATH_COMMANDERS_CHARM = "Super Warpath Commander's Charm";
const SDEFWA_STREAK_SOLDIER_TYPE_SOLIDER = "Soldier";
const SDEFWA_STREAK_SOLDIER_TYPE_COMMANDER = "Commander";
const SDEFWA_STREAK_SOLDIER_TYPE_GARGANTUA = "Gargantua";
*/
        }

        function runWave1Policy() {
        }

        function runWave2Policy() {
        }

        function runWave3Policy() {
            const miceWave3 = {}
            miceWave3.desert_archer_epic = {}
            miceWave3.desert_archer_epic.powerType = POWER_TYPE_PHYSICAL;
            miceWave3.desert_archer_epic[SDEFWA_CHARM_TYPE_WARPATH] = WARPATH_ARCHER_CHARM;
            miceWave3.desert_archer_epic[SDEFWA_CHARM_TYPE_SUPER_WARPATH] = SUPER_WARPATH_ARCHER_CHARM;
            miceWave3.desert_artillery = {}
            miceWave3.desert_artillery.powerType = POWER_TYPE_ARCANE;
            miceWave3.desert_cavalry_strong = {}
            miceWave3.desert_cavalry_strong.powerType = POWER_TYPE_TACTICAL;
            miceWave3.desert_cavalry_strong[SDEFWA_CHARM_TYPE_WARPATH] = WARPATH_CAVALRY_CHARM;
            miceWave3.desert_cavalry_strong[SDEFWA_CHARM_TYPE_SUPER_WARPATH] = SUPER_WARPATH_CAVALRY_CHARM;
            miceWave3.desert_mage_strong = {}
            miceWave3.desert_mage_strong.powerType = POWER_TYPE_HYDRO;
            miceWave3.desert_mage_strong[SDEFWA_CHARM_TYPE_WARPATH] = WARPATH_MAGE_CHARM;
            miceWave3.desert_mage_strong[SDEFWA_CHARM_TYPE_SUPER_WARPATH] = SUPER_WARPATH_MAGE_CHARM;
            miceWave3.desert_scout_epic = {}
            miceWave3.desert_scout_epic.powerType = POWER_TYPE_PHYSICAL;
            miceWave3.desert_scout_epic[SDEFWA_CHARM_TYPE_WARPATH] = WARPATH_SCOUT_CHARM;
            miceWave3.desert_scout_epic[SDEFWA_CHARM_TYPE_SUPER_WARPATH] = SUPER_WARPATH_SCOUT_CHARM;
            miceWave3.desert_warrior_epic = {}
            miceWave3.desert_warrior_epic.powerType = POWER_TYPE_PHYSICAL;
            miceWave3.desert_warrior_epic[SDEFWA_CHARM_TYPE_WARPATH] = WARPATH_WARRIOR_CHARM;
            miceWave3.desert_warrior_epic[SDEFWA_CHARM_TYPE_SUPER_WARPATH] = SUPER_WARPATH_WARRIOR_CHARM;

            return runWave123Policy(SDEFWA_WAVE3, miceWave3);
        }

        function runWave4Policy() {
        }

        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_FIERY_WARPATH;
        const GARGANTUA_CHARM = "Gargantua Charm";
        const WARPATH_ARCHER_CHARM = "Warpath Archer Charm";
        const SUPER_WARPATH_ARCHER_CHARM = "Super Warpath Archer Charm";
        const WARPATH_CAVALRY_CHARM = "Warpath Cavalry Charm";
        const SUPER_WARPATH_CAVALRY_CHARM = "Super Warpath Cavalry Charm";
        const WARPATH_COMMANDERS_CHARM = "Warpath Commander's Charm";
        const SUPER_WARPATH_COMMANDERS_CHARM = "Super Warpath Commander's Charm";
        const WARPATH_MAGE_CHARM = "Warpath Mage Charm";
        const SUPER_WARPATH_MAGE_CHARM = "Super Warpath Mage Charm";
        const WARPATH_SCOUT_CHARM = "Warpath Scout Charm";
        const SUPER_WARPATH_SCOUT_CHARM = "Super Warpath Scout Charm";
        const WARPATH_WARRIOR_CHARM = "Warpath Warrior Charm";
        const SUPER_WARPATH_WARRIOR_CHARM = "Super Warpath Warrior Charm";
        const trapSetups = g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups;
        const warpathInfo = getPageVariable("user.viewing_atts.desert_warpath");
        const trinketNames = getTrinketNames();
        switch(warpathInfo.wave) {
            case 1:
                runWave1Policy();
                break;
            case 2:
                runWave2Policy();
                break;
            case 3:
                runWave3Policy();
                break;
            case 4:
                runWave4Policy();
                break;
            default:
        }
        /*
        alert(warpathInfo.wave);
        listAttributes(warpathInfo);
        */
    }
    /*
        resetTrapSetups() {
        this.trapSetups = {};
        for (const powerType of SDEFWA_POWER_TYPES){
            this.trapSetups[powerType] = [];
        }
        this.trapSetups[SDEFWA_LAST_SOLDIER] = [];
        this.trapSetups[SDEFWA_ARMING_CHARM_SUPPORT_RETREAT] = ITEM_DISARM;
        for (const wave of SDEFWA_WAVES){
            this.trapSetups[wave] = {};
            if (wave == SDEFWA_WAVE4) {
                this.trapSetups[wave][STATUS_BEFORE] = [];
                this.trapSetups[wave][STATUS_AFTER] = [];
            } else {
                for (let steak = 0; steak <= SDEFWA_MAX_STREAKS; steak++) {
                    this.trapSetups[wave][steak] = [];
                }
                this.trapSetups[wave][SDEFWA_POPULATION_PRIORITY] = SDEFWA_TARGET_POPULATION_LOWEST;
            }
        }
    }
*/
    if (document.getElementById(ID_BOT_PROCESS_TXT).innerHTML != BOT_PROCESS_IDLE) {
        return;
    }
    if (!isAtCampPage()){
        return;
    }
    const currentLocation = getPageVariable("user.environment_name");
    switch(currentLocation) {
        case LOCATION_HARBOUR:
            runGnaHarPolicy();
            break;
        case LOCATION_MOUNTAIN:
            runGnaMouPolicy();
            break;
        case LOCATION_CALM_CLEARING:
            runSingleTrapSetupPolicy(POLICY_NAME_CALM_CLEARING);
            break;
        case LOCATION_GREAT_GNARLED_TREE:
            runSingleTrapSetupPolicy(POLICY_NAME_GREAT_GNARLED_TREE);
            break;
        case LOCATION_MOUSOLEUM:
            runSingleTrapSetupPolicy(POLICY_NAME_MOUSOLEUM);
            break;
        case LOCATION_CATACOMBS:
            runSingleTrapSetupPolicy(POLICY_NAME_CATACOMBS);
            break;
        case LOCATION_ACOLYTE_REALM:
            runSingleTrapSetupPolicy(POLICY_NAME_ACOLYTE_REALM);
            break;
        case LOCATION_DERR_DUNES:
            runSingleTrapSetupPolicy(POLICY_NAME_DERR_DUNES);
            break;
        case LOCATION_JUNGLE_OF_DREAD:
            runSingleTrapSetupPolicy(POLICY_NAME_JUNGLE_OF_DREAD);
            break;
        case LOCATION_FORT_ROX:
            runVVaFRoPolicy();
            break;
        case LOCATION_CLAW_SHOT_CITY:
            runVVaCSCPolicy();
            break;
        case LOCATION_SEASONAL_GARDEN:
            runRodSGaPolicy();
            break;
        case LOCATION_CRYSTAL_LIBRARY:
            runRodCLiPolicy();
            break;
        case LOCATION_ZUGZWANGS_TOWER:
            runRodZToPolicy();
            break;
        case LOCATION_SLUSHY_SHORELINE:
            runSingleTrapSetupPolicy(POLICY_NAME_SLUSHY_SHORELINE);
            break;
        case LOCATION_FIERY_WARPATH:
            //runSDeFWaPolicy();
            break;
        case LOCATION_MURIDAE_MARKET:
            runSingleTrapSetupPolicy(POLICY_NAME_MURIDAE_MARKET);
            break;
        default:
            runDefaultLocation();
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
    const x = document.getElementsByTagName("STYLE");
    alert(x[0].lentgh);
    x[0].innerHTML = ".autoBotTxt { background-color: yellow; color: red; }";
    alert(x[0].innerHTML);
    for (let i=0; i<x.length; x++) {
        alert(x[i].tagName);
    }
    document.getElementById("demo").innerHTML = x[0].innerHTML;
}

function debugObj(obj) {
    let tempTxt = "";
    for (const [objKey, entry] of Object.entries(obj)) {
        tempTxt += objKey;
        tempTxt += "\n";
        for (const [entryKey, value] of Object.entries(entry)) {
            tempTxt += "  - " + entryKey + " : " + value;
            tempTxt += "\n";
        }
    }
    alert(tempTxt);
}

function listAttributes(obj) {
    const attrs = obj.attributes;
    let tmpTxt = "";
    for (const [key, value] of Object.entries(obj)) {
        tmpTxt += key + " : " + value + "\n";
    }
    alert(tmpTxt);
}

function testSaveObjToStorage() {
    alert("in saveObjToStorage");
    const myObj = {"key1": ['a', 'b', 'c']};

    for (let i = 0; i < myObj.key1.length; i++) {
        alert(myObj.key1[i]);
    }
    setStorage("testObj", JSON.stringify(myObj));
}

function testLoadObjFromStorage() {
    let tmpInfo;
    tmpInfo = getStorage(STORAGE_TRAP_INFO, undefined);
    debugObj(tmpInfo);
}

function testSortObj() {
    const unSorted = {}
    const WEAPON_A = "horrific_venus_mouse_trap_weapon";
    const WEAPON_B = "mystic_low_weapon";
    const WEAPON_C = "bottomless_grave_weapon";
    const WEAPON_D = "ambush_weapon";
    const WEAPON_E = "acronym_weapon";
    const POWER_TYPE = "Power Type";
    const POWER = "Power";
    const LUCK = "Luck";
    const NAME = "Name";

    unSorted[WEAPON_A] = {};
    unSorted[WEAPON_A].powerType = POWER_TYPE_TACTICAL;
    unSorted[WEAPON_A].power = 3400;
    unSorted[WEAPON_A][LUCK] = 16;
    unSorted[WEAPON_A][NAME] = "Horrific Venus Mouse Trap";
    unSorted[WEAPON_B] = {};
    unSorted[WEAPON_B].powerType = POWER_TYPE_TACTICAL;
    unSorted[WEAPON_B].power = 60;
    unSorted[WEAPON_B][LUCK] = 0;
    unSorted[WEAPON_B][NAME] = "Mystic Pawn Pincher";
    unSorted[WEAPON_C] = {};
    unSorted[WEAPON_C].powerType = "Shadow";
    unSorted[WEAPON_C].power = 1500;
    unSorted[WEAPON_C][LUCK] = 5;
    unSorted[WEAPON_C][NAME] = "Bottomless Grave";
    unSorted[WEAPON_D] = {};
    unSorted[WEAPON_D].powerType = POWER_TYPE_TACTICAL;
    unSorted[WEAPON_D].power = 3000;
    unSorted[WEAPON_D][LUCK] = 12;
    unSorted[WEAPON_D][NAME] = "Ambush Trap";
    unSorted[WEAPON_E] = {};
    unSorted[WEAPON_E].powerType = POWER_TYPE_ARCANE;
    unSorted[WEAPON_E].power = 3000;
    unSorted[WEAPON_E][LUCK] = 18;
    unSorted[WEAPON_E][NAME] = "Arcane Capturing Rod Of Never Yielding Mystery";

    const sorted = Object.keys(unSorted).sort().reduce(
        (obj, key) => {
            obj[key] = unSorted[key];
            return obj;
        },
        {}
    );
    const tacticalWeapons = Object.fromEntries(Object.entries(unSorted).filter(([key, value]) => value.powerType === POWER_TYPE_TACTICAL) );
    const sortedTacticalWeapons = Object.fromEntries(Object.entries(unSorted)
                                                     .filter(([key, value]) => value.powerType === POWER_TYPE_TACTICAL)
                                                     .sort(([,a], [,b]) => b.power - a.power) );
    debugObj(unSorted);
    debugObj(sorted);
    debugObj(tacticalWeapons);
    debugObj(sortedTacticalWeapons);
}

function updateMice() {
    function processMouseListData(data) {
        function getMouseData(mouseIdx) {
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Getting information from mouse: '" + miceList[mouseIdx].name + "'";
            ajaxPost(window.location.origin + '/managers/ajax/mice/getstat.php',
                     getAjaxHeader({action: "get_mice",
                                    "mouse_types[]": miceList[mouseIdx].type,
                                    last_read_journal_entry_id: lastReadJournalEntryId}),
                     function (data) {
                const mouseInfo = data.mice[0];
                g_mouseInfo[mouseInfo.type] = {};
                g_mouseInfo[mouseInfo.type].name = mouseInfo.name;
                g_mouseInfo[mouseInfo.type].id = mouseInfo.id;
                g_mouseInfo[mouseInfo.type].groupName = mouseInfo.group_name;
                if (!isNullOrUndefined(mouseInfo.weaknesses) && mouseInfo.weaknesses.length > 0) {
                    g_mouseInfo[mouseInfo.type].weaknesses = {};
                }
            }, function (error) {
                console.error('ajax:', error);
                alert("error getting mouse information");
            });
            mouseIdx += 1;
            if (mouseIdx < miceList.length) {
                window.setTimeout(function () {
                    getMouseData(mouseIdx);
                }, infoInterval * 1000);
            }
        }

        let miceList = [];
        for (const subgroup of data.mouse_list_category.subgroups) {
            miceList = miceList.concat(subgroup.mice);
        }

        miceList = miceList.slice(0,2);
        getMouseData(0);
    }

    function processAdversariesData(data) {
        function getCategoryData(catIdx) {
            const category = categories[catIdx];
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Fetching mouse list from category: '" + category.type + "'";
            ajaxPost(window.location.origin + '/managers/ajax/mice/mouse_list.php',
                     getAjaxHeader({action: "get_group",
                                    category: category.type,
                                    user_id: getPageVariable("user.user_id"),
                                    display_mode: "images",
                                    view: "ViewMouseListGroups"}),
                     function (data) {
                processMouseListData(data);
            }, function (error) {
                console.error('ajax:', error);
                alert("error getting mouse list");
            });
            catIdx += 1;
            if (catIdx < categories.length) {
                window.setTimeout(function () {
                    getCategoryData(catIdx);
                }, ( 0.5 + (1.2 * category.total * infoInterval)) * 1000);
            }
        }

        g_mouseInfo = {};
        const categories = data.page.tabs[0].subtabs[0].mouse_list.categories.slice(0,1);
        getCategoryData(0);
    }

    /*
    if (!lockBot(BOT_PROCESS_MANUAL)) {
        return;
    }
    */
    const infoInterval = 1.05
    const lastReadJournalEntryId = getPageVariable("lastReadJournalEntryId")
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Prepare updating mice inforamation";
    ajaxPost(window.location.origin + '/managers/ajax/pages/page.php',
             getAjaxHeader({"page_class": "Adversaries", "last_read_journal_entry_id": lastReadJournalEntryId}),
             function (data) {
        processAdversariesData(data);
    }, function (error) {
        console.error('ajax:', error);
        alert("error updating mice information");
    });
}

function test1() {
    updateMice();
    //testSortObj();
    //checkLocation();
    //testSaveObjToStorage();
    //displayDocumentStyles();
}

function test2() {
    //testLoadObjFromStorage();
}

function getAjaxHeader(addedData) {
    const mainData = {};
    mainData.sn = 'Hitgrab';
    mainData.hg_is_ajax = 1;
    mainData.uh = getPageVariable('user.unique_hash');
    return Object.assign(mainData, addedData);
}

function ajaxPost(postURL, objData, callback, throwerror) {
    try {
        jQuery.ajax({
            type: 'POST',
            url: postURL,
            data: objData,
            contentType: 'application/x-www-form-urlencoded',
            dataType: 'json',
            xhrFields: {
                withCredentials: false
            },
            success: callback,
            error: throwerror,
        });
    }
    catch (e) {
        throwerror(e);
    }
}

function manualClaimingYesterdayGifts() {
    if (!lockBot(BOT_PROCESS_MANUAL)) {
        return;
    }
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual claiming yesterday Gifts";
    prepareClaimingGifts(false);
}

function manualClaimingTodayGifts() {
    if (!lockBot(BOT_PROCESS_MANUAL)) {
        return;
    }
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual claiming today Gifts";
    prepareClaimingGifts(true);
}

function prepareClaimingGifts(fromTop) {
    function claimGifts(fromTop) {
        function claimingGifts(fromTop, giftIndex) {
            const giftRow = fromTop? giftRows[giftIndex]: giftRows[nGiftRows-giftIndex-1];
            const senderName = giftRow.getElementsByClassName("giftSelectorView-inbox-gift-details")[0].getElementsByTagName("a")[0].text;
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Claiming a gift from " + senderName;
            const actionButton = giftRow.getElementsByClassName("giftSelectorView-inbox-gift-actions")[0].getElementsByClassName("claim mousehuntActionButton")[0];
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
        const giftRows = document.getElementsByClassName("giftSelectorView-inbox-giftContainer")[0].getElementsByClassName("giftSelectorView-inbox-giftRow");
        const nGiftRows = giftRows.length
        window.setTimeout(function () {
            claimingGifts(fromTop, 0);
        }, 0.5 * 1000);
    }
    const giftButton = document.getElementsByClassName("freeGifts")[0];
    fireEvent(giftButton, "click");
    window.setTimeout(function () {
        claimGifts(fromTop)
    }, 4.5 * 1000);
}

function manualSendingGifts() {
    if (!lockBot(BOT_PROCESS_MANUAL)) {
        return;
    }
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual sending Gifts";
    prepareSendingGifts();
}

function prepareSendingGifts() {
    function sendingGifts(snuidIdx) {
        function processPageData(data) {
            function checkCompleteGifts() {
                if (completeGifts.length == snuids.length) {
                    g_statusGifting = STATUS_COMPLETE;
                    setStorage(STORAGE_STATUS_GIFTING, g_statusGifting);
                }
                window.setTimeout(function () {
                    reloadCampPage();
                }, itemTimeoutInterval * 1000);
            }

            const sendDailyGiftInfo = Object.entries(data.page.tabs.profile.subtabs)[0][1].friends_profile_view.user_interactions.actions.send_daily_gift;
            if (sendDailyGiftInfo.is_allowed) {
                document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Sending a gift to " + friendInfo[snuid].name;
                ajaxPost(window.location.origin + '/managers/ajax/users/socialGift.php',
                         getAjaxHeader({"action": "send_daily_gift", "snuid": snuid}),
                         function (data) {
                }, function (error) {
                    console.error('ajax:', error);
                    alert("error sending gift to " + snuid);
                });
            } else if (sendDailyGiftInfo.is_daily_total_limit_reached) {
                document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Cannot send a gift to " + friendInfo[snuid].name + " (limit reached)";
                g_statusGifting = STATUS_COMPLETE;
                setStorage(STORAGE_STATUS_GIFTING, g_statusGifting);
                reloadCampPage();
            } else if (sendDailyGiftInfo.is_complete) {
                completeGifts.push(snuid);
                document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Cannot send a gift to " + friendInfo[snuid].name + " (already sent)";
            }
            snuidIdx += 1
            if (snuidIdx < snuids.length) {
                window.setTimeout(function () {
                    sendingGifts(snuidIdx);
                }, itemTimeoutInterval * 1000);
            } else {
                window.setTimeout(function () {
                    checkCompleteGifts();
                }, 2 * itemTimeoutInterval * 1000);
            }
        }

        const snuid = snuids[snuidIdx];
        ajaxPost(window.location.origin + '/managers/ajax/pages/page.php',
                 getAjaxHeader({"page_class": "HunterProfile", "page_arguments[snuid]": snuid, "last_read_journal_entry_id": lastReadJournalEntryId}),
                 function (data) {
            processPageData(data);
        }, function (error) {
            console.error('ajax:', error);
            alert("error getting hunter profile");
        });
    }

    const lastReadJournalEntryId = getPageVariable("lastReadJournalEntryId");
    const itemTimeoutInterval = 0.75;
    const friendInfo = getFriendInfo();
    const completeGifts = [];
    const snuids = Object.keys(friendInfo);
    sendingGifts(0);
}

function manualSendingBallots() {
    if (!lockBot(BOT_PROCESS_MANUAL)) {
        return;
    }
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual sending Ballots";
    prepareSendingBallots();
}

function prepareSendingBallots() {
    function sendingBallots(snuidIdx) {
        function processPageData(data) {
            function checkCompleteBallots() {
                if (completeBallots.length == 20) {
                    g_statusBalloting = STATUS_COMPLETE;
                    setStorage(STORAGE_STATUS_BALLOTING, g_statusBalloting);
                }
                window.setTimeout(function () {
                    reloadCampPage();
                }, itemTimeoutInterval * 1000);
            }
            const sendDrawBallot = Object.entries(data.page.tabs.profile.subtabs)[0][1].friends_profile_view.user_interactions.actions.send_draw_ballot;
            if (sendDrawBallot.is_allowed) {
                document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Sending a Ballot to " + friendInfo[snuid].name;
                ajaxPost(window.location.origin + '/managers/ajax/users/givefriendballot.php',
                         getAjaxHeader({"snuid": snuid}),
                         function (data) {
                }, function (error) {
                    console.error('ajax:', error);
                    alert("error sending ballot to " + snuid);
                });
            } else if (sendDrawBallot.is_limit_reached) {
                document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Cannot send a ballot to " + friendInfo[snuid].name + " (limit reached)";
                g_statusBalloting = STATUS_COMPLETE;
                setStorage(STORAGE_STATUS_BALLOTING, g_statusBalloting);
                reloadCampPage();
            } else if (sendDrawBallot.is_complete) {
                completeBallots.push(snuid);
                document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Cannot send a ballot to " + friendInfo[snuid].name + " (already sent)";
            }
            snuidIdx += 1
            if (snuidIdx < snuids.length) {
                window.setTimeout(function () {
                    sendingBallots(snuidIdx);
                }, itemTimeoutInterval * 1000);
            } else {
                window.setTimeout(function () {
                    checkCompleteBallots();
                }, 2 * itemTimeoutInterval * 1000);
            }
        }

        const snuid = snuids[snuidIdx];
        ajaxPost(window.location.origin + '/managers/ajax/pages/page.php',
                 getAjaxHeader({"page_class": "HunterProfile", "page_arguments[snuid]": snuid, "last_read_journal_entry_id": lastReadJournalEntryId}),
                 function (data) {
            processPageData(data);
        }, function (error) {
            console.error('ajax:', error);
            alert("error getting hunter profile");
        });
    }

    const lastReadJournalEntryId = getPageVariable("lastReadJournalEntryId");
    const itemTimeoutInterval = 0.75;
    const friendInfo = getFriendInfo();
    const completeBallots = [];
    const snuids = Object.keys(friendInfo);
    sendingBallots(0);
}

function embedUIStructure() {
    // This function is to embed UI structure at the top of related pages
    // The UI consist of 3 parts
    // 1. timer
    // 2. timer preferences
    // 3. policy preferences for setting up trap based on location and/or event

    function embedStatusTable() {
        let tmpTxt;
        let captionCell;
        let rulerCell;
        const statusSection = document.createElement('div');
        const statusDisplayTable = document.createElement('table');
        statusDisplayTable.width = "100%";

        const trRuler = statusDisplayTable.insertRow();
        trRuler.style.display = "none";
        rulerCell = trRuler.insertCell();
        rulerCell.width = 100;
        rulerCell.style.textAlign = "center";
        rulerCell.style.border = "solid #0000FF";
        rulerCell.innerHTML = rulerCell.width;
        rulerCell = trRuler.insertCell();
        rulerCell.width = 55;
        rulerCell.style.textAlign = "center";
        rulerCell.style.border = "solid #0000FF";
        rulerCell.innerHTML = rulerCell.width;
        rulerCell = trRuler.insertCell();
        rulerCell.width = 20;
        rulerCell.style.textAlign = "center";
        rulerCell.style.border = "solid #0000FF";
        rulerCell.innerHTML = rulerCell.width;
        rulerCell = trRuler.insertCell();
        rulerCell.width = 50;
        rulerCell.style.textAlign = "center";
        rulerCell.style.border = "solid #0000FF";
        rulerCell.innerHTML = rulerCell.width;
        rulerCell = trRuler.insertCell();
        rulerCell.width = 235;
        rulerCell.style.textAlign = "center";
        rulerCell.style.border = "solid #0000FF";
        rulerCell.innerHTML = rulerCell.width;
        rulerCell = trRuler.insertCell();
        rulerCell.width = 50;
        rulerCell.style.textAlign = "center";
        rulerCell.style.border = "solid #0000FF";
        rulerCell.innerHTML = rulerCell.width;
        rulerCell = trRuler.insertCell();
        rulerCell.width = 40;
        rulerCell.style.textAlign = "center";
        rulerCell.style.border = "solid #0000FF";
        rulerCell.innerHTML = rulerCell.width;

        // The first row shows title and version (also some misc buttons)
        const trFirst = statusDisplayTable.insertRow();
        const statusDisplayTitle = trFirst.insertCell();
        statusDisplayTitle.colSpan = 3;
        statusDisplayTitle.innerHTML = "<b><a href=\"https://github.com/bujaraty/JnK/blob/main/MH_Admirer.user.js\" target=\"_blank\">J n K Admirer (version " + g_strScriptVersion + ")</a></b>";
        const miscStatusCell = trFirst.insertCell();
        miscStatusCell.colSpan = 2;
        miscStatusCell.style.fontSize = "9px";
        miscStatusCell.style.textAlign = "right";
        tmpTxt = document.createTextNode("Gifting status : " + g_statusGifting + ",  ");
        miscStatusCell.appendChild(tmpTxt);
        tmpTxt = document.createTextNode("Balloting status : " + g_statusBalloting + "  ");
        miscStatusCell.appendChild(tmpTxt);
        const miscButtonsCell = trFirst.insertCell();
        miscButtonsCell.colSpan = 3;
        miscButtonsCell.style.textAlign = "right";
        const sendGiftsButton = document.createElement('button');
        sendGiftsButton.onclick = manualSendingGifts
        sendGiftsButton.style.fontSize = "8px";
        tmpTxt = document.createTextNode("Send Gifts");
        sendGiftsButton.appendChild(tmpTxt);
        miscButtonsCell.appendChild(sendGiftsButton);
        const sendBallotsButton = document.createElement('button');
        sendBallotsButton.onclick = manualSendingBallots
        sendBallotsButton.style.fontSize = "8px";
        tmpTxt = document.createTextNode("Send Ballots");
        sendBallotsButton.appendChild(tmpTxt);
        miscButtonsCell.appendChild(sendBallotsButton);
        const claimYesterdayGiftsButton = document.createElement('button');
        claimYesterdayGiftsButton.onclick = manualClaimingYesterdayGifts
        claimYesterdayGiftsButton.style.fontSize = "8px";
        tmpTxt = document.createTextNode("Claim yesterday gifts");
        claimYesterdayGiftsButton.appendChild(tmpTxt);
        miscButtonsCell.appendChild(claimYesterdayGiftsButton);
        const claimTodayGiftsButton = document.createElement('button');
        claimTodayGiftsButton.onclick = manualClaimingTodayGifts
        claimTodayGiftsButton.style.fontSize = "8px";
        tmpTxt = document.createTextNode("Claim today gifts");
        claimTodayGiftsButton.appendChild(tmpTxt);
        miscButtonsCell.appendChild(claimTodayGiftsButton);

        // The second row shows next bot horn time countdown
        const trSecond = statusDisplayTable.insertRow();
        captionCell = trSecond.insertCell();
        captionCell.width = 100;
        captionCell.style.fontWeight = "bold";
        captionCell.innerHTML = "Next Hunt : ";
        const nextHuntTimeTxt = trSecond.insertCell();
        nextHuntTimeTxt.width = 60;
        nextHuntTimeTxt.style.textAlign = "left";
        nextHuntTimeTxt.id = ID_NEXT_HUNT_TIME_TXT;
        nextHuntTimeTxt.innerHTML = "Loading...";
        captionCell = trSecond.insertCell();
        captionCell.width = 70;
        captionCell.colSpan = 2;
        captionCell.style.fontWeight = "bold";
        captionCell.innerHTML = "Count Down : ";
        const botCountdownTxt = trSecond.insertCell();
        botCountdownTxt.width = 235;
        botCountdownTxt.style.textAlign = "left";
        botCountdownTxt.id = ID_BOT_COUNTDOWN_TXT;
        botCountdownTxt.innerHTML = "Loading...";
        captionCell = trSecond.insertCell();
        captionCell.style.fontWeight = "bold";
        captionCell.width = 50;
        captionCell.innerHTML = "Interval : ";
        const botIntervalTxt = trSecond.insertCell();
        captionCell.width = 40;
        botIntervalTxt.style.textAlign = "left";
        botIntervalTxt.id = ID_BOT_INTERVAL_TXT;
        botIntervalTxt.innerHTML = "Loading...";

        // The third row shows next trap check time countdown
        const trThird = statusDisplayTable.insertRow();
        captionCell = trThird.insertCell();
        captionCell.style.fontWeight = "bold";
        captionCell.innerHTML = "Next Trap Check : ";
        const nextTrapCheckTimeTxt = trThird.insertCell();
        nextTrapCheckTimeTxt.style.textAlign = "left";
        nextTrapCheckTimeTxt.id = ID_NEXT_TRAP_CHECK_TIME_TXT;
        nextTrapCheckTimeTxt.innerHTML = "Loading...";
        captionCell = trThird.insertCell();
        captionCell.colSpan = 2;
        captionCell.style.fontWeight = "bold";
        captionCell.innerHTML = "Count Down : ";
        const trapCheckCountDownTxt = trThird.insertCell();
        trapCheckCountDownTxt.style.textAlign = "left";
        trapCheckCountDownTxt.id = ID_TRAP_CHECK_COUNTDOWN_TXT;
        trapCheckCountDownTxt.innerHTML = "Loading...";

/*
        // The forth row is very temporary just for testing
        const trForth = statusDisplayTable.insertRow();
        trForth.id = "test row";
        const testButtonsCell = trForth.insertCell();
        const test1Button = document.createElement('button');
        test1Button.onclick = test1
        test1Button.style.fontSize = "10px";
        tmpTxt = document.createTextNode("test 1");
        test1Button.appendChild(tmpTxt);
        testButtonsCell.appendChild(test1Button);
        const test2Button = document.createElement('button');
        test2Button.onclick = test2
        test2Button.style.fontSize = "10px";
        tmpTxt = document.createTextNode("test 2");
        test2Button.appendChild(tmpTxt);
        testButtonsCell.appendChild(test2Button);
*/

        statusSection.appendChild(statusDisplayTable);

        tmpTxt = undefined;
        captionCell = undefined;
        return statusSection;
    }

    function embedPreferences() {
        function togglePreferences() {
            const toggleLink = document.getElementById(ID_PREFERENCES_LINK);
            const preferencesBox = document.getElementById(ID_PREFERENCES_BOX);
            if (toggleLink.innerHTML == '[Show Preferences]') {
                toggleLink.innerHTML = '[Hide Preferences]'
                preferencesBox.style.display = 'block';
            } else {
                toggleLink.innerHTML = '[Show Preferences]'
                preferencesBox.style.display = 'none';
            }
        }

        function toggleTimerPreferencesTable() {
            function inserTimerPreferences () {
                function saveTimerPreferences() {
                    try {
                        setStorage(STORAGE_BOT_HORN_TIME_DELAY_MIN, document.getElementById(ID_INPUT_BOT_HORN_TIME_DELAY_MIN).value);
                        setStorage(STORAGE_BOT_HORN_TIME_DELAY_MAX, document.getElementById(ID_INPUT_BOT_HORN_TIME_DELAY_MAX).value);
                        setStorage(STORAGE_TRAP_CHECK_TIME_DELAY_MIN, document.getElementById(ID_INPUT_TRAP_CHECK_TIME_DELAY_MIN).value);
                        setStorage(STORAGE_TRAP_CHECK_TIME_DELAY_MAX, document.getElementById(ID_INPUT_TRAP_CHECK_TIME_DELAY_MAX).value);
                        setStorage(STORAGE_AUTOSOLVE_KR_DELAY_MIN, document.getElementById(ID_INPUT_AUTOSOLVE_KR_DELAY_MIN).value);
                        setStorage(STORAGE_AUTOSOLVE_KR_DELAY_MAX, document.getElementById(ID_INPUT_AUTOSOLVE_KR_DELAY_MAX).value);
                        setStorage(STORAGE_SCHEDULED_GIFTING_AND_BALLOTING_TIME, document.getElementById(ID_INPUT_SCHEDULED_GIFTING_AND_BALLOTING_TIME).value);
                        setStorage(STORAGE_SCHEDULED_RESET_TIME, document.getElementById(ID_INPUT_SCHEDULED_RESET_TIME).value);
                    } catch (e) {
                        console.log(e);
                    }
                    reloadCampPage();
                }

                let tmpTxt;
                let captionCell;
                const trNextBotHornTimePreferences = preferencesTable.insertRow();
                trNextBotHornTimePreferences.style.height = "21px"
                captionCell = trNextBotHornTimePreferences.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Bot Horn Time Delay :  ";
                captionCell.width = 240;
                const nextBotHornTimePreferencesSettings = trNextBotHornTimePreferences.insertCell();
                nextBotHornTimePreferencesSettings.width = 250;
                const inputBotHornTimeDelayMin = getNumberInput();
                inputBotHornTimeDelayMin.id = ID_INPUT_BOT_HORN_TIME_DELAY_MIN;
                inputBotHornTimeDelayMin.value = g_botHornTimeDelayMin;
                nextBotHornTimePreferencesSettings.appendChild(inputBotHornTimeDelayMin);
                tmpTxt = document.createTextNode(" seconds ~  ");
                nextBotHornTimePreferencesSettings.appendChild(tmpTxt);
                const inputBotHornTimeDelayMax = getNumberInput();
                inputBotHornTimeDelayMax.id = ID_INPUT_BOT_HORN_TIME_DELAY_MAX;
                inputBotHornTimeDelayMax.value = g_botHornTimeDelayMax;
                nextBotHornTimePreferencesSettings.appendChild(inputBotHornTimeDelayMax);
                tmpTxt = document.createTextNode(" seconds");
                nextBotHornTimePreferencesSettings.appendChild(tmpTxt);

                const trNextTrapCheckTimePreferences = preferencesTable.insertRow();
                trNextTrapCheckTimePreferences.style.height = "21px"
                captionCell = trNextTrapCheckTimePreferences.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Check Time Delay :  ";
                const nextTrapCheckTimePreferencesSettings = trNextTrapCheckTimePreferences.insertCell();
                const inputTrapCheckTimeDelayMin = getNumberInput();
                inputTrapCheckTimeDelayMin.id = ID_INPUT_TRAP_CHECK_TIME_DELAY_MIN;
                inputTrapCheckTimeDelayMin.value = g_trapCheckTimeDelayMin;
                nextTrapCheckTimePreferencesSettings.appendChild(inputTrapCheckTimeDelayMin);
                tmpTxt = document.createTextNode(" seconds ~  ");
                nextTrapCheckTimePreferencesSettings.appendChild(tmpTxt);
                const inputTrapCheckTimeDelayMax = getNumberInput();
                inputTrapCheckTimeDelayMax.id = ID_INPUT_TRAP_CHECK_TIME_DELAY_MAX;
                inputTrapCheckTimeDelayMax.value = g_trapCheckTimeDelayMax;
                nextTrapCheckTimePreferencesSettings.appendChild(inputTrapCheckTimeDelayMax);
                tmpTxt = document.createTextNode(" seconds");
                nextTrapCheckTimePreferencesSettings.appendChild(tmpTxt);

                const trAutosolveKRPreferences = preferencesTable.insertRow();
                trAutosolveKRPreferences.style.height = "24px"
                captionCell = trAutosolveKRPreferences.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Auto Solve King Reward Delay :  ";
                const autosolveKRPreferencesSettings = trAutosolveKRPreferences.insertCell();
                const inputAutosolveKRDelayMin = getNumberInput();
                inputAutosolveKRDelayMin.id = ID_INPUT_AUTOSOLVE_KR_DELAY_MIN;
                inputAutosolveKRDelayMin.value = g_autosolveKRDelayMin;
                autosolveKRPreferencesSettings.appendChild(inputAutosolveKRDelayMin);
                tmpTxt = document.createTextNode(" seconds ~  ");
                autosolveKRPreferencesSettings.appendChild(tmpTxt);
                const inputAutosolveKRDelayMax = getNumberInput();
                inputAutosolveKRDelayMax.id = ID_INPUT_AUTOSOLVE_KR_DELAY_MAX;
                inputAutosolveKRDelayMax.value = g_autosolveKRDelayMax;
                autosolveKRPreferencesSettings.appendChild(inputAutosolveKRDelayMax);
                tmpTxt = document.createTextNode(" seconds");
                autosolveKRPreferencesSettings.appendChild(tmpTxt);

                const trSchedulerTitle = preferencesTable.insertRow();
                trSchedulerTitle.style.height = "20px"
                const schedulerTitle = trSchedulerTitle.insertCell();
                schedulerTitle.colSpan = 3;
                schedulerTitle.innerHTML = "Scheduler time";
                schedulerTitle.style.fontWeight = "bold";
                schedulerTitle.style.fontSize = "12px";
                schedulerTitle.style.textAlign = "center";

                const trScheduledGiftingAndBallotingPreferences = preferencesTable.insertRow();
                trScheduledGiftingAndBallotingPreferences.style.height = "24px"
                captionCell = trScheduledGiftingAndBallotingPreferences.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Sending Gifts and Raffles :  ";
                const scheduledGiftingAndBallotingPreferencesSettings = trScheduledGiftingAndBallotingPreferences.insertCell();
                const scheduledGiftingAndBallotingBeginTime = document.createElement('INPUT');
                scheduledGiftingAndBallotingBeginTime.type = "time";
                scheduledGiftingAndBallotingBeginTime.style.fontSize = "11px";
                scheduledGiftingAndBallotingBeginTime.id = ID_INPUT_SCHEDULED_GIFTING_AND_BALLOTING_TIME;
                scheduledGiftingAndBallotingBeginTime.value = g_scheduledGiftingAndBallotingTime;
                scheduledGiftingAndBallotingPreferencesSettings.appendChild(scheduledGiftingAndBallotingBeginTime);

                const trScheduledResetPreferences = preferencesTable.insertRow();
                trScheduledResetPreferences.style.height = "21px"
                captionCell = trScheduledResetPreferences.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "New Date :  ";
                const scheduledResetPreferencesSettings = trScheduledResetPreferences.insertCell();
                const scheduledResetTime = document.createElement('INPUT');
                scheduledResetTime.type = "time";
                scheduledResetTime.style.fontSize = "11px";
                scheduledResetTime.id = ID_INPUT_SCHEDULED_RESET_TIME;
                scheduledResetTime.value = g_scheduledResetTime;
                scheduledResetPreferencesSettings.appendChild(scheduledResetTime);

                const trLastRow = preferencesTable.insertRow();
                const saveButtonCell = trLastRow.insertCell();
                saveButtonCell.colSpan = 3;
                saveButtonCell.style.textAlign = "right";
                tmpTxt = document.createTextNode("(Changes above this line only take place after user save the preference)  ");
                saveButtonCell.appendChild(tmpTxt);
                const saveTimerPreferencesButton = document.createElement('button');
                saveTimerPreferencesButton.onclick = saveTimerPreferences
                saveTimerPreferencesButton.style.fontSize = "13px";
                tmpTxt = document.createTextNode("Save");
                saveTimerPreferencesButton.appendChild(tmpTxt);
                saveButtonCell.appendChild(saveTimerPreferencesButton);
                tmpTxt = document.createTextNode("  ");
                saveButtonCell.appendChild(tmpTxt);

                captionCell = undefined;
                tmpTxt = undefined;
            }
            const toggleLink = document.getElementById(ID_TIMER_LINK);
            const preferencesTable = document.getElementById(ID_TIMER_PREFERENCES_TABLE);
            if (preferencesTable.rows.length < 2) {
                inserTimerPreferences();
            }
            if (toggleLink.innerHTML == '[Show]') {
                toggleLink.innerHTML = '[Hide]'
                preferencesTable.style.display = 'table';
            } else {
                toggleLink.innerHTML = '[Show]'
                preferencesTable.style.display = 'none';
            }
        }

        function getNumberInput() {
            const element = document.createElement('INPUT');
            element.type = "number";
            element.style.fontSize = "9px";
            element.min = "0";
            element.max = "999";
            element.size = "5";
            return element;
        }

        function embedPreferencesHeaderTable() {
            const preferencesHeaderTable = document.createElement('table');
            preferencesHeaderTable.width = "100%";
            const preferencesHeaderRow = preferencesHeaderTable.insertRow();
            const botProcessCaption = preferencesHeaderRow.insertCell();
            botProcessCaption.width = 70;
            botProcessCaption.style.fontSize = "10px";
            botProcessCaption.style.fontWeight = "bold";
            botProcessCaption.innerHTML = "Bot Process :  ";
            const botProcessTxt = preferencesHeaderRow.insertCell();
            botProcessTxt.width = 70;
            botProcessTxt.style.fontSize = "10px";
            botProcessTxt.innerHTML = g_botProcess;
            botProcessTxt.id = ID_BOT_PROCESS_TXT;
            const botStatusCaption = preferencesHeaderRow.insertCell();
            botStatusCaption.width = 45;
            botStatusCaption.style.fontSize = "10px";
            botStatusCaption.style.fontWeight = "bold";
            botStatusCaption.innerHTML = "Status :  ";
            const botStatusTxt = preferencesHeaderRow.insertCell();
            botStatusTxt.width = 295;
            botStatusTxt.style.fontSize = "10px";
            botStatusTxt.innerHTML = BOT_STATUS_IDLE;
            botStatusTxt.id = ID_BOT_STATUS_TXT;

            const policyCaption = preferencesHeaderRow.insertCell();
            policyCaption.className = STYLE_CLASS_NAME_JNK_CAPTION;
            policyCaption.style.fontSize = "10px";
            policyCaption.width = 70;
            policyCaption.innerHTML = "Policy :  ";
            const policyTxt = preferencesHeaderRow.insertCell();
            policyTxt.id = ID_POLICY_TXT;
            policyTxt.style.fontSize = "10px";
            policyTxt.innerHTML = POLICY_NAME_NONE;

            const preferencesHeaderCell = preferencesHeaderRow.insertCell();
            preferencesHeaderCell.style.textAlign = "right";
            const preferencesLink = document.createElement('a');
            preferencesLink.id = ID_PREFERENCES_LINK;
            preferencesLink.style.fontSize = "10px";
            preferencesLink.innerHTML = '[Show Preferences]';
            preferencesLink.style.fontWeight = "bold";
            preferencesLink.onclick = togglePreferences;
            preferencesHeaderCell.appendChild(preferencesLink);

            return preferencesHeaderTable;
        }

        function embedTimerPreferences() {
            const timerPreferencesTable = document.createElement('table');
            timerPreferencesTable.id = ID_TIMER_PREFERENCES_TABLE;
            timerPreferencesTable.width = "100%";
            const trEmpty = timerPreferencesTable.insertRow();
            trEmpty.style.height = "4px"

            return timerPreferencesTable;
        }

        function embedPolicyPreferences() {
            function addOptions(selectItem, options) {
                if (typeof(options) == DATA_TYPE_OBJECT) {
                    for (const option of options) {
                        const itemOption = document.createElement("option");
                        itemOption.value = option;
                        itemOption.text = option;
                        selectItem.appendChild(itemOption);
                    }
                } else if (typeof(options) == DATA_TYPE_STRING) {
                    const itemOption = document.createElement("option");
                    itemOption.value = options;
                    itemOption.text = options;
                    selectItem.appendChild(itemOption);
                }
            }

            function getSelectItem(itemNames, itemId, onchangeFunction, optionIgnore = true, optionOther = false, optionDisarm = false) {
                const selectItem = document.createElement('select');
                selectItem.style.width = "80px";
                selectItem.style.fontSize = "90%";
                if (optionIgnore) {
                    addOptions(selectItem, ITEM_IGNORE);
                    selectItem.value = ITEM_IGNORE;
                } else {
                    selectItem.selectedIndex = -1;
                }
                if (optionOther) {
                    addOptions(selectItem, ITEM_OTHER);
                }
                if (optionDisarm) {
                    addOptions(selectItem, ITEM_DISARM);
                }
                addOptions(selectItem, itemNames);
                selectItem.id = itemId;
                selectItem.onchange = onchangeFunction;
                return selectItem;
            }

            function setSelectItem(selectItem, itemNames) {
                for(let idx = selectItem.options.length - 1; idx >= 0; idx--) {
                    selectItem.remove(idx);
                }
                addOptions(selectItem, itemNames);
            }

            function setSelectSelectableItem(itemNames) {
                const selectItem = document.getElementById(ID_SELECT_SELECTABLE_TRAP_SETUP);
                setSelectItem(selectItem, itemNames);
            }

            function getSelectWeapon(itemId, onchangeFunction) {
                const tmpNames = getWeaponNames();
                const weaponNames = isNullOrUndefined(tmpNames)? []: tmpNames;
                return getSelectItem(weaponNames, itemId, onchangeFunction, true, false, false);
            }

            function getSelectBase(itemId, onchangeFunction) {
                const tmpNames = getBaseNames();
                const baseNames = isNullOrUndefined(tmpNames)? []: tmpNames;
                return getSelectItem(baseNames, itemId, onchangeFunction, true, false, false);
            }

            function getSelectBait(itemId, onchangeFunction) {
                const tmpNames = getBaitNames();
                const baitNames = isNullOrUndefined(tmpNames)? []: tmpNames;
                return getSelectItem(baitNames, itemId, onchangeFunction, true, false, false);
            }

            function getSelectTrinket(itemId, onchangeFunction) {
                const tmpNames = getTrinketNames();
                const trinketNames = isNullOrUndefined(tmpNames)? []: tmpNames;
                return getSelectItem(trinketNames, itemId, onchangeFunction, true, false, true);
            }

            function insertSelectPolicyRow() {
                function onChangePolicy(event) {
                    if (event.target.value == "Select policy") {
                        return;
                    }
                    currentPolicy = event.target.value;
                    switch(currentPolicy) {
                        case POLICY_NAME_HARBOUR:
                            policyStorage = STORAGE_TRAP_SETUP_GNAHAR;
                            break;
                        case POLICY_NAME_MOUNTAIN:
                            insertGnaMouPolicyPreferences();
                            policyStorage = STORAGE_TRAP_SETUP_GNAMOU;
                            break;
                        case POLICY_NAME_CALM_CLEARING:
                            policyStorage = STORAGE_TRAP_SETUP_WWOCCL;
                            break;
                        case POLICY_NAME_GREAT_GNARLED_TREE:
                            policyStorage = STORAGE_TRAP_SETUP_WWOGGT;
                            break;
                        case POLICY_NAME_MOUSOLEUM:
                            policyStorage = STORAGE_TRAP_SETUP_BURMOU;
                            break;
                        case POLICY_NAME_CATACOMBS:
                            policyStorage = STORAGE_TRAP_SETUP_BWOCAT;
                            break;
                        case POLICY_NAME_ACOLYTE_REALM:
                            policyStorage = STORAGE_TRAP_SETUP_BWOARE;
                            break;
                        case POLICY_NAME_DERR_DUNES:
                            policyStorage = STORAGE_TRAP_SETUP_TISDDU;
                            break;
                        case POLICY_NAME_JUNGLE_OF_DREAD:
                            policyStorage = STORAGE_TRAP_SETUP_TISJOD;
                            break;
                        case POLICY_NAME_CLAW_SHOT_CITY:
                            setSelectSelectableItem(g_policies.getPolicy(currentPolicy).selectableValues);
                            insertVVaCSCPolicyPreferences();
                            policyStorage = STORAGE_TRAP_SETUP_VVACSC;
                            break;
                        case POLICY_NAME_FORT_ROX:
                            insertVVaFRoPolicyPreferences();
                            policyStorage = STORAGE_TRAP_SETUP_VVAFRO;
                            break;
                        case POLICY_NAME_SEASONAL_GARDEN:
                            setSelectSelectableItem(g_policies.getPolicy(currentPolicy).selectableValues);
                            policyStorage = STORAGE_TRAP_SETUP_RODSGA;
                            break;
                        case POLICY_NAME_ZUGZWANGS_TOWER:
                            setSelectSelectableItem(g_policies.getPolicy(currentPolicy).selectableValues);
                            insertRodZToPolicyPreferences();
                            policyStorage = STORAGE_TRAP_SETUP_RODZTO;
                            break;
                        case POLICY_NAME_CRYSTAL_LIBRARY:
                            insertRodCLiPolicyPreferences();
                            policyStorage = STORAGE_TRAP_SETUP_RODCLI;
                            break;
                        case POLICY_NAME_SLUSHY_SHORELINE:
                            policyStorage = STORAGE_TRAP_SETUP_RODSSH;
                            break;
                        case POLICY_NAME_ICEBERG:
                            setSelectSelectableItem(g_policies.getPolicy(currentPolicy).selectableValues);
                            policyStorage = STORAGE_TRAP_SETUP_RODICE;
                            break;
                        case POLICY_NAME_FIERY_WARPATH:
                            insertSDeFWaPolicyPreferences();
                            policyStorage = STORAGE_TRAP_SETUP_SDEFWA;
                            break;
                        case POLICY_NAME_MURIDAE_MARKET:
                            setSelectSelectableItem(g_policies.getPolicy(currentPolicy).selectableValues);
                            policyStorage = STORAGE_TRAP_SETUP_SDEMMA;
                            break;
                        default:
                    }

                    for (const policyName of g_policies.list) {
                        const tmpPolicy = g_policies.getPolicy(policyName);
                        if (isNullOrUndefined(document.getElementById(tmpPolicy.trs[0]))) {
                            continue;
                        }
                        for (const tr of tmpPolicy.trs){
                            document.getElementById(tr).style.display = "none";
                        }
                    }
                    for (const policyName of g_policies.list) {
                        if (event.target.value != policyName) {
                            continue;
                        }
                        const tmpPolicy = g_policies.getPolicy(policyName);
                        if (isNullOrUndefined(document.getElementById(tmpPolicy.trs[0]))) {
                            continue;
                        }
                        for (const tr of tmpPolicy.trs){
                            document.getElementById(tr).style.display = "table-row";
                        }
                        if (isNullOrUndefined(tmpPolicy.initSelectTrapSetup)) {
                            alert("Cannot find function initSelectTrapSetup for policy: " + policyName);
                        } else {
                            tmpPolicy.initSelectTrapSetup();
                        }
                    }
                }

                function recommendTrapSetup() {
                    g_policies.getPolicy(currentPolicy).recommendTrapSetup();
                    setStorage(policyStorage, g_policies.getPolicy(currentPolicy).trapSetups);
                }

                function resetTrapSetup() {
                    g_policies.getPolicy(currentPolicy).resetTrapSetups();
                    setStorage(policyStorage, g_policies.getPolicy(currentPolicy).trapSetups);
                    reloadCampPage();
                }

                let tmpTxt;
                const trSelectPolicy = policyPreferencesTable.insertRow();
                trSelectPolicy.style.height = "24px"
                const captionCell = trSelectPolicy.insertCell();
                captionCell.width = 260;
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Select Location :  ";
                const selectPolicyCell = trSelectPolicy.insertCell();
                const selectPolicy = getSelectItem("Select policy", undefined, onChangePolicy, false, false, false);
                selectPolicy.style.width = "120px";
                addOptions(selectPolicy, g_policies.list);
                selectPolicyCell.appendChild(selectPolicy);
                tmpTxt = document.createTextNode("  ");
                selectPolicyCell.appendChild(tmpTxt);
                const recommendButton = document.createElement('button');
                recommendButton.onclick = recommendTrapSetup;
                recommendButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Recommend");
                recommendButton.appendChild(tmpTxt);
                selectPolicyCell.appendChild(recommendButton);
                tmpTxt = document.createTextNode("  ");
                selectPolicyCell.appendChild(tmpTxt);
                const resetButton = document.createElement('button');
                resetButton.onclick = resetTrapSetup;
                resetButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Reset & Reload");
                resetButton.appendChild(tmpTxt);
                selectPolicyCell.appendChild(resetButton);

                tmpTxt = undefined;
            }

            function insertSingleTrapSetupRow() {
                function saveSingleWeapon(event) {
                    g_policies.getPolicy(currentPolicy).trapSetups[IDX_WEAPON] = event.target.value;
                    setStorage(policyStorage, g_policies.getPolicy(currentPolicy).trapSetups);
                }

                function saveSingleBase(event) {
                    g_policies.getPolicy(currentPolicy).trapSetups[IDX_BASE] = event.target.value;
                    setStorage(policyStorage, g_policies.getPolicy(currentPolicy).trapSetups);
                }

                function saveSingleBait(event) {
                    g_policies.getPolicy(currentPolicy).trapSetups[IDX_BAIT] = event.target.value;
                    setStorage(policyStorage, g_policies.getPolicy(currentPolicy).trapSetups);
                }

                function saveSingleTrinket(event) {
                    g_policies.getPolicy(currentPolicy).trapSetups[IDX_TRINKET] = event.target.value;
                    setStorage(policyStorage, g_policies.getPolicy(currentPolicy).trapSetups);
                }

                let tmpTxt;
                const trSingleTrapSetup = policyPreferencesTable.insertRow();
                trSingleTrapSetup.id = ID_TR_SINGLE_TRAP_SETUP;
                trSingleTrapSetup.style.height = "24px";
                trSingleTrapSetup.style.display = "none";
                const captionCell = trSingleTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup :  ";
                const trapSetupCell = trSingleTrapSetup.insertCell();
                trapSetupCell.appendChild(getSelectWeapon(ID_SELECT_SINGLE_WEAPON, saveSingleWeapon));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBase(ID_SELECT_SINGLE_BASE, saveSingleBase));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBait(ID_SELECT_SINGLE_BAIT, saveSingleBait));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectTrinket(ID_SELECT_SINGLE_TRINKET, saveSingleTrinket));
                tmpTxt = undefined;
            }

            function insertSelectableTrapSetupRow() {
                function onChangeSelectableTrapSetup(event) {
                    g_policies.getPolicy(currentPolicy).initSelectTrapSetup();
                }

                function saveSelectableItem(itemIndex, value) {
                    const selectedTrapSetup = document.getElementById(ID_SELECT_SELECTABLE_TRAP_SETUP).value;
                    g_policies.getPolicy(currentPolicy).trapSetups[selectedTrapSetup][itemIndex] = value;
                    setStorage(policyStorage, g_policies.getPolicy(currentPolicy).trapSetups);
                }

                function saveSelectableWeapon(event) {
                    saveSelectableItem(IDX_WEAPON, event.target.value);
                }

                function saveSelectableBase(event) {
                    saveSelectableItem(IDX_BASE, event.target.value);
                }

                function saveSelectableBait(event) {
                    saveSelectableItem(IDX_BAIT, event.target.value);
                }

                function saveSelectableTrinket(event) {
                    saveSelectableItem(IDX_TRINKET, event.target.value);
                }

                let captionCell;
                let tmpTxt;
                const trSelectableTrapSetup = policyPreferencesTable.insertRow();
                trSelectableTrapSetup.id = ID_TR_SELECTABLE_TRAP_SETUP;
                trSelectableTrapSetup.style.height = "24px";
                trSelectableTrapSetup.style.display = "none";
                captionCell = trSelectableTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for ";
                const selectSelectableTrapSetup = getSelectItem([], ID_SELECT_SELECTABLE_TRAP_SETUP, onChangeSelectableTrapSetup, false, false, false);
                selectSelectableTrapSetup.style.width = "100px";
                captionCell.appendChild(selectSelectableTrapSetup);
                tmpTxt = document.createTextNode(" :  ");
                captionCell.appendChild(tmpTxt);
                const trapSetupCell = trSelectableTrapSetup.insertCell();
                trapSetupCell.appendChild(getSelectWeapon(ID_SELECT_SELECTABLE_WEAPON, saveSelectableWeapon));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBase(ID_SELECT_SELECTABLE_BASE, saveSelectableBase));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBait(ID_SELECT_SELECTABLE_BAIT, saveSelectableBait));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectTrinket(ID_SELECT_SELECTABLE_TRINKET, saveSelectableTrinket));
                captionCell = undefined;
                tmpTxt = undefined;
            }

            function insertVVaCSCPolicyPreferences() {
                function saveVVaCSCAtmPoster(event) {
                    g_policies.getPolicy(POLICY_NAME_CLAW_SHOT_CITY).trapSetups[VVACSC_ATM_POSTER] = event.target.checked;
                    setStorage(STORAGE_TRAP_SETUP_VVACSC, g_policies.getPolicy(POLICY_NAME_CLAW_SHOT_CITY).trapSetups);
                }

                function saveVVaCSCAtmCactusCharm(event) {
                    g_policies.getPolicy(POLICY_NAME_CLAW_SHOT_CITY).trapSetups[VVACSC_ATM_CACTUS_CHARM] = event.target.checked;
                    setStorage(STORAGE_TRAP_SETUP_VVACSC, g_policies.getPolicy(POLICY_NAME_CLAW_SHOT_CITY).trapSetups);
                }

                let captionCell;
                let tmpTxt;
                const trVVaCSCAtmPoster = policyPreferencesTable.insertRow();
                trVVaCSCAtmPoster.id = ID_TR_VVACSC_ATM_POSTER;
                trVVaCSCAtmPoster.style.height = "24px";
                trVVaCSCAtmPoster.style.display = "none";
                captionCell = trVVaCSCAtmPoster.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Automatic action(s) :  ";
                const checkboxAtmPosterCell = trVVaCSCAtmPoster.insertCell();
                const checkboxAtmPoster = document.createElement('input');
                checkboxAtmPoster.id = ID_CBX_VVACSC_ATM_POSTER;
                checkboxAtmPoster.type = "checkbox";
                checkboxAtmPoster.onchange = saveVVaCSCAtmPoster;
                checkboxAtmPosterCell.appendChild(checkboxAtmPoster);
                tmpTxt = document.createTextNode(" Open Poster and Claim Bounty Reward");
                checkboxAtmPosterCell.appendChild(tmpTxt);

                const trVVaCSCAtmCactusCharm = policyPreferencesTable.insertRow();
                trVVaCSCAtmCactusCharm.id = ID_TR_VVACSC_ATM_CACTUS_CHARM;
                trVVaCSCAtmCactusCharm.style.height = "24px";
                trVVaCSCAtmCactusCharm.style.display = "none";
                captionCell = trVVaCSCAtmCactusCharm.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                const checkboxAtmCactusCharmCell = trVVaCSCAtmCactusCharm.insertCell();
                const checkboxAtmCactusCharm = document.createElement('input');
                checkboxAtmCactusCharm.id = ID_CBX_VVACSC_ATM_CACTUS_CHARM;
                checkboxAtmCactusCharm.type = "checkbox";
                checkboxAtmCactusCharm.onchange = saveVVaCSCAtmCactusCharm;
                checkboxAtmCactusCharmCell.appendChild(checkboxAtmCactusCharm);
                tmpTxt = document.createTextNode(" Arm Super Cactus Charm ");
                checkboxAtmCactusCharmCell.appendChild(tmpTxt);
                const imgSuperCactusCharm = document.createElement("img");
                imgSuperCactusCharm.src = "https://raw.githubusercontent.com/bujaraty/JnK/main/imgs/SuperCactusCharm.gif"
                imgSuperCactusCharm.height = 15;
                checkboxAtmCactusCharmCell.appendChild(imgSuperCactusCharm);
                tmpTxt = document.createTextNode(" and Cactus Charm ");
                checkboxAtmCactusCharmCell.appendChild(tmpTxt);
                const imgCactusCharm = document.createElement("img");
                imgCactusCharm.src = "https://raw.githubusercontent.com/bujaraty/JnK/main/imgs/CactusCharm.gif"
                imgCactusCharm.height = 15;
                checkboxAtmCactusCharmCell.appendChild(imgCactusCharm);

                tmpTxt = undefined;
                captionCell = undefined;
            }

            function insertVVaFRoPolicyPreferences() {
                function onChangeSelectVVaFRoPhase(event) {
                    g_policies.getPolicy(POLICY_NAME_FORT_ROX).initSelectTrapSetup();
                }

                function saveVVaFRoSetup(itemIndex, value) {
                    const currentPhase = document.getElementById(ID_SELECT_VVAFRO_PHASE).value;
                    g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups[currentPhase][itemIndex] = value;
                    setStorage(STORAGE_TRAP_SETUP_VVAFRO, g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups);
                }

                function saveVVaFRoWeapon(event) {
                    saveVVaFRoSetup(IDX_WEAPON, event.target.value);
                }

                function saveVVaFRoBase(event) {
                    saveVVaFRoSetup(IDX_BASE, event.target.value);
                }

                function saveVVaFRoBait(event) {
                    saveVVaFRoSetup(IDX_BAIT, event.target.value);
                }

                function saveVVaFRoTrinket(event) {
                    saveVVaFRoSetup(IDX_TRINKET, event.target.value);
                }

                function saveVVaFRoTower(event) {
                    saveVVaFRoSetup(IDX_TOWER, event.target.value);
                }

                function saveVVaFRoAtmDeactivate(event) {
                    g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups[VVAFRO_ATM_DEACTIVATE] = event.target.checked;
                    setStorage(STORAGE_TRAP_SETUP_VVAFRO, g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups);
                }

                function saveVVaFRoAtmRetreat(event) {
                    if (!event.target.checked) {
                        g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups[VVAFRO_ATM_RETREAT] = event.target.checked;
                        setStorage(STORAGE_TRAP_SETUP_VVAFRO, g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups);
                    }
                    document.getElementById(ID_INPUT_VVAFRO_REQUIRED_HOWLITE).disabled = !event.target.checked;
                    document.getElementById(ID_INPUT_VVAFRO_REQUIRED_BLOODSTONE).disabled = !event.target.checked;
                }

                function saveVVaFRoRequiredHowlite(event) {
                    g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups[VVAFRO_REQUIRED_HOWLITE] = event.target.value;
                    if (!isNullOrUndefined(event.target.value) && event.target.value > 0) {
                        g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups[VVAFRO_ATM_RETREAT] = true;
                    }
                    setStorage(STORAGE_TRAP_SETUP_VVAFRO, g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups);
                }

                function saveVVaFRoRequiredBloodstone(event) {
                    g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups[VVAFRO_REQUIRED_BLOODSTONE] = event.target.value;
                    if (!isNullOrUndefined(event.target.value) && event.target.value > 0) {
                        g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups[VVAFRO_ATM_RETREAT] = true;
                    }
                    setStorage(STORAGE_TRAP_SETUP_VVAFRO, g_policies.getPolicy(POLICY_NAME_FORT_ROX).trapSetups);
                }

                let captionCell;
                let tmpTxt;

                const trVVaFRoPhasesTrapSetup = policyPreferencesTable.insertRow();
                trVVaFRoPhasesTrapSetup.id = ID_TR_VVAFRO_PHASES_TRAP_SETUP;
                trVVaFRoPhasesTrapSetup.style.height = "24px";
                trVVaFRoPhasesTrapSetup.style.display = "none";
                captionCell = trVVaFRoPhasesTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for ";
                const selectPhase = getSelectItem(VVAFRO_PHASES, ID_SELECT_VVAFRO_PHASE, onChangeSelectVVaFRoPhase, false, false, false);
                selectPhase.style.width = "70px";
                captionCell.appendChild(selectPhase);
                tmpTxt = document.createTextNode(" :  ");
                captionCell.appendChild(tmpTxt);
                const trapSetupCell = trVVaFRoPhasesTrapSetup.insertCell();
                trapSetupCell.appendChild(getSelectWeapon(ID_SELECT_VVAFRO_WEAPON, saveVVaFRoWeapon));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBase(ID_SELECT_VVAFRO_BASE, saveVVaFRoBase));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBait(ID_SELECT_VVAFRO_BAIT, saveVVaFRoBait));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectTrinket(ID_SELECT_VVAFRO_TRINKET, saveVVaFRoTrinket));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                const selectTower = getSelectItem(VVAFRO_TOWER_ACTIVATION, ID_SELECT_VVAFRO_TOWER, saveVVaFRoTower, false, false, false);
                trapSetupCell.appendChild(selectTower);

                const trVVaFRoAtmDeactivate = policyPreferencesTable.insertRow();
                trVVaFRoAtmDeactivate.id = ID_TR_VVAFRO_ATM_DEACTIVATE;
                trVVaFRoAtmDeactivate.style.height = "24px";
                trVVaFRoAtmDeactivate.style.display = "none";
                captionCell = trVVaFRoAtmDeactivate.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Automatic action(s) :  ";
                const checkboxAtmDeactivateCell = trVVaFRoAtmDeactivate.insertCell();
                const checkboxAtmDeactivate = document.createElement('input');
                checkboxAtmDeactivate.id = ID_CBX_VVAFRO_ATM_DEACTIVATE;
                checkboxAtmDeactivate.type = "checkbox";
                checkboxAtmDeactivate.onchange = saveVVaFRoAtmDeactivate;
                checkboxAtmDeactivateCell.appendChild(checkboxAtmDeactivate);
                tmpTxt = document.createTextNode(" Deactivate Mage Tower when HP is full");
                checkboxAtmDeactivateCell.appendChild(tmpTxt);

                const trVVaFRoAtmRetreat = policyPreferencesTable.insertRow();
                trVVaFRoAtmRetreat.id = ID_TR_VVAFRO_ATM_RETREAT;
                trVVaFRoAtmRetreat.style.height = "24px";
                trVVaFRoAtmRetreat.style.display = "none";
                captionCell = trVVaFRoAtmRetreat.insertCell();
                const checkboxAtmRetreatCell = trVVaFRoAtmRetreat.insertCell();
                const checkboxAtmRetreat = document.createElement('input');
                checkboxAtmRetreat.id = ID_CBX_VVAFRO_ATM_RETREAT;
                checkboxAtmRetreat.type = "checkbox";
                checkboxAtmRetreat.onchange = saveVVaFRoAtmRetreat;
                checkboxAtmRetreatCell.appendChild(checkboxAtmRetreat);
                tmpTxt = document.createTextNode(" Retreat when having");
                checkboxAtmRetreatCell.appendChild(tmpTxt);
                tmpTxt = document.createTextNode("  ");
                checkboxAtmRetreatCell.appendChild(tmpTxt);
                const inputVVaFRoRequiredHowlite = getNumberInput();
                inputVVaFRoRequiredHowlite.id = ID_INPUT_VVAFRO_REQUIRED_HOWLITE;
                inputVVaFRoRequiredHowlite.onchange = saveVVaFRoRequiredHowlite;
                inputVVaFRoRequiredHowlite.value = 0;
                checkboxAtmRetreatCell.appendChild(inputVVaFRoRequiredHowlite);
                tmpTxt = document.createTextNode(" ");
                checkboxAtmRetreatCell.appendChild(tmpTxt);
                const imgHowlite = document.createElement("img");
                imgHowlite.src = "https://raw.githubusercontent.com/bujaraty/JnK/main/imgs/Howlite.gif"
                imgHowlite.height = 15;
                checkboxAtmRetreatCell.appendChild(imgHowlite);
                tmpTxt = document.createTextNode(" ");
                checkboxAtmRetreatCell.appendChild(tmpTxt);
                const inputVVaFRoRequiredBloodstone = getNumberInput();
                inputVVaFRoRequiredBloodstone.id = ID_INPUT_VVAFRO_REQUIRED_BLOODSTONE;
                inputVVaFRoRequiredBloodstone.onchange = saveVVaFRoRequiredBloodstone;
                inputVVaFRoRequiredBloodstone.value = 0;
                checkboxAtmRetreatCell.appendChild(inputVVaFRoRequiredBloodstone);
                tmpTxt = document.createTextNode(" ");
                checkboxAtmRetreatCell.appendChild(tmpTxt);
                const imgBloodStone = document.createElement("img");
                imgBloodStone.src = "https://raw.githubusercontent.com/bujaraty/JnK/main/imgs/Bloodstone.gif"
                imgBloodStone.height = 15;
                checkboxAtmRetreatCell.appendChild(imgBloodStone);

                tmpTxt = undefined;
                captionCell = undefined;
            }

            function insertRodZToPolicyPreferences() {
                function onChangeSelectRodZToStrategy(event) {
                    g_policies.getPolicy(POLICY_NAME_ZUGZWANGS_TOWER).trapSetups[RODZTO_STRATEGY] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_RODZTO, g_policies.getPolicy(POLICY_NAME_ZUGZWANGS_TOWER).trapSetups);
                }

                const trRodZToStrategy = policyPreferencesTable.insertRow();
                trRodZToStrategy.id = ID_TR_RODZTO_STRATEGY;
                trRodZToStrategy.style.height = "24px";
                trRodZToStrategy.style.display = "none";
                const captionCell = trRodZToStrategy.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Strategy :  ";
                const selectStrategyCell = trRodZToStrategy.insertCell();
                const selectStrategy = getSelectItem("Select strategy", ID_SELECT_RODZTO_STRATEGY, onChangeSelectRodZToStrategy, false, false, false);
                addOptions(selectStrategy, RODZTO_STRATEGIES)
                selectStrategy.style.width = "100px";
                selectStrategyCell.appendChild(selectStrategy);
            }

            function insertGnaMouPolicyPreferences() {
                function saveGnaMouAtmSmash(event) {
                    g_policies.getPolicy(POLICY_NAME_MOUNTAIN).trapSetups[GNAMOU_ATM_SMASH] = event.target.checked;
                    setStorage(STORAGE_TRAP_SETUP_GNAMOU, g_policies.getPolicy(POLICY_NAME_MOUNTAIN).trapSetups);
                }

                function saveGnaMouAtmSwitchCharm(event) {
                    g_policies.getPolicy(POLICY_NAME_MOUNTAIN).trapSetups[GNAMOU_ATM_SWITCH_CHARM] = event.target.checked;
                    setStorage(STORAGE_TRAP_SETUP_GNAMOU, g_policies.getPolicy(POLICY_NAME_MOUNTAIN).trapSetups);
                }

                let captionCell;
                let tmpTxt;
                const trGnaMouAtmSmash = policyPreferencesTable.insertRow();
                trGnaMouAtmSmash.id = ID_TR_GNAMOU_ATM_SMASH;
                trGnaMouAtmSmash.style.height = "24px";
                trGnaMouAtmSmash.style.display = "none";
                captionCell = trGnaMouAtmSmash.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Automatic action(s) :  ";
                const checkboxAtmSmashCell = trGnaMouAtmSmash.insertCell();
                const checkboxAtmSmash = document.createElement('input');
                checkboxAtmSmash.id = ID_CBX_GNAMOU_ATM_SMASH;
                checkboxAtmSmash.type = "checkbox";
                checkboxAtmSmash.onchange = saveGnaMouAtmSmash;
                checkboxAtmSmashCell.appendChild(checkboxAtmSmash);
                tmpTxt = document.createTextNode(" Smash the boulder");
                checkboxAtmSmashCell.appendChild(tmpTxt);

                const trGnaMouAtmSwitchCharm = policyPreferencesTable.insertRow();
                trGnaMouAtmSwitchCharm.id = ID_TR_GNAMOU_ATM_SWITCH_CHARM;
                trGnaMouAtmSwitchCharm.style.height = "24px";
                trGnaMouAtmSwitchCharm.style.display = "none";
                captionCell = trGnaMouAtmSwitchCharm.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                const checkboxtmSwitchCharmCell = trGnaMouAtmSwitchCharm.insertCell();
                const checkboxtmSwitchCharm = document.createElement('input');
                checkboxtmSwitchCharm.id = ID_CBX_GNAMOU_ATM_SWITCH_CHARM;
                checkboxtmSwitchCharm.type = "checkbox";
                checkboxtmSwitchCharm.onchange = saveGnaMouAtmSwitchCharm;
                checkboxtmSwitchCharmCell.appendChild(checkboxtmSwitchCharm);
                tmpTxt = document.createTextNode(" Switch Power Charm");
                checkboxtmSwitchCharmCell.appendChild(tmpTxt);

                captionCell = undefined;
                tmpTxt = undefined;
            }

            function insertRodCLiPolicyPreferences() {
                function saveRodCLiCheckbox(event) {
                    g_policies.getPolicy(POLICY_NAME_CRYSTAL_LIBRARY).trapSetups[RODCLI_ATM_CATALOG_MICE] = event.target.checked;
                    setStorage(STORAGE_TRAP_SETUP_RODCLI, g_policies.getPolicy(POLICY_NAME_CRYSTAL_LIBRARY).trapSetups);
                }

                const trRodCLiAtmCatalogMice = policyPreferencesTable.insertRow();
                trRodCLiAtmCatalogMice.id = ID_TR_RODCLI_ATM_CATALOG_MICE;
                trRodCLiAtmCatalogMice.style.height = "24px";
                trRodCLiAtmCatalogMice.style.display = "none";
                const captionCell = trRodCLiAtmCatalogMice.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Automatic action(s) :  ";
                const checkboxCell = trRodCLiAtmCatalogMice.insertCell();
                const checkbox = document.createElement('input');
                checkbox.id = ID_CBX_RODCLI_ATM_CATALOG_MICE;
                checkbox.type = "checkbox";
                checkbox.onchange = saveRodCLiCheckbox;
                checkboxCell.appendChild(checkbox);
                const tmpTxt = document.createTextNode(" Start Calalog Mice Library Assignment");
                checkboxCell.appendChild(tmpTxt);
            }

            function insertSDeFWaPolicyPreferences() {
                function onChangeSelectSDeFWaWave(event) {
                    g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).initSelectTrapSetup();
                }

                function saveSoldierSetup(itemIndex, value) {
                    const powerType = document.getElementById(ID_SELECT_SDEFWA_POWER_TYPE).value;
                    g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups[powerType][itemIndex] = value;
                    setStorage(STORAGE_TRAP_SETUP_SDEFWA, g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups);
                }

                function saveSDeFWaSoldierWeapon(event) {
                    saveSoldierSetup(IDX_WEAPON, event.target.value);
                }

                function saveSDeFWaSoldierBase(event) {
                    saveSoldierSetup(IDX_BASE, event.target.value);
                }

                function saveSDeFWaTargetPopulation(event) {
                    const wave = document.getElementById(ID_SELECT_SDEFWA_WAVE).value;
                    g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups[wave][SDEFWA_POPULATION_PRIORITY] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_SDEFWA, g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups);
                }

                function onChangeSelectSDeFWaStreak(event) {
                    g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).initSelectTrapSetup();
                }

                function saveStreakSetup(itemIndex, value) {
                    const streak = document.getElementById(ID_SELECT_SDEFWA_STREAK).value;
                    const wave = document.getElementById(ID_SELECT_SDEFWA_WAVE).value;
                    g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups[wave][streak][itemIndex] = value;
                    setStorage(STORAGE_TRAP_SETUP_SDEFWA, g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups);
                }

                function saveSDeFWaStreakBait(event) {
                    saveStreakSetup(IDX_BAIT, event.target.value);
                }

                function saveSDeFWaStreakCharmType(event) {
                    saveStreakSetup(IDX_CHARM_TYPE, event.target.value);
                }

                function saveSDeFWaStreakSoldierType(event) {
                    saveStreakSetup(IDX_SOLDIER_TYPE, event.target.value);
                }

                function saveSDeFWaLastSoldierBait(event) {
                    g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups[SDEFWA_LAST_SOLDIER][IDX_BAIT] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_SDEFWA, g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups);
                }

                function saveSDeFWaLastSoldierCharmType(event) {
                    g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups[SDEFWA_LAST_SOLDIER][IDX_CHARM_TYPE] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_SDEFWA, g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups);
                }

                function saveSDeFWaArmingWarpathCharm(event) {
                    g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups[SDEFWA_ARMING_CHARM_SUPPORT_RETREAT] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_SDEFWA, g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups);
                }

                function onChangeSelectSDeFWaBeforeAfterWardens(event) {
                    g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).initSelectTrapSetup();
                }

                function saveWave4Setup(itemIndex, value) {
                    const status = document.getElementById(ID_SELECT_SDEFWA_BEFORE_AFTER_WARDENS).value;
                    g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups[SDEFWA_WAVE4][status][itemIndex] = value;
                    setStorage(STORAGE_TRAP_SETUP_SDEFWA, g_policies.getPolicy(POLICY_NAME_FIERY_WARPATH).trapSetups);
                }

                function saveSDeFWaWave4Weapon(event) {
                    saveWave4Setup(IDX_WEAPON, event.target.value);
                }

                function saveSDeFWaWave4Base(event) {
                    saveWave4Setup(IDX_BASE, event.target.value);
                }

                function saveSDeFWaWave4Bait(event) {
                    saveWave4Setup(IDX_BAIT, event.target.value);
                }

                function saveSDeFWaWave4Trinket(event) {
                    saveWave4Setup(IDX_TRINKET, event.target.value);
                }

                let tmpTxt;
                let captionCell;
                const trSelectSDeFWaWave = policyPreferencesTable.insertRow();
                trSelectSDeFWaWave.id = ID_TR_SELECT_SDEFWA_WAVE;
                trSelectSDeFWaWave.style.height = "24px";
                trSelectSDeFWaWave.style.display = "none";
                captionCell = trSelectSDeFWaWave.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Wave :  ";
                const selectSDeFWaWaveCell = trSelectSDeFWaWave.insertCell();
                const selectSDeFWaWave = getSelectItem(SDEFWA_WAVES, ID_SELECT_SDEFWA_WAVE, onChangeSelectSDeFWaWave, false, false, false);
                selectSDeFWaWave.style.width = "65px";
                selectSDeFWaWaveCell.appendChild(selectSDeFWaWave);

                const trSDeFWaPowerTypesTrapSetup = policyPreferencesTable.insertRow();
                trSDeFWaPowerTypesTrapSetup.id = ID_TR_SDEFWA_POWER_TYPES_TRAP_SETUP;
                trSDeFWaPowerTypesTrapSetup.style.height = "24px";
                trSDeFWaPowerTypesTrapSetup.style.display = "none";
                captionCell = trSDeFWaPowerTypesTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for ";
                const selectSDeFWaPowerType = getSelectItem(SDEFWA_POWER_TYPES, ID_SELECT_SDEFWA_POWER_TYPE, onChangeSelectSDeFWaWave, false, false, false);
                selectSDeFWaPowerType.style.width = "65px";
                captionCell.appendChild(selectSDeFWaPowerType);
                tmpTxt = document.createTextNode(" :  ");
                captionCell.appendChild(tmpTxt);
                const powerTypeTrapSetupCell = trSDeFWaPowerTypesTrapSetup.insertCell();
                powerTypeTrapSetupCell.appendChild(getSelectWeapon(ID_SELECT_SDEFWA_SOLDIER_WEAPON, saveSDeFWaSoldierWeapon));
                tmpTxt = document.createTextNode(" ");
                powerTypeTrapSetupCell.appendChild(tmpTxt);
                powerTypeTrapSetupCell.appendChild(getSelectBase(ID_SELECT_SDEFWA_SOLDIER_BASE, saveSDeFWaSoldierBase));

                const trSelectSDeFWaTargetPopulation = policyPreferencesTable.insertRow();
                trSelectSDeFWaTargetPopulation.id = ID_TR_SELECT_SDEFWA_TARGET_POPULATION;
                trSelectSDeFWaTargetPopulation.style.height = "24px";
                trSelectSDeFWaTargetPopulation.style.display = "none";
                captionCell = trSelectSDeFWaTargetPopulation.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Target Population :  ";
                const selectSDeFWaTargetPopulationCell = trSelectSDeFWaTargetPopulation.insertCell();
                const selectSDeFWaTargetPopulation = getSelectItem(SDEFWA_TARGET_POPULATIONS,
                                                                   ID_SELECT_SDEFWA_TARGET_POPULATION,
                                                                   saveSDeFWaTargetPopulation,
                                                                   false, false, false);
                selectSDeFWaTargetPopulation.style.width = "65px";
                selectSDeFWaTargetPopulationCell.appendChild(selectSDeFWaTargetPopulation);

                const trSDeFWaStreaksTrapSetup = policyPreferencesTable.insertRow();
                trSDeFWaStreaksTrapSetup.id = ID_TR_SDEFWA_STREAKS_TRAP_SETUP;
                trSDeFWaStreaksTrapSetup.style.height = "24px";
                trSDeFWaStreaksTrapSetup.style.display = "none";
                captionCell = trSDeFWaStreaksTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for ";
                const selectSDeFWaStreak = getSelectItem(Array(SDEFWA_MAX_STREAKS+1).keys(), ID_SELECT_SDEFWA_STREAK, onChangeSelectSDeFWaStreak, false, false, false);
                selectSDeFWaStreak.style.width = "35px";
                captionCell.appendChild(selectSDeFWaStreak);
                tmpTxt = document.createTextNode(" :  ");
                captionCell.appendChild(tmpTxt);
                const streakTrapSetupCell = trSDeFWaStreaksTrapSetup.insertCell();
                streakTrapSetupCell.appendChild(getSelectBait(ID_SELECT_SDEFWA_STREAK_BAIT, saveSDeFWaStreakBait));
                tmpTxt = document.createTextNode(" ");
                streakTrapSetupCell.appendChild(tmpTxt);
                const selectSDeFWaStreakCharmType = getSelectItem(SDEFWA_CHARM_TYPES, ID_SELECT_SDEFWA_STREAK_CHARM_TYPE, saveSDeFWaStreakCharmType, true, false, false);
                streakTrapSetupCell.appendChild(selectSDeFWaStreakCharmType);
                tmpTxt = document.createTextNode(" ");
                streakTrapSetupCell.appendChild(tmpTxt);
                const selectSDeFWaStreakSoldierType = getSelectItem(SDEFWA_STREAK_SOLDIER_TYPES,
                                                                    ID_SELECT_SDEFWA_STREAK_SOLDIER_TYPE,
                                                                    saveSDeFWaStreakSoldierType,
                                                                    false, false, false);
                streakTrapSetupCell.appendChild(selectSDeFWaStreakSoldierType);

                const trSDeFWaLastSoldierTrapSetup = policyPreferencesTable.insertRow();
                trSDeFWaLastSoldierTrapSetup.id = ID_TR_SDEFWA_LAST_SOLDIER_TRAP_SETUP;
                trSDeFWaLastSoldierTrapSetup.style.height = "24px";
                trSDeFWaLastSoldierTrapSetup.style.display = "none";
                captionCell = trSDeFWaLastSoldierTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for Last Soldier :  ";
                const lastSoldierTrapSetupCell = trSDeFWaLastSoldierTrapSetup.insertCell();
                lastSoldierTrapSetupCell.appendChild(getSelectBait(ID_SELECT_SDEFWA_LAST_SOLDIER_BAIT, saveSDeFWaLastSoldierBait));
                tmpTxt = document.createTextNode(" ");
                lastSoldierTrapSetupCell.appendChild(tmpTxt);
                const selectSDeFWaLastSoldierCharmType = getSelectItem(SDEFWA_CHARM_TYPES,
                                                                       ID_SELECT_SDEFWA_LAST_SOLDIER_CHARM_TYPE,
                                                                       saveSDeFWaLastSoldierCharmType,
                                                                       true, true, false);
                lastSoldierTrapSetupCell.appendChild(selectSDeFWaLastSoldierCharmType);

                const trSDeFWaWhenSupportRetreat = policyPreferencesTable.insertRow();
                trSDeFWaWhenSupportRetreat.id = ID_TR_SDEFWA_WHEN_SUPPORT_RETREAT;
                trSDeFWaWhenSupportRetreat.style.height = "24px";
                trSDeFWaWhenSupportRetreat.style.display = "none";
                captionCell = trSDeFWaWhenSupportRetreat.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "When Support Retreat :  ";
                const trinketArmingCell = trSDeFWaWhenSupportRetreat.insertCell();
                const selectSDeFWaArmingWarpathCharm = getSelectItem(ITEM_ARMING, ID_SELECT_SDEFWA_ARMING_WARPATH_CHARM, saveSDeFWaArmingWarpathCharm, false, false, false);
                selectSDeFWaArmingWarpathCharm.style.width = "60px";
                trinketArmingCell.appendChild(selectSDeFWaArmingWarpathCharm);
                tmpTxt = document.createTextNode("  Warpath Charm");
                trinketArmingCell.appendChild(tmpTxt);

                const trSDeFWaWave4TrapSetup = policyPreferencesTable.insertRow();
                trSDeFWaWave4TrapSetup.id = ID_TR_SDEFWA_WAVE4_TRAP_SETUP;
                trSDeFWaWave4TrapSetup.style.height = "24px";
                trSDeFWaWave4TrapSetup.style.display = "none";
                captionCell = trSDeFWaWave4TrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup ";
                const selectSDeFWaBeforeAfterWardens = getSelectItem(STATUSES,
                                                                     ID_SELECT_SDEFWA_BEFORE_AFTER_WARDENS,
                                                                     onChangeSelectSDeFWaBeforeAfterWardens,
                                                                     false, false, false);
                selectSDeFWaBeforeAfterWardens.style.width = "60px";
                captionCell.appendChild(selectSDeFWaBeforeAfterWardens);
                tmpTxt = document.createTextNode("  Clear Wardens :  ");
                captionCell.appendChild(tmpTxt);
                const wave4TrapSetupCell = trSDeFWaWave4TrapSetup.insertCell();
                wave4TrapSetupCell.appendChild(getSelectWeapon(ID_SELECT_SDEFWA_WAVE4_WEAPON, saveSDeFWaWave4Weapon));
                tmpTxt = document.createTextNode(" ");
                wave4TrapSetupCell.appendChild(tmpTxt);
                wave4TrapSetupCell.appendChild(getSelectBase(ID_SELECT_SDEFWA_WAVE4_BASE, saveSDeFWaWave4Base));
                tmpTxt = document.createTextNode(" ");
                wave4TrapSetupCell.appendChild(tmpTxt);
                wave4TrapSetupCell.appendChild(getSelectBait(ID_SELECT_SDEFWA_WAVE4_BAIT, saveSDeFWaWave4Bait));
                tmpTxt = document.createTextNode(" ");
                wave4TrapSetupCell.appendChild(tmpTxt);
                wave4TrapSetupCell.appendChild(getSelectTrinket(ID_SELECT_SDEFWA_WAVE4_TRINKET, saveSDeFWaWave4Trinket));

                tmpTxt = undefined;
            }

            let currentPolicy;
            let policyStorage;
            const policyPreferencesTable = document.createElement('table');
            policyPreferencesTable.width = "100%";

            const trEmpty = policyPreferencesTable.insertRow();
            trEmpty.style.height = "4px"
            insertSelectPolicyRow();
            insertSingleTrapSetupRow();
            insertSelectableTrapSetupRow();

            return policyPreferencesTable;
        }

        function embedPreferencesFooterTable() {
            function savePolicyPreferences() {
                reloadCampPage();
            }

            function updateTraps() {
                function processData(data, classification) {
                    const tmpInfo = {};
                    for (const component of data.components){
                        if (isNullOrUndefined(component.quantity) || component.quantity == 0) {
                            continue;
                        }
                        tmpInfo[component.type] = {};
                        tmpInfo[component.type].name = component.name;
                        tmpInfo[component.type].itemId = component.item_id;
                        if (classification === CLASSIFICATION_WEAPON || classification === CLASSIFICATION_BASE) {
                            if (classification === CLASSIFICATION_WEAPON) {
                                tmpInfo[component.type].powerType = component.power_type_name;
                            }
                            tmpInfo[component.type].power = component.power;
                            if (isNullOrUndefined(component.luck)) {
                                tmpInfo[component.type].luck = 0;
                            } else {
                                tmpInfo[component.type].luck = component.luck;
                            }
                        }
                    }
                    const sortedInfo = Object.fromEntries(Object.entries(tmpInfo)
                                                          .sort(([,a], [,b]) => (b.name > a.name)? -1: 1));
                    if (classification === CLASSIFICATION_WEAPON) {
                        g_trapInfo.weapon.info = sortedInfo;
                        g_trapInfo.weapon.names = Object.keys(sortedInfo).map(x => sortedInfo[x].name);
                    } else if (classification === CLASSIFICATION_BASE) {
                        g_trapInfo.base.info = sortedInfo;
                        g_trapInfo.base.names = Object.keys(sortedInfo).map(x => sortedInfo[x].name);
                    } else if (classification === CLASSIFICATION_BAIT) {
                        g_trapInfo.bait.info = sortedInfo;
                        g_trapInfo.bait.names = Object.keys(sortedInfo).map(x => sortedInfo[x].name);
                    } else if (classification === CLASSIFICATION_TRINKET) {
                        g_trapInfo.trinket.info = sortedInfo;
                        g_trapInfo.trinket.names = Object.keys(sortedInfo).map(x => sortedInfo[x].name);
                    }
                    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Updating " + classification + "s";
                }

                function updateItems(classification) {
                    ajaxPost(window.location.origin + '/managers/ajax/users/gettrapcomponents.php',
                             getAjaxHeader({"classification": classification}),
                             function (data) {
                        processData(data, classification);
                    }, function (error) {
                        console.error('ajax:', error);
                        alert("error updating weapon");
                    });
                }

                function saveTrapInfo() {
                    setStorage(STORAGE_TRAP_INFO, g_trapInfo);
                    reloadCampPage();
                }

                if (!lockBot(BOT_PROCESS_MANUAL)) {
                    return;
                }
                g_trapInfo = {};
                g_trapInfo.weapon = {};
                updateItems(CLASSIFICATION_WEAPON);
                g_trapInfo.base = {};
                updateItems(CLASSIFICATION_BASE);
                g_trapInfo.bait = {};
                updateItems(CLASSIFICATION_BAIT);
                g_trapInfo.trinket = {};
                updateItems(CLASSIFICATION_TRINKET);

                window.setTimeout(function () {
                    saveTrapInfo();
                }, 3 * 1000);
            }

            function updateFriends() {
                function processUserData(data) {
                    const senderUserId = getPageVariable("user.sn_user_id");
                    g_friendInfo = Object.fromEntries(Object.entries(data.user_data).filter(([key, value]) => value.sn_user_id !== senderUserId));
                    setStorage(STORAGE_FRIEND_INFO, g_friendInfo);
                    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish updating friends";
                }
                ajaxPost(window.location.origin + '/managers/ajax/users/userData.php',
                         getAjaxHeader({"fields%5B%5D": "snuid", "get_friends": true}),
                         function (data) {
                    processUserData(data);
                }, function (error) {
                    console.error('ajax:', error);
                    alert("error getting friend list");
                });
            }

            function clearStorage() {
                window.localStorage.clear();
                reloadCampPage();
            }

            let tmpTxt;
            const preferencesFooterTable = document.createElement('table');
            preferencesFooterTable.width = "100%";

            const preferencesFooterRow = preferencesFooterTable.insertRow();
            const updateTrapsButtonCell = preferencesFooterRow.insertCell();
            const updateTrapsButton = document.createElement('button');
            updateTrapsButton.id = ID_BOTTON_UPDATE_TRAPS;
            updateTrapsButton.onclick = updateTraps
            updateTrapsButton.style.fontSize = "10px";
            tmpTxt = document.createTextNode("Update traps");
            updateTrapsButton.appendChild(tmpTxt);
            updateTrapsButtonCell.appendChild(updateTrapsButton);
            tmpTxt = document.createTextNode(" ");
            updateTrapsButtonCell.appendChild(tmpTxt);
            const updateFriendsButton = document.createElement('button');
            updateFriendsButton.id = ID_BOTTON_UPDATE_FRIENDS;
            updateFriendsButton.onclick = updateFriends;
            updateFriendsButton.style.fontSize = "10px";
            tmpTxt = document.createTextNode("Update friends");
            updateFriendsButton.appendChild(tmpTxt);
            updateTrapsButtonCell.appendChild(updateFriendsButton);
            tmpTxt = document.createTextNode(" ");
            updateTrapsButtonCell.appendChild(tmpTxt);
            const clearStorageButton = document.createElement('button');
            clearStorageButton.onclick = clearStorage;
            clearStorageButton.style.fontSize = "10px";
            tmpTxt = document.createTextNode("Clear stroage");
            clearStorageButton.appendChild(tmpTxt);
            updateTrapsButtonCell.appendChild(clearStorageButton);
            const applyButtonCell = preferencesFooterRow.insertCell();
            applyButtonCell.style.textAlign = "right";
            const applyPolicyPreferencesButton = document.createElement('button');
            applyPolicyPreferencesButton.onclick = savePolicyPreferences
            applyPolicyPreferencesButton.style.fontSize = "9px";
            tmpTxt = document.createTextNode("Apply & Reload");
            applyPolicyPreferencesButton.appendChild(tmpTxt);
            applyButtonCell.appendChild(applyPolicyPreferencesButton);
            tmpTxt = document.createTextNode("  ");
            applyButtonCell.appendChild(tmpTxt);

            tmpTxt = undefined;
            return preferencesFooterTable;
        }

        let separationLine;
        let blankLine;
        let tmpTitle;
        const preferencesSection = document.createElement('div');

        const preferencesHeaderTable = embedPreferencesHeaderTable();
        preferencesSection.appendChild(preferencesHeaderTable);

        const preferencesBox = document.createElement('div');
        preferencesBox.id = "preferencesBox";
        preferencesBox.style.display = "none";

        separationLine = document.createElement('div');
        separationLine.style.height = "3px";
        separationLine.style.borderBottom = "1px solid #F122F6";
        preferencesBox.appendChild(separationLine);
        blankLine = document.createElement('div');
        blankLine.style.height="2px"
        preferencesBox.appendChild(blankLine);
        tmpTitle = document.createElement('div');
        tmpTitle.style.textAlign = "center";
        tmpTitle.style.fontWeight = "bold";
        tmpTitle.style.fontSize = "12px";
        tmpTitle.innerHTML = 'Timer configuration ';
        preferencesBox.appendChild(tmpTitle);
        const timerLink = document.createElement('a');
        timerLink.id = ID_TIMER_LINK;
        timerLink.innerHTML = '[Show]';
        timerLink.style.fontWeight = "bold";
        timerLink.onclick = toggleTimerPreferencesTable;
        tmpTitle.appendChild(timerLink);

        const timerPreferencesTable = embedTimerPreferences();
        preferencesBox.appendChild(timerPreferencesTable);
        timerPreferencesTable.style.display = "none";

        separationLine = document.createElement('div');
        separationLine.style.height = "3px";
        separationLine.style.borderBottom = "1px solid #F122F6";
        preferencesBox.appendChild(separationLine);

        blankLine = document.createElement('div');
        blankLine.style.height="2px"
        preferencesBox.appendChild(blankLine);
        tmpTitle = document.createElement('div');
        tmpTitle.style.textAlign = "center";
        tmpTitle.style.fontWeight = "bold";
        tmpTitle.style.fontSize = "12px";
        tmpTitle.innerHTML = 'Location/event-based trap setup';
        preferencesBox.appendChild(tmpTitle);

        const policyPreferencesTable = embedPolicyPreferences();
        preferencesBox.appendChild(policyPreferencesTable);
        blankLine = document.createElement('div');
        blankLine.style.height="4px"
        preferencesBox.appendChild(blankLine);
        const preferencesFooterTable = embedPreferencesFooterTable();
        preferencesBox.appendChild(preferencesFooterTable);

        preferencesSection.appendChild(preferencesBox);

        separationLine = undefined;
        blankLine = undefined;
        tmpTitle = undefined;

        return preferencesSection;
    }

    const overlayContainerElement = document.getElementById('overlayContainer');
    if (overlayContainerElement) {
        const autobotDiv = document.createElement('div');
        autobotDiv.style.whiteSpace = "pre";
        autobotDiv.style.fontSize = "200%";

        const statusSection = embedStatusTable();
        autobotDiv.appendChild(statusSection);

        const preferencesSection = embedPreferences();
        autobotDiv.appendChild(preferencesSection);

        overlayContainerElement.parentNode.insertBefore(autobotDiv, overlayContainerElement);
        return true;
    } else {
        return false;
    }
}

function getPageVariable(name) {
    if (DEBUG_MODE) console.log('RUN GPV(' + name + ')');
    try {
        if (name == USER_NEXT_ACTIVETURN_SECONDS) {
            return unsafeWindow.user.next_activeturn_seconds;
        } else if (name == USER_HAS_PUZZLE) {
            return unsafeWindow.user.has_puzzle;
        } else if (name == 'user.unique_hash') {
            return unsafeWindow.user.unique_hash;
        } else if (name == 'user.user_id') {
            return unsafeWindow.user.user_id;
        } else if (name == 'user.sn_user_id') {
            return unsafeWindow.user.sn_user_id;
        } else if (name == 'lastReadJournalEntryId') {
            return unsafeWindow.lastReadJournalEntryId;
        } else if (name == "user.bait_quantity") {
            return unsafeWindow.user.bait_quantity;
        } else if (name == "user.weapon_item_id") {
            return unsafeWindow.user.weapon_item_id;
        } else if (name == "user.base_item_id") {
            return unsafeWindow.user.base_item_id;
        } else if (name == "user.bait_item_id") {
            return unsafeWindow.user.bait_item_id;
        } else if (name == "user.trinket_item_id") {
            return unsafeWindow.user.trinket_item_id;
        } else if (name == "user.environment_name") {
            return unsafeWindow.user.environment_name;
        } else if (name == "user.title_name") {
            return unsafeWindow.user.title_name;
        } else if (name == "user.quests.QuestHarbour") {
            return unsafeWindow.user.quests.QuestHarbour;
        } else if (name == "user.quests.QuestMountain") {
            return unsafeWindow.user.quests.QuestMountain;
        } else if (name == "user.quests.QuestClawShotCity.phase") {
            return unsafeWindow.user.quests.QuestClawShotCity.phase;
        } else if (name == "user.quests.QuestFortRox") {
            return unsafeWindow.user.quests.QuestFortRox;
        } else if (name == "user.quests.QuestZugzwangLibrary") {
            return unsafeWindow.user.quests.QuestZugzwangLibrary;
        } else if (name == "user.viewing_atts.desert_warpath") {
            return unsafeWindow.user.viewing_atts.desert_warpath;
        }

        if (DEBUG_MODE) console.log('GPV other: ' + name + ' not found.');
        return 'ERROR';
    } catch (e) {
        if (DEBUG_MODE) console.log('GPV ALL try block error: ' + e);
    } finally {
        name = undefined;
    }
}
