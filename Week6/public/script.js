let circles = [];
let splineColors = []; // Array to hold colors for each spline
let customFont; // Variable to hold the loaded font
let jaeceLogo, xtsuiLogo, purgeFilesLogo;
let sections; // Sections with branches
let centerX, startY, radiusX, radiusY, curveHeight;
let blueCircle;

function preload() {
  // Load the custom font
  customFont = loadFont(
    "JetBrainsMono-Medium.ttf"
  );

  // Load images
  blueCircle = loadImage("blueCircle.png"); // Upload this image to your p5.js project

  jaeceLogo = loadImage(
    "logos/jaeceYtlogonotext.png"
  );
  xtsuiLogo = loadImage(
    "logos/portfoliologo1.png"
  );
  purgeFilesLogo = loadImage(
    "logos/purgeFileslogodraft1.png"
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

  // Compute scaling factor and adjust distances
  computeScalingFactorAndAdjustDistances();
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
      distances: [-80, 50], // Your manually calibrated distances
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
      distances: [70, 70, 90],
    },
  ];
}

function computeScalingFactorAndAdjustDistances() {
  let scalingFactors = [];

  let margin = 20; // 20px margin from canvas edges

  // For each section
  sections.forEach((section, index) => {
    let angle = PI - (PI / (sections.length - 1)) * index;
    let x = centerX + radiusX * cos(angle);

    if (section.branches.length > 0) {
      section.adjustedDistances = [];

      section.branches.forEach((branch, idx) => {
        let distance = section.distances[idx];
        let branchAngle = section.angles[idx];

        // Calculate the sub-branch x position when fully extended
        let subX = x + distance * cos(branchAngle);

        // Calculate text width for the branch label
        textFont(customFont, 8); // Ensure smaller font size for subbranch labels
        let textW = textWidth(branch) + 10; // Additional padding around text

        // Check if subX is within the canvas margins
        let rectLeft = subX - textW / 2;
        let rectRight = subX + textW / 2;

        let requiredScaling = 1; // Default scaling is 1 (no scaling)

        if (rectLeft < margin) {
          // Calculate scaling factor to bring rectLeft to margin
          let availableSpace = x - margin - textW / 2;
          requiredScaling = availableSpace / (distance * cos(branchAngle));
        } else if (rectRight > width - margin) {
          // Calculate scaling factor to bring rectRight to width - margin
          let availableSpace = width - margin - x - textW / 2;
          requiredScaling = availableSpace / (distance * cos(branchAngle));
        }

        // If requiredScaling is less than 1, add it to scalingFactors array
        if (requiredScaling < 1) {
          scalingFactors.push(requiredScaling);
        }
      });
    }
  });

  // Use the minimum scaling factor
  let scalingFactor = scalingFactors.length > 0 ? min(scalingFactors) : 1;

  // Apply scaling factor to distances
  sections.forEach((section) => {
    if (section.branches.length > 0) {
      section.adjustedDistances = section.distances.map(
        (d) => d * scalingFactor
      );
    }
  });
}

function draw() {
  background(255);
  drawMindMap();
}

