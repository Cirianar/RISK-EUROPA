var translateX, translateY = 0
d3.json("./data/risk_map.json").then(function (mapData) {
    var translateX = mapData.transform.translate[0];
    var translateY = mapData.transform.translate[1];
    console.log(translateX+","+translateY);

    return translateX, translateY;
});
const container = d3.select(".map_container");
const width = screen.width;
const height = screen.height;

var svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", "0 -600 1000 600");

var g = svg.append("g")
    .attr("id", "name")
    .attr("transform", "scale("+0.5+","+-0.5+") translate("+-translateX+","+-translateY+")");

//const projection = d3.geoMercator();

var path = d3.geoPath();
    //.projection(projection);

d3.json("./data/risk_map.json").then(function (mapData) {
    console.log(mapData);

    g.selectAll("path")
       .data(topojson.feature(mapData, mapData.objects.map).features)
       .enter().append("path")
           .attr("d", path)
           .style("stroke-width", "0.8px")
           .style("fill", "white");
});