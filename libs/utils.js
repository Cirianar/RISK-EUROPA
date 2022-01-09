import { styleMap } from "./map.js";

const attackingVariables = {
    countryDataArray: null,
    invasionPhase: 0, // 1 == Selecting tile to invade from (base tile), 2 == Selecting tile to attack
    baseTile: null, // Tile to attack from
    attackTile: null, // Tile which gets attacked
    attackTTP: "Select tile to attack from!",
    error: "",
    attackerWon: false,
    currentPlayer: null,
    listPlayers: null,
    map: null,
    reset: function() {
        this.invasionPhase = 0;
        this.attackTTP = "Select tile to attack from!";
        this.error = "";
    }
}

const diceBoxVariables = {
    rollBtn: null,
    cancelBtn: null,

    attackSuccessPct: 0.0,
    resultAttackCasualties: 0,
    resultDefenseCasualties: 0,
    resultText: "",
    reset: function() {
        this.resultText = "";
        this.resultAttackCasualties = 0;
        this.resultDefenseCasualties = 0;
        this.attackSuccessPct = 0.0;
    }
}

const updateHTML = {
    /* HTML INFO CLASSES
    - player
        - AI_info
        - hP_info
    - deployment
    - game_state_info
    - tile_info
    */

    updatePlayerText: function(player) {
        if (player.isAI == false) { 
            const infoboxPlayer = d3.select(".hP_info"); 

            infoboxPlayer.select("#troopGain").html(`Troop gain: <span>${player.troopBaseGain}</span>`);
            infoboxPlayer.select("#deployedTroops").html(`Troops deployed: <span>${player.troopsDeployed}</span>`);
            infoboxPlayer.select("#tilesOwned").html(`Tiles owned: <span>${player.totalTerritoriesControlled}</span>`);

        } else if (player.isAI == true) { 
            const infoboxPlayer = d3.select(".AI_info"); 

            infoboxPlayer.select("#deployedTroops").html(`Troops deployed: <span>${player.troopsDeployed}</span>`);
            infoboxPlayer.select("#tilesOwned").html(`Tiles owned: <span>${player.totalTerritoriesControlled}</span>`);
        } 
    },
    updateTileText: function(clickedTile) {
        const infoboxPlayer = d3.select(".tile_info"); 

        infoboxPlayer.select("#tile").html(clickedTile.name);
        infoboxPlayer.select("#owner").html(`Owned by: <span>${clickedTile.controller}</span>`);
        infoboxPlayer.select("#troopCount").html(`Troops on tile: <span>${clickedTile.troopCount}</span>`);

    },
    updateGameStateText: function(turnPlayer) {
        const infoboxGame = d3.select(".game_state_info");
        let gameStateStr;

        switch (turnPlayer.gameStateFlag) {
            case 0:
                gameStateStr = "Game not started";
                break;
            case 1:
                gameStateStr = "Deployment phase"
                break;
            case 2:
                gameStateStr = "Attacking phase"
                break;
            default:
                gameStateStr = "Game not started";
                break;
        }

        infoboxGame.select("#turn").html(`Who's turn: <span>${turnPlayer.factionName}</span>`);
        infoboxGame.select("#phase").html(`Turn's phase: <span>${gameStateStr}</span>`);
    },
    updateTurnInfoBox: function(turnPlayer, error) {
        const deploymentInfo = d3.select(".deployment");
        const attackInfo = d3.select(".attack");

        if (turnPlayer.gameStateFlag == 1) {
            deploymentInfo.style("visibility", "visible");
            deploymentInfo.select("#troopReserve").html(`Troop reserve: <span>${turnPlayer.troopBaseGain}</span>`);
            deploymentInfo.select("#info").html(`You can deploy <span>${turnPlayer.troopBaseGain}</span> troops from <span>${turnPlayer.totalTerritoriesControlled}</span> number of territories. By clicking on a tile you add 1 troop to it.`);
            deploymentInfo.select("#error").html(error);
        } else {
            deploymentInfo.style("visibility", "hidden");
        }
        
        if (turnPlayer.gameStateFlag == 2) {
            attackInfo.style("visibility", "visible");
            attackInfo.select("#invasionPhase").html(attackingVariables.attackTTP);

            attackInfo.select("#error").html(error);
        } else {
            attackInfo.style("visibility", "hidden");
        }
    },
    updateDiceBox: function(visibility) {
        const diceBox = d3.select("#diceBox");
        const baseTileInfo = diceBox.select("#baseTileInfo");
        const invadeTileInfo = diceBox.select("#invadeTileInfo");
        let attackerTroopCount;
        let defenderTroopCount;
        
        diceBox.style("visibility", visibility);
        
        if (attackingVariables.attackerWon == true) {
            attackerTroopCount = attackingVariables.baseTile.troopCount + attackingVariables.attackTile.troopCount;
            defenderTroopCount = 0;
            attackingVariables.attackerWon = false;
        } else {
            attackerTroopCount = attackingVariables.baseTile.troopCount;
            defenderTroopCount = attackingVariables.attackTile.troopCount;
        }
        baseTileInfo.select("#troops").html(`Troops: <span>${attackerTroopCount}</span>`);
        invadeTileInfo.select("#troops").html(`Troops: <span>${defenderTroopCount}</span>`);

        baseTileInfo.select("#name").html(`${attackingVariables.baseTile.name} (attackers)`);
        invadeTileInfo.select("#name").html(`${attackingVariables.attackTile.name} (defenders)`);

        diceBox.select("h2").html(diceBoxVariables.resultText);
    },
    updateAll: function(countryDataArray, listPlayers, player) {

        // Loops through the player objects participating in the game and executes shared functions updating HTML
        for (let i = 0; i < listPlayers.length; i++) {
            const element = listPlayers[i];
            
            element.calculateBaseStats(countryDataArray);
            updateHTML.updatePlayerText(element);
        }

        // Updates game state infobox HTML
        updateHTML.updateGameStateText(player)
        updateHTML.updateTurnInfoBox(player);
    },
    updateHideScreen: function(visibility, result) {
        const hideScreenEL = d3.select("#end_screen")
        hideScreenEL.select("h2").html(result)
        hideScreenEL.style("visibility", visibility)
    }
}

