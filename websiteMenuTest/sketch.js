let circles = [];
let splineColors = []; // Array to hold colors for each spline
let customFont; // Variable to hold the loaded font
let jaeceLogo, xtsuiLogo, purgeFilesLogo;
let sections; // Sections with branches
let centerX, startY, radiusX, radiusY, curveHeight;

function preload() {
  customFont = loadFont(
    "https://freight.cargo.site/m/M1931740871943339817553035498010/JetBrainsMono-Medium.ttf"
  );
  jaeceLogo = loadImage(
    "https://freight.cargo.site/t/original/i/Q1931638595870837774536184402458/jaeceYtlogonotext.png"
  );
  xtsuiLogo = loadImage(
    "https://freight.cargo.site/t/original/i/I1931638595852391030462474850842/portfoliologo1.png"
  );
  purgeFilesLogo = loadImage(
    "https://freight.cargo.site/t/original/i/J1931638799928720717911244378650/purgeFileslogodraft1.png"
  );
}

function setup() {
  createCanvas(windowWidth, 800);
  noFill();
  strokeWeight(1);

  centerX = width / 2;
  startY = 20;
  radiusX = width * 0.3;
  radiusY = height * 0.33;
  curveHeight = startY + 50;

  initSections();
}

function initSections() {
  sections = [
    {
      name: "purgeFiles",
      logo: purgeFilesLogo,
      branches: ["archives", "youtube"],
      isVisible: false,
      branchAnimProgress: 0,
      angles: [PI / 27, PI / 1.5],
      distances: windowWidth > 800 ? [-80, 50] : [-50, 50], // Adjusted distances for desktop
    },
    {
      name: "jÃ¦ce",
      logo: jaeceLogo,
      branches: ["live/bookings", "releases", "links"],
      isVisible: false,
      branchAnimProgress: 0,
      angles: [PI / 30, PI / 1.2, PI / 1.7],
      distances: [-50, 80, 70],
    },
    {
      name: "xtsui",
      logo: xtsuiLogo,
      branches: ["xtsuimart", "archives"],
      isVisible: false,
      branchAnimProgress: 0,
      angles: [PI / 4, PI / 1.5],
      distances: [80, 66],
    },
    {
      name: "blog",
      logo: null,
      branches: [],
      isVisible: false,
      branchAnimProgress: 0,
    },
    {
      name: "shop",
      logo: null,
      branches: [],
      isVisible: false,
      branchAnimProgress: 0,
    },
    {
      name: "contact",
      logo: null,
      branches: ["email", "instagram", "youtube", "newsletter"],
      isVisible: false,
      branchAnimProgress: 0,
      angles: [PI / 30, PI / 4.5, (3 * PI) / 8, PI / 1.9],
      distances: [50, 70, 100, 120],
    },
    {
      name: "work",
      logo: null,
      branches: ["portfolio", "cv", "commissions"],
      isVisible: false,
      branchAnimProgress: 0,
      angles: [PI / 30, PI / 3.7, PI / 2.5],
      distances: windowWidth > 800 ? [70, 70, 90] : [50, 50, 70], // Adjusted distances for desktop
    },
  ];
}


function draw() {
  background(255);
  drawMindMap();
}