function drawMindMap() {
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(customFont, 12); // Set font size for "jasper"

  // Calculate text width and height
  let mainText = "jasper";
  let mainTextWidth = textWidth(mainText) + 20; // Extra padding
  let mainTextHeight = 20; // Assuming a fixed height

  let mainTextX = centerX;
  let mainTextY = startY + mainTextHeight / 2;

  // Draw the rectangle first
  fill(255); // White fill
  stroke(0); // Black stroke for the border
  strokeWeight(1);
  rect(
    mainTextX - mainTextWidth / 2,
    mainTextY - mainTextHeight / 2,
    mainTextWidth,
    mainTextHeight,
    10
  ); // Rounded corners

  // Draw the text on top
  fill(0); // Black text
  noStroke();
  text(mainText, mainTextX, mainTextY - 2);
  noStroke();

  sections.forEach((section, index) => {
    let angle = PI - (PI / (sections.length - 1)) * index;
    let movement = sin(frameCount * 0.02 + index) * 3; // Slight movement effect
    let x = centerX + radiusX * cos(angle) + movement; // Apply movement
    let y = curveHeight + 30 + radiusY * sin(angle) + movement;

    connectTextWithSpline(centerX, startY + 20, x, y, [0, 0, 0]);

    imageMode(CENTER);
    image(blueCircle, x, y, 20, 15);

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
      drawingContext.filter = "blur(3px)";
      strokeWeight(0.5);
      stroke(0, 0, 128 * sin(millis() / 1000));
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
    let distance = section.adjustedDistances[idx];
    let angle = section.angles[idx];

    let subX =
      x + section.branchAnimProgress * distance * cos(angle);
    let subY =
      y + section.branchAnimProgress * distance * sin(angle);

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
  if (section.isVisible && section.branchAnimProgress < 1) {
    section.branchAnimProgress += 0.07;
  } else if (!section.isVisible && section.branchAnimProgress > 0) {
    section.branchAnimProgress -= 0.07;
  }
}

function toggleVisibility(section) {
  section.isVisible = !section.isVisible;
  section.branchAnimProgress = section.isVisible ? 0 : 1;
}

function touchStarted() {
  // Only proceed if there are touch points (i.e., on touch devices)
  if (touches.length > 0) {
    sections.forEach((section, index) => {
      let angle = PI - (PI / (sections.length - 1)) * index;
      let x = centerX + radiusX * cos(angle);
      let y = curveHeight + 30 + radiusY * sin(angle) + 70;

      if (dist(mouseX, mouseY, x, y) < 40) {
        toggleVisibility(section);
      }
    });
    return false; // Prevent default behavior
  }
}

function mouseClicked() {
  // Only proceed if there are no touch points (i.e., on mouse devices)
  if (touches.length === 0) {
    sections.forEach((section, index) => {
      let angle = PI - (PI / (sections.length - 1)) * index;
      let x = centerX + radiusX * cos(angle);
      let y = curveHeight + 30 + radiusY * sin(angle) + 70;

      if (dist(mouseX, mouseY, x, y) < 40) {
        toggleVisibility(section);
      }

      // Check if the section is "work" and its branches are visible
      if (section.name === "work" && section.isVisible) {
        checkWorkSubBranches(section, x, y);
      }
    });
  }
}

function checkWorkSubBranches(section, x, y) {
  section.branches.forEach((branch, idx) => {
    if (branch === "portfolio") {
      let distance = section.adjustedDistances[idx];
      let angle = section.angles[idx];

      let subX = x + distance * cos(angle);
      let subY = y + distance * sin(angle);

      textFont(customFont, 8);
      let textW = textWidth(branch) + 10;
      let textH = 20;

      // Check if the mouse is over the portfolio rectangle
      if (
        mouseX > subX - textW / 2 &&
        mouseX < subX + textW / 2 &&
        mouseY > subY - textH / 2 &&
        mouseY < subY + textH / 2
      ) {
        fetchPortfolio();
      }
    }
  });
}

// Add the fetchPortfolio function here
async function fetchPortfolio() {
  try {
    const response = await fetch('/portfolio');
    const data = await response.json();
    displayPortfolioModal(data);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
  }
}

function displayPortfolioModal(portfolioData) {
  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'portfolio-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
  `;

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 5px 10px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `;
  closeButton.onclick = () => document.body.removeChild(modal);

  // Add portfolio items
  portfolioData.data.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.classList.add('portfolio-item');
    itemElement.innerHTML = `
      <h2>${item.name}</h2>
      <p>Category: ${item.category}</p>
      <p>Type: ${item.type}</p>
      <p>Date: ${item.date}</p>
      <img src="${item.images[0]}" alt="${item.name}" style="max-width: 100%; height: auto;">
    `;
    modalContent.appendChild(itemElement);
  });

  // Assemble and display modal
  modalContent.appendChild(closeButton);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

function connectTextWithSpline(startX, startY, endX, endY, color) {
  strokeWeight(0.7);
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

  centerX = width / 2;
  startY = 20;
  radiusX = width * 0.3;
  radiusY = height * 0.33;
  curveHeight = startY + 50;

  // Recompute scaling factor and adjust distances
  computeScalingFactorAndAdjustDistances();
}

document.addEventListener('DOMContentLoaded', () => {
  const portfolioContainer = document.getElementById('portfolio-container');
});
