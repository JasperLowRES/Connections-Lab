let radiosondes = {};  
let grains = [];       
let textFeed = [];     
let sortedTimestamps = [];  
let timeSlider;  
let fetchInterval = 10000; 
let isPlaying = false;  
let startButton;
let previousSliderValue = -1; 
let context; 
let sourceFile; 
let audioBuffer; 
let grainScheduler; 
let dataLoaded = false; 
let gridSize = 40;

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

async function loadInitialData() {
    try {
      const response = await fetch('https://jasperlowres.github.io/Connections-Lab/Project1Draft/radiosondeDataPreview.json');  // Replace with actual file path
      if (!response.ok) {
        throw new Error(`Failed to load initial data: ${response.status}`);
      }
  
      radiosondes = await response.json();  
      console.log("Loaded initial radiosonde data from JSON:", radiosondes);
      
      populateTimestampsFromRadiosondes();
      dataLoaded = true;  
  
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  }
  
  async function fetchRadiosondeData() {
    try {
      const response = await fetch('https://api.allorigins.win/get?url=https://api.v2.sondehub.org/sondes/telemetry?duration=12h');
      console.log("Attempting to fetch data");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      radiosondes = JSON.parse(data.contents);
      console.log("Updated radiosonde data from API:", radiosondes);
  
      populateTimestampsFromRadiosondes();
    } catch (error) {
      console.error("Error fetching radiosonde data:", error);
    }
  }
  
  function populateTimestampsFromRadiosondes() {
    let allTimestamps = new Set();
    for (let sondeID in radiosondes) {
      for (let timestamp in radiosondes[sondeID]) {
        allTimestamps.add(timestamp);
      }
    }
    sortedTimestamps = Array.from(allTimestamps).sort();
    numRadiosondes = Object.keys(radiosondes).length;
    timeSlider.attribute('max', sortedTimestamps.length - 1);
  }

function preload() {
  sourceFile = loadSound('https://jasperlowres.github.io/Connections-Lab/Project1Draft/upupandaway.mp3', soundLoaded, loadError);
}

function soundLoaded() {
  audioBuffer = sourceFile.buffer;
  console.log('Sound loaded, buffer duration:', audioBuffer.duration);
}

function loadError(err) {
  console.error('Failed to load sound:', err);
}

function setup() {
  createCanvas(800, 600);

  userStartAudio(); 

  context = getAudioContext(); 

  loadInitialData().then(() => {
    fetchRadiosondeData();
    setInterval(fetchRadiosondeData, fetchInterval); 
  });

  startButton = createButton('Play');
  startButton.position(10, 10);
  startButton.mousePressed(toggleAudio);  

  // slider for scrubbing through timestamps
  timeSlider = createSlider(0, 0, 0, 1);  
  timeSlider.position(windowWidth / 2 - 400, 660);
  timeSlider.size(800);
  timeSlider.input(onSliderInput); 

  // Initialized grain parameters
  minSpread = 0.9;
  maxSpread = 10;
  minAttack = 0.01;
  maxAttack = 0.3;
  minRelease = 0.1;
  maxRelease = 1.2;

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
      textSize(12);
      text('Fetching a large amount data. This usually takes several minutes, you may want to click away and come back later.', width / 2, height / 2 + 30);
      return;
    }
  
    background(255);  
    drawMap();
  
    
    let currentSliderValue = timeSlider.value();
    let currentTimestamp = sortedTimestamps[currentSliderValue];  
  
    if (currentSliderValue !== previousSliderValue) {
      // Stop existing grains
      stopAllGrains();
      // Create new grains for the current radiosondes
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
        let blurValue = map(humidity, 0, 100, 2, 12);  
        let sizeValue = map(altitude, 0, 40000, 4, 12)
  
        drawingContext.filter = `blur(${blurValue}px)`;
  
        if (grains.some(g => g.sondeID === sondeID && g.isPlaying)) {
          strokeWeight(.5);
          stroke(0);
          fill(255); 
        } else {
          fill(colorValue);
        }
        noStroke();
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
  
  // Fetch radiosonde data from SondeHub API and update timestamps
//   async function fetchRadiosondeData() {
//     try {
//       const response = await fetch('https://api.allorigins.win/get?url=https://api.v2.sondehub.org/sondes/telemetry?duration=12h');
//       console.log("Attempting to fetch data");
//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }
  
//       const data = await response.json();
//       radiosondes = JSON.parse(data.contents);
//       console.log("Updated Radiosonde Data:", radiosondes);
  
//       // Collect and sort unique timestamps from all radiosondes
//       let allTimestamps = new Set();
//       for (let sondeID in radiosondes) {
//         for (let timestamp in radiosondes[sondeID]) {
//           allTimestamps.add(timestamp);  
//         }
//       }
//       sortedTimestamps = Array.from(allTimestamps).sort();  
//       numRadiosondes = Object.keys(radiosondes).length;
//       timeSlider.attribute('max', sortedTimestamps.length - 1);  
  
//       dataLoaded = true;
  
//     } catch (error) {
//       console.error('Error fetching radiosonde data:', error);
//     }
//   }
  
  function onSliderInput() {
    let sliderValue = timeSlider.value();
    console.log(`Slider changed to: ${sliderValue}`);
  }
  
  function createGrainsForCurrentRadiosondes(currentTimestamp) {
    if (!currentTimestamp) {
      console.error('Current timestamp is undefined');
      return;
    }
  
    // Get the radiosondes at the current timestamp
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
  
      // Determine density based on number of radiosondes
      let density = currentRadiosondes.length / numRadiosondes;
      density = constrain(density, 0, 1);
      console.log ("density", density)
  
      // Adjust grain duration based on density
      let grainDuration = map(density, 0, 1, minGrainDuration, maxGrainDuration);
  
      // Calculate interval based on density
      let dens = map(density, 1, 0, 0, 1);
      let interval = dens * random(10, 500);
  
      // Randomly select a radiosonde
      let randomIndex = floor(random(0, currentRadiosondes.length));
      let entry = currentRadiosondes[randomIndex];
  
      if (entry) {
        let grain = new Grain(entry, grainDuration, density);
        grains.push(grain);
  
        // Schedule the next grain
        grainScheduler = setTimeout(scheduleNextGrain, interval);
      } else {
        console.error('Entry is undefined at index:', randomIndex);
        // Schedule the next grain anyway
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
  
      let now = context.currentTime;
      this.amp = 0.5; 
      this.source = context.createBufferSource();
      this.source.buffer = audioBuffer;
      this.source.playbackRate.value = this.source.playbackRate.value * pitch;
  
      // Create gain node
      this.gainNode = context.createGain();
      this.source.connect(this.gainNode);
      this.gainNode.connect(context.destination);
  
      // Calculate parameters
      this.attackTime = map(density, 0, 1, minAttack, maxAttack);
      this.releaseTime = map(density, 0, 1, minRelease, maxRelease);
      this.sustainTime = this.grainDuration - this.attackTime - this.releaseTime;
  
      if (this.sustainTime < 0) {
        this.sustainTime = 0.00001; // Ensure positive sustain time
      }

      let duration = this.attackTime + this.sustainTime + this.releaseTime;
  
      this.randomOffset = map(density, 0, 1, random(-minSpread / 2, minSpread / 2), random(-maxSpread / 2, maxSpread / 2));
  
      // Map the slider value to the offset in the audio sample
      let sampleDuration = audioBuffer.duration;
      let centralCuePoint = map(timeSlider.value(), 0, sortedTimestamps.length - 1, 0, sampleDuration - duration);

      this.offset = centralCuePoint + this.randomOffset;
      this.offset = constrain(this.offset, 0, sampleDuration - duration);
  
      // Start playing the sound
      this.source.start(now, this.offset, duration);
  
      this.gainNode.gain.setValueAtTime(0.0, now); 
      this.gainNode.gain.linearRampToValueAtTime(this.amp, now + this.attackTime); 
      this.gainNode.gain.linearRampToValueAtTime(this.amp, now + this.attackTime + this.sustainTime); 
      this.gainNode.gain.linearRampToValueAtTime(0, now + duration); 
  
      this.source.stop(now + duration + 0.01);
  
      // Cleanup after grain is done playing
      setTimeout(() => {
        this.isPlaying = false;
        this.gainNode.disconnect();
        this.source.disconnect();
      }, (duration + 0.1) * 1000);
    }
  
    stop() {
      // Stop the source
      if (this.isPlaying) {
        this.source.stop();
        this.gainNode.disconnect();
        this.source.disconnect();
        this.isPlaying = false;
      }
    }
  }
  
  function toggleAudio() {
    if (!isPlaying) {
      getAudioContext().resume();
      startButton.html('Pause');
      isPlaying = true;  // Update the state
  
      // If data is already loaded, start the grain scheduler immediately
      if (dataLoaded && sortedTimestamps.length > 0) {
        let currentTimestamp = sortedTimestamps[timeSlider.value()];  // Use the current slider value or start at 0
        createGrainsForCurrentRadiosondes(currentTimestamp);
      }
  
      // Force the grains to be created when play is initiated
      previousSliderValue = -1;
    } else {
      // If playing, stop audio and change the button to 'Play'
      getAudioContext().suspend();
      startButton.html('Play');
      isPlaying = false;  // Update the state
  
      // Stop all grains
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
  
  function windowResized() {
    const newSliderX = windowWidth / 2 - 400;  
    const newSliderY = height + 60;     
  
    timeSlider.position(newSliderX, newSliderY);
  }
  
