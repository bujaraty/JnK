// ==UserScript==
// @name         MH_Admirer_by_JnK_beta
// @namespace    https://github.com/bujaraty/JnK
// @version      1.2.2.23
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
// - Auto change trap setting
//   - ZToPolicy 2nd half
//   - Activate-Deactivate FRo tower (After I get tower lvl 3)
//   - CLiPolicy
//   - IcePolicy and test
//   - FWaPolicy

// == Basic User Preference Setting (Begin) ==
// // The variable in this section contain basic option will normally edit by most user to suit their own preference
// // Reload MouseHunt page manually if edit this script while running it for immediate effect.

// // ERROR CHECKING ONLY: Script debug
const DEBUG_MODE = true;

// // Extra delay time before sounding the horn. (in seconds)
// // Default: 10-15
let g_botHornTimeDelayMin = 10;
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
const MAX_KR_RETRY = 5;

// // Scheduler time that will start automatically
const STATUS_GIFTS_AND_RAFFLES_INCOMPLETE = "Incomplete";
const STATUS_GIFTS_AND_RAFFLES_COMPLETE = "Complete";
let g_scheduledGiftsAndRafflesTime = "07:35";
let g_beginScheduledGiftsAndRafflesTime = new Date();
let g_scheduledResetTime = "07:02";
let g_beginScheduledResetTime = new Date();
let g_statusGiftsAndRaffles = STATUS_GIFTS_AND_RAFFLES_INCOMPLETE;

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
let g_nextBotHornTimeInSeconds;
let g_botHornTimeDelayInSeconds;
let g_nextTrapCheckTimeInSeconds = 0;
let g_nextTrapCheckTimeDelayInSeconds = 0;
let g_strScriptVersion = GM_info.script.version;
let g_nextBotHornTimeDisplay;
let g_nextTrapCheckTimeDisplay;
let g_nextBotHornTime;
let g_lastBotHornTimeRecorded = new Date();
let g_lastTrapCheckTimeRecorded = new Date();
let g_kingsRewardRetry = 0;
let g_weaponNames = [];
let g_baseNames = [];
let g_baitNames = [];
let g_trinketNames = [];
let g_botProcess = BOT_PROCESS_IDLE;
let g_bestBase;
let g_bestArcaneWeapon;
let g_bestDraconicWeapon;
let g_bestForgottenWeapon;
let g_bestHydroWeapon;
let g_bestLawWeapon;
let g_bestPhysicalWeapon;
let g_bestRiftWeapon;
let g_bestShadowWeapon;
let g_bestTacticalWeapon;

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
const WEAPON_OASIS_WATER_NODE = "Oasis Water Node";
const WEAPON_STEAM_LASER_MK_III = "Steam Laser Mk. III";
const BASE_CHEESECAKE = "Cheesecake Base";
const BASE_CHOCOLATE_BAR = "Chocolate Bar Base";
const BASE_DEEP_FREEZE = "Deep Freeze Base";
const BASE_HEARTHSTONE = "Hearthstone Base";
const BASE_MAGNET = "Magnet Base";
const BASE_REMOTE_DETONATOR = "Remote Detonator Base";
const BASE_SPIKED = "Spiked Base";
const BASE_THIEF = "Thief Base";
const BASE_WOODEN_BASE_WITH_TARGET = "Wooden Base with Target";
const BEST_BASES = ["Chocolate Bar Base", "Aqua Base", "Fan Base", "Explosive Base"];
const BEST_ARCANE_WEAPONS = ["Circlet of Pursuing", "Circlet of Seeking", "Event Horizon", "Grand Arcanum", "Droid Archmagus", "Arcane Blast",
                             "Arcane Capturing Rod Of Never Yielding Mystery"];
const BEST_DRACONIC_WEAPONS = ["Dragon Slayer Cannon", "Chrome Storm Wrought Ballista", "Storm Wrought Ballista", "Dragonvine Ballista", "Blazing Ember Spear",
                               "Ice Maiden"];
const BEST_FORGOTTEN_WEAPONS = ["Thought Obliterator ", "Thought Manipulator", "Infinite Labyrinth", "Endless Labyrinth", "Crystal Crucible", "Scarlet Ember Root",
                                "Ancient Box"];
const BEST_HYDRO_WEAPONS = ["Queso Fount", "School of Sharks", WEAPON_OASIS_WATER_NODE, "Steam Laser Mk. I", "Ancient Spear Gun"];
const BEST_LAW_WEAPONS = ["S.T.I.N.G.E.R.", "Ember Prison Core", "Meteor Prison Core", "S.L.A.C. II"];
const BEST_PHYSICAL_WEAPONS = ["Smoldering Stone Sentinel", "Chrome MonstroBot", "Sandstorm MonstroBot", "Enraged RhinoBot"];
const BEST_RIFT_WEAPONS= ["Chrome Celestial Dissonance", "Celestial Dissonance", "Timesplit Dissonance",
                          "Mysteriously unYielding Null-Onyx Rampart of Cascading Amperes", "Darkest Chocolate Bunny", "Focused Crystal Laser", "Multi-Crystal",
                          "Crystal Tower"];
const BEST_SHADOW_WEAPONS = ["Chrome Temporal Turbine", "Temporal Turbine", "Interdimensional Crossbow", "Clockwork Portal", "Reaper's Perch", "Clockapult of Time"];
const BEST_TACTICAL_WEAPONS = ["Slumbering Boulder", "Sleeping Stone", "Gouging Geyserite", "Sphynx Wrath", "Horrific Venus Mouse", "Ambush"];
const BAIT_BRIE = "Brie Cheese";
const BAIT_CHECKMATE = "Checkmate Cheese";
const BAIT_CRESCENT = "Crescent Cheese";
const BAIT_GOUDA = "Gouda Cheese";
const BAIT_MOON = "Moon Cheese";
const BAIT_RUNIC = "Runic Cheese";
const TRINKET_ATTRACTION = "Attraction Charm";
const TRINKET_POWER = "Power Charm";
const TRINKET_ROOK_CRUMBLE = "Rook Crumble Charm";
const TRINKET_STICKY = "Sticky Charm";
const TRINKET_VALENTINE = "Valentine Charm";
const TRINKET_WAX = "Wax Charm";
const WEAPON_MYSTIC_PAWN_PINCHER = "Mystic Pawn Pincher";
const WEAPON_TECHNIC_PAWN_PINCHER = "Technic Pawn Pincher";
const WEAPON_BLACKSTONE_PASS = "Blackstone Pass";
const WEAPON_OBVIOUS_AMBUSH = "Obvious Ambush";
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
const ID_POLICY_TXT = "policyTxt";
const ID_TR_ARE_TRAP_SETUP = "trAReTrapSetup";
const ID_SELECT_ARE_WEAPON = "selectAReWeapon";
const ID_SELECT_ARE_BASE = "selectAReBase";
const ID_SELECT_ARE_BAIT = "selectAReBait";
const ID_SELECT_ARE_TRINKET = "selectAReTrinket";
const ID_TR_FRO_PHASES_TRAP_SETUP = "trFRoPhasesTrapSetup";
const ID_SELECT_FRO_PHASE = "selectFRoPhase";
const ID_SELECT_FRO_WEAPON = "selectFRoWeapon";
const ID_SELECT_FRO_BASE = "selectFRoBase";
const ID_SELECT_FRO_BAIT = "selectFRoBait";
const ID_SELECT_FRO_TRINKET = "selectFRoTrinket";
const ID_SELECT_FRO_TOWER = "selectFRoTower";
const ID_TR_FRO_TOWER_HP_FULL = "trFRoTowerHPFull";
const ID_SELECT_FRO_ACTIVATION_HP_FULL = "selctFRoActivationHPFull";
const ID_TR_SGA_SEASONS_TRAP_SETUP = "trSGaSeasonsTrapSetup";
const ID_SELECT_SGA_SEASON = "selectSGaSeason";
const ID_SELECT_SGA_WEAPON = "selectSGaWeapon";
const ID_SELECT_SGA_BASE = "selectSGaBase";
const ID_SELECT_SGA_BAIT = "selectSGaBait";
const ID_SELECT_SGA_TRINKET = "selectSGaTrinket";
const ID_TR_ZTO_STRATEGY = "trZToStrategy";
const ID_SELECT_ZTO_STRATEGY = "selectZToStrategy";
const ID_TR_ZTO_CHESS_TRAP_SETUP = "trZToChessTrapSetup";
const ID_SELECT_ZTO_CHESS = "selectZToChess";
const ID_SELECT_ZTO_WEAPON = "selectZToWeapon";
const ID_SELECT_ZTO_BASE = "selectZToBase";
const ID_SELECT_ZTO_BAIT = "selectZToBait";
const ID_SELECT_ZTO_TRINKET = "selectZToTrinket";
const ID_TR_CLI_CATALOG_MICE = "trCLiCatalogMice";
const ID_CHECKBOX_CLI_CATALOG_MICE = "checkboxCLiCatalogMice";
const ID_TR_ICE_SUBLOCATIONS_TRAP_SETUP = "trIceSublocationTrapSetup";
const ID_SELECT_ICE_SUBLOCATION = "selectIceSublocation";
const ID_SELECT_ICE_WEAPON = "selectIceWeapon";
const ID_SELECT_ICE_BASE = "selectIceBase";
const ID_SELECT_ICE_BAIT = "selectIceBait";
const ID_SELECT_ICE_TRINKET = "selectIceTrinket";
const ID_TR_SELECT_FWA_WAVE = "trSelectFWaWave";
const ID_SELECT_FWA_WAVE = "selectFWaWave";
const ID_TR_FWA_POWER_TYPES_TRAP_SETUP = "trFWaPowerTypesTrapSetup";
const ID_SELECT_FWA_POWER_TYPE = "selectFWaPowerType";
const ID_SELECT_FWA_SOLDIER_WEAPON = "selectFWaSoldierWeapon";
const ID_SELECT_FWA_SOLDIER_BASE = "selectFWaSoldierBase";
const ID_TR_SELECT_FWA_TARGET_POPULATION = "trSelectFWaTargetPopulation";
const ID_SELECT_FWA_TARGET_POPULATION = "selectFWaTargetPopulation";
const ID_TR_FWA_STREAKS_TRAP_SETUP = "trFWaStreaksTrapSetup";
const ID_SELECT_FWA_STREAK = "selectFWaStreak";
const ID_SELECT_FWA_STREAK_BAIT = "selectFWaStreakBait";
const ID_SELECT_FWA_STREAK_CHARM_TYPE = "selectFWaStreakCharmType";
const ID_SELECT_FWA_STREAK_SOLDIER_TYPE = "selectFWaStreakSoldierType";
const ID_TR_FWA_LAST_SOLDIER_TRAP_SETUP = "trFWaLastSoldierTrapSetup";
const ID_SELECT_FWA_LAST_SOLDIER_BAIT = "selectFWaLastSoldierBait";
const ID_SELECT_FWA_LAST_SOLDIER_CHARM_TYPE = "selectFWaLastSoldierCharmType";
const ID_TR_FWA_WHEN_SUPPORT_RETREAT = "trFWaWhenSupportRetreat";
const ID_SELECT_FWA_ARMING_WARPATH_CHARM = "selectFWaArmingWarpathCharm";
const ID_TR_FWA_WAVE4_TRAP_SETUP = "trFWaWave4TrapSetup";
const ID_SELECT_FWA_BEFORE_AFTER_WARDENS = "selectFWaBeforeAfterWardens";
const ID_SELECT_FWA_WAVE4_WEAPON = "selectFWaWave4Weapon";
const ID_SELECT_FWA_WAVE4_BASE = "selectFWaWave4Base";
const ID_SELECT_FWA_WAVE4_BAIT = "selectFWaWave4Bait";
const ID_SELECT_FWA_WAVE4_TRINKET = "selectFWaWave4Trinket";
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
const STORAGE_TRAP_SETUP_ARE = "trapSetupARe";
const STORAGE_TRAP_SETUP_FRO = "trapSetupFRo";
const STORAGE_TRAP_SETUP_SGA = "trapSetupSGa";
const STORAGE_TRAP_SETUP_ZTO = "trapSetupZTo";
const STORAGE_TRAP_SETUP_CLI = "trapSetupCLi";
const STORAGE_TRAP_SETUP_ICE = "trapSetupIce";
const STORAGE_TRAP_SETUP_FWA = "trapSetupFWa";
const IDX_WEAPON = 0;
const IDX_BASE = 1;
const IDX_BAIT = 2;
const IDX_TRINKET = 3;
const IDX_TOWER = 4;
const IDX_CHARM_TYPE = 4;
const IDX_SOLDIER_TYPE = 5;
const POWER_TYPE_ARCANE = "Arcane";
const POWER_TYPE_HYDRO = "Hydro";
const POWER_TYPE_PHYSICAL = "Physical";
const POWER_TYPE_TACTICAL = "Tactical";
const TRINKET_ARM = "Arm";
const TRINKET_DISARM = "Disarm";
const TRINKET_ARMING = [TRINKET_ARM, TRINKET_DISARM];
const STATUS_BEFORE = "Before";
const STATUS_AFTER = "After";
const STATUSES = [STATUS_BEFORE, STATUS_AFTER];
const STYLE_CLASS_NAME_JNK_CAPTION = "JnKCaption";
const BOT_PROCESS_POLICY = "Policy";
const BOT_PROCESS_SCHEDULER = "Scheduler";
const BOT_PROCESS_Manual = "Manual";
const BOT_STATUS_IDLE = "Idle";
const FRO_PHASE_DAY = "Day";
const FRO_PHASE_TWILIGHT = "Twilight";
const FRO_PHASE_MIDNIGHT = "Midnight";
const FRO_PHASE_PITCH = "Pitch";
const FRO_PHASE_UTTER_DARKNESS = "Utter Darkness";
const FRO_PHASE_FIRST_LIGHT = "First Light";
const FRO_PHASE_DAWN = "Dawn";
const FRO_PHASES = [FRO_PHASE_DAY, FRO_PHASE_TWILIGHT, FRO_PHASE_MIDNIGHT, FRO_PHASE_PITCH, FRO_PHASE_UTTER_DARKNESS, FRO_PHASE_FIRST_LIGHT, FRO_PHASE_DAWN];
const FRO_TOWER_HP_FULL = "HP Full";
const FRO_TOWER_ACTIVATE = "Activate";
const FRO_TOWER_DEACTIVATE = "Deactivate";
const FRO_TOWER_ACTIVATION = [FRO_TOWER_ACTIVATE, FRO_TOWER_DEACTIVATE];
const SGA_SEASON_SPRING = "Spring";
const SGA_SEASON_SUMMER = "Summer";
const SGA_SEASON_AUTUMN = "Autumn";
const SGA_SEASON_WINTER = "Winter";
const SGA_SEASONS = [SGA_SEASON_SPRING, SGA_SEASON_SUMMER, SGA_SEASON_AUTUMN, SGA_SEASON_WINTER];
const ZTO_STRATEGY_MYSTIC_ONLY = "Mystic Only";
const ZTO_STRATEGY_TECHNIC_ONLY = "Technic Only";
const ZTO_STRATEGY_MYSTIC_FIRST = "Mystic First";
const ZTO_STRATEGY_TECHNIC_FIRST = "Technic First";
const ZTO_STRATEGY = "ZTo Strategy"
const ZTO_STRATEGIES = [ZTO_STRATEGY_MYSTIC_ONLY, ZTO_STRATEGY_TECHNIC_ONLY, ZTO_STRATEGY_MYSTIC_FIRST, ZTO_STRATEGY_TECHNIC_FIRST];
const ZTO_CHESS_MYSTIC_PAWN = "Mystic Pawn";
const ZTO_CHESS_MYSTIC_KNIGHT = "Mystic Knight";
const ZTO_CHESS_MYSTIC_BISHOP = "Mystic Bishop";
const ZTO_CHESS_MYSTIC_ROOK = "Mystic Rook";
const ZTO_CHESS_MYSTIC_QUEEN = "Mystic Queen";
const ZTO_CHESS_MYSTIC_KING = "Mystic King";
const ZTO_CHESS_MYSTIC = [ZTO_CHESS_MYSTIC_PAWN, ZTO_CHESS_MYSTIC_KNIGHT, ZTO_CHESS_MYSTIC_BISHOP, ZTO_CHESS_MYSTIC_ROOK, ZTO_CHESS_MYSTIC_QUEEN, ZTO_CHESS_MYSTIC_KING];
const ZTO_CHESS_TECHNIC_PAWN = "Technic Pawn";
const ZTO_CHESS_TECHNIC_KNIGHT = "Technic Knight";
const ZTO_CHESS_TECHNIC_BISHOP = "Technic Bishop";
const ZTO_CHESS_TECHNIC_ROOK = "Technic Rook";
const ZTO_CHESS_TECHNIC_QUEEN = "Technic Queen";
const ZTO_CHESS_TECHNIC_KING = "Technic King";
const ZTO_CHESS_TECHNIC = [ZTO_CHESS_TECHNIC_PAWN, ZTO_CHESS_TECHNIC_KNIGHT, ZTO_CHESS_TECHNIC_BISHOP, ZTO_CHESS_TECHNIC_ROOK, ZTO_CHESS_TECHNIC_QUEEN, ZTO_CHESS_TECHNIC_KING];
const ZTO_CHESS_MASTER = "Chess Master";
const ZTO_CHESS_PROGRESS = [ZTO_CHESS_MYSTIC_PAWN, ZTO_CHESS_MYSTIC_KNIGHT, ZTO_CHESS_MYSTIC_BISHOP, ZTO_CHESS_MYSTIC_ROOK, ZTO_CHESS_MYSTIC_QUEEN, ZTO_CHESS_MYSTIC_KING,
                            ZTO_CHESS_TECHNIC_PAWN, ZTO_CHESS_TECHNIC_KNIGHT, ZTO_CHESS_TECHNIC_BISHOP, ZTO_CHESS_TECHNIC_ROOK, ZTO_CHESS_TECHNIC_QUEEN, ZTO_CHESS_TECHNIC_KING,
                            ZTO_CHESS_MASTER];
