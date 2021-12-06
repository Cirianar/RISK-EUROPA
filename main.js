/*

===IMPORT STRUCTURE===
main.js
|---map.js
    |---utils.js
|---player.js
    |---map.js
    |---utils.js
|---utils.js

*/

import { generateCountryData, drawMap } from "./libs/map.js";
import { Player, gameFlow } from "./libs/player.js";

/* 
===ALL VARIBALES FOR GAME===
Country-data array[DIM: 58x4]
    ∋ [n][0] = ID (INT)
    ∋ [n][1] = Name (STR)
    ∋ [n][2] = Factional Overlord (BIN => STR)
    ∋ [n][3] = Adjacencies (INT ∈ ARR)
    ∋ [n][4] = Troop Count (INT)

Player object:
    Human/AI: Is AI? BOOL.
    Human/AI: Faction name
    Human/AI: Troops
    Human/AI: Tiles owned
    Human/AI: Troop gain per turn
    Human/AI: Game State Flag
        - 0 = Not started
        - 1 = Deployment phase
        - 2 = Attack Phase
    Human/AI: Tiles owned array
*/

// Defining player object constants
const playerHuman = new Player(false, "Allies");
const playerAI = new Player(true, "Axis");
const listPlayers = [ playerHuman, playerAI ]

let currentPlayer;
let enemyPlayer;

// MAIN RUN FUNCTION
generateCountryData().then(countryDataArray => {
    drawMap(countryDataArray).then(map => {
        currentPlayer = playerHuman;
        enemyPlayer = playerAI;
        gameFlow.humanTurn(countryDataArray, map, listPlayers, currentPlayer, enemyPlayer);
    });
});