const riskEvent = {
    map: {
        selectedTile: class {
            constructor(dataArray, svgIndex) { // Constructs a tile object from the svg tile
                this.tileGameInfo = dataArray.filter(e => e.includes(svgIndex.properties.name));

                this.DOM = d3.select("."+svgIndex.properties.name);
                this.id = this.tileGameInfo[0][0];
                this.name = this.tileGameInfo[0][1];
                this.controller = this.tileGameInfo[0][2];
                this.adjacencies = this.tileGameInfo[0][3];
                this.troopCount = this.tileGameInfo[0][4];
            }
        },
        iteratedTile: class { // Constructs a tile object from the countryDataArray element
            constructor(dataArrayElement) {
                this.DOM = d3.select("."+dataArrayElement[1]);
                this.id = dataArrayElement[0];
                this.name = dataArrayElement[1];
                this.controller = dataArrayElement[2];
                this.adjacencies = dataArrayElement[3];
                this.troopCount = dataArrayElement[4];
            }
        },
        hover: {
            enterElement: {
                style: function(hoveredTile, clickedTile) {
                    if (clickedTile) {
                        if (clickedTile.name!=hoveredTile.name) {
                            hoveredTile.DOM.style("stroke-width", "3px");
                        }
                    }
                    else if (!clickedTile) {
                        hoveredTile.DOM.style("stroke-width", "3px");
                    }
                }
            },
            exitElement: {
                style: function(hoveredTile, clickedTile) {
                    if (clickedTile) {
                        if (clickedTile.name!=hoveredTile.name) {
                            hoveredTile.DOM.style("stroke-width", "1px");
                        }
                    }
                    else if (!clickedTile) {
                        hoveredTile.DOM.style("stroke-width", "1px");
                    }
                }
            },
        },
        click: {
            style: function(clickedTile) {
                switch (clickedTile.controller) {
                    case "Allies":
                        clickedTile.DOM
                            .style("filter", "brightness(1.5)")
                            .style("stroke-width", "5px")
                            .style("stroke", "rgb(0, 82, 102)"); 
                        break;
                    case "Axis":
                        clickedTile.DOM
                            .style("filter", "brightness(1.5)")
                            .style("stroke-width", "5px")
                            .style("stroke", "rgb(128, 0, 0)");
                        break;
                }
            },
            deployTroops: function(dataArray, player, clickedTile) {
                if (clickedTile.controller == player.factionName) {
                    if (player.troopBaseGain > 0) {
                        player.troopBaseGain = player.troopBaseGain - 1;

                        dataArray.forEach(element => {
                            if (element == clickedTile.tileGameInfo[0]) {
                                ++element[4];
                                ++clickedTile.troopCount;
                            }
                        });
                        updateHTML.updateTurnInfoBox(player);
                    }
                    else {
                        let error = `You have no troops left in reserve to deploy!<br><span>Click "Next Phase" button to proceed</span>`;
                        updateHTML.updateTurnInfoBox(player, error);
                    }
                }
                else {
                    let error = `You (${player.factionName}) do not own this tile!`;
                    updateHTML.updateTurnInfoBox(player, error);
                }
            },
            attackTile: function(dataArray, currentPlayer, enemyPlayer, clickedTile) {
                function selectBaseTile() {
                    if (clickedTile.troopCount > 1) {
                        attackingVariables.error = "";
    
                        attackingVariables.baseTile = clickedTile;

                        attackingVariables.attackTTP = `From <span>${attackingVariables.baseTile.name}</span>`;
                        updateHTML.updateTurnInfoBox(currentPlayer, attackingVariables.error);
                    } else {
                        attackingVariables.error = `This tile (${clickedTile.name}) does not have more than 1 troop on it and so can not be used as a base of operations!`
                        updateHTML.updateTurnInfoBox(currentPlayer, attackingVariables.error);
                    }
                }

                function selectAttackTile() {
                    if (attackingVariables.baseTile.adjacencies.includes(clickedTile.name)) {
                        attackingVariables.error = "";

                        attackingVariables.attackTile = clickedTile;

                        attackingVariables.attackTTP = `From <span>${attackingVariables.baseTile.name}</span> invade <span>${attackingVariables.attackTile.name}</span>`;
                        updateHTML.updateTurnInfoBox(currentPlayer, attackingVariables.error);
                    } else {
                        attackingVariables.error = `This tile (${clickedTile.name}) does not border the base invasion tile (${attackingVariables.baseTile.name})!`
                        updateHTML.updateTurnInfoBox(currentPlayer, attackingVariables.error);

                        attackingVariables.invasionPhase = 1;
                    }
                }

                if (clickedTile.controller == currentPlayer.factionName) {
                    if (attackingVariables.invasionPhase == 0) {
                        ++attackingVariables.invasionPhase;
                        selectBaseTile();
                    } else if (attackingVariables.invasionPhase == 1) {
                        selectBaseTile();
                    }
                    else if (attackingVariables.invasionPhase == 2) {
                        --attackingVariables.invasionPhase;
                        selectBaseTile();
                    } else {
                        console.log(`Variable attacking Variables.invasionPhase is set to invalid value: ${attackingVariables.invasionPhase}`);
                    }
                } else if (clickedTile.controller == enemyPlayer.factionName) {
                    if (attackingVariables.invasionPhase == 0) {
                        attackingVariables.error = `This tile (${clickedTile.name}) is not owned by the you and so can not be used as a base to attack from!`
                        updateHTML.updateTurnInfoBox(currentPlayer, attackingVariables.error);
                    } else if (attackingVariables.invasionPhase == 1) {
                        ++attackingVariables.invasionPhase;
                        selectAttackTile();
                    } else if (attackingVariables.invasionPhase == 2) {
                        selectAttackTile();
                    } else {
                        console.log(`Variable attacking Variables.invasionPhase is set to invalid value: ${attackingVariables.invasionPhase}`);
                    }
                }
            },
            diceButtons: {
                roll: function() {
                    console.log(`CLICKED BUTTON ${diceBoxVariables.rollBtn.getAttribute("value")}`);
                    if (diceBoxVariables.rollBtn.getAttribute("value") == "ROLL") {

                        let resultsBool = false;

                        // Variables for dice roll
                        let attackTroops = attackingVariables.baseTile.troopCount - 1; // if player wins => invasion + support troops
                        let invasionTroops = 0; // Troops which attack and move into the invaded tile
                        let supportTroops = 0; // Troops which support the attack but stay on the base tile

                        let defenseTroops = attackingVariables.attackTile.troopCount;
                        let baseTotal = attackTroops + defenseTroops;
                        diceBoxVariables.attackSuccessPct = attackTroops / baseTotal;

                        // insert per troop num
                        while (attackTroops > 0 && defenseTroops > 0) {
                            resultsBool = Math.random() < diceBoxVariables.attackSuccessPct;
                            if (resultsBool == true) {
                                --defenseTroops;
                            } else if (resultsBool == false) {
                                --attackTroops;
                            }
                        }

                        invasionTroops = attackTroops;
                        supportTroops = attackTroops;

                        // Sets global variables
                        diceBoxVariables.resultAttackCasualties = attackingVariables.baseTile.troopCount - 1 - attackTroops;
                        diceBoxVariables.resultDefenseCasualties = attackingVariables.attackTile.troopCount - defenseTroops;

                        if (defenseTroops == 0) {
                            invasionTroops = Math.round(invasionTroops/2);
                            supportTroops = supportTroops - invasionTroops + 1;

                            attackingVariables.baseTile.troopCount = supportTroops;
                            attackingVariables.attackTile.troopCount = invasionTroops;
                            console.log("Support troops: ", attackingVariables.baseTile.troopCount)

                            attackingVariables.countryDataArray.forEach(element => {
                                if (element[1] == attackingVariables.attackTile.name) {
                                    element[2] = attackingVariables.currentPlayer.factionName;
                                    element[4] = invasionTroops;

                                    console.log("Invasion troops: ", element[4])
                                }
                            });

                            attackingVariables.attackerWon = true;
                        } else {
                            attackingVariables.baseTile.troopCount = attackTroops + 1;
                            attackingVariables.attackTile.troopCount = defenseTroops;
                        }

                        // Updates tile troop count
                        attackingVariables.countryDataArray.forEach(element => {
                            if (element[1] == attackingVariables.baseTile.name) {
                                element[4] = attackingVariables.baseTile.troopCount;
                            } else if (element[1] == attackingVariables.attackTile.name) {
                                element[4] = attackingVariables.attackTile.troopCount;
                            }
                        });

                        // Updates tile overlord

                        // Updates cosmetic text
                        if (defenseTroops == 0) {
                            diceBoxVariables.resultText = `Attacker (you) WINS with <span>${diceBoxVariables.resultAttackCasualties}</span> casualties.<br><span>${attackingVariables.baseTile.troopCount}</span> will stay on the attackers tile.<br><span>${attackingVariables.attackTile.troopCount}</span> will move into the defenders tile.`;
                        } else if (attackTroops == 0) {
                            diceBoxVariables.resultText = `Attacker (you) LOSE with <span>${attackingVariables.baseTile.troopCount}</span> troops left over.`;
                        }

                        updateHTML.updateDiceBox("visible");

                        diceBoxVariables.rollBtn.setAttribute("value", "FINISH");
                    }
                    else if (diceBoxVariables.rollBtn.getAttribute("value") == "FINISH") {

                        diceBoxVariables.rollBtn.setAttribute("value", "ROLL");
                        styleMap(attackingVariables.map, attackingVariables.countryDataArray);

                        attackingVariables.reset();
                        updateHTML.updateDiceBox("hidden");
                        updateHTML.updateAll(attackingVariables.countryDataArray, attackingVariables.listPlayers, attackingVariables.currentPlayer);
                    }
                },
                cancel: function() {
                    if (diceBoxVariables.rollBtn.getAttribute("value") == "ROLL") {
                        attackingVariables.reset();
                        updateHTML.updateDiceBox("hidden");
                        updateHTML.updateTurnInfoBox(attackingVariables.currentPlayer, attackingVariables.error);
                    }
                }
            },
            rollDice: function() {
                document.getElementById("diceBox").style.visibility = "visible";

                diceBoxVariables.rollBtn = document.getElementById("rollDice");
                diceBoxVariables.cancelBtn = document.getElementById("cancelRoll");
                
                diceBoxVariables.reset();
                updateHTML.updateDiceBox("visible");
            
                diceBoxVariables.rollBtn.addEventListener("click", this.diceButtons.roll);

                diceBoxVariables.cancelBtn.addEventListener("click", this.diceButtons.cancel);
            }
        }
    },
    html: {
        clickNextPhaseBtn: function(countryDataArray, listPlayers, currentPlayerTurn) {
            const button = document.getElementById("nextPhase");
            
            button.addEventListener("click", () => {
                if (currentPlayerTurn.gameStateFlag == 0) {
                    ++currentPlayerTurn.gameStateFlag;
                } else if (currentPlayerTurn.gameStateFlag == 1) {
                    ++currentPlayerTurn.gameStateFlag;

                    attackingVariables.currentPlayer = currentPlayerTurn;
                    attackingVariables.listPlayers = listPlayers;

                    this.clickStartAttackBtn();

                    button.value = "End Turn";
                } else if (currentPlayerTurn.gameStateFlag == 2) {
                    aiTurn.aiPlayer = listPlayers[1];
                    aiTurn.humanPlayer = listPlayers[0];
                    aiTurn.countryDataArray = countryDataArray;

                    aiTurn.executeAiTurn();

                    if (aiTurn.aiPlayer.totalTerritoriesControlled < 10) {
                        updateHTML.updateHideScreen("visible", "You Won!<br>Reload the page to play again");
                    }
                }
                updateHTML.updateAll(countryDataArray, listPlayers, currentPlayerTurn);
            });
        },
        clickStartAttackBtn: function() {
            const button = document.getElementById("startAttack");
            button.addEventListener("click", () => {
                if (attackingVariables.invasionPhase == 2 && attackingVariables.baseTile != null && attackingVariables.attackTile != null && attackingVariables.error == "") {

                    riskEvent.map.click.rollDice();
                }
            });
        }
    }
}

