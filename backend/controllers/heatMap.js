const heatMapRouter = require("express").Router();
const Heatmap = require("../models/HeatMap");
const mongoose = require("mongoose");


heatMapRouter.get('/heatmap-get', async (req, res) => {
    try {
        // Retrieve all heatmap data and calculate intensities
        const heatmapData = await Heatmap.find({});
        const processedData = await Promise.all(
            heatmapData.map(async (doc) => {
                await doc.removeExpiredUIDs(); // Call the method on each document
                return {
                    lat: doc.lat,
                    long: doc.long,
                    intensity: doc.uids.length / 10 // Calculate intensity
                };
            })
        );

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
        const expirationDate = new Date(Date.now() + 10 * 60 * 1000);  // 10 minutes from now

        // Find existing document or create a new one for the same coordinates
        const heatmapEntry = await Heatmap.findOneAndUpdate(
            { lat, long },
            {
                $addToSet: { uids: uid, expirationDates: expirationDate },
                $set: { lastExpirationDate: expirationDate }  // Update the TTL index field
            },
            { new: true, upsert: true }
        );

        res.json({ message: "Heatmap data added/updated successfully", entry: heatmapEntry });
    } catch (error) {
        console.error("Error adding heatmap data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = heatMapRouter;