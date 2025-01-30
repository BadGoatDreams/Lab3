/* Example from Leaflet Quick Start Guide */

var map; // Declare map globally to avoid redeclaring in multiple places
var minValue; // This will store the minimum value of population for the proportional radius calculation
var geojson

// Step 1: Create map
var Cities_path = "data/US_cities.geojson";
var States_path = "data/Urban_pop_by_state.geojson";

function createMapCities() {
    // Create the map centered at coordinates [38.598, -98.63] with zoom level 5.5
    map = L.map('map').setView([38.598, -98.63], 5.5);

    // Add OSM base tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Call the getData function to fetch and process the GeoJSON data
    getData(Cities_path, "City");
    addTitle("U.S. Cities and Population");
}

function createMapStates() {
    // Create the map centered at coordinates [38.598, -98.63] with zoom level 5.5
    map = L.map('map').setView([38.598, -98.63], 5.5);

    // Add OSM base tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Call the getData function to fetch and process the GeoJSON data
    getData(States_path, "State");
    addTitle("Urban Population by State");

    var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [ 500000, 1000000, 5000000, 7500000, 10000000, 20000000,50000000],
        labels = ["500K - 1M", " 1M - 5M", "5M - 7.5M", "7.5M - 10M", "10M - 20M", "20M - 50M", "50M+"];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        console.log("adding states legend")
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i]) + '"></i> ' +
            labels[i] + '<br>' ;
    }

    return div;
};

legend.addTo(map);
}

// Step 2: Import GeoJSON data
function getData(data_path, map_flag) {
    // Load the GeoJSON data (replace this with the correct path to your GeoJSON file)
    fetch(data_path)
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            if (map_flag === "City") {
                // Calculate minimum data value for proportional symbols
                minValue = calculateMinValue(json);
                // Call function to create proportional symbols based on the data
                createPropSymbols(json);
                addLegend();
            } else if (map_flag === "State") {
                geojson = L.geoJson(json, { style: style, onEachFeature:onEachFeature }).addTo(map);
                info.addTo(map);
            }
        })
        .catch(function(error) {
            console.log("Error fetching GeoJSON data: ", error);
        });
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.sum_POPULA),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function getColor(pop) {
    return pop > 50000000 ? '#800026' :
           pop > 20000000  ? '#BD0026' :
           pop > 10000000  ? '#E31A1C' :
           pop > 7500000  ? '#FC4E2A' :
           pop > 5000000   ? '#FD8D3C' :
           pop > 1000000   ? '#FEB24C' :
           pop > 500000   ? '#FED976' :
                      '#FED976';
}

// Step 3: Calculate minimum population value for proportional symbols
function calculateMinValue(data) {
    var allValues = [];
    // Loop through each city in the features
    for (var city of data.features) {
        // Add the population value to the array
        allValues.push(city.properties.POPULATION);
    }
    // Calculate the minimum population value from the array
    var minValue = Math.min(...allValues);
    // Debugging: Log minValue and grades
    console.log("minValue:", minValue);
    return minValue;
}

// Step 4: Calculate the radius of the proportional symbols based on population
function calcPropRadius(attValue) {
    var minRadius = 5; // Constant factor for adjusting symbol sizes evenly
    var radius = 1.0083 * Math.pow(attValue / minValue, 0.3715) * minRadius;
    return radius;
}

// Step 5: Create circle markers for point features
function pointToLayer(feature, latlng) {
    var attribute = "POPULATION"; // Use "POPULATION" as the attribute to visualize

    // Create marker options
    var geojsonMarkerOptions = {
        fillColor: "#2BD438",
        color: "#2BC7D4",
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.5,
        radius: 6 // Default radius for symbols
    };

    // For each feature, determine its value for the selected attribute
    var attValue = feature.properties[attribute];

    // Give each feature's circle marker a radius based on its attribute value
    geojsonMarkerOptions.radius = calcPropRadius(attValue);

    // Create circle marker layer
    var layer = L.circleMarker(latlng, geojsonMarkerOptions);

    // Build popup content string
    var popupContent = "<p><b>City:</b> " + feature.properties.NAME + "</p>";
    popupContent += "<p><b>Population:</b> " + feature.properties[attribute] + "</p>";

    // Bind the popup to the circle marker
    layer.bindPopup(popupContent);

    // Return the circle marker to the L.geoJson pointToLayer option
    return layer;
}

// Step 6: Create proportional symbols (circle markers) and add to map
function createPropSymbols(data) {
    // Create a Leaflet GeoJSON layer and add it to the map with the pointToLayer function
    L.geoJson(data, {
        pointToLayer: pointToLayer
    }).addTo(map);
}

function addTitle(title_input) {
    // Create a custom control
    var title = L.control({ position: 'topleft' });

    // This method will be called when the control is added to the map
    title.onAdd = function (map) {
        // Create a div element to hold the title
        this._div = L.DomUtil.create('div', 'map-title');
        
        // Set the inner HTML of the div to your title
        this._div.innerHTML = '<p class="ex2">' + title_input + '</p>';
        
        // Return the div element
        return this._div;
    };

    // Add the control to the map
    title.addTo(map);
}

// Step 7: Add a legend to the map
function addLegend() {
    // Create a custom control for the legend
    var legend = L.control({ position: 'bottomright' });

    // This method will be called when the control is added to the map
    legend.onAdd = function (map) {
        // Create a div element to hold the legend
        var div = L.DomUtil.create('div', 'info legend');
        
        // Define the population ranges and corresponding circle sizes
        var grades = [minValue, minValue * 10, minValue * 100, minValue * 1000];
        var labels = [];

        // Loop through the population ranges and generate a label with a circle for each range
        for (var i = 0; i < grades.length; i++) {
            var from = grades[i];
            var to = grades[i + 1];

            // Calculate the radius for the current range
            var radius = calcPropRadius(from);

            // Create a label with a circle and the population range
            labels.push(
                '<div style="display: flex; align-items: center; margin-bottom: 8px;">' +
                '<i style="background: #2BD438; width: ' + (radius * 2) + 'px; height: ' + (radius * 2) + 'px; border-radius: 50%; display: inline-block; margin-right: 8px;"></i> ' +
                '<span>' + from + (to ? '–' + to : '+') + '</span>' +
                '</div>'
            );
        }

        // Set the inner HTML of the div to the labels
        div.innerHTML = '<strong>Population</strong><br>' + labels.join('');
        
        // Return the div element
        return div;
    };

    // Add the legend control to the map
    legend.addTo(map);
}
 // Function to switch to the Cities map
 function switchToCities() {
    if (map) {
        map.remove(); // Remove the existing map
    }
    createMapCities(); // Create the Cities map
}

// Function to switch to the States map
function switchToStates() {
    if (map) {
        map.remove(); // Remove the existing map
    }
    createMapStates(); // Create the States map
}

// Initialize the Cities map by default

//Mouse listener for interactivity for statesmap

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    layer.bringToFront();
    info.update(layer.feature.properties);
}
function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}
 
var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>State Urban Population</h4>' +  (props ?
        '<b>' + props.name + '</b><br />' + props.sum_POPULA + ' Urban dwellers in state'
        : 'Hover over a state');
};


console.log("added info!")

// Listen for the DOMContentLoaded event to initialize the map
document.addEventListener('DOMContentLoaded', createMapCities);