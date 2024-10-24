let radiosondes = {};  
let grains = [];       
let textFeed = [];     
let sortedTimestamps = [];  
let timeSlider;  
let fetchInterval = 1800000; 
let isPlaying = false;  
let startButton;
let previousSliderValue = -1; 
let context; 
let sourceFile; 
let audioBuffer; 
let grainScheduler; 
let dataLoaded = false; 
let apiDataLoaded = false;
let apiLoadTime = '';
let timeLabels = [];

let gridSize = 40;
let sketchWidth;
let reverbIR;
let loadingStatus = "loading data...";

// Grain parameters
let minAttack;
let maxAttack;
let minRelease;
let maxRelease;
let maxGrainDuration = 0.5;  
let minGrainDuration = 0.00001; 
let minSpread;
let maxSpread;
let pitch = 0.9; 
let densityParameter = 0.9;
let numRadiosondes; 
const MAX_ACTIVE_GRAINS = 20; 

let loadingDots = '';
let dotCount = 0;
let lastDotTime = 0;

let isLooping = false;
let loopIntervalId = null;

let dataPoints = []; // array of data points

let yourStartTimestamp, yourEndTimestamp;

function setupTimeMarkers() {
    const markerContainer = document.getElementById('timeMarkers');
    if (!markerContainer) {
        console.error('Time markers container not found');
        return;
    }
    markerContainer.innerHTML = ''; // Clear existing markers

    const timeSliderContainer = document.getElementById('timeSlider');
    if (!timeSliderContainer) {
        console.error('Time slider container not found');
        return;
    }

    // Remove existing balloon icons
    const existingBalloons = timeSliderContainer.querySelectorAll('.balloon-icon');
    existingBalloons.forEach(balloon => balloon.remove());

    const specificPositions = [];

    const startTime = new Date(yourStartTimestamp);
    const endTime = new Date(yourEndTimestamp);
    let timeRange = endTime - startTime;
    
    // Ensure the time range covers 12 hours
    const twelveHours = 12 * 60 * 60 * 1000; // in milliseconds
    if (timeRange < twelveHours) {
        console.warn('Time range is less than 12 hours. Adjusting endTime.');
        endTime.setTime(startTime.getTime() + twelveHours);
        timeRange = twelveHours;
    }

    // Calculate all launch times (00:00 and 12:00 UTC) within the time range
    const launchTimes = [];
    const currentDate = new Date(startTime);

    // Set to the start of the day
    currentDate.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endTime) {
        // Add 00:00 UTC
        let launchTime1 = new Date(currentDate);
        launchTimes.push(new Date(launchTime1));

        // Add 12:00 UTC
        let launchTime2 = new Date(currentDate);
        launchTime2.setUTCHours(12);
        launchTimes.push(new Date(launchTime2));

        // Move to the next day
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Filter launchTimes within startTime and endTime
    const validLaunchTimes = launchTimes.filter(launchTime => launchTime >= startTime && launchTime <= endTime);

    validLaunchTimes.forEach((utcTime) => {
        // Calculate the relative position (0 to 1)
        const position = (utcTime - startTime) / timeRange;
        const percentage = position * 100;

        // Store specific marker positions
        specificPositions.push(percentage);

        // Create time marker
        const marker = document.createElement('div');
        marker.classList.add('time-marker');
        marker.style.left = `${percentage}%`;

        // Create marker line
        const markerLine = document.createElement('div');
        markerLine.classList.add('marker-line');
        marker.appendChild(markerLine);

        // Create marker time label in UTC format
        const markerTime = document.createElement('div');
        markerTime.classList.add('marker-time');
        markerTime.textContent = formatUTCTime(utcTime.getTime()); // Formats to hh:mm UTC
        marker.appendChild(markerTime);

        // Append marker to container
        markerContainer.appendChild(marker);

        // Create balloon icon
        const balloon = document.createElement('div');
        balloon.classList.add('balloon-icon');
        balloon.style.left = `${percentage}%`;
        balloon.innerHTML = '🎈';
        balloon.setAttribute('aria-hidden', 'true'); // Accessibility

        // Append balloon to timeSlider container
        timeSliderContainer.appendChild(balloon);

        // Trigger reflow to enable transition and animation
        requestAnimationFrame(() => {
            balloon.classList.add('visible');
        });

        console.log(`Balloon appended at ${percentage}%:`, balloon);
    });

    // Define the minimum distance (in percentage) between markers to prevent overlap
    const MIN_DISTANCE_PERCENT = 2.5; // Adjust as needed

    // Add general time markers (e.g., every hour)
    const numberOfGeneralMarkers = 12; // 12 markers for 12 hours
    for (let i = 0; i <= numberOfGeneralMarkers; i++) {
        const currentTime = new Date(startTime.getTime() + (i * (timeRange / numberOfGeneralMarkers)));
        const position = (currentTime - startTime) / timeRange;
        const percentage = position * 100;

        // Check if this general marker is too close to any specific marker
        const isTooClose = specificPositions.some(specificPos => Math.abs(specificPos - percentage) < MIN_DISTANCE_PERCENT);

        if (isTooClose) {
            console.log(`Skipping marker at ${percentage}% to prevent overlap with balloon marker.`);
            continue; // Skip adding this marker
        }

        // Create time marker
        const marker = document.createElement('div');
        marker.classList.add('time-marker');
        marker.style.left = `${percentage}%`;

        // Create marker line
        const markerLine = document.createElement('div');
        markerLine.classList.add('marker-line');
        marker.appendChild(markerLine);

        // Create marker time label in standard format
        const markerTime = document.createElement('div');
        markerTime.classList.add('marker-time');
        markerTime.textContent = formatTime(currentTime.getTime()); // Formats to hh:mm AM/PM or as per your format
        marker.appendChild(markerTime);

        // Append marker to container
        markerContainer.appendChild(marker);
    }
}