const CLI_CATALOG_MICE = "Catalog Mice";
const ICE_SUBLOCATION_ICEBERG_GENERAL = "Iceberg General";
const ICE_SUBLOCATION_TREACHEROUS_TUNNELS = "Treacherous Tunnels";
const ICE_SUBLOCATION_BRUTAL_BULWARK = "Brutal Bulwark";
const ICE_SUBLOCATION_BOMBING_RUN = "Bombing Run";
const ICE_SUBLOCATION_THE_MAD_DEPTHS = "The Mad Depths";
const ICE_SUBLOCATION_ICEWINGS_LAIR = "Icewing's Lair";
const ICE_SUBLOCATION_HIDDEN_DEPTHS = "Hidden Depths";
const ICE_SUBLOCATION_THE_DEEP_LAIR = "The Deep Lair";
const ICE_SUBLOCATION_SLUSHY_SHORELINE = "Slushy Shoreline";
const ICE_SUBLOCATIONS = [ICE_SUBLOCATION_ICEBERG_GENERAL, ICE_SUBLOCATION_TREACHEROUS_TUNNELS, ICE_SUBLOCATION_BRUTAL_BULWARK,
                          ICE_SUBLOCATION_BOMBING_RUN, ICE_SUBLOCATION_THE_MAD_DEPTHS, ICE_SUBLOCATION_ICEWINGS_LAIR,
                          ICE_SUBLOCATION_HIDDEN_DEPTHS, ICE_SUBLOCATION_THE_DEEP_LAIR, ICE_SUBLOCATION_SLUSHY_SHORELINE];
const FWA_WAVE1 = "Wave 1";
const FWA_WAVE2 = "Wave 2";
const FWA_WAVE3 = "Wave 3";
const FWA_WAVE4 = "Wave 4";
const FWA_WAVES = [FWA_WAVE1, FWA_WAVE2, FWA_WAVE3, FWA_WAVE4];
const FWA_POWER_TYPES = [POWER_TYPE_ARCANE, POWER_TYPE_HYDRO, POWER_TYPE_PHYSICAL, POWER_TYPE_TACTICAL];
const FWA_TARGET_POPULATION_LOWEST = "Lowest";
const FWA_TARGET_POPULATION_HIGHEST = "Highest";
const FWA_TARGET_POPULATIONS = [FWA_TARGET_POPULATION_LOWEST, FWA_TARGET_POPULATION_HIGHEST];
const FWA_POPULATION_PRIORITY = "Population Priority";
const FWA_MAX_STREAKS = 9;
const FWA_CHARM_TYPE_WARPATH = "Warpath";
const FWA_CHARM_TYPE_SUPER_WARPATH = "Super Warpath";
const FWA_CHARM_TYPES = [FWA_CHARM_TYPE_WARPATH, FWA_CHARM_TYPE_SUPER_WARPATH];
const FWA_STREAK_SOLDIER_TYPE_SOLIDER = "Soldier";
const FWA_STREAK_SOLDIER_TYPE_COMMANDER = "Commander";
const FWA_STREAK_SOLDIER_TYPE_GARGANTUA = "Gargantua";
const FWA_STREAK_SOLDIER_TYPES = [FWA_STREAK_SOLDIER_TYPE_SOLIDER, FWA_STREAK_SOLDIER_TYPE_COMMANDER, FWA_STREAK_SOLDIER_TYPE_GARGANTUA];
const FWA_LAST_SOLDIER = "Last Soldier";
const FWA_ARMING_CHARM_SUPPORT_RETREAT = "Arming Charm";
const LOCATION_HARBOUR = "Harbour";
const LOCATION_ACOLYTE_REALM = "Acolyte Realm";
const LOCATION_CLAW_SHOT_CITY = "Claw Shot City";
const LOCATION_FORT_ROX = "Fort Rox";
const LOCATION_SEASONAL_GARDEN = "Seasonal Garden";
const LOCATION_CRYSTAL_LIBRARY = "Crystal Library";
const LOCATION_ZUGZWANGS_TOWER = "Zugzwang's Tower";
const LOCATION_FIERY_WARPATH = "Fiery Warpath";
const POLICY_NAME_NONE = "None";
const POLICY_NAME_HARBOUR = "Harbour";
const POLICY_NAME_ACOLYTE_REALM = "Acolyte Realm";
const POLICY_NAME_CLAW_SHOT_CITY = "Claw Shot City";
const POLICY_NAME_FORT_ROX = "Fort Rox";
const POLICY_NAME_SEASONAL_GARDEN = "Seasonal Garden";
const POLICY_NAME_ZUGZWANGS_TOWER = "Zugzwang's Tower";
const POLICY_NAME_CRYSTAL_LIBRARY = "Crystal Library";
const POLICY_NAME_ICEBERG = "Iceberg";
const POLICY_NAME_FIERY_WARPATH = "Fiery Warpath";

// Policy description
class Policy {
    constructor() {
        this.trs = [];
    }

    setName(name) {
        this.name = name;
    }

    getTrapSetups(storageName) {
        if (isNullOrUndefined(this.trapSetups)) {
            const tmpStorage = getStorage(storageName, null);
            if (isNullOrUndefined(tmpStorage)) {
                this.resetTrapSetups();
            } else {
                this.trapSetups = tmpStorage;
            }
        }
        return this.trapSetups;
    }
    getDefaultTrapSetup(trapSetup, baitName, trinketName) {
        trapSetup[IDX_BASE] = g_bestBase;
        if ( !isNullOrUndefined(baitName)) {
            trapSetup[IDX_BAIT] = baitName;
        }
        if ( !isNullOrUndefined(trinketName)) {
            trapSetup[IDX_TRINKET] = trinketName;
        }
    }

    getArcaneTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = g_bestArcaneWeapon;
    }

    getDraconicTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = g_bestDraconicWeapon;
    }

    getForgottenTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = g_bestForgottenWeapon;
    }

    getHydroTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = g_bestHydroWeapon;
    }

    getLawTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = g_bestLawWeapon;
    }

    getPhysicalTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = g_bestPhysicalWeapon;
    }

    getRiftTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = g_bestRiftWeapon;
    }

    getShadowTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = g_bestShadowWeapon;
    }

    getTacticalTrapSetup(trapSetup, baitName, trinketName) {
        this.getDefaultTrapSetup(trapSetup, baitName, trinketName);
        trapSetup[IDX_WEAPON] = g_bestTacticalWeapon;
    }
}

class PolicyARe extends Policy {
    constructor () {
        super();
        this.setName(POLICY_NAME_ACOLYTE_REALM);
        this.trs[0] = ID_TR_ARE_TRAP_SETUP;
    }

    resetTrapSetups() {
        this.trapSetups = [];
    }

    getTrapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_ARE);
    }

    initSelectTrapSetup() {
        const trapSetups = this.getTrapSetups();
        document.getElementById(ID_SELECT_ARE_WEAPON).value = trapSetups[IDX_WEAPON];
        document.getElementById(ID_SELECT_ARE_BASE).value = trapSetups[IDX_BASE];
        document.getElementById(ID_SELECT_ARE_BAIT).value = trapSetups[IDX_BAIT];
        document.getElementById(ID_SELECT_ARE_TRINKET).value = trapSetups[IDX_TRINKET];
    }

    recommendTrapSetup() {
        const trapSetups = this.getTrapSetups();
        if (g_baitNames.includes(BAIT_RUNIC)) {
            this.getForgottenTrapSetup(trapSetups, BAIT_RUNIC);
        } else {
            this.getArcaneTrapSetup(trapSetups);
        }
        this.initSelectTrapSetup();
    }
}

class PolicyFRo extends Policy {
    constructor () {
        super();
        this.setName(POLICY_NAME_FORT_ROX);
        this.trs[0] = ID_TR_FRO_PHASES_TRAP_SETUP;
        this.trs[1] = ID_TR_FRO_TOWER_HP_FULL;
    }

    resetTrapSetups() {
        this.trapSetups = {};
        for (const phase of FRO_PHASES){
            this.trapSetups[phase] = [];
        }
        this.trapSetups[FRO_TOWER_HP_FULL] = FRO_TOWER_DEACTIVATE;
    }

    getTrapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_FRO);
    }

    initSelectTrapSetup() {
        const trapSetups = this.getTrapSetups();
        const currentPhase = document.getElementById(ID_SELECT_FRO_PHASE).value;
        document.getElementById(ID_SELECT_FRO_WEAPON).value = trapSetups[currentPhase][IDX_WEAPON];
        document.getElementById(ID_SELECT_FRO_BASE).value = trapSetups[currentPhase][IDX_BASE];
        document.getElementById(ID_SELECT_FRO_BAIT).value = trapSetups[currentPhase][IDX_BAIT];
        document.getElementById(ID_SELECT_FRO_TRINKET).value = trapSetups[currentPhase][IDX_TRINKET];
        if (isNullOrUndefined(trapSetups[currentPhase][IDX_TOWER])) {
            trapSetups[currentPhase][IDX_TOWER] = FRO_TOWER_DEACTIVATE;
        }
        document.getElementById(ID_SELECT_FRO_TOWER).value = trapSetups[currentPhase][IDX_TOWER];
        document.getElementById(ID_SELECT_FRO_ACTIVATION_HP_FULL).value = trapSetups[FRO_TOWER_HP_FULL];
    }

    recommendTrapSetup() {
        const trapSetups = this.getTrapSetups();
        const brieCheese = g_baitNames.includes(BAIT_BRIE)? BAIT_BRIE: undefined;
        const baitName = g_baitNames.includes(BAIT_MOON)? BAIT_MOON: g_baitNames.includes(BAIT_CRESCENT)? BAIT_CRESCENT: undefined;
        this.getLawTrapSetup(trapSetups[FRO_PHASE_DAY], brieCheese);
        this.getShadowTrapSetup(trapSetups[FRO_PHASE_TWILIGHT], baitName);
        this.getShadowTrapSetup(trapSetups[FRO_PHASE_MIDNIGHT], baitName);
        this.getArcaneTrapSetup(trapSetups[FRO_PHASE_PITCH], baitName);
        this.getArcaneTrapSetup(trapSetups[FRO_PHASE_UTTER_DARKNESS], baitName);
        this.getArcaneTrapSetup(trapSetups[FRO_PHASE_FIRST_LIGHT], baitName);
        this.getArcaneTrapSetup(trapSetups[FRO_PHASE_DAWN], baitName);
        this.initSelectTrapSetup();
    }
}

class PolicySGa extends Policy {
    constructor () {
        super();
        this.setName(POLICY_NAME_SEASONAL_GARDEN);
        this.trs[0] = ID_TR_SGA_SEASONS_TRAP_SETUP;
    }

    resetTrapSetups() {
        this.trapSetups = {};
        for (const season of SGA_SEASONS){
            this.trapSetups[season] = [];
        }
    }

    getTrapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_SGA);
    }

    initSelectTrapSetup() {
        const trapSetups = this.getTrapSetups();
        const currentSeason = document.getElementById(ID_SELECT_SGA_SEASON).value;
        document.getElementById(ID_SELECT_SGA_WEAPON).value = trapSetups[currentSeason][IDX_WEAPON];
        document.getElementById(ID_SELECT_SGA_BASE).value = trapSetups[currentSeason][IDX_BASE];
        document.getElementById(ID_SELECT_SGA_BAIT).value = trapSetups[currentSeason][IDX_BAIT];
        document.getElementById(ID_SELECT_SGA_TRINKET).value = trapSetups[currentSeason][IDX_TRINKET];
    }

    recommendTrapSetup() {
        const trapSetups = this.getTrapSetups();
        const baitName = g_baitNames.includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;
        this.getPhysicalTrapSetup(trapSetups[SGA_SEASON_SPRING], baitName);
        this.getTacticalTrapSetup(trapSetups[SGA_SEASON_SUMMER], baitName);
        this.getShadowTrapSetup(trapSetups[SGA_SEASON_AUTUMN], baitName);
        this.getHydroTrapSetup(trapSetups[SGA_SEASON_WINTER], baitName);
        this.initSelectTrapSetup();
    }
}

class PolicyZTo extends Policy {
    constructor () {
        super();
        this.setName(POLICY_NAME_ZUGZWANGS_TOWER);
        this.trs[0] = ID_TR_ZTO_STRATEGY;
        this.trs[1] = ID_TR_ZTO_CHESS_TRAP_SETUP;
    }

    resetTrapSetups() {
        this.trapSetups = {};
        for (const chessPiece of ZTO_CHESS_PROGRESS){
            this.trapSetups[chessPiece] = [];
        }
        this.trapSetups[ZTO_STRATEGY] = ZTO_STRATEGY_MYSTIC_ONLY;
    }

    getTrapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_ZTO);
    }

    initSelectTrapSetup() {
        const trapSetups = this.getTrapSetups();
        const currentChess = document.getElementById(ID_SELECT_ZTO_CHESS).value;
        document.getElementById(ID_SELECT_ZTO_WEAPON).value = trapSetups[currentChess][IDX_WEAPON];
        document.getElementById(ID_SELECT_ZTO_BASE).value = trapSetups[currentChess][IDX_BASE];
        document.getElementById(ID_SELECT_ZTO_BAIT).value = trapSetups[currentChess][IDX_BAIT];
        document.getElementById(ID_SELECT_ZTO_TRINKET).value = trapSetups[currentChess][IDX_TRINKET];
        document.getElementById(ID_SELECT_ZTO_STRATEGY).value = trapSetups[ZTO_STRATEGY];
    }

    recommendTrapSetup() {
        function getZToTrapSetup(trapSetup, weaponName, baseName, baitName, trinketName) {
            trapSetup[IDX_WEAPON] = weaponName;
            trapSetup[IDX_BASE] = baseName;
            trapSetup[IDX_BAIT] = baitName;
            trapSetup[IDX_TRINKET] = trinketName;
        }

        const trapSetups = this.getTrapSetups();
        const mysticPawnWeapon = g_weaponNames.includes(WEAPON_MYSTIC_PAWN_PINCHER)? WEAPON_MYSTIC_PAWN_PINCHER: g_bestTacticalWeapon;
        const mysticOnlyWeapon = g_weaponNames.includes(WEAPON_BLACKSTONE_PASS)? WEAPON_BLACKSTONE_PASS: g_bestTacticalWeapon;
        const technicPawnWeapon = g_weaponNames.includes(WEAPON_TECHNIC_PAWN_PINCHER)? WEAPON_TECHNIC_PAWN_PINCHER: g_bestTacticalWeapon;
        const technicOnlyWeapon = g_weaponNames.includes(WEAPON_OBVIOUS_AMBUSH)? WEAPON_OBVIOUS_AMBUSH: g_bestTacticalWeapon;
        const attractionBase = g_baseNames.includes(BASE_CHEESECAKE)? BASE_CHEESECAKE: g_baseNames.includes(BASE_WOODEN_BASE_WITH_TARGET)? BASE_WOODEN_BASE_WITH_TARGET: g_bestBase;
        const attractionCharm = g_trinketNames.includes(TRINKET_VALENTINE)? TRINKET_VALENTINE: g_trinketNames.includes(TRINKET_ATTRACTION)? TRINKET_ATTRACTION: undefined;
        const powerCharm = g_trinketNames.includes(TRINKET_POWER)? TRINKET_POWER: attractionCharm;
        const rookCrumbleCharm = g_trinketNames.includes(TRINKET_ROOK_CRUMBLE)? TRINKET_ROOK_CRUMBLE: powerCharm;
        const checkmateCheese = g_baitNames.includes(BAIT_CHECKMATE)? BAIT_CHECKMATE: undefined;
        const baitName = g_baitNames.includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;

        getZToTrapSetup(trapSetups[ZTO_CHESS_MYSTIC_PAWN], mysticPawnWeapon, attractionBase, baitName, attractionCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_MYSTIC_KNIGHT], mysticOnlyWeapon, g_bestBase, baitName, powerCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_MYSTIC_BISHOP], mysticOnlyWeapon, g_bestBase, baitName, powerCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_MYSTIC_ROOK], mysticOnlyWeapon, g_bestBase, baitName, rookCrumbleCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_MYSTIC_QUEEN], mysticOnlyWeapon, g_bestBase, baitName, powerCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_MYSTIC_KING], mysticOnlyWeapon, attractionBase, baitName, attractionCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_TECHNIC_PAWN], technicPawnWeapon, attractionBase, baitName, attractionCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_TECHNIC_KNIGHT], technicOnlyWeapon, g_bestBase, baitName, powerCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_TECHNIC_BISHOP], technicOnlyWeapon, g_bestBase, baitName, powerCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_TECHNIC_ROOK], technicOnlyWeapon, g_bestBase, baitName, rookCrumbleCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_TECHNIC_QUEEN], technicOnlyWeapon, g_bestBase, baitName, powerCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_TECHNIC_KING], technicOnlyWeapon, attractionBase, baitName, attractionCharm);
        getZToTrapSetup(trapSetups[ZTO_CHESS_MASTER], g_bestTacticalWeapon, g_bestBase, checkmateCheese, powerCharm);
        this.initSelectTrapSetup();
    }
}

