//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function () {

    //pseudo-global variables
    var attrArray = ["percentage of farms that are organic", "population", "air quality ranking", "water quality ranking", "percentage of land that is used for farming"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute

    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 55,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 15]);

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
        var promises = [d3.csv("data/WI_ENVI_1.csv"),
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

            //add Europe countries to map
            /*var states = map
                .append("path")
                .datum(wi_states)
                .attr("class", "states")
                .attr("d", path);*/
            
            /*var lakes = map
                .append("path")
                .datum(wi_lakes)
                .attr("class", "lakes")
                .attr("d", path);*/

            wi_counties = joinData(wi_counties, csvData);

            var colorScale = makeColorScale(csvData);

            setEnumerationUnits(wi_counties, map, path, colorScale);

            createDropdown(csvData);

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

    function makeColorScale(data) {
        var colorClasses = [
            "#cdeff7",
            "#b2e2e2",
            "#66c2a4",
            "#2ca25f",
            "#006d2c"
        ];

        //create color scale generator
       //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i = 0; i < data.length; i++) {
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        

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
            .style("fill", function (d) {
                return colorScale(d.properties[expressed]);
            })
            .on("mouseover", function (event, d) {
                setLabel(d.properties);
                highlight(d.properties);
            })
            .on("mouseout", function (event, d) {
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);
    };

    //function to create coordinated bar chart
    function setChart(csvData, colorScale) {
        //chart frame dimensions


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

        //Example 2.4 line 8...set bars for each province
        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function (a, b) {
                return a[expressed] - b[expressed]
            })
            .attr("class", function (d) {
                return "bars " + d.NAME;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .on("mouseover", function (event, d) {
                setLabel(d);
                highlight(d);
            })
            .on("mouseout", function (event, d) {
                dehighlight(d.properties)
            })
            .on("mousemove", moveLabel);

        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 100)
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
        updateChart(bars, csvData.length, colorScale);
    }

    //Example 1.1 line 1...function to create a dropdown menu for attribute selection
    function createDropdown(csvData) {
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function () {
                changeAttribute(this.value, csvData)
            });

        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function (d) { return d })
            .text(function (d) { return d });
    }

    //dropdown change event handler
    function changeAttribute(attribute, csvData) {
        //change the expressed attribute
        expressed = attribute;

        var domainArray = [];
        for (var i = 0; i < csvData.length; i++) {
            var val = parseFloat(csvData[i][expressed]);
            if (val) {
                domainArray.push(val);
            }
        };
        var maxValue = Math.max(...domainArray);

        yScale = d3.scaleLinear()
            .range([463, 0])
            .domain([0, maxValue]);

        var yAxis = d3.axisLeft()
            .scale(yScale);

        console.log(domainArray);

        var axis = d3.select(".axis")
            .attr("transform", translate)
            .call(yAxis);
        //recreate the color scale
        var colorScale = makeColorScale(csvData);

        //recolor enumeration units
        var wi_counties = d3.selectAll(".regions")
            .transition()
            .duration(1000)
            .style("fill", function (d) {
                var value = d.properties[expressed];
                if (value) {
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
            });
        //Sort, resize, and recolor bars
        var bars = d3.selectAll(".bars")
            //Sort bars
            .sort(function (a, b) {
                return b[expressed] - a[expressed];
            })
            .transition() //add animation
            .delay(function (d, i) {
                return i * 20
            })
            .duration(500);

        updateChart(bars, csvData.length, colorScale);
    }

    function updateChart(bars, n, colorScale) {
        //position bars
        bars.attr("x", function (d, i) {
            return i * (chartInnerWidth / n) + leftPadding;
        })
            //size/resize bars
            .attr("height", function (d, i) {
                var value = d[expressed];
                if (value) {
                    return 463 - yScale(parseFloat(d[expressed]));
                } else {
                    return 0;
                }
                
            })
            .attr("y", function (d, i) {
                var value = d[expressed];
                if (value) {
                    return yScale(parseFloat(d[expressed])) + topBottomPadding;
                } else {
                    return 0;
                }
               
            })
            //color/recolor bars
            .style("fill", function (d) {
                var value = d[expressed];
                if (value) {
                    return colorScale(value);
                } else {
                    return "#ccc";
                }
            })
        var chartTitle = d3.select(".chartTitle")
            .text("The " + expressed + " in each county");
    }

    //function to highlight enumeration units and bars
    function highlight(props) {
        //change stroke
        var selected = d3.selectAll("." + props.NAME)
            .style("stroke", "black")
            .style("stroke-width", "3");
    };

    //function to reset the element style on mouseout
    function dehighlight(props) {
        //change stroke
        var wi_counties = d3.selectAll(".regions")
            .style("stroke", "#ccc")
            .style("stroke-width", ".5");
        //function to reset bars
        var bars = d3.selectAll(".bars")
            .style("stroke", "none")
            .style("stroke-width", "0");
        //remove info label
        d3.select(".infolabel").remove();
    };

    //function to create dynamic label
    function setLabel(props){
        //label content
        var labelAttribute = "<h1>" + props[expressed] +
            "</h1><b>" + expressed + "</b>";

        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.NAME + "_label")
            .html(labelAttribute);

        var regionName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.NAME);
    };

    function moveLabel(){
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;
    
        //use coordinates of mousemove event to set label coordinates
        var x1 = event.clientX + 10,
            y1 = event.clientY - 75,
            x2 = event.clientX - labelWidth - 10,
            y2 = event.clientY + 25;
    
        //horizontal label coordinate, testing for overflow
        var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
        //vertical label coordinate, testing for overflow
        var y = event.clientY < 75 ? y2 : y1; 
    
        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };



})(); //last line of main.js
