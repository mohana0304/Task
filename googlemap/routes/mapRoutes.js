const express = require("express");
const router  = express.Router();
const { Client, TravelMode } = require("@googlemaps/google-maps-services-js");
const client  = new Client({});

router.get("/", (req, res) => {
    res.render("index", { apiKey: process.env.GOOGLE_MAPS_KEY });
});


router.get("/geocode", async (req, res) => {
    const city = req.query.city;
    try {
        const response = await client.geocode({
            params: { address: city, key: process.env.GOOGLE_MAPS_KEY }
        });
        if (!response.data.results.length)
            return res.status(404).json({ error: "Location not found" });
        res.json(response.data.results[0].geometry.location);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Geocode failed" });
    }
});


router.get("/route", async (req, res) => {
    const from  = req.query.from;
    const to  = req.query.to;
    const modeParam = (req.query.mode || "driving").toLowerCase().trim();

    const modeEnumMap = {
        driving:   TravelMode.driving,
        walking:   TravelMode.walking,
        bicycling: TravelMode.bicycling,
        transit:   TravelMode.transit,
    };
    
    const travelMode = modeEnumMap[modeParam];
    if (!travelMode) {
        return res.status(400).json({ error: `Unknown mode: ${modeParam}` });
    }

try {

    const params = {
        origin: from,
        destination: to,
        mode: travelMode,
        key: process.env.GOOGLE_MAPS_KEY
    };

    if (travelMode === TravelMode.transit) {
        params.departure_time = "now";
    }

    const response = await client.directions({
        params
    });

    console.log("Google status:", response.data.status);

    if (response.data.status === "ZERO_RESULTS") {
        return res.json({
            noRoute: true,
            message: `No ${modeParam} route found between these locations.`
        });
    }

    if (response.data.status !== "OK") {
        return res.status(400).json({
            error: response.data.status
        });
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    const hasTolls = (route.warnings || []).some(w =>
        /toll/i.test(w)
    );

    res.json({
        distance: leg.distance.text,
        duration: leg.duration.text,
        start: leg.start_location,
        end: leg.end_location,
        polyline: route.overview_polyline.points,
        mode: modeParam,
        tolls: hasTolls,
        warnings: route.warnings || []
    });

} catch (err) {

    console.error("FULL ERROR:");
    console.error(err.response?.data || err);

    res.status(500).json({
        error: err.message
    });
}
});

module.exports = router;
