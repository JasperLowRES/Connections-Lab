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

    // Only use touchStarted if touch is supported
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
        canvas.addEventListener('touchstart', touchStarted);
    } else {
        canvas.addEventListener('mousedown', mouseClicked);
    }
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
      name: "jæce",
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
function animateSubBranches(x, y, section) {
  section.branches.forEach((branch, idx) => {
    let subX = x + section.branchAnimProgress * section.distances[idx] * cos(section.angles[idx]);
    let subY = y + section.branchAnimProgress * section.distances[idx] * sin(section.angles[idx]);

    textFont(customFont, 8); // Ensure smaller font size for subbranch labels
    let textW = textWidth(branch) + 10; // Additional padding around text
    let textH = 20; // Fixed height for simplicity

    // Calculate alpha based on animation progress
    let alpha = map(Math.abs(section.branchAnimProgress), 0, 1, 0, 255);

    // Draw the spline first
    stroke(0, alpha);
    connectTextWithSpline(x, y, subX, subY, [0, 0, 0]);

    // Only show interaction effects if animation is complete
    if (section.branchAnimProgress >= 1) {
      if (dist(mouseX, mouseY, subX, subY) < textW / 2) {
        fill(220, 220, 255, alpha); // Lighter fill on hover
        cursor(HAND);
      } else {
        fill(255, alpha); // Normal fill
        cursor(ARROW);
      }
    } else {
      fill(255, alpha); // Non-interactive fill when animating
      cursor(ARROW);
    }

    rect(subX - textW / 2, subY - textH / 2, textW, textH, 10); // Draw rounded rectangle

    // Draw text on top of the rectangle
    fill(0, alpha);
    noStroke();
    textAlign(CENTER, CENTER); // Center text within the rectangle
    text(branch, subX, subY);
  });

  updateAnimationProgress(section);
}


function updateAnimationProgress(section) {
    if (section.isVisible) {
        if (section.branchAnimProgress < 1) {
            section.branchAnimProgress += 0.05;
        }
    } else {
        if (section.branchAnimProgress > 0) {
            section.branchAnimProgress -= 0.05;
        }
    }
}




function updateAnimationProgress(section) {
  if (section.isVisible && section.branchAnimProgress < 1) {
    section.branchAnimProgress += 0.05;
  } else if (!section.isVisible && section.branchAnimProgress > 0) {
    section.branchAnimProgress -= 0.05;
  }
}

function touchStarted() {
    let touchX = mouseX; // p5.js maps touch coordinates to mouseX and mouseY
    let touchY = mouseY;
    handleInteraction(touchX, touchY);
    return false; // Prevent default behavior and stop propagation
}

function mouseClicked() {
    handleInteraction(mouseX, mouseY);
}

function handleInteraction(x, y) {
    sections.forEach((section, index) => {
        let angle = PI - (PI / (sections.length - 1)) * index;
        let branchX = centerX + radiusX * cos(angle);
        let branchY = curveHeight + 30 + radiusY * sin(angle) + 70; // Adjust if needed

        if (dist(x, y, branchX, branchY) < 40) {
            section.isVisible = !section.isVisible;
            // Reset the animation progress when toggling visibility
            if (section.isVisible && section.branchAnimProgress <= 0) {
                section.branchAnimProgress = 0; // Start animation
            } else if (!section.isVisible && section.branchAnimProgress >= 1) {
                section.branchAnimProgress = 1; // Start reverse animation
            }
        }
    });
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

