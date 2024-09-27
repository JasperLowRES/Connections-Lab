let radiosondes = {};  // Stores radiosonde data
let synths = {};       // Synths for generating tones for each radiosonde
let fetchInterval = 5000; // Interval to fetch new data (5 seconds)
let textFeed = [];     // Array to store the text feed
let superjiraScale = []; // F♭ Superjira chord in 31-EDO

// Generate F♭ Superjira chord frequencies in 31-EDO
function generateSuperjiraScale() {
  superjiraScale = [];  // Clear the existing scale
  const edoSteps = [0, 5, 9, 13, 17, 21];  // Steps in 31-EDO for F♭ Superjira chord
  const baseFrequency = random(50, 250);  // F♭ base frequency
  edoSteps.forEach(step => {
    let freq = baseFrequency * Math.pow(2, step / random(12, 31)); // Calculate frequency for each step
    superjiraScale.push(freq);
  });
}

function setup() {
  createCanvas(800, 600);
  generateSuperjiraScale(); // Generate the Superjira scale in 31-EDO
  userStartAudio();  // Ensure that the AudioContext is started after a user gesture

  let resumeButton = createButton('Click to Start Audio');
  resumeButton.position(10, 10);
  resumeButton.mousePressed(() => {
    getAudioContext().resume();
    resumeButton.hide();  // Hide button after clicking
  });

  fetchRadiosondeData();  // Initial fetch
  setInterval(fetchRadiosondeData, fetchInterval);  // Fetch new data every 5 seconds
}

function draw() {
  background(100);  // Make sure the text is drawn after this background
  drawMap();

  // Loop through radiosondes and get the latest timestamp for each
  for (let sonde in radiosondes) {
    let data = radiosondes[sonde];
    
    // Get all the timestamps for this radiosonde
    let timestamps = Object.keys(data);
    
    if (timestamps.length > 0) {
      let latestTimestamp = timestamps[timestamps.length - 1];  // Get the latest timestamp
      let entry = data[latestTimestamp];
      
      // Ensure all necessary data fields are available
      if (entry.lat && entry.lon && entry.alt && entry.temp !== undefined && entry.humidity !== undefined) {
        let lat = entry.lat;
        let lon = entry.lon;
        let altitude = entry.alt;
        let temp = entry.temp;
        let humidity = entry.humidity;

        let x = map(lon, -180, 180, 0, width);
        let y = map(lat, -90, 90, height, 0);

        let tempColor = map(temp, -50, 50, 0, 255);
        let colorValue = color(tempColor, 0, 255 - tempColor);
        let blurValue = map(humidity, 0, 100, 0, 10);
        drawingContext.filter = `blur(${blurValue}px)`;

        fill(colorValue);
        noStroke();
        ellipse(x, y, 10, 10);

        textFeed.push(`Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}, Alt: ${altitude}m, Temp: ${temp}°C, Humidity: ${humidity}%`);
        if (textFeed.length > 10) {
          textFeed.shift(); // Keep the text feed to 10 lines
        }

        // Sonify the radiosonde data
        sonifyRadiosonde(sonde, lat, lon, altitude, temp);
      }
    }
  }

  drawingContext.filter = 'none'; // Reset blur filter
  drawTextFeed(); // Draw the text feed after visualizing the radiosonde data
}

// Fetch radiosonde data from SondeHub API
async function fetchRadiosondeData() {
  try {
    const response = await fetch('https://api.allorigins.win/get?url=https://api.v2.sondehub.org/sondes/telemetry?duration=1h');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    radiosondes = JSON.parse(data.contents);
    console.log("Updated Radiosonde Data:", radiosondes);

    // Regenerate the Superjira scale when new data is fetched
    generateSuperjiraScale();

  } catch (error) {
    console.error('Error fetching radiosonde data:', error);
  }
}

// Map longitude and latitude to a note in the F♭ Superjira chord
function getNoteFromCoords(lat, lon) {
  let step = floor(map(lon, -180, 180, 0, superjiraScale.length)); // Map longitude to scale step
  let baseFreq = superjiraScale[step % superjiraScale.length]; // Get the note

  // Rescale frequency to be in a higher range (e.g., 200 Hz to 1000 Hz)
  let freq = map(baseFreq, 184.997, 369.994, 200, 1000);
  
  return freq;
}

// Sonify radiosonde data with pulsing tones
function sonifyRadiosonde(sondeId, lat, lon, altitude, temp) {
  let noteFreq = getNoteFromCoords(lat, lon); // Get the note based on lat/lon
  
  // Map temperature to waveform type (Sine wave for cold, Saw wave for hot)
  let waveform = temp < 0 ? 'sine' : 'triangle';

  // Map altitude to pulse rate (lower altitude = slower pulsing, higher altitude = faster pulsing)
  let pulseRate = map(altitude, 0, 20000, 0.1, 15);  // Pulsing rate in Hz

  // Ensure temperature is finite and within expected range before mapping to volume
  if (!isFinite(temp)) {
    console.error('Invalid temperature value:', temp);
    return; // Exit the function if the temperature is invalid
  }
  
  let volume = map(temp, -50, 50, 0.2, 1);  // Map temperature to volume (colder = quieter, warmer = louder)

  // Ensure all values are finite before proceeding
  if (!isFinite(noteFreq) || !isFinite(pulseRate) || !isFinite(volume)) {
    console.error('Invalid value detected in sonifyRadiosonde:', { noteFreq, pulseRate, volume });
    return;  // Exit the function if any value is invalid
  }

  // Check if the oscillator for this radiosonde already exists
  if (!synths[sondeId]) {
    let osc = new p5.Oscillator(noteFreq, waveform);
    osc.amp(0);  // Start with no amplitude
    osc.start();  // Start the oscillator

    // Store the oscillator and pulse rate in the synths object
    synths[sondeId] = { osc, pulseRate, volume, pulseTimer: 0 };
  }

  // Update the existing oscillator's parameters
  let existingSynth = synths[sondeId];
  existingSynth.osc.freq(noteFreq);  // Update frequency
  existingSynth.osc.setType(waveform);  // Update waveform
  existingSynth.volume = volume;  // Update amplitude
  existingSynth.pulseRate = pulseRate;  // Update pulse rate

  // Apply pulsing effect
  existingSynth.pulseTimer += deltaTime / random(100, 200);  // Increment pulse timer
  if (existingSynth.pulseTimer >= 1 / pulseRate) {
    let ampValue = existingSynth.osc.amp().value > 0 ? 0 : volume;  // Toggle between 0 and volume
    existingSynth.osc.amp(ampValue, 0.09);  // Smooth fade for pulsing
    existingSynth.pulseTimer = 0;  // Reset pulse timer
  }
}

// Draw a basic map background
function drawMap() {
  stroke(255);
  noFill();
  rect(0, 0, width, height);
  textSize(12);
  textAlign(CENTER);
  fill(255);
  text("World Map", width / 2, height - 10);
}

// Function to draw the text feed
function drawTextFeed() {
  fill(255);            // Ensure the text is white and visible
  textAlign(LEFT);       // Align text to the left of the screen
  textSize(6);          // Set the text size to a readable value
  let yPos = 20;         // Starting Y position for the text feed

  // Loop through each entry in the textFeed array and display it
  for (let i = 0; i < textFeed.length; i++) {
    text(textFeed[i], 20, yPos);  // Draw each line of the feed at (20, yPos)
    yPos += 15;                   // Increment Y position for the next line
  }
}
