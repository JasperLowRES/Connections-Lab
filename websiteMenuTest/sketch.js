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
  textFont(customFont, 12);

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
      branchAnimProgress: 0
    },
    {
      name: "jæce",
      logo: jaeceLogo,
      branches: ["live/bookings", "releases", "links"],
      isVisible: false,
      branchAnimProgress: 0
    },
    {
      name: "xtsui",
      logo: xtsuiLogo,
      branches: ["xtsuimart", "archives"],
      isVisible: false,
      branchAnimProgress: 0
    },
    {
      name: "blog",
      logo: null,
      branches: [],
      isVisible: false,
      branchAnimProgress: 0
    },
    {
      name: "shop",
      logo: null,
      branches: [],
      isVisible: false,
      branchAnimProgress: 0
    },
    {
      name: "contact",
      logo: null,
      branches: ["email", "instagram", "youtube", "newsletter"],
      isVisible: false,
      branchAnimProgress: 0
    },
    {
      name: "work",
      logo: null,
      branches: ["portfolio", "cv", "commissions"],
      isVisible: false,
      branchAnimProgress: 0
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
  text("jasper hall", centerX, startY);

  sections.forEach((section, index) => {
    let angle = PI - (PI / (sections.length - 1)) * index;
    let x = centerX + radiusX * cos(angle);
    let y = curveHeight + radiusY * sin(angle) + 40;

    connectTextWithSpline(centerX, startY + 20, x, y, [0, 0, 0]);

    if (section.isVisible || section.branchAnimProgress > 0) {
      animateSubBranches(x, y, section);
    }
  });
}

function animateSubBranches(x, y, section) {
  section.branches.forEach((branch, idx) => {
    let subX = x + section.branchAnimProgress * 100 * cos(idx * 0.5);
    let subY = y + section.branchAnimProgress * 100 * sin(idx * 0.5);

    // Drawing the spline
    stroke(0);
    connectTextWithSpline(x, y, subX, subY, [0, 0, 0]);

    // Drawing the text
    fill(0);
    noStroke();
    text(branch, subX, subY);
  });

  updateAnimationProgress(section);
}

function updateAnimationProgress(section) {
  // Only update progress if it's not complete
  if (section.isVisible && section.branchAnimProgress < 1) {
    section.branchAnimProgress += 0.05;  // Increment progress for opening
  } else if (!section.isVisible && section.branchAnimProgress > 0) {
    section.branchAnimProgress -= 0.05;  // Decrement progress for closing
  }
}

function mouseClicked() {
  sections.forEach((section, index) => {
    let angle = PI - (PI / (sections.length - 1)) * index;
    let x = centerX + radiusX * cos(angle);
    let y = curveHeight + radiusY * sin(angle) + 40;
    if (dist(mouseX, mouseY, x, y) < 20) {
      section.isVisible = !section.isVisible;  // Toggle visibility
      if (section.isVisible) {
        section.branchAnimProgress = 0; // Start animation
      } else {
        section.branchAnimProgress = 1; // Prepare to reverse animation
      }
    }
  });
}

function connectTextWithSpline(startX, startY, endX, endY, color) {
  stroke(color[0], color[1], color[2]);
  noFill();
  beginShape();
  vertex(startX, startY);
  bezierVertex(
    startX, endY + (startY - endY) / 2,
    endX, startY + (endY - startY) / 2,
    endX, endY
  );
  endShape();
}

function windowResized() {
  resizeCanvas(windowWidth, 800);
  centerX = width / 2;  // Recalculate center based on new window size
  initSections();  // Reinitialize sections to adjust for new window size
}
