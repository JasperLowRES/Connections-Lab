let circles = [];
let splineColors = []; // Array to hold colors for each spline
let customFont; // Variable to hold the loaded font
let jaeceLogo, xtsuiLogo, purgeFilesLogo;
let sections; // Sections with branches
let centerX, startY, radiusX, radiusY, curveHeight;
let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
        {
            name: "purgeFiles",
            logo: purgeFilesLogo,
            branches: ["archives", "youtube"],
            isVisible: false,
            branchAnimProgress: 0,
            angles: [PI / 27, PI / 1.5],
            distances: windowWidth > 800 ? [-80, 50] : [-50, 50],
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
            distances: windowWidth > 800 ? [70, 70, 90] : [50, 50, 70],
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
    textFont(customFont, 12);

    let mainText = "jasper hall";
    let mainTextWidth = textWidth(mainText) + 20;
    let mainTextHeight = 20;

    let mainTextX = centerX;
    let mainTextY = startY + mainTextHeight / 2;

    fill(255);
    stroke(0);
    strokeWeight(1);
    rect(mainTextX - mainTextWidth / 2, mainTextY - mainTextHeight / 2, mainTextWidth, mainTextHeight, 10);

    fill(0);
    noStroke();
    text(mainText, mainTextX, mainTextY);

    sections.forEach((section, index) => {
        let angle = PI - (PI / (sections.length - 1)) * index;
        let movement = sin(frameCount * 0.02 + index) * 3;
        let x = centerX + radiusX * cos(angle) + movement;
        let y = curveHeight + 30 + radiusY * sin(angle) + movement;

        connectTextWithSpline(centerX, startY + 20, x, y, [0, 0, 0]);

        if (section.logo) {
            imageMode(CENTER);
            image(section.logo, x, y + 30, 50, 50);
        }

        fill(0);
        noStroke();
        text(section.name, x, y + 50);

        if (section.branches.length > 0) {
            strokeWeight(0.5);
            stroke(0, 0 + 128 * sin(millis() / 1000));
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
        let subX = x + section.branchAnimProgress * section.distances[idx] * cos(section.angles[idx]);
        let subY = y + section.branchAnimProgress * section.distances[idx] * sin(section.angles[idx]);

        textFont(customFont, 8);
        let textW = textWidth(branch) + 10;
        let textH = 20;

        let alpha = map(Math.abs(section.branchAnimProgress), 0, 1, 0, 255);

        stroke(0, alpha);
        connectTextWithSpline(x, y, subX, subY, [0, 0, 0]);

        if (section.branchAnimProgress >= 1) {
            if (dist(mouseX, mouseY, subX, subY) < textW / 2) {
                fill(220, 220, 255, alpha);
                cursor(HAND);
            } else {
                fill(255, alpha);
                cursor(ARROW);
            }
        } else {
            fill(255, alpha);
            cursor(ARROW);
        }

        rect(subX - textW / 2, subY - textH / 2, textW, textH, 10);

        fill(0, alpha);
        noStroke();
        text(branch, subX, subY);
    });

    updateAnimationProgress(section);
}

function updateAnimationProgress(section) {
    if (section.isVisible && section.branchAnimProgress < 1) {
        section.branchAnimProgress += 0.05;
    } else if (!section.isVisible && section.branchAnimProgress > 0) {
        section.branchAnimProgress -= 0.05;
    }
}

function mouseClicked() {
    sections.forEach((section, index) => {
        let angle = PI - (PI / (sections.length - 1)) * index;
        let x = centerX + radiusX * cos(angle);
        let y = curveHeight + 30 + radiusY * sin(angle) + 30;
        if (dist(mouseX, mouseY, x, y + 70) < 40) {
            section.isVisible = !section.isVisible; // Toggle visibility
        }
    });
}

function connectTextWithSpline(startX, startY, endX, endY, color) {
    strokeWeight(0.7);
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
    resizeCanvas(windowWidth, windowHeight);
    centerX = width / 2; // Recalculate center based on new window size
    initSections(); // Reinitialize sections to adjust for new window size
}
