//initialize function called when the script loads
function initialize(){
    cities();
};

//function to create a table with cities and their populations
function cities(){
    //define two arrays for cities and population
    var cities = [
        'Lincoln',
        'Madison',
        'Raleigh',
        'Portland'
    ];
    var population = [
        1,
        2,
        3,
        4
    ];

    //create the table element
    var table = document.createElement("table");

    //create a header row
    var headerRow = document.createElement("tr");

    //add the "City" column
    var cityHeader = document.createElement("th");
    cityHeader.innerHTML = "City";
    headerRow.appendChild(cityHeader);

    //add the "Population" column
    var popHeader = document.createElement("th");
    popHeader.innerHTML = "Happiness";
    headerRow.appendChild(popHeader);

    //add the row to the table
    table.appendChild(headerRow);

    //loop to add a new row for each city
    for (var i = 0; i < cities.length; i++){
        var tr = document.createElement("tr");

        var city = document.createElement("td");
        if (cities[i] == 'Madison'){
            city.innerHTML = 'My City';
        } else {
            city.innerHTML = cities[i];
        }

        tr.appendChild(city);

        var pop = document.createElement("td");
        if (population[i] === 2){
            pop.innerHTML = 'Happiest';
        } else if (population[i] === 1){
            pop.innerHTML = 'Overrated'
        } else {
            pop.innerHTML = population[i];
        };

        tr.appendChild(pop);

        table.appendChild(tr);
    };


    //add the table to the div in index.html
    var mydiv = document.querySelector("#mydiv");
    mydiv.appendChild(table);
};

//call the initialize function when the window has loaded
window.onload = initialize();