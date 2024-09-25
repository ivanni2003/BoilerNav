var mymap = L.map('mapid').setView([40.4274, -86.9132], 13); // Latitude, Longitude, Zoom Level

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 18,
    maxZoom: 20,
}).addTo(mymap);

var marker = L.marker([40.4274, -86.9132]).addTo(mymap);

marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();

console.log(mymap.getBounds())