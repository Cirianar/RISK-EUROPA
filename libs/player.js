import { executeMapEvents } from "./map.js";
import { updateHTML, riskEvent, attackingVariables } from "./utils.js";

// Encapsulates generic player properties and methods so that seperate human and ai objects can be created in main.js 
class Player {
    constructor(isAIBool, factionTag) {
        this.isAI = isAIBool;

        this.factionName = factionTag;

        this.gameStateFlag = 0;
        // 0 = Not started
        // 1 = Deployment phase
        // 2 = Attack Phase

        this.territoriesControlledArray = [];
        this.totalTerritoriesControlled;
        this.troopsDeployed = 0
        this.troopBaseGain = 0;
    }
    
    // Calculates the 3 bases variables required for game flow
    calculateBaseStats(countryDataArray) {
        this.territoriesControlledArray = [];
        this.totalTerritoriesControlled;
        this.troopsDeployed = 0
        this.troopBaseGain = 0;

        // CALC NUM TERRITORIES CONTROLLED
        countryDataArray.forEach(element => {
            if (element[2] == this.factionName) {
                this.territoriesControlledArray.push(element);
            }
        });

        this.totalTerritoriesControlled = this.territoriesControlledArray.length;
        
        // CALC TROOP GAIN
        this.troopBaseGain = Math.round(this.totalTerritoriesControlled / 4);
        if (this.troopBaseGain < 3) { this.troopBaseGain = 3 };

        // CALC TROOP COUNT
        this.territoriesControlledArray.forEach(element => {
            this.troopsDeployed = this.troopsDeployed + element[4];
        });
    }
    
}

// Object storing functions which relate to the game meachnics and turn based playing (refer to flow chart)
const gameFlow = {
    humanTurn: function(countryDataArray, map, listPlayers, currentPlayer, enemyPlayer) {
        attackingVariables.map = map;
        attackingVariables.countryDataArray = countryDataArray;
        riskEvent.html.clickNextPhaseBtn(countryDataArray, listPlayers, currentPlayer);
        executeMapEvents(countryDataArray, map, currentPlayer, enemyPlayer);

        currentPlayer.gameStateFlag = 1;

        updateHTML.updateAll(countryDataArray, listPlayers, currentPlayer);
    }
}

export { Player, gameFlow };