class PolicyCLi extends Policy {
    constructor () {
        super();
        this.setName(POLICY_NAME_CRYSTAL_LIBRARY);
        this.trs[0] = ID_TR_CLI_CATALOG_MICE;
    }

    resetTrapSetups() {
        this.trapSetups = {};
        this.trapSetups[CLI_CATALOG_MICE] = false;
    }

    getTrapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_CLI);
    }

    initSelectTrapSetup() {
        const trapSetups = this.getTrapSetups();
        document.getElementById(ID_CHECKBOX_CLI_CATALOG_MICE).checked = trapSetups[CLI_CATALOG_MICE];
    }
}

class PolicyIce extends Policy {
    constructor () {
        super();
        this.setName(POLICY_NAME_ICEBERG);
        this.trs[0] = ID_TR_ICE_SUBLOCATIONS_TRAP_SETUP;
    }

    resetTrapSetups() {
        this.trapSetups = {};
        for (const sublocation of ICE_SUBLOCATIONS){
            this.trapSetups[sublocation] = [];
        }
    }

    getTrapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_ICE);
    }

    initSelectTrapSetup() {
        const trapSetups = this.getTrapSetups();
        const sublocation = document.getElementById(ID_SELECT_ICE_SUBLOCATION).value;
        document.getElementById(ID_SELECT_ICE_WEAPON).value = trapSetups[sublocation][IDX_WEAPON];
        document.getElementById(ID_SELECT_ICE_BASE).value = trapSetups[sublocation][IDX_BASE];
        document.getElementById(ID_SELECT_ICE_BAIT).value = trapSetups[sublocation][IDX_BAIT];
        document.getElementById(ID_SELECT_ICE_TRINKET).value = trapSetups[sublocation][IDX_TRINKET];
    }

    recommendTrapSetup() {
        function getIceTrapSetup(trapSetup, baseName, baitName, trinketName) {
            trapSetup[IDX_WEAPON] = weaponName;
            trapSetup[IDX_BASE] = baseName;
            trapSetup[IDX_BAIT] = baitName;
            trapSetup[IDX_TRINKET] = trinketName;
        }

        const trapSetups = this.getTrapSetups();
        const deepFreezeBase = g_baseNames.includes(BASE_DEEP_FREEZE)? BASE_DEEP_FREEZE: g_bestBase;
        const hearthstoneBase = g_baseNames.includes(BASE_HEARTHSTONE)? BASE_HEARTHSTONE: g_bestBase;
        const magnetBase = g_baseNames.includes(BASE_MAGNET)? BASE_MAGNET: g_bestBase;
        const remoteDetonatorBase = g_baseNames.includes(BASE_REMOTE_DETONATOR)? BASE_REMOTE_DETONATOR: g_bestBase;
        const spikedBase = g_baseNames.includes(BASE_SPIKED)? BASE_SPIKED: g_bestBase;
        const brieCheese = g_baitNames.includes(BAIT_BRIE)? BAIT_BRIE: undefined;
        const powerCharm = g_trinketNames.includes(TRINKET_POWER)? TRINKET_POWER: undefined;
        const stickyCharm = g_trinketNames.includes(TRINKET_STICKY)? TRINKET_STICKY: undefined;
        const waxCharm = g_trinketNames.includes(TRINKET_WAX)? TRINKET_WAX: undefined;
        const weaponName = (g_weaponNames.includes(WEAPON_STEAM_LASER_MK_III) && g_bestHydroWeapon == WEAPON_OASIS_WATER_NODE)? WEAPON_STEAM_LASER_MK_III: g_bestHydroWeapon;
        const baitName = g_baitNames.includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;
        const trinketName = g_weaponNames.indexOf(g_bestHydroWeapon) < 2? waxCharm: stickyCharm;

        getIceTrapSetup(trapSetups[ICE_SUBLOCATION_ICEBERG_GENERAL], g_bestBase, baitName, powerCharm);
        getIceTrapSetup(trapSetups[ICE_SUBLOCATION_TREACHEROUS_TUNNELS], magnetBase, baitName, trinketName);
        getIceTrapSetup(trapSetups[ICE_SUBLOCATION_BRUTAL_BULWARK], spikedBase, baitName, trinketName);
        getIceTrapSetup(trapSetups[ICE_SUBLOCATION_BOMBING_RUN], remoteDetonatorBase, baitName, trinketName);
        getIceTrapSetup(trapSetups[ICE_SUBLOCATION_THE_MAD_DEPTHS], hearthstoneBase, baitName, trinketName);
        getIceTrapSetup(trapSetups[ICE_SUBLOCATION_ICEWINGS_LAIR], deepFreezeBase, baitName, powerCharm);
        getIceTrapSetup(trapSetups[ICE_SUBLOCATION_HIDDEN_DEPTHS], g_bestBase, baitName, powerCharm);
        getIceTrapSetup(trapSetups[ICE_SUBLOCATION_THE_DEEP_LAIR], g_bestBase, baitName, powerCharm);
        getIceTrapSetup(trapSetups[ICE_SUBLOCATION_SLUSHY_SHORELINE], g_bestBase, brieCheese, powerCharm);
        this.initSelectTrapSetup();
    }
}

class PolicyFWa extends Policy {
    constructor () {
        super();
        this.setName(POLICY_NAME_FIERY_WARPATH);
        this.trs[0] = ID_TR_SELECT_FWA_WAVE;
        this.trs[1] = ID_TR_FWA_POWER_TYPES_TRAP_SETUP;
        this.trs[2] = ID_TR_SELECT_FWA_TARGET_POPULATION;
        this.trs[3] = ID_TR_FWA_STREAKS_TRAP_SETUP;
        this.trs[4] = ID_TR_FWA_LAST_SOLDIER_TRAP_SETUP;
        this.trs[5] = ID_TR_FWA_WHEN_SUPPORT_RETREAT;
        this.trs[6] = ID_TR_FWA_WAVE4_TRAP_SETUP;
    }

    resetTrapSetups() {
        this.trapSetups = {};
        for (const powerType of FWA_POWER_TYPES){
            this.trapSetups[powerType] = [];
        }
        this.trapSetups[FWA_LAST_SOLDIER] = [];
        this.trapSetups[FWA_ARMING_CHARM_SUPPORT_RETREAT] = TRINKET_DISARM;
        for (const wave of FWA_WAVES){
            this.trapSetups[wave] = {};
            if (wave == FWA_WAVE4) {
                this.trapSetups[wave][STATUS_BEFORE] = [];
                this.trapSetups[wave][STATUS_AFTER] = [];
            } else {
                for (let steak = 0; steak <= FWA_MAX_STREAKS; steak++) {
                    this.trapSetups[wave][steak] = [];
                }
                this.trapSetups[wave][FWA_POPULATION_PRIORITY] = FWA_TARGET_POPULATION_LOWEST;
            }
        }
    }

    getTrapSetups() {
        return super.getTrapSetups(STORAGE_TRAP_SETUP_FWA);
    }

    initSelectTrapSetup() {
        function hideShowFWaRows() {
            const currentWave = document.getElementById(ID_SELECT_FWA_WAVE).value;
            const WAVE4_DISPLAY = currentWave == FWA_WAVE4? "table-row": "none";
            const WAVE123_DISPLAY = currentWave == FWA_WAVE4? "none": "table-row";
            for (const tr of POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trs){
                if (tr == ID_TR_SELECT_FWA_WAVE) {
                    continue;
                }
                document.getElementById(tr).style.display = tr == ID_TR_FWA_WAVE4_TRAP_SETUP? WAVE4_DISPLAY : WAVE123_DISPLAY;
            }
        }

        const trapSetups = this.getTrapSetups();
        const currentPowerType = document.getElementById(ID_SELECT_FWA_POWER_TYPE).value;
        document.getElementById(ID_SELECT_FWA_SOLDIER_WEAPON).value = trapSetups[currentPowerType][IDX_WEAPON];
        document.getElementById(ID_SELECT_FWA_SOLDIER_BASE).value = trapSetups[currentPowerType][IDX_BASE];
        document.getElementById(ID_SELECT_FWA_LAST_SOLDIER_BAIT).value = trapSetups[FWA_LAST_SOLDIER][IDX_BAIT];
        document.getElementById(ID_SELECT_FWA_LAST_SOLDIER_CHARM_TYPE).value = trapSetups[FWA_LAST_SOLDIER][IDX_CHARM_TYPE];
        document.getElementById(ID_SELECT_FWA_ARMING_WARPATH_CHARM).value = trapSetups[FWA_ARMING_CHARM_SUPPORT_RETREAT];
        const currentWave = document.getElementById(ID_SELECT_FWA_WAVE).value;
        if (currentWave == FWA_WAVE4) {
            const currentStatus = document.getElementById(ID_SELECT_FWA_BEFORE_AFTER_WARDENS).value;
            document.getElementById(ID_SELECT_FWA_WAVE4_WEAPON).value = trapSetups[currentWave][currentStatus][IDX_WEAPON];
            document.getElementById(ID_SELECT_FWA_WAVE4_BASE).value = trapSetups[currentWave][currentStatus][IDX_BASE];
            document.getElementById(ID_SELECT_FWA_WAVE4_BAIT).value = trapSetups[currentWave][currentStatus][IDX_BAIT];
            document.getElementById(ID_SELECT_FWA_WAVE4_TRINKET).value = trapSetups[currentWave][currentStatus][IDX_TRINKET];
        } else {
            const currentSteak = document.getElementById(ID_SELECT_FWA_STREAK).value;
            document.getElementById(ID_SELECT_FWA_STREAK_BAIT).value = trapSetups[currentWave][currentSteak][IDX_BAIT];
            document.getElementById(ID_SELECT_FWA_STREAK_CHARM_TYPE).value = trapSetups[currentWave][currentSteak][IDX_CHARM_TYPE];
            document.getElementById(ID_SELECT_FWA_STREAK_SOLDIER_TYPE).value = trapSetups[currentWave][currentSteak][IDX_SOLDIER_TYPE];
            document.getElementById(ID_SELECT_FWA_TARGET_POPULATION).value = trapSetups[currentWave][FWA_POPULATION_PRIORITY];
        }
        hideShowFWaRows();
    }

    recommendTrapSetup() {
        /*
                for (const powerType of FWA_POWER_TYPES){
            this.trapSetups[powerType] = [];
        }
        this.trapSetups[FWA_LAST_SOLDIER] = [];
        this.trapSetups[FWA_ARMING_CHARM_SUPPORT_RETREAT] = TRINKET_DISARM;
        for (const wave of FWA_WAVES){
            this.trapSetups[wave] = {};
            if (wave == FWA_WAVE4) {
                this.trapSetups[wave][STATUS_BEFORE] = [];
                this.trapSetups[wave][STATUS_AFTER] = [];
            } else {
                for (let steak = 0; steak <= FWA_MAX_STREAKS; steak++) {
                    this.trapSetups[wave][steak] = [];
                }
                this.trapSetups[wave][FWA_POPULATION_PRIORITY] = FWA_TARGET_POPULATION_LOWEST;
            }
        }
        const FWA_STREAK_SOLDIER_TYPE_SOLIDER = "Soldier";
const FWA_STREAK_SOLDIER_TYPE_COMMANDER = "Commander";
const FWA_STREAK_SOLDIER_TYPE_GARGANTUA = "Gargantua";
const FWA_TARGET_POPULATION_LOWEST = "Lowest";
const FWA_TARGET_POPULATION_HIGHEST = "Highest";
const FWA_TARGET_POPULATIONS = [FWA_TARGET_POPULATION_LOWEST, FWA_TARGET_POPULATION_HIGHEST];
const FWA_POPULATION_PRIORITY = "Population Priority";
const FWA_MAX_STREAKS = 9;
const FWA_CHARM_TYPE_WARPATH = "Warpath";
const FWA_CHARM_TYPE_SUPER_WARPATH = "Super Warpath";
*/
        const trapSetups = this.getTrapSetups();
        const baitName = g_baitNames.includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;
        trapSetups[POWER_TYPE_ARCANE][IDX_WEAPON] = g_bestArcaneWeapon;
        trapSetups[POWER_TYPE_ARCANE][IDX_BASE] = g_bestBase;
        trapSetups[POWER_TYPE_HYDRO][IDX_WEAPON] = g_bestHydroWeapon;
        trapSetups[POWER_TYPE_HYDRO][IDX_BASE] = g_bestBase;
        trapSetups[POWER_TYPE_PHYSICAL][IDX_WEAPON] = g_bestPhysicalWeapon;
        trapSetups[POWER_TYPE_PHYSICAL][IDX_BASE] = g_bestBase;
        trapSetups[POWER_TYPE_TACTICAL][IDX_WEAPON] = g_bestTacticalWeapon;
        trapSetups[POWER_TYPE_TACTICAL][IDX_BASE] = g_bestBase;
        trapSetups[FWA_LAST_SOLDIER][IDX_BAIT] = baitName;
        trapSetups[FWA_LAST_SOLDIER][IDX_CHARM_TYPE] = TRINKET_DISARM;
        for (const wave of FWA_WAVES){
            if (wave == FWA_WAVE4) {
                for (const status of STATUSES){
                    trapSetups[wave][status][IDX_WEAPON] = g_bestPhysicalWeapon;
                    trapSetups[wave][status][IDX_BASE] = g_bestBase;
                    trapSetups[wave][status][IDX_BAIT] = baitName;
                }
            } else {
                if (wave == FWA_WAVE3) {
                    trapSetups[wave][FWA_POPULATION_PRIORITY] = FWA_TARGET_POPULATION_HIGHEST;
                    for (let steak = 0; steak <= FWA_MAX_STREAKS; steak++) {
                        trapSetups[wave][steak][IDX_BAIT] = baitName;
                        if (steak > 5) {
                            trapSetups[wave][steak][IDX_CHARM_TYPE] = FWA_CHARM_TYPE_SUPER_WARPATH;
                            trapSetups[wave][steak][IDX_SOLDIER_TYPE] = FWA_STREAK_SOLDIER_TYPE_COMMANDER;
                        } else if (steak > 2) {
                            trapSetups[wave][steak][IDX_CHARM_TYPE] = FWA_CHARM_TYPE_SUPER_WARPATH;
                            trapSetups[wave][steak][IDX_SOLDIER_TYPE] = FWA_STREAK_SOLDIER_TYPE_SOLIDER;
                        } else {
                            trapSetups[wave][steak][IDX_CHARM_TYPE] = FWA_CHARM_TYPE_WARPATH;
                            trapSetups[wave][steak][IDX_SOLDIER_TYPE] = FWA_STREAK_SOLDIER_TYPE_SOLIDER;
                        }
                    }
                } else {
                    trapSetups[wave][FWA_POPULATION_PRIORITY] = FWA_TARGET_POPULATION_LOWEST;
                    for (let steak = 0; steak <= FWA_MAX_STREAKS; steak++) {
                        trapSetups[wave][steak][IDX_BAIT] = baitName;
                        trapSetups[wave][steak][IDX_CHARM_TYPE] = FWA_CHARM_TYPE_WARPATH;
                        trapSetups[wave][steak][IDX_SOLDIER_TYPE] = FWA_STREAK_SOLDIER_TYPE_SOLIDER;
                    }
                }
            }
        }
        this.initSelectTrapSetup();
        /*
        const trapSetups = this.getTrapSetups();
        const baitName = g_baitNames.includes(BAIT_GOUDA)? BAIT_GOUDA: undefined;
        this.getPhysicalTrapSetup(trapSetups[SGA_SEASON_SPRING], baitName);
        this.getTacticalTrapSetup(trapSetups[SGA_SEASON_SUMMER], baitName);
        this.getShadowTrapSetup(trapSetups[SGA_SEASON_AUTUMN], baitName);
        this.getHydroTrapSetup(trapSetups[SGA_SEASON_WINTER], baitName);
        this.initSelectTrapSetup();
        */
    }
}

