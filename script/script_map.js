var container = d3.select(".map_container");
var svg = container.append("svg")
    .attr("width", 1200)
    .attr("height", 700)
    .attr("viewBox", "0 -250 1200 700");

var g = svg.append("g")
    .attr("id", "countries")

var projection = d3.geoMercator();

var path = d3.geoPath()
    .projection(projection);

var infobox = d3.select(".infobox")
  .append("div")
    .attr("id", "tooltip")
    .html("<p>-- : --</p>");

d3.csv("./data/data_csv.csv", function(d) {
    return {
        "country" : d["country"],
        "gini" : +d["value"],
        "year" : +d["year"]
    }
}).then(function(data) {
    var temp = data.map(Object.values);

    //console.log(temp)

    var tempStore = "";
    var countryList = [];
    for (var i = 0; i < temp.length; i++) {
        if (temp[i][0] != tempStore) {
            countryList.push(temp[i][0]);
            tempStore = temp[i][0];
        }
    }

    console.log(countryList)

    var dataArray = countryList;
    for (var i = 0; i < countryList.length; i++) {
        var tempStore = 0;

        for (let n = 0; n < temp.length; n++) {
            if (countryList[i] == temp[n][0] && temp[n][2] > tempStore) {
                dataArray[i] = temp[n];
                tempStore = temp[n][2];
                //console.log(tempStore);
            }
        }
    }

    console.log(dataArray)

    d3.json("./data/map.json").then(function (mapData) {
         g.selectAll("path")
            .data(topojson.feature(mapData, mapData.objects.countries).features)
            .enter().append("path")
                .attr("d", path)
                .style("stroke-width", "0.8px")
                .style("fill", "black")
                .style("fill-opacity", (d, i) =>{
                    var country = dataArray.filter(e => e.includes(mapData.objects.countries.geometries[i].properties.name));
                    //console.log(country)
                    if (country.length > 0) {
                        return (country[0][1] / 70);
                    }
                    if (country.length < 1) {
                        return 0;
                    }
                })
                .html((d, i) =>{
                    return "<title>" + mapData.objects.countries.geometries[i].properties.name + "</title>"
                })
                .on("mouseover", (d, i) =>{
                  var country = dataArray.filter(e => e.includes(i.properties.name));
                  if (country.length > 0) {
                      infobox.html("<p>" + i.properties.name + ": " + country[0][1] + "</p>")
                        .style("color", "#000000")
                        .style("font-weight", "bold")
                  }
                  if (country.length < 1) {
                      infobox.html("<p>" + i.properties.name + ": No Data</p>");
                  }
                })
    });
});

