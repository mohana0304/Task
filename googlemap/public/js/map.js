let map;
let markers = [];
let polyline = null;
let autocompleteCity, autocompleteFrom, autocompleteTo;
let markerCluster = null;
let placesService;
let nearbyMarkers = [];
let nearbyCircles  = [];   
let lastClickedLocation = null; 
let trafficLayer = null;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 8,
        center: { lat: 11.0169, lng: 76.9558 }
       // mapId: "cb47b3ef55ea1b2b91a49db8"
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLoc);
                map.setZoom(14);
                addMarker(userLoc);
                lastClickedLocation = userLoc; 
            },
            (error) => {
                console.warn("Geolocation failed or denied:", error.message);
            }
        );
    }

    placesService = new google.maps.places.PlacesService(map);
    trafficLayer = new google.maps.TrafficLayer();
    map.addListener("click", (e) => {
        const loc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        lastClickedLocation = loc; 
        addMarker(loc);
    });
    autocompleteCity = new google.maps.places.Autocomplete(document.getElementById("city"));
    autocompleteFrom = new google.maps.places.Autocomplete(document.getElementById("from"));
    autocompleteTo   = new google.maps.places.Autocomplete(document.getElementById("to"));

    function autoRouteIfReady() {
        const from = document.getElementById("from").value.trim();
        const to   = document.getElementById("to").value.trim();
        if (from && to) getRoute();
    }

    autocompleteFrom.addListener("place_changed", autoRouteIfReady);
    autocompleteTo.addListener("place_changed",   autoRouteIfReady);
    document.getElementById("city").addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); loadLocation(); }
    });
}


function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
    if (markerCluster) {
        markerCluster.clearMarkers();
        markerCluster = null;
    }
}

function addMarker(loc) {
    const marker = new google.maps.Marker({ position: loc, map });
    markers.push(marker);
    if (!markerCluster) {
        markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
    } else {
        markerCluster.addMarker(marker);
    }
}

function clearRoute() {
    if (polyline) { polyline.setMap(null); polyline = null; }
}

function toggleTraffic() {
    if (trafficLayer.getMap()) {
        trafficLayer.setMap(null);
    } else {
        trafficLayer.setMap(map);
    }
}

async function loadLocation() {
    const city = document.getElementById("city").value.trim();
    if (!city) { alert("Enter a city"); return; }
    try {
        const data = await fetch(`/geocode?city=${encodeURIComponent(city)}`).then(r => r.json());
        if (!data.lat || !data.lng) { alert("Location not found"); return; }
        clearMarkers(); clearRoute();
        setInfo("");
        const loc = { lat: data.lat, lng: data.lng };
        addMarker(loc);
        lastClickedLocation = loc; 
        map.setCenter(loc);
        map.setZoom(10);
    } catch (err) { alert("Error fetching location"); }
}

async function getRoute() {
    const from = document.getElementById("from").value.trim();
    const to   = document.getElementById("to").value.trim();
    const mode = document.getElementById("modeInput").value;

    if (!from || !to) { alert("Please enter both From and To locations"); return; }

    const strokeColors = {
        driving:   "#1c66dd",
        walking:   "#259523",
        bicycling: "#db9215",
        transit:   "#4d26a8"
    };

    setInfoLoading();

    try {
        const url  = `/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&mode=${encodeURIComponent(mode)}&_=${Date.now()}`;
        const data = await fetch(url, { cache: "no-store" }).then(r => r.json());

        if (data.noRoute) { setInfoNoRoute(mode, data.message); return; }
        if (data.error)   { setInfo(""); alert("Error: " + data.error); return; }

        setInfoResult(mode, data.distance, data.duration,data.tolls, strokeColors[mode]);

        clearRoute();
        const path = google.maps.geometry.encoding.decodePath(data.polyline);
        polyline = new google.maps.Polyline({
            path,
            geodesic:      true,
            strokeColor:   strokeColors[mode],
            strokeOpacity: 0.9,
            strokeWeight:  5
        });
        polyline.setMap(map);

        clearMarkers();
        addMarker(data.start);
        addMarker(data.end);

        const bounds = new google.maps.LatLngBounds();
        path.forEach(p => bounds.extend(p));
        map.fitBounds(bounds);
        showTollGates(path);

    } catch (err) {
        alert("Network error: " + err.message);
        setInfo("");
    }
}

function clearNearbyMarkers() {
    nearbyMarkers.forEach(m => m.setMap(null));
    nearbyMarkers = [];
    nearbyCircles.forEach(c => c.setMap(null)); 
    nearbyCircles = [];
}

