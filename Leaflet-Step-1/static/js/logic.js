function createMap(quakesLayer)
{
    // Create the tile layer that will be the background of our map.
    var street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // Create map object
    let map = L.map("map", {
        center: [39.42, -111.95], // middle of Utah
        zoom: 4,
        layers: [street, quakesLayer]
    });

    // Legend for colors that represent depth
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            bounds = ["<10", "10-30", "30-50", "50-70", "70-90", "90+"],
            colors = ["lime", "yellow", "gold", "orange", "orangered", "red"];

        for (var i = 0; i < colors.length; i++) {
            div.innerHTML +=
                '<i style="background:' + colors[i] + '"></i> ' + 
                bounds[i] + '<br>';
        }

        return div;
    };  

    legend.addTo(map);
}

// Create bubble markers
function createMarkers(data)
{   
    // Bind popup for each marker
    function onEachFeature(feature, layer)
    {
      layer.bindPopup(`<h3>${feature.properties.place}</h3>
                      <hr>
                      <p>${new Date(feature.properties.time)}</p>
                      <hr>
                      <b>Magnitude: </b> ${feature.properties.mag}
                      <br>
                      <b>Depth: </b> ${feature.geometry.coordinates[2]}`);
    }

    // function for marker radius
    function getRadius(mag)
    {
        if (mag < 0.5)
            return 2;
        else
            return mag * 4;
    }

    // function for marker color scale
    function getColor(depth)
    {
        if (depth > 90)
            return "red";
        else if (depth > 70)
            return "orangered";
        else if (depth > 50)
            return "orange";
        else if (depth > 30)
            return "gold";
        else if (depth > 10)
            return "yellow";
        else
            return "lime";
    }

    let quakeMarkers = [];

    for (var i = 0; i < data.features.length; i++)
    {   
        let feature = data.features[i];

        let markerOptions = {
            radius: getRadius(feature.properties.mag),
            color: "black",
            weight: .5,
            fillColor: getColor(feature.geometry.coordinates[2]),
            fillOpacity: 1,
            opacity: 1,
        };

        let marker = L.geoJSON(feature, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, markerOptions)
            },

            onEachFeature: onEachFeature
        });

        quakeMarkers.push(marker);
    }

    let quakesLayer = L.layerGroup(quakeMarkers);

    createMap(quakesLayer);
}


// Get earthquake data and pass to createMarkers function

// ALL quakes in the last 7 days
let url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

// mag 2.5+ quakes in the last 7 days (for quicker testing)
// let url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson"

d3.json(url).then(createMarkers);