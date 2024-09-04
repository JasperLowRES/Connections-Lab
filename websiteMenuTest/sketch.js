let circles = [];
let splineColors = []; // Array to hold colors for each spline
let customFont; // Variable to hold the loaded font
let jaeceLogo, xtsuiLogo, purgeFilesLogo;
let sections; // Sections with branches
let centerX, startY, radiusX, radiusY, curveHeight;

function preload() {
  customFont = loadFont("https://freight.cargo.site/m/M1931740871943339817553035498010/JetBrainsMono-Medium.ttf");
  jaeceLogo = loadImage("https://freight.cargo.site/t/original/i/Q1931638595870837774536184402458/jaeceYtlogonotext.png");
  xtsuiLogo = loadImage("https://freight.cargo.site/t/original/i/I1931638595852391030462474850842/portfoliologo1.png");
  purgeFilesLogo = loadImage("https://freight.cargo.site/t/original/i/J1931638799928720717911244378650/purgeFileslogodraft1.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
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
    { name: "purgeFiles", logo: purgeFilesLogo, branches: ["archives", "youtube"], isVisible: false, branchAnimProgress: 0 },
    { name: "jæce", logo: jaeceLogo, branches: ["live/bookings", "releases", "links"], isVisible: false, branchAnimProgress: 0 },
    { name: "xtsui", logo: xtsuiLogo, branches: ["xtsuimart", "archives"], isVisible: false, branchAnimProgress: 0 },
    { name: "blog", logo: null, branches: [], isVisible: false, branchAnimProgress: 0 },
    { name: "shop", logo: null, branches: [], isVisible: false, branchAnimProgress: 0 },
    { name: "contact", logo: null, branches: ["email", "instagram", "youtube", "newsletter"], isVisible: false, branchAnimProgress: 0 },
    { name: "work", logo: null, branches: ["portfolio", "cv", "commissions"], isVisible: false, branchAnimProgress: 0 }
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
  textFont(customFont, 12);

  // Display main text "jasper hall"
  let mainText = "jasper hall";
  text(mainText, centerX, startY);

  sections.forEach((section, index) => {
    let angle = PI - (PI / (sections.length - 1)) * index;
    let x = centerX + radiusX * cos(angle);
    let y = curveHeight + radiusY * sin(angle);

    // Draw the connection line
    stroke(0);
    line(centerX, startY, x, y);

    // Display logos if available
    if (section.logo) {
      image(section.logo, x, y - 30, 50, 50);
    }

    fill(0);
    noStroke();
    text(section.name, x, y + 20);

    // Interactive indicator
    fill(200, 200, 150, 200);
    ellipse(x, y + 40, 10, 10);

    if (section.isVisible || section.branchAnimProgress > 0) {
      animateSubBranches(x, y + 40, section);
    }
  });
}

function mouseClicked() {
  sections.forEach((section, index) => {
    let angle = PI - (PI / (sections.length - 1)) * index;
    let x = centerX + radiusX * cos(angle);
    let y = curveHeight + radiusY * sin(angle) + 40;
    if (dist(mouseX, mouseY, x, y) < 20) {
      section.isVisible = !section.isVisible;  // Toggle visibility
      if (section.isVisible) {
        // Start opening animation
        section.branchAnimProgress = 0; // Ensure we start the animation from the beginning
      } else {
        // Start closing animation
        section.branchAnimProgress = 1; // Ensure we start the reverse animation from the end
      }
    }
  });
}

function animateSubBranches(x, y, section) {
  section.branches.forEach((branch, idx) => {
    let subX = x + section.branchAnimProgress * 100 * cos(idx * 0.5);
    let subY = y + section.branchAnimProgress * 100 * sin(idx * 0.5);

    fill(0);
    text(branch, subX, subY);
  });

  updateAnimationProgress(section);
}

function updateAnimationProgress(section) {
  if (section.branchAnimProgress < 1 && section.isVisible) {
    section.branchAnimProgress += 0.05; // Increment the progress for opening animation
  } else if (section.branchAnimProgress > 0 && !section.isVisible) {
    section.branchAnimProgress -= 0.05; // Decrement the progress for closing animation
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  centerX = width / 2;  // Update the center based on the new dimensions
  radiusX = width * 0.3;  // Adjust the radius based on the new width
  radiusY = height * 0.33;  // Adjust the radius based on the new height
  initSections();  // Reinitialize the sections to update any dependent calculations
}