async function searchNearby(type) {
    if (!map) return;
    clearNearbyMarkers();
    
    const typeColors = {
    pharmacy:    "yellow",
    gas_station: "blue",
    car_repair:  "orange",
    hospital:    "green",
    restaurant:  "purple"
};

const color = typeColors[type] || "red";

    const center = lastClickedLocation
        ? new google.maps.LatLng(lastClickedLocation.lat, lastClickedLocation.lng)
        : map.getCenter();

    const { Place } = await google.maps.importLibrary("places");

    const request = {
        fields: ["displayName", "location", "formattedAddress", "rating", "businessStatus"],
        locationRestriction: {
            center: center,
            radius: 5000,
        },
        includedPrimaryTypes: [type],
        maxResultCount: 20,
    };

    try {
        const { places } = await Place.searchNearby(request);

        if (!places.length) {
            alert(`No "${type}" found near this location.`);
            return;
        }

        const bounds = new google.maps.LatLngBounds();

        places.forEach(place => {
        const marker = new google.maps.Marker({
    map,
    position:  place.location,
    title:     place.displayName,
    animation: google.maps.Animation.DROP,
    icon: {
        url: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
        scaledSize: new google.maps.Size(40, 40)
    }
});
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="min-width:200px;font-family:'DM Sans',sans-serif">
                        <h3 style="margin:0 0 6px;font-size:15px">${place.displayName}</h3>
                        <p style="margin:0 0 4px;color:#555;font-size:13px">${place.formattedAddress || ""}</p>
                        <p style="margin:0;font-size:13px">⭐ ${place.rating || "N/A"}</p>
                    </div>
                `
            });

            marker.addListener("click", () => infoWindow.open(map, marker));
            nearbyMarkers.push(marker);
            bounds.extend(place.location);
        });

        new markerClusterer.MarkerClusterer({ map, markers: nearbyMarkers });
        map.fitBounds(bounds);

    } catch (err) {
        console.error("searchNearby error:", err);
        alert("Could not fetch nearby places. Check console for details.");
    }
}

const LABELS = { driving:"Driving", walking:"Walking", bicycling:"Cycling", transit:"Transit" };
const ICONS  = { driving:"⛟",       walking:"🚶",       bicycling:"🚲",      transit:"🚆" };

function setInfo(html) {
    const el = document.getElementById("info");
    el.innerHTML     = html;
    el.style.display = html ? "flex" : "none";
}

function setInfoLoading() {
    setInfo(`<span class="info-spinner"></span><span class="info-msg">Calculating route…</span>`);
}

function setInfoNoRoute(mode, msg) {
    setInfo(`<span class="info-icon">${ICONS[mode] || "🗺"}</span><span class="info-msg">${msg}</span>`);
}

function setInfoResult(mode, distance, duration, tolls = false) {

    const el = document.getElementById("info");

    el.innerHTML = `
        <div class="info-inline">
            <span class="info-emoji">${ICONS[mode]}</span>
            <span class="info-mode">${LABELS[mode]}</span>

            <span class="info-dot">•</span>

            <span class="info-duration">
                ${duration}
            </span>

            <span class="info-dot">•</span>

            <span class="info-distance">
                ${distance}
            </span>

            ${
                tolls
                ? `
                    <span class="info-dot">•</span>
                    <span style="color:#d97706;font-weight:600">
                        💰 Toll Road
                    </span>
                  `
                : ""
            }
        </div>
    `;

    el.style.display = "flex";
}


function selectMode(el) {
    document.querySelectorAll(".dir-mode").forEach(btn => btn.classList.remove("active"));
    el.classList.add("active");
    document.getElementById("modeInput").value = el.dataset.mode;
    const from = document.getElementById("from").value.trim();
    const to   = document.getElementById("to").value.trim();
    if (from && to) getRoute();
}

function swapLocations() {
    const fromInput = document.getElementById("from");
    const toInput   = document.getElementById("to");
    const temp      = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value   = temp;
    if (fromInput.value.trim() && toInput.value.trim()) getRoute();
}

async function showTollGates(path) {

    clearNearbyMarkers();

    const service = new google.maps.places.PlacesService(map);

    const tollMarkers = [];

    for (let i = 0; i < path.length; i += 25) {

        const point = path[i];

        const request = {
            location: point,
            radius: 3000,
            keyword: "toll plaza"
        };

        service.nearbySearch(request, (results, status) => {

            if (
                status !== google.maps.places.PlacesServiceStatus.OK ||
                !results
            ) return;

            results.forEach(place => {

                const marker = new google.maps.Marker({
                    map,
                    position: place.geometry.location,
                    title: place.name,
                    icon: {
                        url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                    }
                });

                const info = new google.maps.InfoWindow({
                    content: `
                        <div style="padding:8px">
                            <strong>💰 ${place.name}</strong><br>
                            ${place.vicinity || ""}
                        </div>
                    `
                });

                marker.addListener("click", () => {
                    info.open(map, marker);
                });

                tollMarkers.push(marker);
            });
        });
    }

    nearbyMarkers.push(...tollMarkers);
}

function toggleDirections() {
    document.getElementById("dirPanel").classList.toggle("active");
}

window.toggleTraffic = toggleTraffic;
window.searchNearby      = searchNearby;
window.initMap           = initMap;
window.getRoute          = getRoute;
window.loadLocation      = loadLocation;
window.selectMode        = selectMode;
window.toggleDirections  = toggleDirections;
window.swapLocations     = swapLocations;
