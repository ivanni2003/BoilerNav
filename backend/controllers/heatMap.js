const heatMapRouter = require("express").Router();
const Heatmap = require("../models/HeatMap");
const HistoricalHeatmap = require("../models/HistoricalHeatMap");
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

heatMapRouter.get('/historical-heatmap-get', async(req, res) => {
    try {
        const now = new Date();
        const currentHour = now.getHours();
        //const currentHour = 0;

        const aggregatedData = await HistoricalHeatmap.aggregate([
            {
              $addFields: {
                hour: { $hour: "$Date" }, // Add the hour of the 'Date' field to the document
              }
            },
            {
              $match: {
                hour: currentHour, // Filter for documents where the hour matches the current hour
              }
            },
            {
              $group: {
                _id: { lat: "$lat", long: "$long" }, // Group by lat and long
                uniqueUids: { $addToSet: "$uid" }, // Collect unique UIDs
              }
            },
            {
              $project: {
                lat: "$_id.lat", 
                long: "$_id.long",
                uidCount: { $size: "$uniqueUids" }, // Count the number of unique UIDs
                _id: 0
              }
            },
            {
              $match: {
                uidCount: { $gt: 0 } // Only include locations with more than 3 unique UIDs
              }
            }
          ]);
          
      
          // Map the data into a format suitable for the heatmap
          const heatmapData = aggregatedData.map(entry => ({
            lat: entry.lat,
            long: entry.long,
            intensity: entry.uidCount // Use the UID count as the intensity value
          }));
          res.json(heatmapData);
    }
    catch (error) {
        console.error("Error fetching heatmap data:", error);
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
        const roundedLat = parseFloat(lat).toFixed(5);
        const roundedLong = parseFloat(long).toFixed(5);
        const heatmapEntry = await Heatmap.findOneAndUpdate(
            { uid }, // Match by UID
            { lat: roundedLat, long: roundedLong, uid, expirationDate }, // Update fields
            { new: true, upsert: true } // Create a new entry if it doesn't exist
        );
        //console.log("Expiration Date3:", expirationDate);

        //one month from now
        const historicalExpirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        var currDate = new Date(Date.now());
        const currentHour = currDate.getHours();
        currDate = new Date();
        const hourStart = new Date(currDate);
        hourStart.setHours(currentHour, 0, 0, 0); // Set to the start of the current hour

        const hourEnd = new Date(currDate);
        hourEnd.setHours(currentHour + 1, 0, 0, 0);
        const historicalroundedLat = parseFloat(lat).toFixed(3);
        const historicalroundedLong = parseFloat(long).toFixed(3);
        const historicalheatmapEntry = new HistoricalHeatmap({
            lat: historicalroundedLat, // rounded latitude
            long: historicalroundedLong, // rounded longitude
            uid: uid, // user ID
            expirationDate: historicalExpirationDate, // expiration date
            Date: currDate // current date for when the entry was created
          });
          const existingEntry = await HistoricalHeatmap.findOne({
            lat: historicalroundedLat,
            long: historicalroundedLong,
            uid: uid,
            Date: { $gte: hourStart, $lt: hourEnd }
          });
        if (existingEntry) {
            //console.log("updating");
            const updatedEntry = await HistoricalHeatmap.findOneAndUpdate(
                { _id: existingEntry._id }, // Find the document by its _id
                { 
                  $set: {
                    expirationDate: historicalExpirationDate, // Update expiration date
                    Date: currDate // Update the current date
                  }
                },
                { new: true } // Return the updated document
              );
            return res.status(200).json({
                message: "Entry updated successfully",
                data: updatedEntry 
              });
        }
        await historicalheatmapEntry.save();


        res.json({ message: "Heatmap data added/updated successfully", entry: heatmapEntry });
    } catch (error) {
        console.error("Error adding heatmap data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = heatMapRouter;