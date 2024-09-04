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
  createCanvas(windowWidth, 800);
  noFill();
  strokeWeight(1);
  textFont(customFont);

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
  text("jasper hall", centerX, startY);

  sections.forEach((section, index) => {
    let angle = PI - (PI / (sections.length - 1)) * index;
    let x = centerX + radiusX * cos(angle);
    let y = curveHeight + 30 + radiusY * sin(angle);

    connectTextWithSpline(centerX, startY + 20, x, y, [0, 0, 0]);

    if (section.logo) {
      imageMode(CENTER);
      image(section.logo, x, y + 30, 50, 50);
    }

    fill(0);
    text(section.name, x, y + 50);

    if (section.branches.length > 0) {
      fill(200, 200, 150, 200 + 128 * sin(millis() / 1000));
      ellipse(x, y + 70, 6, 6);
    }

    if (section.isVisible || section.branchAnimProgress > 0) {
      animateSubBranches(x, y + 70, section);
    }
  });
}

function animateSubBranches(x, y, section) {
  section.branches.forEach((branch, idx) => {
    let subX = x + section.branchAnimProgress * 100 * cos(idx * 0.5);
    let subY = y + section.branchAnimProgress * 100 * sin(idx * 0.5);

    stroke(0);
    connectTextWithSpline(x, y, subX, subY, [0, 0, 0]);

    let alpha = map(Math.abs(section.branchAnimProgress), 0, 1, 0, 255);
    fill(255, alpha);
    rect(subX - 50, subY - 10, 100, 20, 5);

    fill(0, alpha);
    text(branch, subX, subY);
  });

  updateAnimationProgress(section);
}

function mouseClicked() {
  sections.forEach((section, index) => {
    let angle = PI - (PI / (sections.length - 1)) * index;
    let x = centerX + radiusX * cos(angle);
    let y = curveHeight + 30 + radiusY * sin(angle) + 70;
    if (dist(mouseX, mouseY, x, y) < 50) {
      section.isVisible = !section.isVisible;
      section.branchAnimProgress = section.isVisible ? 0 : 1;
    }
  });
}

function connectTextWithSpline(startX, startY, endX, endY, color) {
  strokeWeight(0.5);
  stroke(color[0], color[1], color[2]);
  noFill();
  beginShape();
  vertex(startX, startY);
  bezierVertex(startX, endY + (startY - endY) / 2, endX, startY + (endY - startY) / 2, endX, endY);
  endShape();
}

function updateAnimationProgress(section) {
  if (section.isVisible && section.branchAnimProgress < 1) {
    section.branchAnimProgress += 0.05;
  } else if (!section.isVisible && section.branchAnimProgress > 0) {
    section.branchAnimProgress -= 0.05;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  centerX = width / 2; // Recalculate center based on new window size
  initSections(); // Reinitialize sections to adjust for new window size
}
