//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function () {

    //pseudo-global variables
    var attrArray = ["org_per_2017", "pop", "air_2008", "water_2008", "per_acres_farm"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute

    //begin script when window loads
    window.onload = setMap();

    //set up choropleth map
    function setMap() {
        //map frame dimensions
        var width = window.innerWidth * 0.5,
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

            wi_counties = joinData(wi_counties, csvData);

            var colorScale = makeColorScale(csvData);

            setEnumerationUnits(wi_counties, map, path, colorScale);

            setChart(csvData, colorScale);
        };
    };

    function joinData(wi_counties, csvData) {

        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i = 0; i < csvData.length; i++) {
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.NAME; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a = 0; a < wi_counties.length; a++) {

                var geojsonProps = wi_counties[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.NAME; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey) {

                    //assign all attributes and values
                    attrArray.forEach(function (attr) {
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };
        console.log(wi_counties);
        return wi_counties;
    };
    
    function makeColorScale(data){
		var colorClasses = [
	        "#018571",
	        "#80cdc1",
	        "#f5f5f5",
	        "#dfc27d",
	        "#a6611a"
	    ];
    
    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale;
};

    function setEnumerationUnits(wi_counties, map, path, colorScale) {
        var wi_counties = map.selectAll(".regions")
            .data(wi_counties)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "regions " + d.properties.NAME;
            })
            .attr("d", path)
            .style("fill", function(d){
                return colorScale(d.properties[expressed]);
            });
    };

    //function to create coordinated bar chart
    function setChart(csvData, colorScale){
        //chart frame dimensions
        var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");
        
            //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

    
         //create a scale to size bars proportionally to frame
        var yScale = d3.scaleLinear()
            .range([463, 0])
            .domain([0, 15]);
    
        //Example 2.4 line 8...set bars for each province
        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return a[expressed]-b[expressed]
            })
            .attr("class", function(d){
                return "bars " + d.NAME;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .attr("x", function(d, i){
                return i * (chartInnerWidth / csvData.length) + leftPadding;
            })
            .attr("height", function(d, i){
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .style("fill", function(d){
                return colorScale(d[expressed]);
            })
    
        //annotate bars with attribute value text
        /*var numbers = chart.selectAll(".numbers")
            .data(csvData)
            .enter()
            .append("text")
            .sort(function(a, b){
                return a[expressed]-b[expressed]
            })
            .attr("class", function(d){
                return "numbers " + d.NAME;
            })
            .attr("text-anchor", "middle")
            .attr("x", function(d, i){
                var fraction = chartWidth / csvData.length;
                return i * fraction + (fraction - 1) / 2;
            })
            .attr("y", function(d){
                return chartHeight - yScale(parseFloat(d[expressed])) + 15;
            })
            .text(function(d){
                return d[expressed];
            });*/
    
          //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("The percent of farms that are organic " + expressed[3] + " in each county");

     //create vertical axis generator
     var yAxis = d3.axisLeft()
     .scale(yScale);

 //place axis
 var axis = chart.append("g")
     .attr("class", "axis")
     .attr("transform", translate)
     .call(yAxis);

 //create frame for chart border
 var chartFrame = chart.append("rect")
     .attr("class", "chartFrame")
     .attr("width", chartInnerWidth)
     .attr("height", chartInnerHeight)
     .attr("transform", translate);
};

    //examine the results
   
    //console.log(wi_states);
    //console.log(wi_lakes);
    //console.log(csvData);

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


})(); //last line of main.js
