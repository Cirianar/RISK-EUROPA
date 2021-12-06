import { updateHTML, riskEvent } from "./utils.js";

// HTML constants
const CONTAINER = d3.select(".map_container");
const PATH = d3.geoPath();

// Dynamic variables
let svgWidth = screen.width;
let svgHeight = screen.height;

// SVG format variables
let svg = CONTAINER.append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight)
                .attr("viewBox", "-500 -850 2500 950"); // ViewBox = (x, y, width, height)
let g = svg.append("g")
                .attr("id", "svgMap")
                .attr("transform", "scale("+0.83+","+-0.83+") translate("+470+","+1415+")"); // Scale (0.9, -0.9) => Translate (x, y)

// Local variables used in drawMap()
let alliesColour = "rgb(90, 185, 232)";
let axisColour = "rgb(212, 61, 81)";
let prevTile;
let clickedTile;

// ASync function which converts the CSV file into an array (country-data array) which stores map variables related to the game
async function generateCountryData() {
        
        // Gets CSV data and turns it into an object
        let csvData = await d3.csv("./data/data.csv", d => {
                return {
                        "id" : +d["id"], // The '+' turns a string into a number
                        "country" : d["name"],
                        "faction" : +d["overlord"],
                        "adjacencies" : d["adjacencies"]
                }
        });

        // Turns reulting object into an array
        let dataArray = csvData.map(Object.values);

        // Adds 2 troops to each tile and change the binary data format of the "faction" column into strings
        for (let i = 0; i < dataArray.length; i++) {
                dataArray[i].push(2); 
                
                if (dataArray[i][2] == 1) {
                        dataArray[i][2] = "Allies";
                } else if (dataArray[i][2] == 0) {
                        dataArray[i][2] = "Axis";
                }
        }

        // Parses the string containing the adjacencies into seperate integer values
        // Places the output into an array which is nested into the 3rd index of element "i" in the array
        for (let i = 0; i < dataArray.length; i++) {
                let adjacenciesArray = dataArray[i][3];
                
                adjacenciesArray = adjacenciesArray.split(",");
                if (adjacenciesArray == "\r\n") {
                        adjacenciesArray = false;
                }
                dataArray[i][3] = adjacenciesArray;
        }

        return dataArray;
}

// Function that draws the map from the .json file and the country-data array
async function drawMap(dataArray){
        let mapData = await d3.json("./data/risk_map.json");

        let map = g.selectAll("path")
                        .data(topojson.feature(mapData, mapData.objects.map).features)
                        .enter().append("path")
                                .attr("d", PATH)
                                .attr("class", (d, i) => {
                                        return d.properties.name; // Sets the id of each HTML tile element to the id of the tile
                                });

        styleMap(map, dataArray);
        return map;
}

function styleMap(map, dataArray) {
        map.style("fill", (d, i) => {
                let tile = new riskEvent.map.selectedTile(dataArray, d)
                // AI is axis
                if (tile.controller == "Allies") {
                        // Allies
                        return alliesColour; // Aqua
                }
                else if (tile.controller == "Axis") {
                        // Axis
                        return axisColour; // Red
                }
        });
        map.style("fill-opacity", (d, i) => {
                let pathElement = dataArray.filter(e => e.includes(d.properties.name));
                let fillOpacity = 0.05;

                if (pathElement[0][4] > 0) {
                        fillOpacity =  pathElement[0][4] / 10;
                }
                return fillOpacity;
        });
}

function executeMapEvents(dataArray, map, currentPlayer, enemyPlayer) {
        map.on("mouseenter", (d, i) =>{
                let hoveredTile = new riskEvent.map.selectedTile(dataArray, i)

                riskEvent.map.hover.enterElement.style(hoveredTile, clickedTile)
        });
        map.on("mouseout", (d, i) =>{
                let hoveredTile = new riskEvent.map.selectedTile(dataArray, i)

                riskEvent.map.hover.exitElement.style(hoveredTile, clickedTile)
        });
        map.on("click", (d, i) =>{
                clickedTile = new riskEvent.map.selectedTile(dataArray, i)

                if (prevTile == null) {
                        riskEvent.map.click.style(clickedTile);

                        prevTile = clickedTile;
                } else if (prevTile.name != clickedTile.name) { // Resets the tiles colour which has been previously selected
                        switch (prevTile.controller) { // Faction name of who controls the previous tile
                                case "Allies":
                                        prevTile.DOM
                                                .style("filter", "brightness(0.7)")
                                                .style("stroke-width", "1px")
                                                .style("stroke", "black"); 
                                        break;
                                case "Axis":
                                        prevTile.DOM
                                                .style("filter", "brightness(0.7)")
                                                .style("stroke-width", "1px")
                                                .style("stroke", "black"); 
                                        break;
                        }
                        riskEvent.map.click.style(clickedTile);

                        prevTile = clickedTile;
                }

                if (currentPlayer.gameStateFlag == 1) {
                        riskEvent.map.click.deployTroops(dataArray, currentPlayer, clickedTile);
                        styleMap(map, dataArray);
                } else if (currentPlayer.gameStateFlag == 2) {
                        riskEvent.map.click.attackTile(dataArray, currentPlayer, enemyPlayer, clickedTile);
                }

                updateHTML.updateTileText(clickedTile);
        });
        
}

export { generateCountryData, drawMap, styleMap, executeMapEvents};
