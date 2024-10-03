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
let gridSize = 40;
let reverbIR;

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
      const response = await fetch('https://jasperlowres.github.io/Connections-Lab/Project1Draft/radiosondeDataPreview.json');  
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
  sourceFile = loadSound('https://jasperlowres.github.io/Connections-Lab/Project1Draft/upupandaway.mp3', soundLoaded);
  reverbIR = loadSound('https://jasperlowres.github.io/Connections-Lab/Project1Draft/IRx500_01A.wav')
}

function soundLoaded() {
  audioBuffer = sourceFile.buffer;
  console.log('Sound loaded, buffer duration:', audioBuffer.duration);
}

function setup() {
  createCanvas(windowWidth*.67, windowHeight*7);

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
  timeSlider.position(windowWidth / 2 - 405, 660);
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
      //textSize(12);
     // text('Fetching a large amount data. This usually takes several minutes, you may want to click away and come back later.', width / 2, height / 2 + 30);
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
      startButton.html('Pause');
      isPlaying = true; 
  
      if (dataLoaded && sortedTimestamps.length > 0) {
        let currentTimestamp = sortedTimestamps[timeSlider.value()]; 
        createGrainsForCurrentRadiosondes(currentTimestamp);
      }
  
      previousSliderValue = -1;
    } else {

        getAudioContext().suspend();
      startButton.html('Play');
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
  
  function windowResized() {
    resizeCanvas(windowWidth*.67, windowHeight*7);

    const newSliderX = windowWidth / 2 - 400;  
    const newSliderY = height + 60;     
  
    timeSlider.position(newSliderX, newSliderY);
  }
  