// Helper function to format time in UTC
function formatUTCTime(timestamp) {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        console.error("Invalid date:", timestamp);
        return "Invalid Date";
    }
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes} UTC`;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        console.error("Invalid date:", timestamp);
        return "Invalid Date";
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g., "02:00 PM"
}

// function to format dates
function formatDate(timestamp) {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        console.error("Invalid date:", timestamp);
        return "Invalid Date";
    }
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }); // e.g., "Sep 14, 2023"
}

function updateTimeLabels(startTime, endTime) {
    const startTimeElement = document.getElementById('startTime');
    const endTimeElement = document.getElementById('endTime');
    if (startTimeElement && endTimeElement) {
        startTimeElement.textContent = formatDateTime(startTime);
        endTimeElement.textContent = formatDateTime(endTime);
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    updateTimeLabels(yourStartTimestamp, yourEndTimestamp);
});


async function loadInitialData() {
    try {
        const response = await fetch('https://jasperlowres.github.io/Connections-Lab/Project1Draft/radiosondeDataPreview.json');  
        if (!response.ok) {
            throw new Error(`Failed to load initial data: ${response.status}`);
        }
    
        radiosondes = await response.json();  
        console.log("Loaded initial radiosonde data from JSON:", radiosondes);
        
        populateTimestampsFromRadiosondes();
        dataLoaded = true;  
        updateLoadingStatus();
        setupTimeMarkers(); 
        
        // Start fetching data from API
        fetchRadiosondeData();
    } catch (error) {
        console.error("Error loading initial data:", error);
    }
}
  
  async function fetchRadiosondeData() {
    try {
        apiDataLoaded = false;
        loadingStatus = "loading data..."
        const response = await fetch('https://api.allorigins.win/get?url=https://api.v2.sondehub.org/sondes/telemetry?duration=12h');
        console.log("Attempting to fetch data");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        radiosondes = JSON.parse(data.contents);
        console.log("Updated radiosonde data from API:", radiosondes);

        populateTimestampsFromRadiosondes();
        apiDataLoaded = true;
        
        // Store apiLoadTime as a timestamp
        apiLoadTime = Date.now(); 
        updateLoadingStatus();

        // **Call setupTimeMarkers to update balloon positions**
        setupTimeMarkers();

    } catch (error) {
        console.error("Error fetching radiosonde data:", error);
    }
}

  function updateLoadingStatus() {
    const statusIndicator = document.getElementById('statusIndicator');
    if (!statusIndicator) return;

    if (!dataLoaded) {
        loadingStatus = "Loading most recent data";
    } else if (!apiDataLoaded) {
        loadingStatus = "Loading most recent data";
    } else {
        const nextUpdateTime = apiLoadTime + fetchInterval;
        const timeUntilNextUpdate = Math.max(0, Math.floor((nextUpdateTime - Date.now()) / 60000));
        loadingStatus = `Data loaded, updating in ${timeUntilNextUpdate} mins`;
    }

    statusIndicator.textContent = loadingStatus;
}
  
  function populateTimestampsFromRadiosondes() {
    let allTimestamps = new Set();
    for (let sondeID in radiosondes) {
        for (let timestamp in radiosondes[sondeID]) {
            allTimestamps.add(timestamp);
        }
    }
    sortedTimestamps = Array.from(allTimestamps).sort();

    // Ensure sortedTimestamps covers at least 12 hours
    if (sortedTimestamps.length < 2) {
        console.error("Not enough timestamps to cover 12 hours.");
        return;
    }

    numRadiosondes = Object.keys(radiosondes).length;
    timeSlider.attribute('max', sortedTimestamps.length - 1);

    // Set start and end timestamps to cover 12 hours
    yourStartTimestamp = sortedTimestamps[0];
    yourEndTimestamp = new Date(new Date(yourStartTimestamp).getTime() + 12 * 60 * 60 * 1000).toISOString();

    // Ensure endTimestamp exists in sortedTimestamps
    if (!sortedTimestamps.includes(yourEndTimestamp)) {
        sortedTimestamps.push(yourEndTimestamp);
        sortedTimestamps.sort();
    }

    // Update time labels after setting timestamps
    updateTimeLabels(yourStartTimestamp, yourEndTimestamp);
    
    // Set dataLoaded to true and update loading status
    dataLoaded = true;
    updateLoadingStatus();
  }

function preload() {
  sourceFile = loadSound('https://jasperlowres.github.io/Connections-Lab/Project1Draft/upupandaway.mp3', soundLoaded);
  reverbIR = loadSound('https://jasperlowres.github.io/Connections-Lab/Project1Draft/IRx500_01A.wav')
}

function soundLoaded() {
  audioBuffer = sourceFile.buffer;
  console.log('Sound loaded, buffer duration:', audioBuffer.duration);
}

function setup() {
    let canvas = createCanvas(windowWidth * 0.6, windowHeight * 0.6);
    canvas.parent('sketch-holder');
  
    userStartAudio(); 
    context = getAudioContext(); 
    loadInitialData().then(() => {
        fetchRadiosondeData();
        setInterval(fetchRadiosondeData, fetchInterval); 
    });
  
    timeSlider = select('#slider');
    timeSlider.input(onSliderInput);
  
    // Initialized grain parameters
    minSpread = 0.9;
    maxSpread = 10;
    minAttack = 0.01;
    maxAttack = 0.3;
    minRelease = 0.1;
    maxRelease = 1.2;

    // Initialize other elements if necessary

    // Add interval to update loading status every minute
    setInterval(updateLoadingStatus, 60000); // 60000 ms = 1 minute
}

function draw() {
    if (!audioBuffer) {
      background(255);
      fill(100);
      textAlign(CENTER, CENTER);
      textSize(24);
      text('Loading audio...', width / 2, height / 2);
      return;
    }
  
    if (!dataLoaded || sortedTimestamps.length === 0) {
      background(255);
      fill(100);
      textAlign(CENTER, CENTER);
      textSize(24);
      text('Loading data...', width / 2, height / 2);
      return;
    }

    background(255);  

    drawMap();
  
    let currentSliderValue = timeSlider.value();
    let currentTimestamp = sortedTimestamps[currentSliderValue];  
  
    if (currentSliderValue !== previousSliderValue) {
      stopAllGrains();
      createGrainsForCurrentRadiosondes(currentTimestamp);
      previousSliderValue = currentSliderValue;
    }
  
    // Loop through radiosondes and visualize/sonify data for the current timestamp
    for (let sondeID in radiosondes) {
      let sondeData = radiosondes[sondeID];
      if (sondeData[currentTimestamp]) {
        let entry = sondeData[currentTimestamp];
        let lat = entry.lat;
        let lon = entry.lon;
        let altitude = entry.alt;
        let temp = entry.temp || 0;  
        let humidity = entry.humidity || 0;  
        let x = map(lon, -180, 180, 0, width);
        let y = map(lat, -90, 90, height, 0);
  
        let tempColor = map(temp, -50, 50, 0, 255);  
        let colorValue = color(0, tempColor, 255 - tempColor);
        let blurValue = map(humidity, 0, 100, 2, 6);  
        let sizeValue = map(altitude, 0, 40000, 6, 14)
  
        drawingContext.filter = `blur(${blurValue}px)`;
  
        if (grains.some(g => g.sondeID === sondeID && g.isPlaying)) {
          drawingContext.filter = 'none';
          strokeWeight(.7);
          stroke(0);
          fill(255); 
        } else {
          noStroke();
          fill(colorValue);
        }
        ellipse(x, y, sizeValue, sizeValue);
  
        textFeed.push(`Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}, Alt: ${altitude}m, Temp: ${temp}°C, Humidity: ${humidity}%`);
        if (textFeed.length > 10) {
          textFeed.shift(); 
        }
      }
    }
  
    drawingContext.filter = 'none'; 
    // drawTextFeed(); 
}

function onSliderInput() {
    let sliderValue = timeSlider.value();
    // console.log(`Slider changed to: ${sliderValue}`);
}

function createGrainsForCurrentRadiosondes(currentTimestamp) {
    if (!currentTimestamp) {
      console.error('Current timestamp is undefined');
      return;
    }
  
    let currentRadiosondes = [];
    for (let sondeID in radiosondes) {
      let sondeData = radiosondes[sondeID];
      if (sondeData[currentTimestamp]) {
        let entry = { ...sondeData[currentTimestamp], sondeID: sondeID };
        currentRadiosondes.push(entry);
      }
    }
  
    if (currentRadiosondes.length === 0) {
      console.log('No radiosondes found for the current timestamp');
      return;
    }
      scheduleGrains(currentRadiosondes);
}

function scheduleGrains(currentRadiosondes) {
    if (grainScheduler) {
      clearTimeout(grainScheduler);
    }
  
    function scheduleNextGrain() {
      if (!isPlaying) {
        return;
      }
  
      // Remove grains that have finished playing
      grains = grains.filter(g => g.isPlaying);
  
      if (grains.length >= MAX_ACTIVE_GRAINS) {
        grainScheduler = setTimeout(scheduleNextGrain, 50);
        return;
      }
  
      let density = currentRadiosondes.length / numRadiosondes;
      density = constrain(density, 0, 1);
      //console.log ("density", density)
  
      let grainDuration = map(density, 0, 1, minGrainDuration, maxGrainDuration);
  
      let dens = map(density, 1, 0, 0, 1);
      let interval = dens * random(10, 500);
  
      let randomIndex = floor(random(0, currentRadiosondes.length));
      let entry = currentRadiosondes[randomIndex];
  
      if (entry) {
        let grain = new Grain(entry, grainDuration, density);
        grains.push(grain);
  
        grainScheduler = setTimeout(scheduleNextGrain, interval);
      } else {
        console.error('Entry is undefined at index:', randomIndex);
        grainScheduler = setTimeout(scheduleNextGrain, interval);
      }
    }
  
    scheduleNextGrain();
}

function stopAllGrains() {
    if (grains.length > 0) {
      grains.forEach(grain => grain.stop());
      grains = [];
    }
    if (grainScheduler) {
      clearTimeout(grainScheduler);
      grainScheduler = null;
    }
}

class Grain {
    constructor(entry, grainDuration, density) {
        if (!entry || !entry.sondeID) {
            console.error('Invalid entry provided to Grain:', entry);
            return;
        }
        this.entry = entry;
        this.sondeID = entry.sondeID;
        this.isPlaying = true;
        this.grainDuration = grainDuration;
        this.startTime = millis();

        let now = context.currentTime;

        let altitude = entry.alt || 0;
        let volume = map(altitude, 0, 40000, 0.1, 1);
        this.amp = volume;

        let filterFreq = map(altitude, 0, 40000, random(500, 5000), 12000);
        let reverbMix = map(altitude, 0, 40000, 1, 0.5);

        this.source = context.createBufferSource();
        this.source.buffer = audioBuffer;
        this.source.playbackRate.value = this.source.playbackRate.value * pitch;

        this.gainNode = context.createGain();
        this.gainNode.gain.value = this.amp;

        this.filter = context.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = filterFreq;
        this.filter.Q.value = random(5, 10);

        this.reverbNode = context.createConvolver();
        this.reverbNode.buffer = reverbIR.buffer;

        this.reverbGain = context.createGain();
        this.reverbGain.gain.value = reverbMix;

        this.source.connect(this.filter);
        this.filter.connect(this.gainNode);
        this.gainNode.connect(context.destination);  // Dry signal
        this.gainNode.connect(this.reverbNode);  // Wet signal
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(context.destination);

        this.attackTime = map(density, 0, 1, minAttack, maxAttack);
        this.releaseTime = map(density, 0, 1, minRelease, maxRelease);
        this.sustainTime = this.grainDuration - this.attackTime - this.releaseTime;

        if (this.sustainTime < 0) {
            this.sustainTime = 0.00001; 
        }

        let duration = this.attackTime + this.sustainTime + this.releaseTime;

        let sampleDuration = audioBuffer.duration;
        let centralCuePoint = map(timeSlider.value(), 0, sortedTimestamps.length - 1, 0, sampleDuration - duration);
        this.offset = centralCuePoint + map(density, 0, 1, random(-minSpread / 2, minSpread / 2), random(-maxSpread / 2, maxSpread / 2));
        this.offset = constrain(this.offset, 0, sampleDuration - duration);

        this.source.start(now, this.offset, duration);

        this.gainNode.gain.setValueAtTime(0.0, now);
        this.gainNode.gain.linearRampToValueAtTime(this.amp, now + this.attackTime);
        this.gainNode.gain.linearRampToValueAtTime(this.amp, now + this.attackTime + this.sustainTime);
        this.gainNode.gain.linearRampToValueAtTime(0, now + duration);

        this.source.stop(now + duration + 0.01);
        setTimeout(() => {
            this.isPlaying = false;
            this.gainNode.disconnect();
            this.filter.disconnect();
            this.reverbGain.disconnect();
            this.reverbNode.disconnect();
            this.source.disconnect();
        }, (duration + 0.1) * 1000);
    }

    stop() {
        if (this.isPlaying) {
            this.source.stop();
            this.gainNode.disconnect();
            this.filter.disconnect();
            this.reverbGain.disconnect();
            this.reverbNode.disconnect();
            this.source.disconnect();
            this.isPlaying = false;
        }
    }
}

function toggleAudio() {
    if (!isPlaying) {
      getAudioContext().resume();
      select('.top-buttons button:first-child').html('Pause');
      isPlaying = true;
      
      if (dataLoaded && sortedTimestamps.length > 0) {
        let currentTimestamp = sortedTimestamps[timeSlider.value()];
        createGrainsForCurrentRadiosondes(currentTimestamp);
      }
      
      previousSliderValue = -1;
    } else {
      getAudioContext().suspend();
      select('.top-buttons button:first-child').html('Play');
      isPlaying = false;
      
      stopAllGrains();
    }
}

function drawMap() {
    stroke(100);
    noFill();
    rect(0, 0, width, height);
    for (let xGrid = 0; xGrid < width; xGrid += gridSize) {
        for (let yGrid = 0; yGrid < height; yGrid += gridSize ) {
            stroke (0, 0, 255, 25);
            strokeWeight (.7);
            line(xGrid, 0, xGrid, height);
            line(0, yGrid, width, yGrid);
        }
    }
}

function drawTextFeed() {
    fill(255);            
    textAlign(LEFT);      
    textSize(12);        
    let yPos = 20;    

    for (let i = 0; i < textFeed.length; i++) {
      text(textFeed[i], 10, yPos + i * 15);
    }
}

function legendSketch(p) {
  const minTemp = 0;
  const maxTemp = 50;
  const numCircles = 7;

  const minHumidity = 0;
  const maxHumidity = 100;

  const altitudes = [0, 828, 8848, 12000, 20000, 30000, 40000];
  const milestones = ["Ground", "Burj Khalifa", "Mount Everest", "Commercial Jets", "Military Planes", "Stratosphere", "Space"];

  p.setup = function () {
      let canvas = p.createCanvas(250, 280);  
      canvas.parent('legendCanvasContainer');
      p.textAlign(p.CENTER, p.CENTER);
  };

  p.draw = function () {
      p.background(255);
      p.fill(0);
      p.textSize(9);

      let topOffset = 5;

      // Temperature section
      p.text("Temperature", p.width / 2, topOffset + 10);
      let circleYTemp = topOffset + 30;
      let startX = 20;
      let circleSpacing = (p.width - startX * 2) / (numCircles - 1);
      let radius = 10;

      for (let i = 0; i < numCircles; i++) {
          let t = i / (numCircles - 1);
          let tempColor = p.lerpColor(p.color(0, 0, 255), p.color(0, 255, 0), t);

          p.fill(tempColor);
          p.noStroke();
          p.ellipse(startX + i * circleSpacing, circleYTemp, radius, radius);

          if (i === 0 || i === numCircles - 1 || i === Math.floor(numCircles / 2)) {
              p.fill(0);
              p.text(Math.round(p.map(t, 0, 1, minTemp, maxTemp)) + "°C", startX + i * circleSpacing, circleYTemp + radius + 10);
          }
      }

      // Humidity section
      p.text("Humidity", p.width / 2, topOffset + 75);
      let circleYHumidity = topOffset + 95;

      for (let i = 0; i < numCircles; i++) {
          let h = i / (numCircles - 1);
          let blurValue = p.map(h, 0, 1, 0, 6);

          p.drawingContext.filter = `blur(${blurValue}px)`;
          p.fill(150);
          p.ellipse(startX + i * circleSpacing, circleYHumidity, radius, radius);
          p.drawingContext.filter = 'none';

          if (i === 0 || i === numCircles - 1 || i === Math.floor(numCircles / 2)) {
              p.fill(0);
              p.text(Math.round(p.map(h, 0, 1, minHumidity, maxHumidity)) + "%", startX + i * circleSpacing, circleYHumidity + radius + 10);
          }
      }

      // Altitude section
      p.text("Altitude", p.width / 2, topOffset + 140);
      let circleYAltitude = topOffset + 160;

      for (let i = 0; i < altitudes.length; i++) {
          let alt = altitudes[i];
          let circleSize = p.map(alt, 0, 40000, 6, 14);

          p.fill(100);
          p.noStroke();
          p.ellipse(startX + i * circleSpacing, circleYAltitude, circleSize, circleSize);

          p.fill(0);
          p.textSize(8);
          p.text(alt + "m", startX + i * circleSpacing, circleYAltitude + circleSize + 10);

          p.push();
          p.translate(startX + i * circleSpacing, circleYAltitude + circleSize + 50);
          p.rotate(p.radians(90));
          p.textSize(8);
          p.text(milestones[i], 0, 0);
          p.pop();
      }

      // Currently audible section
      p.fill(0);
      p.textSize(10);
      p.text("Currently Audible", p.width / 2 - 50, topOffset + 270);  
      p.noFill();
      p.stroke(0);
      p.strokeWeight(.7);
      p.ellipse(p.width / 2 - 115, topOffset + 270, 10, 10);  
      p.fill(0);
      p.noStroke();
      p.text("=", p.width / 2 - 100, topOffset + 270);  
      p.text("🎈  =   Global Launch Time", p.width / 2+60, topOffset + 270);  
      
  };
}



let legendSketchInstance; 
function toggleLegend() {
  let legendPopup = document.getElementById('legendPopup');

  if (legendPopup.style.display === 'none' || legendPopup.style.display === '') {
      legendPopup.style.display = 'block';
      legendPopup.style.top = windowHeight / 2 - 140 + 'px';
      legendPopup.style.left = windowWidth / 2 - 125 + 'px';

      if (!legendSketchInstance) {
          legendSketchInstance = new p5(legendSketch, 'legendCanvasContainer');
      }
  } else {
      legendPopup.style.display = 'none';
  }
}


function toggleInfo() {
  let infoPopup = document.getElementById('infoPopup');
  if (infoPopup.style.display === 'none' || infoPopup.style.display === '') {
    infoPopup.style.display = 'block';
    infoPopup.style.top = windowHeight / 2 - 100 + 'px'; 
    infoPopup.style.left = windowWidth / 2 - 125 + 'px'; 
  } else {
    infoPopup.style.display = 'none';
  }
}

function toggleCredits() {
  let creditsPopup = document.getElementById('creditsPopup');
  if (creditsPopup.style.display === 'none' || creditsPopup.style.display === '') {
    creditsPopup.style.display = 'block';
    creditsPopup.style.top = windowHeight / 2 - 100 + 'px'; 
    creditsPopup.style.left = windowWidth / 2 - 125 + 'px'; 
  } else {
    creditsPopup.style.display = 'none';
  }
}



function windowResized() {
  sketchWidth = windowWidth * 0.6;
  resizeCanvas(sketchWidth, 600);

  startButton.position(90, 10);
  legendButton.position(90, windowHeight - 50); 
  creditsButton.position(windowWidth - 90, windowHeight - 50); 
  infoButton.position(windowWidth - 90, 10);

  const newSliderX = windowWidth / 2 - (sketchWidth / 2);
  const newSliderY = height + 60;
  timeSlider.position(newSliderX, newSliderY);
}


populateTimestampsFromRadiosondes();

// Function to start the loop
function startLoop() {
  const speedSlider = select('#speedSlider'); // Using p5.js's select
  const speed = parseFloat(speedSlider.value()); // p5.Element's value()
  const interval = 1000 / speed; // Convert speed to interval in milliseconds

  loopIntervalId = setInterval(() => {
      let currentValue = parseInt(timeSlider.value()); // p5.Element's value()
      let maxValue = parseInt(timeSlider.attribute('max')); // p5.Element's attribute()

      if (currentValue < maxValue) {
          timeSlider.value(currentValue + 1);
      } else {
          timeSlider.value(0); // Loop back to start
      }

      onSliderInput(); // Trigger any updates associated with slider input
  }, interval);
}

// Function to stop the loop
function stopLoop() {
  if (loopIntervalId) {
      clearInterval(loopIntervalId);
      loopIntervalId = null;
  }
}

// Function to toggle the loop on and off
function toggleLoop() {
  const loopButton = document.querySelector('.top-buttons button:nth-child(2)');
  if (!isLooping) {
      isLooping = true;
      loopButton.textContent = 'Stop Loop';
      startLoop();
  } else {
      isLooping = false;
      loopButton.textContent = 'Loop';
      stopLoop();
  }
}

// Function to update the loop speed based on the speed slider
function updateLoopSpeed() {
  if (isLooping) {
      stopLoop();
      startLoop();
  }
}

// Expose functions to the global scope
window.toggleLoop = toggleLoop;
window.updateLoopSpeed = updateLoopSpeed;

class DataPoint {
  constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = 5;
      this.alpha = 255;
  }

  animate() {
      this.alpha = 127 + 128 * sin(frameCount * 0.1); // Pulsing effect
  }

  display() {
      fill(0, 0, 255, this.alpha);
      ellipse(this.x, this.y, this.size);
  }
}


function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        console.error("Invalid date:", timestamp);
        return "Invalid Date";
    }
    return date.toLocaleString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    }); // e.g., "Sep 14, 2023, 02:00 PM"
}

