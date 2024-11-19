const heatMapRouter = require("express").Router();
const Heatmap = require("../models/HeatMap");
const RoomLink = require("../models/RoomLink")
const mongoose = require("mongoose");


heatMapRouter.get('/heatmap-get', async (req, res) => {
    try {
        // Retrieve all heatmap data and calculate intensities
        const heatmapData = await Heatmap.find({});
        const intensityMap = {};
        heatmapData.forEach(({ lat, long }) => {
            const key = `${lat},${long}`;
            if (!intensityMap[key]) {
                intensityMap[key] = { lat, long, intensity: 0 };
            }
            intensityMap[key].intensity++;
        });

        const processedData = Object.values(intensityMap);

        res.json(processedData);
    } catch (error) {
        console.error("Error retrieving heatmap data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Route to add heatmap data with a 10-minute expiration
heatMapRouter.get('/heatmap-add', async (req, res) => {
    const { lat, long, uid } = req.query;
    if (!lat || !long || !uid) {
        return res.status(400).json({ message: "Latitude, longitude, and UID are required" });
    }

    try {
        const expirationDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        //console.log("Expiration Date1:", expirationDate);
        const roundedLat = parseFloat(lat).toFixed(3);
        const roundedLong = parseFloat(long).toFixed(3);
        const heatmapEntry = await Heatmap.findOneAndUpdate(
            { uid }, // Match by UID
            { lat: roundedLat, long: roundedLong, uid, expirationDate }, // Update fields
            { new: true, upsert: true } // Create a new entry if it doesn't exist
        );
        //console.log("Expiration Date3:", expirationDate);


        res.json({ message: "Heatmap data added/updated successfully", entry: heatmapEntry });
    } catch (error) {
        console.error("Error adding heatmap data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = heatMapRouter;