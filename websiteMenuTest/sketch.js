function setup() {
    createCanvas(windowWidth, windowHeight);
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

function draw() {
    background(255);
    drawMindMap();
}

function drawMindMap() {
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textFont(customFont, 12);
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
        let subX = x + section.branchAnimProgress * section.distances[idx] * cos(section.angles[idx]);
        let subY = y + section.branchAnimProgress * section.distances[idx] * sin(section.angles[idx]);

        textFont(customFont, 8);
        let textW = textWidth(branch) + 10;
        let alpha = map(Math.abs(section.branchAnimProgress), 0, 1, 0, 255);

        fill(255, alpha);
        rect(subX - textW / 2, subY - 10, textW, 20, 5);
        fill(0, alpha);
        text(branch, subX, subY);

        connectTextWithSpline(x, y, subX, subY, [0, 0, 0]);
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
    return handleInteraction(mouseX, mouseY);
}

function touchStarted() {
    return handleInteraction(touches[0].x, touches[0].y);
}

function handleInteraction(px, py) {
    sections.forEach((section, index) => {
        let angle = PI - (PI / (sections.length - 1)) * index;
        let x = centerX + radiusX * cos(angle);
        let y = curveHeight + 30 + radiusY * sin(angle) + 70;

        if (dist(px, py, x, y) < 40) {
            section.isVisible = !section.isVisible;
            section.branchAnimProgress = section.isVisible ? 0 : 1;
        }
    });

    return false; // Prevent default behavior and stop propagation
}

function connectTextWithSpline(startX, startY, endX, endY, color) {
    strokeWeight(0.7);
    stroke(color[0], color[1], color[2]);
    noFill();
    beginShape();
    vertex(startX, startY);
    bezierVertex(startX, endY + (startY - endY) / 2, endX, startY + (endY - startY) / 2, endX, endY);
    endShape();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    centerX = width / 2;
    initSections();
}