const POLICY_DICT = {};
function initPolicyDict() {
    POLICY_DICT[POLICY_NAME_ACOLYTE_REALM] = new PolicyARe();
    POLICY_DICT[POLICY_NAME_FORT_ROX] = new PolicyFRo();
    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN] = new PolicySGa();
    POLICY_DICT[POLICY_NAME_ZUGZWANGS_TOWER] = new PolicyZTo();
    POLICY_DICT[POLICY_NAME_CRYSTAL_LIBRARY] = new PolicyCLi();
    POLICY_DICT[POLICY_NAME_ICEBERG] = new PolicyIce();
    POLICY_DICT[POLICY_NAME_FIERY_WARPATH] = new PolicyFWa();
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
        updateNextBotHornTimeTxt(strTemp);
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
        initPolicyDict();
        setBotDocumentStyle();
        loadPreferenceSettingFromStorage();
        rankWeapons();
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

    const krDelaySec = g_autosolveKRDelayMin + Math.floor(Math.random() * (g_autosolveKRDelayMax - g_autosolveKRDelayMin));

    kingRewardCountdownTimer(krDelaySec);
}

function kingRewardCountdownTimer(krDelaySec) {
    const strTemp = "Solve KR in " + timeFormat(krDelaySec) + " second(s)";
    updateTitleTxt(strTemp);
    updateNextBotHornTimeTxt(strTemp);
    //updateNextTrapCheckTimeTxt(strTemp);
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

function runScheduledGiftsAndRaffles() {
    function getGiftsAndRafflesStatus() {
        function gettingGiftsAndRafflesStatus() {
            const sendActionRemaining = parseInt(document.getElementsByClassName("giftSelectorView-numSendActionsRemaining")[0].innerHTML);
            if (sendActionRemaining <= 1) {
                g_statusGiftsAndRaffles = STATUS_GIFTS_AND_RAFFLES_COMPLETE;
                setStorage(STORAGE_STATUS_GIFTS_AND_RAFFLES, g_statusGiftsAndRaffles);
            }
        }
        const giftButton = document.getElementsByClassName("freeGifts")[0];
        fireEvent(giftButton, "click");
        window.setTimeout(function () {
            gettingGiftsAndRafflesStatus()
        }, 4.5 * 1000);
    }
    if (!lockBot(BOT_PROCESS_SCHEDULER)) {
        return;
    }
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
    if (!lockBot(BOT_PROCESS_SCHEDULER)) {
        return;
    }
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
    const dateNow = new Date();
    const g_endScheduledResetTime = new Date();
    g_endScheduledResetTime.setHours(g_beginScheduledResetTime.getHours(), g_beginScheduledResetTime.getMinutes() + 1, 0);

    if (g_beginScheduledResetTime < dateNow && g_endScheduledResetTime > dateNow) {
        resetSchedule();
    } else if (g_beginScheduledGiftsAndRafflesTime < dateNow && g_statusGiftsAndRaffles == STATUS_GIFTS_AND_RAFFLES_INCOMPLETE) {
        runScheduledGiftsAndRaffles();
    }
}

function countdownBotHornTimer() {
    // Update timer
    const dateNow = new Date();
    const intervalTime = timeElapsedInSeconds(g_lastBotHornTimeRecorded, dateNow);
    g_lastBotHornTimeRecorded = undefined;
    g_lastBotHornTimeRecorded = dateNow;

    g_nextBotHornTimeInSeconds -= intervalTime;

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
}

function countdownTrapCheckTimer() {
    // Update timer
    const dateNow = new Date();
    const intervalTime = timeElapsedInSeconds(g_lastTrapCheckTimeRecorded, dateNow);
    g_lastTrapCheckTimeRecorded = dateNow;

    g_nextTrapCheckTimeInSeconds -= intervalTime;

    if (g_nextTrapCheckTimeInSeconds <= 0) {
        trapCheck();
    } else {
        checkLocation();
        updateNextTrapCheckTimeTxt(timeFormat(g_nextTrapCheckTimeInSeconds) + "  <i>(including " + timeFormat(g_nextTrapCheckTimeDelayInSeconds) + " delay)</i>");

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
                updateNextBotHornTimeTxt("KR found. Prepare to Solve...");
                window.setTimeout(function () {
                    reloadCampPage()
                }, 0.5 * 1000);
            }
        }

        if (DEBUG_MODE) console.log("RUN %cafterSoundingHorn()", "color: #bada55");
        checkKRPrompt();
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

    const hornElement = document.getElementsByClassName(CLASS_HUNTERHORN_ELEMENT)[0].firstChild;
    fireEvent(hornElement, 'click');

    // double check if the horn was already sounded
    /*
    window.setTimeout(function () {
        afterSoundingHorn()
    }, 4000);
    */
    window.setTimeout(function () {
        afterSoundingHorn()
    }, 2000);
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

    const evt = document.createEvent("HTMLEvents");
    evt.initEvent(event, true, true);

    return !element.dispatchEvent(evt);
}

function updateTitleTxt(titleTxt) {
    document.title = titleTxt;
}

function updateNextBotHornTimeTxt(nextHornTimeTxt) {
    g_nextBotHornTimeDisplay.innerHTML = nextHornTimeTxt;
}

function updateNextTrapCheckTimeTxt(trapCheckTimeTxt) {
    g_nextTrapCheckTimeDisplay.innerHTML = trapCheckTimeTxt;
}
/*
function updateUI(titleTxt, nextHornTimeTxt, trapCheckTimeTxt) {
    updateTitleTxt(titleTxt);
    updateNextBotHornTimeTxt(nextHornTimeTxt);
    updateNextTrapCheckTimeTxt(trapCheckTimeTxt);
}
*/
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