const aiTurn = {
    aiPlayer: null,
    humanPlayer: null,
    countryDataArray: null,

    weights: {
        deployTroops: {
            inputs: {
                currentTile: null,
                enemyBorderingTiles: [],
            },
            borderingEnemy: 10,
            borderingEnemyMultiplier: 2,
            enemyTroopCountLow: 1.5,
            enemyTroopCountHigh: 25
        }
    },

    doDeployTroops: function() {
        // Abbreviations
        let cdArr = this.countryDataArray;
        let dt = this.weights.deployTroops;

        // Vars
        let reserveTroops = this.aiPlayer.troopBaseGain;
        let factor = 0;
        let troopPlacementArray = [];

        for (let i = 0; i < cdArr.length; i++) {
            const element = cdArr[i];
            factor = 0;

            if (element[2] == this.aiPlayer.factionName) {
                dt.inputs.currentTile = new riskEvent.map.iteratedTile(element);
                dt.inputs.enemyBorderingTiles = (function() {
                    let adjacencies = [];

                    for (let i = 0; i < dt.inputs.currentTile.adjacencies.length; i++) {
                        let adjacency = dt.inputs.currentTile.adjacencies[i];

                        cdArr.forEach(e => {
                            if (e[1] == adjacency && e[2] != element[2]) {
                                adjacency = new riskEvent.map.iteratedTile(e);
                                adjacencies.push(adjacency);
                            }
                        });
                    }

                    return adjacencies;
                })();

                if (dt.inputs.enemyBorderingTiles.length > 0) {

                    let highestEnemyTileTroopCount = (function() {
                        let highest = 0;
    
                        dt.inputs.enemyBorderingTiles.forEach(e => {
                            if (e.troopCount > highest) {
                                highest = e.troopCount
                            }
                        })
    
                        return highest;
                    })();
                    let aiToEnemyTroopRatio = dt.inputs.currentTile.troopCount / highestEnemyTileTroopCount;

                    factor = dt.borderingEnemy;
                    if (dt.inputs.enemyBorderingTiles.length > 1) {
                        factor = factor + dt.inputs.enemyBorderingTiles.length * dt.borderingEnemyMultiplier;
                    }
                    if (aiToEnemyTroopRatio >= 3) { // AI has more troops than enemy
                        factor = factor + aiToEnemyTroopRatio * dt.enemyTroopCountLow;
                    }
                    if (aiToEnemyTroopRatio <= 0.3) { // AI has less troops than enemy
                        factor = factor + aiToEnemyTroopRatio * dt.enemyTroopCountHigh;
                    }

                    // console.log(`${dt.inputs.currentTile.name}: ${factor}\nHighest enemy troops: ${highestEnemyTileTroopCount}\nAI/Human troop ratio: ${aiToEnemyTroopRatio}\nBordering tiles: `, dt.inputs.enemyBorderingTiles)
                    // console.log(cdArr)
                    // console.log(factor)
                    troopPlacementArray.push([factor, dt.inputs.currentTile.name]);
                }
            }
        }

        
        troopPlacementArray.sort(function(a, b){return b[0]-a[0]}); // Decending order
        troopPlacementArray = troopPlacementArray.splice(0, Math.floor(troopPlacementArray.length / 2));
 
        troopPlacementArray.forEach(element => {
            element[0] = 0;
        });

        while (reserveTroops > 0) {
            troopPlacementArray.forEach(element => {
                if (reserveTroops > 0) {
                    element[0] += 1; 
                    --reserveTroops;
                }
            });
        }
        
        troopPlacementArray.forEach(element => {
            cdArr.forEach(tile => {
                if (tile[1] == element[1]) {
                    tile[4] = tile[4] + element[0];
                }
            });
        });

        // console.log(troopPlacementArray)

        styleMap(attackingVariables.map, attackingVariables.countryDataArray);
    },
    calcAttackTiles: function() {
        let cdArr = this.countryDataArray;
        let tilesToInvade = [];

        for (let i = 0; i < cdArr.length; i++) {
            const element = cdArr[i];
            let currentTile = new Object;
            let enemyBorderingTiles = new Object;

            if (element[2] == this.aiPlayer.factionName) {
                currentTile = new riskEvent.map.iteratedTile(element);
                enemyBorderingTiles = (function() {
                    let adjacencies = [];

                    for (let i = 0; i < currentTile.adjacencies.length; i++) {
                        let adjacency = currentTile.adjacencies[i];

                        cdArr.forEach(e => {
                            if (e[1] == adjacency && e[2] != element[2]) {
                                adjacency = new riskEvent.map.iteratedTile(e);
                                adjacencies.push(adjacency);
                            }
                        });
                    }

                    return adjacencies;
                })();

                if (enemyBorderingTiles.length > 0) {
                    let highestEnemyTileTroop = (function() {
                        let troop = 0;
                        let tile = "";
    
                        enemyBorderingTiles.forEach(e => {
                            if (e.troopCount > troop) {
                                troop = e.troopCount
                                tile = e
                            }
                        })

                        return [tile, troop];
                    })();

                    let aiToEnemyTroopRatio = currentTile.troopCount / highestEnemyTileTroop[1];


                    if (aiToEnemyTroopRatio >= 1.5 && currentTile.troopCount >= 2) {
                        tilesToInvade.push([currentTile, highestEnemyTileTroop[0]])
                    }
                }
            }
        }

        // console.log(tilesToInvade)

        return tilesToInvade
    },
    doAttackTiles: function(tilesToInvade) {
        for (let i = 0; i < tilesToInvade.length; i++) {
            let resultsBool = false;
            let baseTile = tilesToInvade[i][0];
            let attackTile = tilesToInvade[i][1];
            // Variables for dice roll
            let attackTroops = baseTile.troopCount - 1; // if player wins => invasion + support troops
            let defenseTroops = attackTile.troopCount;
            let baseTotal = attackTroops + defenseTroops;
            let attackSuccessPct = attackTroops / baseTotal;

            let invasionTroops = 0; // Troops which attack and move into the invaded tile
            let supportTroops = 0; // Troops which support the attack but stay on the base tile
            

            // insert per troop num
            while (attackTroops > 0 && defenseTroops > 0) {
                resultsBool = Math.random() < attackSuccessPct;
                if (resultsBool == true) {
                    --defenseTroops;
                } else if (resultsBool == false) {
                    --attackTroops;
                }
            }

            invasionTroops = attackTroops;
            supportTroops = attackTroops;

            if (defenseTroops == 0) {
                invasionTroops = Math.round(invasionTroops/2);
                supportTroops = supportTroops - invasionTroops + 1;

                baseTile.troopCount = supportTroops;
                attackTile.troopCount = invasionTroops;

                this.countryDataArray.forEach(element => {
                    if (element[1] == attackTile.name) {
                        element[2] = "Axis";
                    }
                });
                console.log("Won! ", baseTile.name)

            } else {
                baseTile.troopCount = attackTroops + 1;
                attackTile.troopCount = defenseTroops;

                console.log("Lost! ", baseTile.name)
            }

            // Updates tile troop count
            this.countryDataArray.forEach(element => {
                if (element[1] == baseTile.name) {
                    element[4] = baseTile.troopCount;
                } else if (element[1] == attackTile.name) {
                    element[4] = attackTile.troopCount;
                }
            });
        }
        styleMap(attackingVariables.map, attackingVariables.countryDataArray);
    },

    executeAiTurn: function() {
        // updateHTML.updateHideScreen("visible")
        this.doDeployTroops();

        let tilesToInvade = this.calcAttackTiles();
        this.doAttackTiles(tilesToInvade);

        // updateHTML.updateHideScreen("hidden");


        // Start human turn again or somin
        updateHTML.updateAll(attackingVariables.countryDataArray, attackingVariables.listPlayers, attackingVariables.currentPlayer);
        attackingVariables.currentPlayer.gameStateFlag = 1;
        document.getElementById("nextPhase").value = "Next Phase";
        if (attackingVariables.currentPlayer.totalTerritoriesControlled < 10) {
            updateHTML.updateHideScreen("visible", "You Lost!<br>Reload the page to play again");
        }
        
    }
}

function start() {
    console.log("Start: ", Date.now());
}
function finish() {
    console.log("Finish: ", Date.now());
}

function wait(ms) {
    let start = Date.now(), now = start;
    while (now - start < ms) {
        now = Date.now();
    }
}

export { updateHTML, riskEvent, attackingVariables };