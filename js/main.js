//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = 330,
        height = 460;

    //create new svg container for the map
    var map = d3
        .select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3
        .geoConicEqualArea()
        .center([0, 44.5])
        .rotate([90, 0, 0])
        .parallels([40, 50])
        .scale(4000)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection);
    //use Promise.all to parallelize asynchronous data loading
    var promises = [d3.csv("data/WI_ENVI.csv"),                    
                    d3.json("data/wi_counties.topojson"),
                    d3.json("data/wi_lakes.topojson"),                    
                    d3.json("data/wi_states.topojson"),                   
                    ];    
    Promise.all(promises).then(callback);


    function callback(data) {
        var csvData = data[0],
            counties = data[1],
            lakes = data[2],
            states = data[3];

    //translate europe TopoJSON
    var wi_counties = topojson.feature(counties, counties.objects.wi_counties).features,
        wi_lakes = topojson.feature(lakes, lakes.objects.wi_lakes),
        wi_states = topojson.feature(states, states.objects.wi_states);

    //examine the results
    console.log(wi_counties);
    console.log(wi_states);
    console.log(wi_lakes);

    //add Europe countries to map
/*var states = map.append("path")
    .datum(wi_states)
    .attr("class", "name")
    .attr("d", path);

var lakes = map.append("path")
    .datum(wi_lakes)
    .attr("class", "name")
    .attr("d", path);*/

//add France regions to map
var counties = map.selectAll(".regions")
    .data(wi_counties)
    .enter()
    .append("path")
    .attr("class", function(d){
        return "regions " + d.properties.name;
    })
    .attr("d", path);
};
}
