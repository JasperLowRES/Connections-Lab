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
      let currentDate = new Date();
      apiLoadTime = currentDate.toLocaleString();
      updateLoadingStatus();

    } catch (error) {
      console.error("Error fetching radiosonde data:", error);
    }
  }

  function updateLoadingStatus () {
    if (apiDataLoaded) {
        loadingStatus = 'data loaded, ${apiLoadTime}';
    } else {
        loadingStatus = "loading data...";
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
    sketchWidth = windowWidth * 0.6;
    let radiosondeCanvas = createCanvas(sketchWidth, 600);
    radiosondeCanvas.addClass('radiosondeCanvas');  

    userStartAudio(); 
    context = getAudioContext(); 
    loadInitialData().then(() => {
        fetchRadiosondeData();
        setInterval(fetchRadiosondeData, fetchInterval); 
    });
  
    startButton = createButton('Play');
    startButton.position(20, 10);
    startButton.mousePressed(toggleAudio);  
  
    const legendButton = createButton('Legend');
    legendButton.position(20, windowHeight - 50);
    legendButton.mousePressed(toggleLegend);
  
    const infoButton = createButton('Info');
    infoButton.position(windowWidth - 60, 10);
    infoButton.mousePressed(toggleInfo);
  
    const creditsButton = createButton('Credits');
    creditsButton.position(windowWidth - 70, windowHeight - 50);
    creditsButton.mousePressed(toggleCredits);
    

  
    timeSlider = createSlider(0, 0, 0, 1);  
    timeSlider.position(windowWidth / 2 - (sketchWidth / 2), 660);
    timeSlider.size(sketchWidth);
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

   // textSize(14);
   // fill(0);
   // textAlign(RIGHT, TOP);
   // text(loadingStatus, width - 18, 2);

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

  function legendSketch(p) {
    const minTemp = 0;
    const maxTemp = 50;
    const numCircles = 7;

    const minHumidity = 0;
    const maxHumidity = 100;

    const altitudes = [0, 828, 8848, 12000, 20000, 30000, 40000];
    const milestones = ["Ground", "Burj Khalifa", "Mount Everest", "Commercial Jets", "Military Planes", "Stratosphere", "Space"];

    p.setup = function () {
        let canvas = p.createCanvas(250, 380);  // Increase canvas height to fit the new line
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
        p.text("Currently Audible", p.width / 2 + 20, topOffset + 270);  // Adjust position for the final line
        p.noFill();
        p.stroke(0);
        p.strokeWeight(.7);
        p.ellipse(p.width / 2 - 60, topOffset + 270, 10, 10);  // Draw a circle with black stroke

        p.fill(0);
        p.noStroke();
        p.text("=", p.width / 2 - 35, topOffset + 270);  // Add equals sign next to the circle
    };
}


  
let legendSketchInstance; // Declare a variable to track the p5.js instance

function toggleLegend() {
    let legendPopup = document.getElementById('legendPopup');

    if (legendPopup.style.display === 'none' || legendPopup.style.display === '') {
        legendPopup.style.display = 'block';
        legendPopup.style.top = windowHeight / 2 - 140 + 'px'; // Center vertically
        legendPopup.style.left = windowWidth / 2 - 125 + 'px'; // Center horizontally

        // Create the p5.js sketch only if it hasn't been created yet
        if (!legendSketchInstance) {
            legendSketchInstance = new p5(legendSketch, 'legendCanvasContainer');
        }
    } else {
        legendPopup.style.display = 'none';
    }
}
  
  
  // Function to toggle the display of the Info popup
  function toggleInfo() {
    let infoPopup = document.getElementById('infoPopup');
    if (infoPopup.style.display === 'none' || infoPopup.style.display === '') {
      infoPopup.style.display = 'block';
      infoPopup.style.top = windowHeight / 2 - 100 + 'px'; // Example positioning, adjust as needed
      infoPopup.style.left = windowWidth / 2 - 125 + 'px'; // Example positioning, adjust as needed
    } else {
      infoPopup.style.display = 'none';
    }
  }
  
  // Function to toggle the display of the Credits popup
  function toggleCredits() {
    let creditsPopup = document.getElementById('creditsPopup');
    if (creditsPopup.style.display === 'none' || creditsPopup.style.display === '') {
      creditsPopup.style.display = 'block';
      creditsPopup.style.top = windowHeight / 2 - 100 + 'px'; // Example positioning, adjust as needed
      creditsPopup.style.left = windowWidth / 2 - 125 + 'px'; // Example positioning, adjust as needed
    } else {
      creditsPopup.style.display = 'none';
    }
  }
  
  

  function windowResized() {
    // Recalculate sketch width on window resize
    sketchWidth = windowWidth * 0.6;
    resizeCanvas(sketchWidth, 600);

    // Reposition the buttons based on window size
    startButton.position(90, 10); // Top left
    legendButton.position(90, windowHeight - 50); // Bottom left
    creditsButton.position(windowWidth - 90, windowHeight - 50); // Bottom right
    infoButton.position(windowWidth - 90, 10); // Top right

    // Reposition the slider
    const newSliderX = windowWidth / 2 - (sketchWidth / 2);
    const newSliderY = height + 60;
    timeSlider.position(newSliderX, newSliderY);
}