function rankWeapons() {
    function getBestWeapon(BestWeapons) {
        for (const weaponName of BestWeapons){
            if (g_weaponNames.includes(weaponName)) {
                return weaponName;
            }
        }
    }

    const hunterTitle = getPageVariable("user.title_name");
    if (HUNTER_TITLES.indexOf(hunterTitle) > 16 && g_baseNames.includes(BASE_THIEF)) {
        g_bestBase = BASE_THIEF;
    } else {
        for (const baseName of BEST_BASES){
            if (g_baseNames.includes(baseName)) {
                g_bestBase = baseName;
                break;
            }
        }
    }
    g_bestArcaneWeapon = getBestWeapon(BEST_ARCANE_WEAPONS);
    g_bestDraconicWeapon = getBestWeapon(BEST_DRACONIC_WEAPONS);
    g_bestForgottenWeapon = getBestWeapon(BEST_FORGOTTEN_WEAPONS);
    g_bestHydroWeapon = getBestWeapon(BEST_HYDRO_WEAPONS);
    g_bestLawWeapon = getBestWeapon(BEST_LAW_WEAPONS);
    g_bestPhysicalWeapon = getBestWeapon(BEST_PHYSICAL_WEAPONS);
    g_bestRiftWeapon = getBestWeapon(BEST_RIFT_WEAPONS);
    g_bestShadowWeapon = getBestWeapon(BEST_SHADOW_WEAPONS);
    g_bestTacticalWeapon = getBestWeapon(BEST_TACTICAL_WEAPONS);
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
    // This function is to retrieve data from camp page that is actively changed, including
    // - next horn time
    // - king reward
    // - bait quantity
    if (DEBUG_MODE) console.log('RUN retrieveCampActiveData()');

    // Set time stamp for when the other time stamps are queried
    g_lastBotHornTimeRecorded = new Date();

    // Get MH horn time and use it to calculate next bot horn time
    const nextMHHornTimeInSeconds = parseInt(getPageVariable(USER_NEXT_ACTIVETURN_SECONDS));
    g_botHornTimeDelayInSeconds = g_botHornTimeDelayMin + Math.round(Math.random() * (g_botHornTimeDelayMax - g_botHornTimeDelayMin));
    g_nextBotHornTimeInSeconds = nextMHHornTimeInSeconds + g_botHornTimeDelayInSeconds;
    if (g_nextBotHornTimeInSeconds <= 0){
        alert("g_nextActiveTime <= 0");
        // K_Todo_014
        //eventLocationCheck();
    }
    const trapCheckTimeOffsetInSeconds = getTrapCheckTime() * 60;
    const now = new Date();
    g_nextTrapCheckTimeInSeconds = trapCheckTimeOffsetInSeconds - (now.getMinutes() * 60 + now.getSeconds());
    g_nextTrapCheckTimeDelayInSeconds = g_trapCheckTimeDelayMin + Math.round(Math.random() * (g_trapCheckTimeDelayMax - g_trapCheckTimeDelayMin));
    g_nextTrapCheckTimeInSeconds = (g_nextTrapCheckTimeInSeconds <= 0) ? 3600 + g_nextTrapCheckTimeInSeconds : g_nextTrapCheckTimeInSeconds;
    g_nextTrapCheckTimeInSeconds += g_nextTrapCheckTimeDelayInSeconds;

    // Check if there is King Reward ongoing
    g_isKingReward = getPageVariable(USER_HAS_PUZZLE);

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
        return null;
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

    function armTraps(trapSetup) {
        function getCurrentWeapon() {
            return document.getElementById("campPage-trap-armedItem-floatingTooltip-weapon").innerHTML;
        }

        function getCurrentBase() {
            return document.getElementById("campPage-trap-armedItem-floatingTooltip-base").innerHTML;
        }

        function getCurrentBait() {
            return document.getElementsByClassName("campPage-trap-baitName")[0].innerHTML;
        }

        function getCurrentTrinket() {
            return document.getElementById("campPage-trap-armedItem-floatingTooltip-trinket").innerHTML;
        }

        function armWeapon(policyWeaponName) {
            function armingWeapon(policyWeaponName) {
                const camppageWeapons = document.getElementsByClassName('campPage-trap-itemBrowser-item weapon');
                for (let i = 0; i < camppageWeapons.length; ++i) {
                    const camppageWeaponName = camppageWeapons[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                    if (camppageWeaponName == policyWeaponName) {
                        const armButton = camppageWeapons[i].getElementsByClassName("campPage-trap-itemBrowser-item-armButton ")[0];
                        fireEvent(armButton, 'click');
                    }
                }
                document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Arming Weapon";;
            }
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Policy arming Weapon";
            const currentWeapon = document.getElementsByClassName('campPage-trap-armedItem weapon')[0];
            fireEvent(currentWeapon, 'click');
            window.setTimeout(function () {
                armingWeapon(policyWeaponName);
            }, 4.5 * 1000);
        }

        function armBase(policyBaseName) {
            function armingBase(policyBaseName) {
                const camppageBases = document.getElementsByClassName('campPage-trap-itemBrowser-item base');
                for (let i = 0; i < camppageBases.length; ++i) {
                    const camppageBaseName = camppageBases[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                    if (camppageBaseName == policyBaseName) {
                        const armButton = camppageBases[i].getElementsByClassName("campPage-trap-itemBrowser-item-armButton ")[0];
                        fireEvent(armButton, 'click');
                    }
                }
                document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Arming Base";;
            }
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Policy arming Base";
            const currentBase = document.getElementsByClassName('campPage-trap-armedItem base')[0];
            fireEvent(currentBase, 'click');
            window.setTimeout(function () {
                armingBase(policyBaseName);
            }, 4.5 * 1000);
        }

        function armBait(policyBaitName) {
            function armingBait(policyBaitName) {
                const camppageBaits = document.getElementsByClassName('campPage-trap-itemBrowser-item bait');
                for (let i = 0; i < camppageBaits.length; ++i) {
                    const camppageBaitName = camppageBaits[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                    if (camppageBaitName == policyBaitName) {
                        const armButton = camppageBaits[i].getElementsByClassName("campPage-trap-itemBrowser-item-armButton ")[0];
                        fireEvent(armButton, 'click');
                    }
                }
                document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Arming Bait";;
            }
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Policy arming Bait";
            const currentBait = document.getElementsByClassName('campPage-trap-armedItem bait')[0];
            fireEvent(currentBait, 'click');
            window.setTimeout(function () {
                armingBait(policyBaitName);
            }, 4.5 * 1000);
        }

        function armTrinket(policyTrinketName) {
            function armingTrinket(policyTrinketName) {
                const camppageTrinkets = document.getElementsByClassName('campPage-trap-itemBrowser-item trinket');
                if (policyTrinketName == TRINKET_DISARM) {
                    const disarmButton = document.getElementsByClassName("campPage-trap-itemBrowser-item-disarmButton")[0];
                    fireEvent(disarmButton, 'click');
                } else {
                    for (let i = 0; i < camppageTrinkets.length; ++i) {
                        const camppageTrinketName = camppageTrinkets[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                        if (camppageTrinketName == policyTrinketName) {
                            const armButton = camppageTrinkets[i].getElementsByClassName("campPage-trap-itemBrowser-item-armButton")[0];
                            fireEvent(armButton, 'click');
                        }
                    }
                }
                document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Arming Trinket";;
            }
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Policy arming Trinket";
            const currentTrinket = document.getElementsByClassName('campPage-trap-armedItem trinket')[0];
            fireEvent(currentTrinket, 'click');
            window.setTimeout(function () {
                armingTrinket(policyTrinketName);
            }, 4.5 * 1000);
        }

        let delayTime = 0;
        // Check weapon
        let currentWeapon = getCurrentWeapon();
        if (currentWeapon.endsWith("Trap")) {
            currentWeapon = currentWeapon.slice(0, -5);
        }
        let policyWeapon = trapSetup[IDX_WEAPON];
        if (policyWeapon.endsWith("Trap")) {
            policyWeapon = policyWeapon.slice(0, -5);
        }
        if( !isNullOrUndefined(trapSetup[IDX_WEAPON]) && currentWeapon != policyWeapon ) {
            if (!lockBot(BOT_PROCESS_POLICY)) {
                return;
            }
            window.setTimeout(function () {
                armWeapon(trapSetup[IDX_WEAPON]);
            }, delayTime * 1000);
            delayTime += 10;
        }
        // Check Base
        const currentBase = getCurrentBase();
        if( !isNullOrUndefined(trapSetup[IDX_BASE]) && currentBase != trapSetup[IDX_BASE] ) {
            if (!lockBot(BOT_PROCESS_POLICY)) {
                return;
            }
            window.setTimeout(function () {
                armBase(trapSetup[IDX_BASE]);
            }, delayTime * 1000);
            delayTime += 10;
        }
        // Check Bait
        const currentBait = getCurrentBait();
        if( !isNullOrUndefined(trapSetup[IDX_BAIT]) && currentBait != trapSetup[IDX_BAIT] ) {
            if (!lockBot(BOT_PROCESS_POLICY)) {
                return;
            }
            window.setTimeout(function () {
                armBait(trapSetup[IDX_BAIT]);
            }, delayTime * 1000);
            delayTime += 10;
        }
        // Check Trinket
        let currentTrinket = getCurrentTrinket();
        if (currentTrinket == "") {
            currentTrinket = TRINKET_DISARM;
        }
        if( !isNullOrUndefined(trapSetup[IDX_TRINKET]) && currentTrinket != trapSetup[IDX_TRINKET] ) {
            if (!lockBot(BOT_PROCESS_POLICY)) {
                return;
            }
            window.setTimeout(function () {
                armTrinket(trapSetup[IDX_TRINKET]);
            }, delayTime * 1000);
            delayTime += 10;
        }
        if (delayTime > 0) {
            window.setTimeout(function () {
                reloadCampPage();
            }, delayTime * 1000);
        }
    }

    function runHarPolicy() {
        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_HARBOUR;
        const status = getPageVariable("user.quests.QuestHarbour.status");
        let button;
        let canClaim;
        switch(status) {
            case "noShip":
                break;
            case "canBeginSearch":
                button = document.getElementsByClassName("harbourHUD-beginSearch")[0];
                fireEvent(button, "click");
                break;
            case "searchStarted":
                canClaim = getPageVariable("user.quests.QuestHarbour.can_claim");
                if (canClaim) {
                    button = document.getElementsByClassName("harbourHUD-claimBootyButton active")[0];
                    fireEvent(button, "click");
                }
                break;
            default:
        }
        canClaim = null;
        button = null;
    }

    function runARePolicy() {
        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_ACOLYTE_REALM;
        const trapSetups = POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].getTrapSetups();
        armTraps(trapSetups);
    }

    function runCSCPolicy() {
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
        switch(phase) {
            case "need_poster":
                break;
            case "has_poster":
                poster = document.getElementsByClassName("open has_poster")[0];
                fireEvent(poster, "click");
                window.setTimeout(function () {
                    reloadCampPage();
                }, 5 * 1000);
                break;
            case "active_poster":
                break;
            case "has_reward":
                if (!lockBot(BOT_PROCESS_POLICY)) {
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
        poster = null;
    }

    function runFRoPolicy() {
        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_FORT_ROX;
        const currentStage = getPageVariable("user.quests.QuestFortRox.current_stage");
        const trapSetups = POLICY_DICT[POLICY_NAME_FORT_ROX].getTrapSetups();
        switch(currentStage) {
            case false:
                armTraps(trapSetups[FRO_PHASE_DAY]);
                break;
            case "stage_one":
                armTraps(trapSetups[FRO_PHASE_TWILIGHT]);
                break;
            case "stage_two":
                armTraps(trapSetups[FRO_PHASE_MIDNIGHT]);
                break;
            case "stage_three":
                armTraps(trapSetups[FRO_PHASE_PITCH]);
                break;
            case "stage_four":
                armTraps(trapSetups[FRO_PHASE_UTTER_DARKNESS]);
                break;
            case "stage_five":
                armTraps(trapSetups[FRO_PHASE_FIRST_LIGHT]);
                break;
            case "DAWN":
                armTraps(trapSetups[FRO_PHASE_DAWN]);
                break;
            default:
        }
    }

    function runSGaPolicy() {
        function getSGaSeason() {
            const nTimeStamp = Date.parse(new Date()) / 1000;
            const nFirstSeasonTimeStamp = 1283328000;
            const nSeasonLength = 288000; // 80hr
            const seasonIdx = Math.floor((nTimeStamp - nFirstSeasonTimeStamp) / nSeasonLength) % SGA_SEASONS.length;
            return SGA_SEASONS[seasonIdx];
        }

        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_SEASONAL_GARDEN;
        const currentSeason = getSGaSeason();
        const trapSetups = POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].getTrapSetups();
        armTraps(trapSetups[currentSeason]);
    }

    function runZToPolicy() {
        function getTowerProgress() {
            const towerProgress = {};
            for (const chess of ZTO_CHESS_MYSTIC){
                towerProgress[chess] = 0;
            }
            for (const chess of ZTO_CHESS_TECHNIC){
                towerProgress[chess] = 0;
            }
            towerProgress[NEXT_MYSTIC_TARGET] = ZTO_CHESS_MYSTIC_PAWN;
            towerProgress[NEXT_TECHNIC_TARGET] = ZTO_CHESS_TECHNIC_PAWN;
            towerProgress[UNLOCK_CHESS_MASTER] = false;

            const progressMagic = document.getElementsByClassName("zuzwangsTowerHUD-progress magic")[0].children;
            for (const item of progressMagic){
                if (item.src.indexOf("pawn") > -1) {
                    towerProgress[ZTO_CHESS_MYSTIC_PAWN] += 1
                } else if (item.src.indexOf("knight") > -1) {
                    towerProgress[ZTO_CHESS_MYSTIC_KNIGHT] += 1
                } else if (item.src.indexOf("bishop") > -1) {
                    towerProgress[ZTO_CHESS_MYSTIC_BISHOP] += 1
                } else if (item.src.indexOf("rook") > -1) {
                    towerProgress[ZTO_CHESS_MYSTIC_ROOK] += 1
                } else if (item.src.indexOf("queen") > -1) {
                    towerProgress[ZTO_CHESS_MYSTIC_QUEEN] += 1
                } else if (item.src.indexOf("king") > -1) {
                    towerProgress[ZTO_CHESS_MYSTIC_KING] += 1
                }
            }
            const progressTechnic = document.getElementsByClassName("zuzwangsTowerHUD-progress tech")[0].children;
            for (const item of progressTechnic){
                if (item.src.indexOf("pawn") > -1) {
                    towerProgress[ZTO_CHESS_TECHNIC_PAWN] += 1
                } else if (item.src.indexOf("knight") > -1) {
                    towerProgress[ZTO_CHESS_TECHNIC_KNIGHT] += 1
                } else if (item.src.indexOf("bishop") > -1) {
                    towerProgress[ZTO_CHESS_TECHNIC_BISHOP] += 1
                } else if (item.src.indexOf("rook") > -1) {
                    towerProgress[ZTO_CHESS_TECHNIC_ROOK] += 1
                } else if (item.src.indexOf("queen") > -1) {
                    towerProgress[ZTO_CHESS_TECHNIC_QUEEN] += 1
                } else if (item.src.indexOf("king") > -1) {
                    towerProgress[ZTO_CHESS_TECHNIC_KING] += 1
                }
            }
            if (towerProgress[ZTO_CHESS_MYSTIC_KING] == 1) {
                towerProgress[NEXT_MYSTIC_TARGET] = ZTO_CHESS_MASTER;
                towerProgress[UNLOCK_CHESS_MASTER] = true;
            } else if (towerProgress[ZTO_CHESS_MYSTIC_QUEEN] == 1) {
                towerProgress[NEXT_MYSTIC_TARGET] = ZTO_CHESS_MYSTIC_KING;
            } else if (towerProgress[ZTO_CHESS_MYSTIC_ROOK] == 2) {
                towerProgress[NEXT_MYSTIC_TARGET] = ZTO_CHESS_MYSTIC_QUEEN;
            } else if (towerProgress[ZTO_CHESS_MYSTIC_BISHOP] == 2) {
                towerProgress[NEXT_MYSTIC_TARGET] = ZTO_CHESS_MYSTIC_ROOK;
            } else if (towerProgress[ZTO_CHESS_MYSTIC_KNIGHT] == 2) {
                towerProgress[NEXT_MYSTIC_TARGET] = ZTO_CHESS_MYSTIC_BISHOP;
            } else if (towerProgress[ZTO_CHESS_MYSTIC_PAWN] == 8) {
                towerProgress[NEXT_MYSTIC_TARGET] = ZTO_CHESS_MYSTIC_KNIGHT;
            }
            if (towerProgress[ZTO_CHESS_TECHNIC_KING] == 1) {
                towerProgress[NEXT_TECHNIC_TARGET] = ZTO_CHESS_MASTER;
                towerProgress[UNLOCK_CHESS_MASTER] = true;
            } else if (towerProgress[ZTO_CHESS_TECHNIC_QUEEN] == 1) {
                towerProgress[NEXT_TECHNIC_TARGET] = ZTO_CHESS_TECHNIC_KING;
            } else if (towerProgress[ZTO_CHESS_TECHNIC_ROOK] == 2) {
                towerProgress[NEXT_TECHNIC_TARGET] = ZTO_CHESS_TECHNIC_QUEEN;
            } else if (towerProgress[ZTO_CHESS_TECHNIC_BISHOP] == 2) {
                towerProgress[NEXT_TECHNIC_TARGET] = ZTO_CHESS_TECHNIC_ROOK;
            } else if (towerProgress[ZTO_CHESS_TECHNIC_KNIGHT] == 2) {
                towerProgress[NEXT_TECHNIC_TARGET] = ZTO_CHESS_TECHNIC_BISHOP;
            } else if (towerProgress[ZTO_CHESS_TECHNIC_PAWN] == 8) {
                towerProgress[NEXT_TECHNIC_TARGET] = ZTO_CHESS_TECHNIC_KNIGHT;
            }
            return towerProgress;
        }

        const NEXT_MYSTIC_TARGET = "Next Mystic Target";
        const NEXT_TECHNIC_TARGET = "Next Technic Target";
        const UNLOCK_CHESS_MASTER = "Unlock Chess Master";
        document.getElementById(ID_POLICY_TXT).innerHTML = POLICY_NAME_ZUGZWANGS_TOWER;
        const towerProgress = getTowerProgress();
        const trapSetups = POLICY_DICT[POLICY_NAME_ZUGZWANGS_TOWER].getTrapSetups();
        switch(trapSetups[ZTO_STRATEGY]) {
            case ZTO_STRATEGY_MYSTIC_ONLY:
                armTraps(trapSetups[towerProgress[NEXT_MYSTIC_TARGET]]);
                break;
            case ZTO_STRATEGY_TECHNIC_ONLY:
                armTraps(trapSetups[towerProgress[NEXT_TECHNIC_TARGET]]);
                break;
            case ZTO_STRATEGY_MYSTIC_FIRST:
                break;
            case ZTO_STRATEGY_TECHNIC_FIRST:
                break;
            default:
        }
    }

    if (document.getElementById(ID_BOT_PROCESS_TXT).innerHTML != BOT_PROCESS_IDLE) {
        return;
    }
    if (!isAtCampPage()){
        return;
    }
    const currentLocation = getPageVariable("user.environment_name");
    switch(currentLocation) {
        case LOCATION_HARBOUR:
            runHarPolicy();
            break;
        case LOCATION_ACOLYTE_REALM:
            runARePolicy();
            break;
        case LOCATION_FORT_ROX:
            runFRoPolicy();
            break;
        case LOCATION_CLAW_SHOT_CITY:
            runCSCPolicy();
            break;
        case LOCATION_SEASONAL_GARDEN:
            runSGaPolicy();
            break;
        case LOCATION_ZUGZWANGS_TOWER:
            runZToPolicy();
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

function listAttributes(obj) {
    const attrs = obj.attributes;
    let tmpTxt = "";
    for (let i = 0; i < attrs.length; i++) {
        tmpTxt += attrs[i].name + " : " + attrs[i].value + "\n";
    }
    alert(tmpTxt);
}

function testSaveObjToStorage() {
    alert("in saveObjToStorage");
    const myObj = {"key1": ['a', 'b', 'c']};
    //alert(myObj.key1);

    for (let i = 0; i < myObj.key1.length; i++) {
        alert(myObj.key1[i]);
    }
    setStorage("testObj", JSON.stringify(myObj));
}

function testLoadObjFromStorage() {
    alert("in loadObjFromStorage");
    const myObj = JSON.parse(getStorage("testObj"));
    for (let i = 0; i < myObj.key1.length; i++) {
        alert(myObj.key1[i]);
    }
}

function testDict() {
    const tmpPolicy = POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN];
    alert(tmpPolicy.trapSetups[SGA_SEASON_SPRING].weapon);
    /*
    for (const [key, value] of Object.entries(POLICY_DICT)) {
        alert(key + ": " + value);
    }
    */
}

function testArray() {
    const myArr = [];
    myArr[0] = "a";
    myArr[3] = "d";
    alert(myArr[0]);
    alert(myArr[2]);
    alert(myArr[3]);
}

function test1() {
    //testArray();
    checkLocation();
    //testDict();
    //testSaveObjToStorage();
    //displayDocumentStyles();
}

function test2() {
    //testLoadObjFromStorage();
}

function manualClaimingYesterdayGifts() {
    if (!lockBot(BOT_PROCESS_Manual)) {
        return;
    }
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual claiming yesterday Gifts";
    prepareClaimingGifts(false);
}

function manualClaimingTodayGifts() {
    if (!lockBot(BOT_PROCESS_Manual)) {
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

function manualSendingGiftsAndRaffles() {
    if (!lockBot(BOT_PROCESS_Manual)) {
        return;
    }
    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual sending Gifts and Raffles";
    prepareSendingGiftsAndRaffles();
}

function prepareSendingGiftsAndRaffles() {
    function clickActionButton(actionButton) {
        fireEvent(actionButton, "click");
    }
    function sendGiftsAndRaffles(friendIndex, nGifts, nRaffles) {
        function sendingGiftsAndRaffles(friendIndex, nGifts, nRaffles) {
            const friendRow = friendRows[friendIndex];
            const friendName = friendRow.getElementsByClassName("friendsPage-friendRow-titleBar")[0].getElementsByTagName('a')[0].text;
            document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Sending a gift and a ballot ticket to " + friendName;
            const sendGiftButton = friendRow.getElementsByClassName("userInteractionButtonsView-button sendGift")[0];
            const sendBallotButton = friendRow.getElementsByClassName("userInteractionButtonsView-button sendTicket")[0];

            clickActionButton(sendGiftButton);
            if (friendIndex < nRaffles) {
                window.setTimeout(function () {
                    clickActionButton(sendBallotButton);
                }, 1 * 1000);
            }
            friendIndex++;
            if (friendIndex < nGifts) {
                window.setTimeout(function () {
                    sendingGiftsAndRaffles(friendIndex, nGifts, nRaffles);
                }, 2 * 1000);
            }
        }

        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Retrieving friend list";
        const friendRows = document.getElementsByClassName("friendsPage-friendRow");
        window.setTimeout(function () {
            sendingGiftsAndRaffles(friendIndex, nGifts, nRaffles);
        }, 0.5 * 1000);
    }
    function gotoNextFriendList() {
        // Got to the second frield list page
        const nextFriendListLink = document.getElementsByClassName("next active pagerView-section")[0].getElementsByTagName("a")[0];
        fireEvent(nextFriendListLink, "click");

        // Go through all sendGift and sendRaffle buttons in the first page
        window.setTimeout(function () {
            sendGiftsAndRaffles(0, 5, 0);
        }, 5 * 1000);
    }
    let friendRows;
    if (DEBUG_MODE) console.log('RUN sendRafflesAndGifts()');

    // Goto friend list page
    const friendListLink = document.getElementsByClassName("mousehuntHud-gameInfo")[0].getElementsByTagName("a")[0];
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
        let tmpTxt;
        const statusSection = document.createElement('div');
        const statusDisplayTable = document.createElement('table');
        statusDisplayTable.width = "100%";

        // The first row shows title and version (also some misc buttons)
        const trFirst = statusDisplayTable.insertRow();
        const statusDisplayTitle = trFirst.insertCell();
        statusDisplayTitle.colSpan = 2;
        statusDisplayTitle.innerHTML = "<b><a href=\"https://github.com/bujaraty/JnK/blob/main/MH_Admirer.user.js\" target=\"_blank\">J n K Admirer (version " + g_strScriptVersion + ")</a></b>";
        const miscStatusCell = trFirst.insertCell();
        miscStatusCell.style.fontSize = "9px";
        miscStatusCell.style.textAlign = "right";
        tmpTxt = document.createTextNode("Gifts & Raffles status : " + g_statusGiftsAndRaffles + "  ");
        miscStatusCell.appendChild(tmpTxt);
        const miscButtonsCell = trFirst.insertCell();
        miscButtonsCell.style.textAlign = "right";
        const sendGiftsAndRafflesButton = document.createElement('button');
        sendGiftsAndRafflesButton.onclick = manualSendingGiftsAndRaffles
        sendGiftsAndRafflesButton.style.fontSize = "8px";
        tmpTxt = document.createTextNode("Send Gifts & Raffles");
        sendGiftsAndRafflesButton.appendChild(tmpTxt);
        miscButtonsCell.appendChild(sendGiftsAndRafflesButton);
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
        const nextBotHornTimeCaptionCell = trSecond.insertCell();
        nextBotHornTimeCaptionCell.width = 20;
        nextBotHornTimeCaptionCell.style.fontWeight = "bold";
        nextBotHornTimeCaptionCell.innerHTML = "Next Hunter Horn Time : ";
        g_nextBotHornTimeDisplay = trSecond.insertCell();
        g_nextBotHornTimeDisplay.colSpan = 2;
        g_nextBotHornTimeDisplay.style.textAlign = "left";
        g_nextBotHornTimeDisplay.width = 320;
        g_nextBotHornTimeDisplay.innerHTML = "Loading...";

        // The third row shows next trap check time countdown
        const trThird = statusDisplayTable.insertRow();
        const nextTrapCheckTimeCaptionCell = trThird.insertCell();
        nextTrapCheckTimeCaptionCell.style.fontWeight = "bold";
        nextTrapCheckTimeCaptionCell.innerHTML = "Next Trap Check Time :  ";
        g_nextTrapCheckTimeDisplay = trThird.insertCell();
        g_nextTrapCheckTimeDisplay.colSpan = 2;
        g_nextTrapCheckTimeDisplay.innerHTML = "Loading...";

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
            const toggleLink = document.getElementById(ID_TIMER_LINK);
            const preferencesTable = document.getElementById(ID_TIMER_PREFERENCES_TABLE);
            if (toggleLink.innerHTML == '[Show]') {
                toggleLink.innerHTML = '[Hide]'
                preferencesTable.style.display = 'table';
            } else {
                toggleLink.innerHTML = '[Show]'
                preferencesTable.style.display = 'none';
            }
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

            let tmpTxt;
            let captionCell;
            const timerPreferencesTable = document.createElement('table');
            timerPreferencesTable.id = ID_TIMER_PREFERENCES_TABLE;
            timerPreferencesTable.width = "100%";

            const trEmpty = timerPreferencesTable.insertRow();
            trEmpty.style.height = "4px"

            const trNextBotHornTimePreferences = timerPreferencesTable.insertRow();
            trNextBotHornTimePreferences.style.height = "21px"
            captionCell = trNextBotHornTimePreferences.insertCell();
            captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
            captionCell.innerHTML = "Bot Horn Time Delay :  ";
            captionCell.width = 240;
            const nextBotHornTimePreferencesSettings = trNextBotHornTimePreferences.insertCell();
            nextBotHornTimePreferencesSettings.width = 250;
            const botHornTimeDelayMinInput = document.createElement('INPUT');
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
            const botHornTimeDelayMaxInput = document.createElement('INPUT');
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

            const trNextTrapCheckTimePreferences = timerPreferencesTable.insertRow();
            trNextTrapCheckTimePreferences.style.height = "21px"
            captionCell = trNextTrapCheckTimePreferences.insertCell();
            captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
            captionCell.innerHTML = "Trap Check Time Delay :  ";
            const nextTrapCheckTimePreferencesSettings = trNextTrapCheckTimePreferences.insertCell();
            const trapCheckTimeDelayMinInput = document.createElement('INPUT');
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
            const trapCheckTimeDelayMaxInput = document.createElement('INPUT');
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

            const trAutosolveKRPreferences = timerPreferencesTable.insertRow();
            trAutosolveKRPreferences.style.height = "24px"
            captionCell = trAutosolveKRPreferences.insertCell();
            captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
            captionCell.innerHTML = "Auto Solve King Reward Delay :  ";
            const autosolveKRPreferencesSettings = trAutosolveKRPreferences.insertCell();
            const autosolveKRDelayMinInput = document.createElement('INPUT');
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
            const autosolveKRDelayMaxInput = document.createElement('INPUT');
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

            const trSchedulerTitle = timerPreferencesTable.insertRow();
            trSchedulerTitle.style.height = "20px"
            const schedulerTitle = trSchedulerTitle.insertCell();
            schedulerTitle.colSpan = 3;
            schedulerTitle.innerHTML = "Scheduler time";
            schedulerTitle.style.fontWeight = "bold";
            schedulerTitle.style.fontSize = "12px";
            schedulerTitle.style.textAlign = "center";

            const trScheduledGiftAndRafflesPreferences = timerPreferencesTable.insertRow();
            trScheduledGiftAndRafflesPreferences.style.height = "24px"
            captionCell = trScheduledGiftAndRafflesPreferences.insertCell();
            captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
            captionCell.innerHTML = "Sending Gifts and Raffles :  ";
            const scheduledGiftsAndRafflesPreferencesSettings = trScheduledGiftAndRafflesPreferences.insertCell();
            const scheduledGiftsAndRafflesBeginTime = document.createElement('INPUT');
            scheduledGiftsAndRafflesBeginTime.type = "time";
            scheduledGiftsAndRafflesBeginTime.style.fontSize = "12px";
            scheduledGiftsAndRafflesBeginTime.id = ID_SCHEDULED_GIFTS_AND_RAFFLES_TIME_INPUT;
            scheduledGiftsAndRafflesBeginTime.value = g_scheduledGiftsAndRafflesTime;
            scheduledGiftsAndRafflesPreferencesSettings.appendChild(scheduledGiftsAndRafflesBeginTime);

            const trScheduledResetPreferences = timerPreferencesTable.insertRow();
            trScheduledResetPreferences.style.height = "21px"
            captionCell = trScheduledResetPreferences.insertCell();
            captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
            captionCell.innerHTML = "New Date :  ";
            const scheduledResetPreferencesSettings = trScheduledResetPreferences.insertCell();
            const scheduledResetTime = document.createElement('INPUT');
            scheduledResetTime.type = "time";
            scheduledResetTime.style.fontSize = "12px";
            scheduledResetTime.id = ID_SCHEDULED_RESET_TIME_INPUT;
            scheduledResetTime.value = g_scheduledResetTime;
            scheduledResetPreferencesSettings.appendChild(scheduledResetTime);

            const trLastRow = timerPreferencesTable.insertRow();
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

            captionCell = null;
            tmpTxt = null;

            return timerPreferencesTable;
        }

        function embedPolicyPreferences() {
            function savePolicyPreferences() {
                reloadCampPage();
            }

            function onChangePolicy(event) {
                if (event.target.value == "Select policy") {
                    return;
                }
                for (const [policyName, policyObj] of Object.entries(POLICY_DICT)) {
                    const tmpDisplay = (event.target.value == policyName)? "table-row" : "none";
                    const tmpPolicy = POLICY_DICT[policyName];
                    for (const tr of tmpPolicy.trs){
                        document.getElementById(tr).style.display = tmpDisplay;
                    }
                    if (tmpDisplay == "table-row" && isNullOrUndefined(tmpPolicy.initSelectTrapSetup)) {
                        alert("Cannot find function initSelectTrapSetup for policy: " + policyName);
                    } else if (tmpDisplay == "table-row") {
                        tmpPolicy.initSelectTrapSetup();
                    }
                }
            }

            function updateTraps() {
                function updateWeapons() {
                    function getCampPageWeaponNames() {
                        g_weaponNames = [];
                        const camppageWeapons = document.getElementsByClassName('campPage-trap-itemBrowser-item weapon');
                        for (let i = 0; i < camppageWeapons.length; ++i) {
                            const weaponName = camppageWeapons[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                            if (g_weaponNames.indexOf(weaponName) == -1) {
                                g_weaponNames[g_weaponNames.length] = weaponName;
                            }
                        }
                        g_weaponNames.sort();
                        setStorage(STORAGE_WEAPON_NAMES, g_weaponNames);
                        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Updating Weapons";;
                    }
                    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual Updating Weapons";
                    const currentWeapon = document.getElementsByClassName('campPage-trap-armedItem weapon')[0];
                    fireEvent(currentWeapon, 'click');
                    window.setTimeout(function () {
                        getCampPageWeaponNames();
                    }, 4.5 * 1000);
                }

                function updateBases() {
                    function getCampPageBaseNames() {
                        g_baseNames = [];
                        const camppageBases = document.getElementsByClassName('campPage-trap-itemBrowser-item base');
                        for (let i = 0; i < camppageBases.length; ++i) {
                            const baseName = camppageBases[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                            if (g_baseNames.indexOf(baseName) == -1) {
                                g_baseNames[g_baseNames.length] = baseName;
                            }
                        }
                        g_baseNames.sort();
                        setStorage(STORAGE_BASE_NAMES, g_baseNames);
                        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Updating Bases";;
                    }
                    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual Updating Bases";
                    const currentBase = document.getElementsByClassName('campPage-trap-armedItem base')[0];
                    fireEvent(currentBase, 'click');
                    window.setTimeout(function () {
                        getCampPageBaseNames();
                    }, 4.5 * 1000);
                }

                function updateBaits() {
                    function getCampPageBaitNames() {
                        g_baitNames = [];
                        const camppageBaits = document.getElementsByClassName('campPage-trap-itemBrowser-item bait');
                        for (let i = 0; i < camppageBaits.length; ++i) {
                            const baitName = camppageBaits[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                            if (g_baitNames.indexOf(baitName) == -1) {
                                g_baitNames[g_baitNames.length] = baitName;
                            }
                        }
                        g_baitNames.sort();
                        setStorage(STORAGE_BAIT_NAMES, g_baitNames);
                        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Updating Baits";;
                    }
                    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual Updating Baits";
                    const currentBait = document.getElementsByClassName('campPage-trap-armedItem bait')[0];
                    fireEvent(currentBait, 'click');
                    window.setTimeout(function () {
                        getCampPageBaitNames();
                    }, 4.5 * 1000);
                }

                function updateTrinkets() {
                    function getCampPageTrinketNames() {
                        g_trinketNames = [];
                        const camppageTrinkets = document.getElementsByClassName('campPage-trap-itemBrowser-item trinket');
                        for (let i = 0; i < camppageTrinkets.length; ++i) {
                            const trinketName = camppageTrinkets[i].getElementsByClassName("campPage-trap-itemBrowser-item-name")[0].innerHTML;
                            if (g_trinketNames.indexOf(trinketName) == -1) {
                                g_trinketNames[g_trinketNames.length] = trinketName;
                            }
                        }
                        g_trinketNames.sort();
                        setStorage(STORAGE_TRINKET_NAMES, g_trinketNames);
                        document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Finish Updating Trinkets";;
                    }
                    document.getElementById(ID_BOT_STATUS_TXT).innerHTML = "Manual Updating Trinkets";
                    const currentTrinket = document.getElementsByClassName('campPage-trap-armedItem trinket')[0];
                    fireEvent(currentTrinket, 'click');
                    window.setTimeout(function () {
                        getCampPageTrinketNames();
                    }, 4.5 * 1000);
                }

                if (!lockBot(BOT_PROCESS_Manual)) {
                    return;
                }
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

            function getSelectItem(items, itemId, onchangeFunction) {
                const selectItem = document.createElement('select');
                selectItem.style.width = "80px";
                selectItem.style.fontSize = "90%";
                for (let i = 0; i < items.length; i++) {
                    const itemOption = document.createElement("option");
                    itemOption.value = items[i];
                    itemOption.text = items[i];
                    selectItem.appendChild(itemOption);
                }
                selectItem.selectedIndex = -1;
                selectItem.id = itemId;
                selectItem.onchange = onchangeFunction;
                return selectItem;
            }

            function getSelectWeapon(itemId, onchangeFunction) {
                return getSelectItem(g_weaponNames, itemId, onchangeFunction);
            }

            function getSelectBase(itemId, onchangeFunction) {
                return getSelectItem(g_baseNames, itemId, onchangeFunction);
            }

            function getSelectBait(itemId, onchangeFunction) {
                return getSelectItem(g_baitNames, itemId, onchangeFunction);
            }

            function getSelectTrinket(itemId, onchangeFunction) {
                const selectTrinket = document.createElement('select');
                selectTrinket.style.width = "80px";
                selectTrinket.style.fontSize = "90%";
                const itemOption = document.createElement("option");
                itemOption.value = TRINKET_DISARM;
                itemOption.text = TRINKET_DISARM;
                selectTrinket.appendChild(itemOption);
                for (let i = 0; i < g_trinketNames.length; i++) {
                    const itemOption = document.createElement("option");
                    itemOption.value = g_trinketNames[i];
                    itemOption.text = g_trinketNames[i];
                    selectTrinket.appendChild(itemOption);
                }
                selectTrinket.selectedIndex = -1;
                selectTrinket.id = itemId;
                selectTrinket.onchange = onchangeFunction;
                return selectTrinket;
            }

            function insertSelectPolicyRow() {
                let itemOption;
                const trSelectPolicy = policyPreferencesTable.insertRow();
                trSelectPolicy.style.height = "24px"
                const captionCell = trSelectPolicy.insertCell();
                captionCell.width = 260;
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Select Location :  ";
                const selectPolicyCell = trSelectPolicy.insertCell();
                const selectPolicy = document.createElement('select');
                selectPolicy.style.width = "120px";
                selectPolicy.style.fontSize = "90%";
                selectPolicy.onchange = onChangePolicy;
                itemOption = document.createElement("option");
                itemOption.value = "Select policy";
                itemOption.text = "Select policy";
                selectPolicy.appendChild(itemOption);
                for (const [policyName, policyObj] of Object.entries(POLICY_DICT)) {
                    itemOption = document.createElement("option");
                    itemOption.value = policyName;
                    itemOption.text = policyName;
                    selectPolicy.appendChild(itemOption);
                }
                selectPolicyCell.appendChild(selectPolicy);
                itemOption = null;
            }

            function insertARePolicyPreferences() {
                function saveAReWeapon(event) {
                    POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].trapSetups[IDX_WEAPON] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_ARE, POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].trapSetups);
                }

                function saveAReBase(event) {
                    POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].trapSetups[IDX_BASE] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_ARE, POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].trapSetups);
                }

                function saveAReBait(event) {
                    POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].trapSetups[IDX_BAIT] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_ARE, POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].trapSetups);
                }

                function saveAReTrinket(event) {
                    POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].trapSetups[IDX_TRINKET] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_ARE, POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].trapSetups);
                }

                function recommendAReTrapSetup() {
                    POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].recommendTrapSetup();
                    setStorage(STORAGE_TRAP_SETUP_ARE, POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].trapSetups);
                }

                function resetAReTrapSetup() {
                    POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].resetTrapSetups();
                    setStorage(STORAGE_TRAP_SETUP_ARE, POLICY_DICT[POLICY_NAME_ACOLYTE_REALM].trapSetups);
                    reloadCampPage();
                }

                let tmpTxt;
                const trAReTrapSetup = policyPreferencesTable.insertRow();
                trAReTrapSetup.id = ID_TR_ARE_TRAP_SETUP;
                trAReTrapSetup.style.height = "24px";
                trAReTrapSetup.style.display = "none";
                const captionCell = trAReTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup :  ";
                const trapSetupCell = trAReTrapSetup.insertCell();
                trapSetupCell.appendChild(getSelectWeapon(ID_SELECT_ARE_WEAPON, saveAReWeapon));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBase(ID_SELECT_ARE_BASE, saveAReBase));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBait(ID_SELECT_ARE_BAIT, saveAReBait));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectTrinket(ID_SELECT_ARE_TRINKET, saveAReTrinket));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                const recommendButton = document.createElement('button');
                recommendButton.onclick = recommendAReTrapSetup;
                recommendButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Recommend");
                recommendButton.appendChild(tmpTxt);
                trapSetupCell.appendChild(recommendButton);
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                const resetButton = document.createElement('button');
                resetButton.onclick = resetAReTrapSetup;
                resetButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Reset & Reload");
                resetButton.appendChild(tmpTxt);
                trapSetupCell.appendChild(resetButton);
                tmpTxt = null;
            }

            function insertFRoPolicyPreferences() {
                function onChangeSelectFRoPhase(event) {
                    POLICY_DICT[POLICY_NAME_FORT_ROX].initSelectTrapSetup();
                }

                function saveFRoSetup(itemIndex, value) {
                    const currentPhase = document.getElementById(ID_SELECT_FRO_PHASE).value;
                    POLICY_DICT[POLICY_NAME_FORT_ROX].trapSetups[currentPhase][itemIndex] = value;
                    setStorage(STORAGE_TRAP_SETUP_FRO, POLICY_DICT[POLICY_NAME_FORT_ROX].trapSetups);
                }

                function saveFRoWeapon(event) {
                    saveFRoSetup(IDX_WEAPON, event.target.value);
                }

                function saveFRoBase(event) {
                    saveFRoSetup(IDX_BASE, event.target.value);
                }

                function saveFRoBait(event) {
                    saveFRoSetup(IDX_BAIT, event.target.value);
                }

                function saveFRoTrinket(event) {
                    saveFRoSetup(IDX_TRINKET, event.target.value);
                }

                function saveFRoTower(event) {
                    saveFRoSetup(IDX_TOWER, event.target.value);
                }

                function recommendFRoTrapSetup() {
                    POLICY_DICT[POLICY_NAME_FORT_ROX].recommendTrapSetup();
                    setStorage(STORAGE_TRAP_SETUP_FRO, POLICY_DICT[POLICY_NAME_FORT_ROX].trapSetups);
                }

                function resetFRoTrapSetup() {
                    POLICY_DICT[POLICY_NAME_FORT_ROX].resetTrapSetups();
                    setStorage(STORAGE_TRAP_SETUP_FRO, POLICY_DICT[POLICY_NAME_FORT_ROX].trapSetups);
                    reloadCampPage();
                }

                function saveFRoActivationHPFull(event) {
                    POLICY_DICT[POLICY_NAME_FORT_ROX].trapSetups[FRO_TOWER_HP_FULL] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_FRO, POLICY_DICT[POLICY_NAME_FORT_ROX].trapSetups);
                }

                let captionCell;
                let tmpTxt;

                const trFRoPhasesTrapSetup = policyPreferencesTable.insertRow();
                trFRoPhasesTrapSetup.id = ID_TR_FRO_PHASES_TRAP_SETUP;
                trFRoPhasesTrapSetup.style.height = "24px";
                trFRoPhasesTrapSetup.style.display = "none";
                captionCell = trFRoPhasesTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for ";
                const selectPhase = document.createElement('select');
                selectPhase.id = ID_SELECT_FRO_PHASE;
                selectPhase.style.width = "70px";
                selectPhase.style.fontSize = "90%";
                selectPhase.onchange = onChangeSelectFRoPhase;
                for (const phase of FRO_PHASES){
                    const itemOption = document.createElement("option");
                    itemOption.value = phase
                    itemOption.text = phase
                    selectPhase.appendChild(itemOption);
                }
                captionCell.appendChild(selectPhase);
                tmpTxt = document.createTextNode(" :  ");
                captionCell.appendChild(tmpTxt);
                const trapSetupCell = trFRoPhasesTrapSetup.insertCell();
                trapSetupCell.appendChild(getSelectWeapon(ID_SELECT_FRO_WEAPON, saveFRoWeapon));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBase(ID_SELECT_FRO_BASE, saveFRoBase));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBait(ID_SELECT_FRO_BAIT, saveFRoBait));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectTrinket(ID_SELECT_FRO_TRINKET, saveFRoTrinket));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                const selectTower = document.createElement('select');
                selectTower.id = ID_SELECT_FRO_TOWER;
                selectTower.style.fontSize = "90%";
                selectTower.style.width = "80px";
                selectTower.onchange = saveFRoTower;
                for (const phase of FRO_TOWER_ACTIVATION){
                    const itemOption = document.createElement("option");
                    itemOption.value = phase
                    itemOption.text = phase
                    selectTower.appendChild(itemOption);
                }
                trapSetupCell.appendChild(selectTower);

                const trFRoTowerHPFull = policyPreferencesTable.insertRow();
                trFRoTowerHPFull.id = ID_TR_FRO_TOWER_HP_FULL;
                trFRoTowerHPFull.style.height = "24px";
                trFRoTowerHPFull.style.display = "none";
                captionCell = trFRoTowerHPFull.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Tower Activation When HP Full :  ";
                const selectActivationCell = trFRoTowerHPFull.insertCell();
                const selectActivation = document.createElement('select');
                selectActivation.id = ID_SELECT_FRO_ACTIVATION_HP_FULL;
                selectActivation.style.fontSize = "90%";
                selectActivation.style.width = "60px";
                selectActivation.onchange = saveFRoActivationHPFull;
                for (const phase of FRO_TOWER_ACTIVATION){
                    const itemOption = document.createElement("option");
                    itemOption.value = phase
                    itemOption.text = phase
                    selectActivation.appendChild(itemOption);
                }
                selectActivationCell.appendChild(selectActivation);
                tmpTxt = document.createTextNode(" ");
                selectActivationCell.appendChild(tmpTxt);
                const recommendButton = document.createElement('button');
                recommendButton.onclick = recommendFRoTrapSetup;
                recommendButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Recommend");
                recommendButton.appendChild(tmpTxt);
                selectActivationCell.appendChild(recommendButton);
                tmpTxt = document.createTextNode(" ");
                selectActivationCell.appendChild(tmpTxt);
                const resetButton = document.createElement('button');
                resetButton.onclick = resetFRoTrapSetup;
                resetButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Reset & Reload");
                resetButton.appendChild(tmpTxt);
                selectActivationCell.appendChild(resetButton);

                tmpTxt = null;
                captionCell = null;
            }

            function insertSGaPolicyPreferences() {
                function onChangeSelectSGaSeason(event) {
                    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].initSelectTrapSetup();
                }

                function saveSGaSetup(itemIndex, value) {
                    const currentSeason = document.getElementById(ID_SELECT_SGA_SEASON).value;
                    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups[currentSeason][itemIndex] = value;
                    setStorage(STORAGE_TRAP_SETUP_SGA, POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups);
                }

                function saveSGaWeapon(event) {
                    saveSGaSetup(IDX_WEAPON, event.target.value);
                }

                function saveSGaBase(event) {
                    saveSGaSetup(IDX_BASE, event.target.value);
                }

                function saveSGaBait(event) {
                    saveSGaSetup(IDX_BAIT, event.target.value);
                }

                function saveSGaTrinket(event) {
                    saveSGaSetup(IDX_TRINKET, event.target.value);
                }

                function recommendSGaTrapSetup() {
                    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].recommendTrapSetup();
                    setStorage(STORAGE_TRAP_SETUP_SGA, POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups);
                }

                function resetSGaTrapSetup() {
                    POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].resetTrapSetups();
                    setStorage(STORAGE_TRAP_SETUP_SGA, POLICY_DICT[POLICY_NAME_SEASONAL_GARDEN].trapSetups);
                    reloadCampPage();
                }

                let captionCell;
                let tmpTxt;
                const trSGaSeasonsTrapSetup = policyPreferencesTable.insertRow();
                trSGaSeasonsTrapSetup.id = ID_TR_SGA_SEASONS_TRAP_SETUP;
                trSGaSeasonsTrapSetup.style.height = "24px";
                trSGaSeasonsTrapSetup.style.display = "none";
                captionCell = trSGaSeasonsTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for ";
                const selectSeason = document.createElement('select');
                selectSeason.id = ID_SELECT_SGA_SEASON;
                selectSeason.style.fontSize = "90%";
                selectSeason.style.width = "70px";
                selectSeason.onchange = onChangeSelectSGaSeason;
                for (const season of SGA_SEASONS){
                    const itemOption = document.createElement("option");
                    itemOption.value = season
                    itemOption.text = season
                    selectSeason.appendChild(itemOption);
                }
                captionCell.appendChild(selectSeason);
                tmpTxt = document.createTextNode(" :  ");
                captionCell.appendChild(tmpTxt);
                const trapSetupCell = trSGaSeasonsTrapSetup.insertCell();
                trapSetupCell.appendChild(getSelectWeapon(ID_SELECT_SGA_WEAPON, saveSGaWeapon));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBase(ID_SELECT_SGA_BASE, saveSGaBase));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBait(ID_SELECT_SGA_BAIT, saveSGaBait));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectTrinket(ID_SELECT_SGA_TRINKET, saveSGaTrinket));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                const recommendButton = document.createElement('button');
                recommendButton.onclick = recommendSGaTrapSetup;
                recommendButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Recommend");
                recommendButton.appendChild(tmpTxt);
                trapSetupCell.appendChild(recommendButton);
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                const resetButton = document.createElement('button');
                resetButton.onclick = resetSGaTrapSetup;
                resetButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Reset & Reload");
                resetButton.appendChild(tmpTxt);
                trapSetupCell.appendChild(resetButton);
                captionCell = null;
                tmpTxt = null;
            }

            function insertZToPolicyPreferences() {
                function onChangeSelectZToStrategy(event) {
                    POLICY_DICT[POLICY_NAME_ZUGZWANGS_TOWER].trapSetups[ZTO_STRATEGY] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_ZTO, POLICY_DICT[POLICY_NAME_ZUGZWANGS_TOWER].trapSetups);
                }

                function onChangeZToSelectChess(event) {
                    POLICY_DICT[POLICY_NAME_ZUGZWANGS_TOWER].initSelectTrapSetup();
                }

                function saveZToSetup(itemIndex, value) {
                    const currentChess = document.getElementById(ID_SELECT_ZTO_CHESS).value;
                    POLICY_DICT[POLICY_NAME_ZUGZWANGS_TOWER].trapSetups[currentChess][itemIndex] = value;
                    setStorage(STORAGE_TRAP_SETUP_ZTO, POLICY_DICT[POLICY_NAME_ZUGZWANGS_TOWER].trapSetups);
                }

                function saveZToWeapon(event) {
                    saveZToSetup(IDX_WEAPON, event.target.value);
                }

                function saveZToBase(event) {
                    saveZToSetup(IDX_BASE, event.target.value);
                }

                function saveZToBait(event) {
                    saveZToSetup(IDX_BAIT, event.target.value);
                }

                function saveZToTrinket(event) {
                    saveZToSetup(IDX_TRINKET, event.target.value);
                }

                function recommendZToTrapSetup() {
                    POLICY_DICT[POLICY_NAME_ZUGZWANGS_TOWER].recommendTrapSetup();
                    setStorage(STORAGE_TRAP_SETUP_ZTO, POLICY_DICT[POLICY_NAME_ZUGZWANGS_TOWER].trapSetups);
                }

                function resetZToTrapSetup() {
                    POLICY_DICT[POLICY_NAME_ZUGZWANGS_TOWER].resetTrapSetups();
                    setStorage(STORAGE_TRAP_SETUP_ZTO, POLICY_DICT[POLICY_NAME_ZUGZWANGS_TOWER].trapSetups);
                    reloadCampPage();
                }

                let captionCell;
                let tmpTxt;
                const trZToStrategy = policyPreferencesTable.insertRow();
                trZToStrategy.id = ID_TR_ZTO_STRATEGY;
                trZToStrategy.style.height = "24px";
                trZToStrategy.style.display = "none";
                captionCell = trZToStrategy.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Strategy :  ";
                const selectStrategyCell = trZToStrategy.insertCell();
                const selectStrategy = document.createElement('select');
                selectStrategy.id = ID_SELECT_ZTO_STRATEGY;
                selectStrategy.style.fontSize = "90%";
                selectStrategy.style.width = "120px";
                selectStrategy.onchange = onChangeSelectZToStrategy;
                const itemOption = document.createElement("option");
                itemOption.value = "Select strategy";
                itemOption.text = "Select strategy";
                selectStrategy.appendChild(itemOption);
                for (const strategy of ZTO_STRATEGIES){
                    const itemOption = document.createElement("option");
                    itemOption.value = strategy
                    itemOption.text = strategy
                    selectStrategy.appendChild(itemOption);
                }
                selectStrategyCell.appendChild(selectStrategy);
                tmpTxt = document.createTextNode("   ");
                selectStrategyCell.appendChild(tmpTxt);
                const recommendButton = document.createElement('button');
                recommendButton.onclick = recommendZToTrapSetup;
                recommendButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Recommend");
                recommendButton.appendChild(tmpTxt);
                selectStrategyCell.appendChild(recommendButton);
                tmpTxt = document.createTextNode(" ");
                selectStrategyCell.appendChild(tmpTxt);
                const resetButton = document.createElement('button');
                resetButton.onclick = resetZToTrapSetup;
                resetButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Reset & Reload");
                resetButton.appendChild(tmpTxt);
                selectStrategyCell.appendChild(resetButton);

                const trZToChessTrapSetup = policyPreferencesTable.insertRow();
                trZToChessTrapSetup.id = ID_TR_ZTO_CHESS_TRAP_SETUP;
                trZToChessTrapSetup.style.height = "24px";
                trZToChessTrapSetup.style.display = "none";
                captionCell = trZToChessTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for ";
                const selectChess = document.createElement('select');
                selectChess.id = ID_SELECT_ZTO_CHESS;
                selectChess.style.fontSize = "90%";
                selectChess.style.width = "70px";
                selectChess.onchange = onChangeZToSelectChess;
                for (const name of ZTO_CHESS_PROGRESS){
                    const itemOption = document.createElement("option");
                    itemOption.value = name
                    itemOption.text = name
                    selectChess.appendChild(itemOption);
                }
                captionCell.appendChild(selectChess);
                tmpTxt = document.createTextNode(" :  ");
                captionCell.appendChild(tmpTxt);
                const trapSetupCell = trZToChessTrapSetup.insertCell();
                trapSetupCell.appendChild(getSelectWeapon(ID_SELECT_ZTO_WEAPON, saveZToWeapon));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBase(ID_SELECT_ZTO_BASE, saveZToBase));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBait(ID_SELECT_ZTO_BAIT, saveZToBait));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectTrinket(ID_SELECT_ZTO_TRINKET, saveZToTrinket));

                captionCell = null;
                tmpTxt = null;
            }

            function insertCLiPolicyPreferences() {
                function saveCLiCheckbox(event) {
                    POLICY_DICT[POLICY_NAME_CRYSTAL_LIBRARY].trapSetups[CLI_CATALOG_MICE] = event.target.checked;
                    setStorage(STORAGE_TRAP_SETUP_CLI, POLICY_DICT[POLICY_NAME_CRYSTAL_LIBRARY].trapSetups);
                }

                const trCLiCatalogMice = policyPreferencesTable.insertRow();
                trCLiCatalogMice.id = ID_TR_CLI_CATALOG_MICE;
                trCLiCatalogMice.style.height = "24px";
                trCLiCatalogMice.style.display = "none";
                const captionCell = trCLiCatalogMice.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Catalog Library Mice :  ";
                const checkboxCell = trCLiCatalogMice.insertCell();
                const checkbox = document.createElement('input');
                checkbox.id = ID_CHECKBOX_CLI_CATALOG_MICE;
                checkbox.type = "checkbox";
                checkbox.onchange = saveCLiCheckbox;
                checkboxCell.appendChild(checkbox);
            }

            function insertIcePolicyPreferences() {
                function onChangeSelectIceSublocation(event) {
                    POLICY_DICT[POLICY_NAME_ICEBERG].initSelectTrapSetup();
                }

                function saveIceSetup(itemIndex, value) {
                    const sublocation = document.getElementById(ID_SELECT_ICE_SUBLOCATION).value;
                    POLICY_DICT[POLICY_NAME_ICEBERG].trapSetups[sublocation][itemIndex] = value;
                    setStorage(STORAGE_TRAP_SETUP_ICE, POLICY_DICT[POLICY_NAME_ICEBERG].trapSetups);
                }

                function saveIceWeapon(event) {
                    saveIceSetup(IDX_WEAPON, event.target.value);
                }

                function saveIceBase(event) {
                    saveIceSetup(IDX_BASE, event.target.value);
                }

                function saveIceBait(event) {
                    saveIceSetup(IDX_BAIT, event.target.value);
                }

                function saveIceTrinket(event) {
                    saveIceSetup(IDX_TRINKET, event.target.value);
                }

                function recommendIceTrapSetup() {
                    POLICY_DICT[POLICY_NAME_ICEBERG].recommendTrapSetup();
                    setStorage(STORAGE_TRAP_SETUP_ICE, POLICY_DICT[POLICY_NAME_ICEBERG].trapSetups);
                }

                function resetIceTrapSetup() {
                    POLICY_DICT[POLICY_NAME_ICEBERG].resetTrapSetups();
                    setStorage(STORAGE_TRAP_SETUP_ICE, POLICY_DICT[POLICY_NAME_ICEBERG].trapSetups);
                    reloadCampPage();
                }

                let tmpTxt;
                const trIceSublocationTrapSetup = policyPreferencesTable.insertRow();
                trIceSublocationTrapSetup.id = ID_TR_ICE_SUBLOCATIONS_TRAP_SETUP;
                trIceSublocationTrapSetup.style.height = "24px";
                trIceSublocationTrapSetup.style.display = "none";
                const captionCell = trIceSublocationTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for ";
                const selectSublocation = document.createElement('select');
                selectSublocation.id = ID_SELECT_ICE_SUBLOCATION;
                selectSublocation.style.fontSize = "90%";
                selectSublocation.style.width = "70px";
                selectSublocation.onchange = onChangeSelectIceSublocation;
                for (const sublocation of ICE_SUBLOCATIONS){
                    const itemOption = document.createElement("option");
                    itemOption.value = sublocation
                    itemOption.text = sublocation
                    selectSublocation.appendChild(itemOption);
                }
                captionCell.appendChild(selectSublocation);
                tmpTxt = document.createTextNode(" :  ");
                captionCell.appendChild(tmpTxt);
                const trapSetupCell = trIceSublocationTrapSetup.insertCell();
                trapSetupCell.appendChild(getSelectWeapon(ID_SELECT_ICE_WEAPON, saveIceWeapon));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBase(ID_SELECT_ICE_BASE, saveIceBase));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectBait(ID_SELECT_ICE_BAIT, saveIceBait));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                trapSetupCell.appendChild(getSelectTrinket(ID_SELECT_ICE_TRINKET, saveIceTrinket));
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                const recommendButton = document.createElement('button');
                recommendButton.onclick = recommendIceTrapSetup;
                recommendButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Recommend");
                recommendButton.appendChild(tmpTxt);
                trapSetupCell.appendChild(recommendButton);
                tmpTxt = document.createTextNode(" ");
                trapSetupCell.appendChild(tmpTxt);
                const resetButton = document.createElement('button');
                resetButton.onclick = resetIceTrapSetup;
                resetButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Reset & Reload");
                resetButton.appendChild(tmpTxt);
                trapSetupCell.appendChild(resetButton);
                tmpTxt = null;
            }

            function insertFWaPolicyPreferences() {
                function onChangeSelectFWaWave(event) {
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].initSelectTrapSetup();
                }

                function saveSoldierSetup(itemIndex, value) {
                    const powerType = document.getElementById(ID_SELECT_FWA_POWER_TYPE).value;
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups[powerType][itemIndex] = value;
                    setStorage(STORAGE_TRAP_SETUP_FWA, POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups);
                }

                function saveFWaSoldierWeapon(event) {
                    saveSoldierSetup(IDX_WEAPON, event.target.value);
                }

                function saveFWaSoldierBase(event) {
                    saveSoldierSetup(IDX_BASE, event.target.value);
                }

                function saveFWaTargetPopulation(event) {
                    const wave = document.getElementById(ID_SELECT_FWA_WAVE).value;
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups[wave][FWA_POPULATION_PRIORITY] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_FWA, POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups);
                }

                function onChangeSelectFWaStreak(event) {
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].initSelectTrapSetup();
                }

                function saveStreakSetup(itemIndex, value) {
                    const streak = document.getElementById(ID_SELECT_FWA_STREAK).value;
                    const wave = document.getElementById(ID_SELECT_FWA_WAVE).value;
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups[wave][streak][itemIndex] = value;
                    setStorage(STORAGE_TRAP_SETUP_FWA, POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups);
                }

                function saveFWaStreakBait(event) {
                    saveStreakSetup(IDX_BAIT, event.target.value);
                }

                function saveFWaStreakCharmType(event) {
                    saveStreakSetup(IDX_CHARM_TYPE, event.target.value);
                }

                function saveFWaStreakSoldierType(event) {
                    saveStreakSetup(IDX_SOLDIER_TYPE, event.target.value);
                }

                function saveFWaLastSoldierBait(event) {
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups[FWA_LAST_SOLDIER][IDX_BAIT] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_FWA, POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups);
                }

                function saveFWaLastSoldierCharmType(event) {
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups[FWA_LAST_SOLDIER][IDX_CHARM_TYPE] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_FWA, POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups);
                }

                function saveFWaArmingWarpathCharm(event) {
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups[FWA_ARMING_CHARM_SUPPORT_RETREAT] = event.target.value;
                    setStorage(STORAGE_TRAP_SETUP_FWA, POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups);
                }

                function onChangeSelectFWaBeforeAfterWardens(event) {
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].initSelectTrapSetup();
                }

                function saveWave4Setup(itemIndex, value) {
                    const status = document.getElementById(ID_SELECT_FWA_BEFORE_AFTER_WARDENS).value;
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups[FWA_WAVE4][status][itemIndex] = value;
                    setStorage(STORAGE_TRAP_SETUP_FWA, POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups);
                }

                function saveFWaWave4Weapon(event) {
                    saveWave4Setup(IDX_WEAPON, event.target.value);
                }

                function saveFWaWave4Base(event) {
                    saveWave4Setup(IDX_BASE, event.target.value);
                }

                function saveFWaWave4Bait(event) {
                    saveWave4Setup(IDX_BAIT, event.target.value);
                }

                function saveFWaWave4Trinket(event) {
                    saveWave4Setup(IDX_TRINKET, event.target.value);
                }

                function recommendFWaTrapSetup() {
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].recommendTrapSetup();
                    setStorage(STORAGE_TRAP_SETUP_FWA, POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups);
                }

                function resetFWaTrapSetup() {
                    POLICY_DICT[POLICY_NAME_FIERY_WARPATH].resetTrapSetups();
                    setStorage(STORAGE_TRAP_SETUP_FWA, POLICY_DICT[POLICY_NAME_FIERY_WARPATH].trapSetups);
                    reloadCampPage();
                }

                let tmpTxt;
                let captionCell;
                const trSelectFWaWave = policyPreferencesTable.insertRow();
                trSelectFWaWave.id = ID_TR_SELECT_FWA_WAVE;
                trSelectFWaWave.style.height = "24px";
                trSelectFWaWave.style.display = "none";
                captionCell = trSelectFWaWave.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Wave :  ";
                const selectFWaWaveCell = trSelectFWaWave.insertCell();
                const selectFWaWave = document.createElement('select');
                selectFWaWave.id = ID_SELECT_FWA_WAVE;
                selectFWaWave.style.fontSize = "90%";
                selectFWaWave.style.width = "70px";
                selectFWaWave.onchange = onChangeSelectFWaWave;
                for (const wave of FWA_WAVES){
                    const itemOption = document.createElement("option");
                    itemOption.value = wave
                    itemOption.text = wave
                    selectFWaWave.appendChild(itemOption);
                }
                selectFWaWaveCell.appendChild(selectFWaWave);
                tmpTxt = document.createTextNode(" ");
                selectFWaWaveCell.appendChild(tmpTxt);
                const recommendButton = document.createElement('button');
                recommendButton.onclick = recommendFWaTrapSetup;
                recommendButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Recommend");
                recommendButton.appendChild(tmpTxt);
                selectFWaWaveCell.appendChild(recommendButton);
                tmpTxt = document.createTextNode(" ");
                selectFWaWaveCell.appendChild(tmpTxt);
                const resetButton = document.createElement('button');
                resetButton.onclick = resetFWaTrapSetup;
                resetButton.style.fontSize = "9px";
                tmpTxt = document.createTextNode("Reset & Reload");
                resetButton.appendChild(tmpTxt);
                selectFWaWaveCell.appendChild(resetButton);

                const trFWaPowerTypesTrapSetup = policyPreferencesTable.insertRow();
                trFWaPowerTypesTrapSetup.id = ID_TR_FWA_POWER_TYPES_TRAP_SETUP;
                trFWaPowerTypesTrapSetup.style.height = "24px";
                trFWaPowerTypesTrapSetup.style.display = "none";
                captionCell = trFWaPowerTypesTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for ";
                const selectFWaPowerType = document.createElement('select');
                selectFWaPowerType.id = ID_SELECT_FWA_POWER_TYPE;
                selectFWaPowerType.style.fontSize = "90%";
                selectFWaPowerType.style.width = "65px";
                selectFWaPowerType.onchange = onChangeSelectFWaWave;
                for (const power_type of FWA_POWER_TYPES){
                    const itemOption = document.createElement("option");
                    itemOption.value = power_type
                    itemOption.text = power_type
                    selectFWaPowerType.appendChild(itemOption);
                }
                captionCell.appendChild(selectFWaPowerType);
                tmpTxt = document.createTextNode(" :  ");
                captionCell.appendChild(tmpTxt);
                const powerTypeTrapSetupCell = trFWaPowerTypesTrapSetup.insertCell();
                powerTypeTrapSetupCell.appendChild(getSelectWeapon(ID_SELECT_FWA_SOLDIER_WEAPON, saveFWaSoldierWeapon));
                tmpTxt = document.createTextNode(" ");
                powerTypeTrapSetupCell.appendChild(tmpTxt);
                powerTypeTrapSetupCell.appendChild(getSelectBase(ID_SELECT_FWA_SOLDIER_BASE, saveFWaSoldierBase));

                const trSelectFWaTargetPopulation = policyPreferencesTable.insertRow();
                trSelectFWaTargetPopulation.id = ID_TR_SELECT_FWA_TARGET_POPULATION;
                trSelectFWaTargetPopulation.style.height = "24px";
                trSelectFWaTargetPopulation.style.display = "none";
                captionCell = trSelectFWaTargetPopulation.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Target Population :  ";
                const selectFWaTargetPopulationCell = trSelectFWaTargetPopulation.insertCell();
                const selectFWaTargetPopulation = document.createElement('select');
                selectFWaTargetPopulation.id = ID_SELECT_FWA_TARGET_POPULATION;
                selectFWaTargetPopulation.style.fontSize = "90%";
                selectFWaTargetPopulation.style.width = "65px";
                selectFWaTargetPopulation.onchange = saveFWaTargetPopulation;
                for (const target_population of FWA_TARGET_POPULATIONS){
                    const itemOption = document.createElement("option");
                    itemOption.value = target_population;
                    itemOption.text = target_population;
                    selectFWaTargetPopulation.appendChild(itemOption);
                }
                selectFWaTargetPopulationCell.appendChild(selectFWaTargetPopulation);

                const trFWaStreaksTrapSetup = policyPreferencesTable.insertRow();
                trFWaStreaksTrapSetup.id = ID_TR_FWA_STREAKS_TRAP_SETUP;
                trFWaStreaksTrapSetup.style.height = "24px";
                trFWaStreaksTrapSetup.style.display = "none";
                captionCell = trFWaStreaksTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for ";
                const selectFWaStreak = document.createElement('select');
                selectFWaStreak.id = ID_SELECT_FWA_STREAK;
                selectFWaStreak.style.fontSize = "90%";
                selectFWaStreak.style.width = "35px";
                selectFWaStreak.onchange = onChangeSelectFWaStreak;
                for (let i = 0; i <= FWA_MAX_STREAKS; i++){
                    const itemOption = document.createElement("option");
                    itemOption.value = i;
                    itemOption.text = i;
                    selectFWaStreak.appendChild(itemOption);
                }
                captionCell.appendChild(selectFWaStreak);
                tmpTxt = document.createTextNode(" :  ");
                captionCell.appendChild(tmpTxt);
                const streakTrapSetupCell = trFWaStreaksTrapSetup.insertCell();
                streakTrapSetupCell.appendChild(getSelectBait(ID_SELECT_FWA_STREAK_BAIT, saveFWaStreakBait));
                tmpTxt = document.createTextNode(" ");
                streakTrapSetupCell.appendChild(tmpTxt);
                const selectFWaStreakCharmType = document.createElement('select');
                selectFWaStreakCharmType.id = ID_SELECT_FWA_STREAK_CHARM_TYPE;
                selectFWaStreakCharmType.style.fontSize = "90%";
                selectFWaStreakCharmType.style.width = "80px";
                selectFWaStreakCharmType.onchange = saveFWaStreakCharmType;
                for (const charmType of FWA_CHARM_TYPES){
                    const itemOption = document.createElement("option");
                    itemOption.value = charmType;
                    itemOption.text = charmType;
                    selectFWaStreakCharmType.appendChild(itemOption);
                }
                selectFWaStreakCharmType.selectedIndex = -1;
                streakTrapSetupCell.appendChild(selectFWaStreakCharmType);
                tmpTxt = document.createTextNode(" ");
                streakTrapSetupCell.appendChild(tmpTxt);
                const selectFWaStreakSoldierType = document.createElement('select');
                selectFWaStreakSoldierType.id = ID_SELECT_FWA_STREAK_SOLDIER_TYPE;
                selectFWaStreakSoldierType.style.fontSize = "90%";
                selectFWaStreakSoldierType.style.width = "80px";
                selectFWaStreakSoldierType.onchange = saveFWaStreakSoldierType;
                for (const soldierType of FWA_STREAK_SOLDIER_TYPES){
                    const itemOption = document.createElement("option");
                    itemOption.value = soldierType;
                    itemOption.text = soldierType;
                    selectFWaStreakSoldierType.appendChild(itemOption);
                }
                selectFWaStreakSoldierType.selectedIndex = -1;
                streakTrapSetupCell.appendChild(selectFWaStreakSoldierType);

                const trFWaLastSoldierTrapSetup = policyPreferencesTable.insertRow();
                trFWaLastSoldierTrapSetup.id = ID_TR_FWA_LAST_SOLDIER_TRAP_SETUP;
                trFWaLastSoldierTrapSetup.style.height = "24px";
                trFWaLastSoldierTrapSetup.style.display = "none";
                captionCell = trFWaLastSoldierTrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup for Last Soldier :  ";
                const lastSoldierTrapSetupCell = trFWaLastSoldierTrapSetup.insertCell();
                lastSoldierTrapSetupCell.appendChild(getSelectBait(ID_SELECT_FWA_LAST_SOLDIER_BAIT, saveFWaLastSoldierBait));
                tmpTxt = document.createTextNode(" ");
                lastSoldierTrapSetupCell.appendChild(tmpTxt);
                const selectFWaLastSoldierCharmType = document.createElement('select');
                selectFWaLastSoldierCharmType.id = ID_SELECT_FWA_LAST_SOLDIER_CHARM_TYPE;
                selectFWaLastSoldierCharmType.style.fontSize = "90%";
                selectFWaLastSoldierCharmType.style.width = "80px";
                selectFWaLastSoldierCharmType.onchange = saveFWaLastSoldierCharmType;
                const itemOption = document.createElement("option");
                itemOption.value = TRINKET_DISARM;
                itemOption.text = TRINKET_DISARM;
                selectFWaLastSoldierCharmType.appendChild(itemOption);
                for (const charmType of FWA_CHARM_TYPES){
                    const itemOption = document.createElement("option");
                    itemOption.value = charmType;
                    itemOption.text = charmType;
                    selectFWaLastSoldierCharmType.appendChild(itemOption);
                }
                selectFWaLastSoldierCharmType.selectedIndex = -1;
                lastSoldierTrapSetupCell.appendChild(selectFWaLastSoldierCharmType);

                const trFWaWhenSupportRetreat = policyPreferencesTable.insertRow();
                trFWaWhenSupportRetreat.id = ID_TR_FWA_WHEN_SUPPORT_RETREAT;
                trFWaWhenSupportRetreat.style.height = "24px";
                trFWaWhenSupportRetreat.style.display = "none";
                captionCell = trFWaWhenSupportRetreat.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "When Support Retreat :  ";
                const trinketArmingCell = trFWaWhenSupportRetreat.insertCell();
                const selectFWaArmingWarpathCharm = document.createElement('select');
                selectFWaArmingWarpathCharm.id = ID_SELECT_FWA_ARMING_WARPATH_CHARM;
                selectFWaArmingWarpathCharm.style.fontSize = "90%";
                selectFWaArmingWarpathCharm.style.width = "60px";
                selectFWaArmingWarpathCharm.onchange = saveFWaArmingWarpathCharm;
                for (const armStatus of TRINKET_ARMING){
                    const itemOption = document.createElement("option");
                    itemOption.value = armStatus;
                    itemOption.text = armStatus;
                    selectFWaArmingWarpathCharm.appendChild(itemOption);
                }
                trinketArmingCell.appendChild(selectFWaArmingWarpathCharm);
                tmpTxt = document.createTextNode("  Warpath Charm");
                trinketArmingCell.appendChild(tmpTxt);

                const trFWaWave4TrapSetup = policyPreferencesTable.insertRow();
                trFWaWave4TrapSetup.id = ID_TR_FWA_WAVE4_TRAP_SETUP;
                trFWaWave4TrapSetup.style.height = "24px";
                trFWaWave4TrapSetup.style.display = "none";
                captionCell = trFWaWave4TrapSetup.insertCell();
                captionCell.className = STYLE_CLASS_NAME_JNK_CAPTION;
                captionCell.innerHTML = "Trap Setup ";
                const selectFWaBeforeAfterWardens = document.createElement('select');
                selectFWaBeforeAfterWardens.id = ID_SELECT_FWA_BEFORE_AFTER_WARDENS;
                selectFWaBeforeAfterWardens.style.fontSize = "90%";
                selectFWaBeforeAfterWardens.style.width = "60px";
                selectFWaBeforeAfterWardens.onchange = onChangeSelectFWaBeforeAfterWardens;
                for (const status of STATUSES){
                    const itemOption = document.createElement("option");
                    itemOption.value = status;
                    itemOption.text = status;
                    selectFWaBeforeAfterWardens.appendChild(itemOption);
                }
                captionCell.appendChild(selectFWaBeforeAfterWardens);
                tmpTxt = document.createTextNode("  Clear Wardens :  ");
                captionCell.appendChild(tmpTxt);
                const wave4TrapSetupCell = trFWaWave4TrapSetup.insertCell();
                wave4TrapSetupCell.appendChild(getSelectWeapon(ID_SELECT_FWA_WAVE4_WEAPON, saveFWaWave4Weapon));
                tmpTxt = document.createTextNode(" ");
                wave4TrapSetupCell.appendChild(tmpTxt);
                wave4TrapSetupCell.appendChild(getSelectBase(ID_SELECT_FWA_WAVE4_BASE, saveFWaWave4Base));
                tmpTxt = document.createTextNode(" ");
                wave4TrapSetupCell.appendChild(tmpTxt);
                wave4TrapSetupCell.appendChild(getSelectBait(ID_SELECT_FWA_WAVE4_BAIT, saveFWaWave4Bait));
                tmpTxt = document.createTextNode(" ");
                wave4TrapSetupCell.appendChild(tmpTxt);
                wave4TrapSetupCell.appendChild(getSelectTrinket(ID_SELECT_FWA_WAVE4_TRINKET, saveFWaWave4Trinket));

                tmpTxt = null;
            }

            let tmpTxt;
            const policyPreferencesTable = document.createElement('table');
            policyPreferencesTable.width = "100%";

            const trEmpty = policyPreferencesTable.insertRow();
            trEmpty.style.height = "4px"

            insertSelectPolicyRow();
            insertARePolicyPreferences();
            insertFRoPolicyPreferences();
            insertSGaPolicyPreferences();
            insertZToPolicyPreferences();
            insertCLiPolicyPreferences();
            insertIcePolicyPreferences();
            insertFWaPolicyPreferences();

            const trLastRow = policyPreferencesTable.insertRow();
            const updateTrapsButtonCell = trLastRow.insertCell();
            const updateTrapsButton = document.createElement('button');
            updateTrapsButton.onclick = updateTraps
            updateTrapsButton.style.fontSize = "10px";
            tmpTxt = document.createTextNode("Update traps");
            updateTrapsButton.appendChild(tmpTxt);
            updateTrapsButtonCell.appendChild(updateTrapsButton);
            const applyButtonCell = trLastRow.insertCell();
            applyButtonCell.style.textAlign = "right";
            const applyPolicyPreferencesButton = document.createElement('button');
            applyPolicyPreferencesButton.onclick = savePolicyPreferences
            applyPolicyPreferencesButton.style.fontSize = "13px";
            tmpTxt = document.createTextNode("Apply & Reload");
            applyPolicyPreferencesButton.appendChild(tmpTxt);
            applyButtonCell.appendChild(applyPolicyPreferencesButton);
            tmpTxt = document.createTextNode("  ");
            applyButtonCell.appendChild(tmpTxt);
            tmpTxt = null;

            return policyPreferencesTable;
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

        preferencesSection.appendChild(preferencesBox);

        separationLine = null;
        blankLine = null;
        tmpTitle = null;

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
        } else if (name == "user.bait_quantity") {
            return unsafeWindow.user.bait_quantity;
        } else if (name == "user.environment_name") {
            return unsafeWindow.user.environment_name;
        } else if (name == "user.title_name") {
            return unsafeWindow.user.title_name;
        } else if (name == "user.quests.QuestHarbour.status") {
            return unsafeWindow.user.quests.QuestHarbour.status;
        } else if (name == "user.quests.QuestHarbour.can_claim") {
            return unsafeWindow.user.quests.QuestHarbour.can_claim;
        } else if (name == "user.quests.QuestClawShotCity.phase") {
            return unsafeWindow.user.quests.QuestClawShotCity.phase;
        } else if (name == "user.quests.QuestFortRox.current_stage") {
            return unsafeWindow.user.quests.QuestFortRox.current_stage;
        }

        if (DEBUG_MODE) console.log('GPV other: ' + name + ' not found.');
        return 'ERROR';
    } catch (e) {
        if (DEBUG_MODE) console.log('GPV ALL try block error: ' + e);
    } finally {
        name = undefined;
    }
}
