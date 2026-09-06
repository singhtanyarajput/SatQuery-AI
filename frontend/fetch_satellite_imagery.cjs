// fetch_satellite_imagery.cjs
// Downloads genuine top-down Earth Observation satellite imagery for SatQuery AI mock reports.
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'public', 'satellite');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const scenes = [
  { name: 'godavari_optical.jpg', bbox: '79.05,19.75,79.25,19.95' },
  { name: 'brahmaputra_flood.jpg', bbox: '92.85,26.15,93.15,26.35' },
  { name: 'punjab_agriculture.jpg', bbox: '75.75,30.80,75.95,30.95' },
  { name: 'kerala_wetlands.jpg', bbox: '76.25,9.92,76.38,10.04' },
  { name: 'odisha_coast.jpg', bbox: '86.60,20.25,86.75,20.38' },
  { name: 'gujarat_port.jpg', bbox: '69.70,22.75,69.85,22.88' },
  { name: 'bengaluru_urban.jpg', bbox: '77.65,12.82,77.72,12.88' },
  { name: 'tamilnadu_coast.jpg', bbox: '79.80,11.88,79.86,11.96' },
  { name: 'delhi_airport.jpg', bbox: '77.08,28.545,77.12,28.58' },
  { name: 'sundarbans_delta.jpg', bbox: '88.75,21.85,88.95,22.02' },
  { name: 'jamnagar_refinery.jpg', bbox: '69.81,22.34,69.87,22.39' },
  { name: 'marathwada_reservoir.jpg', bbox: '75.32,19.46,75.44,19.55' },
];

async function downloadAll() {
  for (const scene of scenes) {
    const filePath = path.join(outDir, scene.name);
    const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${scene.bbox}&bboxSR=4326&imageSR=4326&size=800,500&format=jpg&f=image`;
    console.log(`Downloading ${scene.name}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buf));
      console.log(`Saved ${scene.name} (${buf.byteLength} bytes)`);
    } catch (err) {
      console.error(`Failed ${scene.name}:`, err.message);
    }
  }
  console.log('Finished downloading all satellite imagery scenes.');
}

downloadAll();