function drawMindMap() {
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(customFont, 12);  // Set font size for "jasper hall"
  
  // Calculate text width and height
  let mainText = "jasper hall";
  let mainTextWidth = textWidth(mainText) + 20;  // Extra padding
  let mainTextHeight = 20;  // Assuming a fixed height

  let mainTextX = centerX;
  let mainTextY = startY + mainTextHeight / 2;

  // Draw the rectangle first
  fill(255);  // White fill
  stroke(0);  // Black stroke for the border
  strokeWeight(1);
  rect(mainTextX - mainTextWidth / 2, mainTextY - mainTextHeight / 2, mainTextWidth, mainTextHeight, 10);  // Rounded corners

  // Draw the text on top
  fill(0);  // Black text
  noStroke();
  text(mainText, mainTextX, mainTextY-2);
  noStroke();

  sections.forEach((section, index) => {
    let angle = PI - (PI / (sections.length - 1)) * index;
    let movement = sin(frameCount * 0.02 + index) * 3; // Slight movement effect
    let x = centerX + radiusX * cos(angle) + movement; // Apply movement
    let y = curveHeight + 30 + radiusY * sin(angle) + movement;

    connectTextWithSpline(centerX, startY + 20, x, y, [0, 0, 0]);

    drawingContext.filter = "blur(5px)";
    fill(0, 0, 255);
    noStroke;
    ellipse(x, y, 10, 10); // Adjust position as needed
    drawingContext.filter = "none";

    // Display logos if available
    if (section.logo) {
      imageMode(CENTER);
      image(section.logo, x, y + 30, 50, 50); // Adjust size as needed
    }

    fill(0);
    noStroke();
    textFont(customFont, 12);

    text(section.name, x, y + 50); // Adjust text position according to logo

    // Interactive indicator
    if (section.branches.length > 0) {
      // drawingContext.filter = 'blur(3px)';
      strokeWeight(0.5);
      stroke(0, 0 + 128 * sin(millis() / 1000));
      fill(200, 200, 150, 200 + 128 * sin(millis() / 1000));

      ellipse(x, y + 70, 6, 6); // Adjust position as needed
      drawingContext.filter = "none";
    }

    if (section.isVisible || section.branchAnimProgress > 0) {
      animateSubBranches(x, y + 70, section); // Adjust for logo and text
    }
  });
}
function mouseClicked() {
  sections.forEach((section, index) => {
    let angle = PI - (PI / (sections.length - 1)) * index;
    let x = centerX + radiusX * cos(angle);
    let y = curveHeight + radiusY * sin(angle) + 40;
    if (dist(mouseX, mouseY, x, y) < 20) {
      section.isVisible = !section.isVisible; // Toggle visibility
      console.log("Section toggled:", section.name, "isVisible:", section.isVisible);

      // Explicitly control animation direction
      if (section.isVisible) {
        section.branchAnimProgress = 0; // Start animation from the beginning
        console.log("Starting animation for:", section.name);
      } else {
        section.branchAnimProgress = 1; // Reset to reverse animation
        console.log("Reversing animation for:", section.name);
      }
    }
  });
}

function animateSubBranches(x, y, section) {
  section.branches.forEach((branch, idx) => {
    let subX = x + section.branchAnimProgress * 100 * cos(idx * 0.5);
    let subY = y + section.branchAnimProgress * 100 * sin(idx * 0.5);

    stroke(0);
    connectTextWithSpline(x, y, subX, subY, [0, 0, 0]);
    fill(0);
    noStroke();
    text(branch, subX, subY);
  });

  // Update animation progress with debug logging
  updateAnimationProgress(section);
}

function updateAnimationProgress(section) {
  if (section.isVisible && section.branchAnimProgress < 1) {
    section.branchAnimProgress += 0.05;
    console.log("Animating open:", section.name, section.branchAnimProgress);
  } else if (!section.isVisible && section.branchAnimProgress > 0) {
    section.branchAnimProgress -= 0.05;
    console.log("Animating close:", section.name, section.branchAnimProgress);
  }
}
function connectTextWithSpline(startX, startY, endX, endY, color) {
  strokeWeight(.7)
  stroke(color[0], color[1], color[2]);
  noFill();
  beginShape();
  vertex(startX, startY);
  bezierVertex(
    startX,
    endY + (startY - endY) / 2,
    endX,
    startY + (endY - startY) / 2,
    endX,
    endY
  );
  endShape();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  centerX = width / 2; // Recalculate center based on new window size
  initSections(); // Reinitialize sections to adjust for new window size
}
