// Read geoJSON of tectonic plate boundaries and convert to layer
d3.json("tectonics.json").then((data) => {
    let tectonicLayer = L.geoJSON(data.features, {
        style: {
            "color": "#ff7800",
        }
    });

function createMap(quakesLayer)
{
    // Create the tile layers that will be the background of our map.
    var street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    var dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
    });

    var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });


    // Create a baseMaps object to hold the layers.
    let baseMaps = {
    "Dark": dark,
    "Street": street,
    "Topography": topo,
    "Satellite": satellite,
    };

    d3.json("tectonics.json", function(data) {
        console.log(data);
    });

    // overLayMaps object to hold layers
    var overLays = {
        "Earthquakes": quakesLayer,
        "Tectonic Plates": tectonicLayer
    };

    // Create map object
    let map = L.map("map", {
        center: [39.42, -111.95], // middle of Utah
        zoom: 4,
        layers: [satellite, quakesLayer, tectonicLayer]
    });

    // Create a layer control, and pass it baseMaps and overlayMaps. Add the layer control to the map.
    L.control.layers(baseMaps, overLays, {
    collapsed: false
    }).addTo(map);

    // Legend for colors that represent depth
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            bounds = ["<10", "10-30", "30-50", "50-70", "70-90", "90+"],
            colors = ["lime", "yellow", "gold", "orange", "orangered", "red"];

        div.innerHTML += '<b>Depth (m)</b><hr>';

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

    // create list of markers for earthquakes
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

        // convert default marker to circle marker
        let marker = L.geoJSON(feature, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, markerOptions)
            },

            onEachFeature: onEachFeature
        });

        quakeMarkers.push(marker);
    }

    // convert list of markers to a layer and pass to createMap function
    let quakesLayer = L.layerGroup(quakeMarkers);
    createMap(quakesLayer);
}




// Get earthquake data and pass to createMarkers function

// ALL quakes in the last 7 days
let url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

// mag 2.5+ quakes in the last 7 days
// let url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson"

d3.json(url).then(createMarkers);

});