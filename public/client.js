const socket = io();
const board = document.getElementById('bulletin-board');
const modal = document.getElementById('flier-modal');
const addFlierBtn = document.getElementById('add-flier');
const submitFlierBtn = document.getElementById('submit-flier');
const cancelFlierBtn = document.getElementById('cancel-flier');
const imageInput = document.getElementById('flier-image');
const imagePreview = document.getElementById('image-preview');

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX, startY;
let pendingFlier = null;
let pendingFlierElement = null;
let isPlacingFlier = false;

// Create and add preview window
const previewContainer = document.createElement('div');
previewContainer.id = 'preview-container';
const preview = document.createElement('div');
preview.id = 'preview';
const viewportIndicator = document.createElement('div');
viewportIndicator.id = 'viewport-indicator';
previewContainer.appendChild(preview);
previewContainer.appendChild(viewportIndicator);
document.body.appendChild(previewContainer);

// Add visitor counter
const visitorCounter = document.createElement('div');
visitorCounter.id = 'visitor-counter';
visitorCounter.innerHTML = `
    <div class="counter-text">
        <img src="https://web.archive.org/web/20090829082658/http://geocities.com/hk/counter.gif" style="vertical-align: middle;">
        You are visitor #${Math.floor(Math.random() * 9000) + 1000}
    </div>
`;
document.body.appendChild(visitorCounter);

// Center the viewport initially
function centerBoard() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    offsetX = -(board.offsetWidth / 2) + (viewportWidth / 2);
    offsetY = -(board.offsetHeight / 2) + (viewportHeight / 2);
    updateBoardPosition();
}

function updateBoardPosition() {
    board.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    updatePreview();
}

function updatePreview() {
    const boardWidth = board.offsetWidth;
    const boardHeight = board.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const previewScale = 150 / Math.max(boardWidth, boardHeight);
    
    const indicatorX = (-offsetX * previewScale) / scale;
    const indicatorY = (-offsetY * previewScale) / scale;
    const indicatorWidth = (viewportWidth * previewScale) / scale;
    const indicatorHeight = (viewportHeight * previewScale) / scale;
    
    viewportIndicator.style.transform = `translate(${indicatorX}px, ${indicatorY}px)`;
    viewportIndicator.style.width = `${indicatorWidth}px`;
    viewportIndicator.style.height = `${indicatorHeight}px`;

    // Update minimap fliers
    updateMinimapFliers(previewScale);
}

function updateMinimapFliers(previewScale) {
    // Remove existing minimap fliers
    const existingDots = preview.querySelectorAll('.minimap-flier');
    existingDots.forEach(dot => dot.remove());

    // Add dots for each flier
    const fliers = board.querySelectorAll('.flier:not(.pending-flier)');
    fliers.forEach(flier => {
        const dot = document.createElement('div');
        dot.className = 'minimap-flier';
        const x = (parseFloat(flier.style.left) + 150) * previewScale;
        const y = (parseFloat(flier.style.top) + 100) * previewScale;
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        preview.appendChild(dot);
    });
}

// Pan functionality
board.addEventListener('mousedown', (e) => {
    if (e.target === board && !isPlacingFlier) {
        isDragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
        e.preventDefault();
    }
});

document.addEventListener('mousemove', (e) => {
    if (isDragging && !isPlacingFlier) {
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        updateBoardPosition();
    }
    if (pendingFlierElement) {
        const rect = board.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        pendingFlierElement.style.left = `${x - 150}px`;
        pendingFlierElement.style.top = `${y - 20}px`;
    }
});

board.addEventListener('click', (e) => {
    if (pendingFlierElement && !isDragging) {
        const rect = board.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        
        // Create the permanent flier
        const finalFlier = {
            ...pendingFlier,
            x: x - 150,
            y: y - 20
        };

        // Remove the pending flier
        pendingFlierElement.remove();
        pendingFlierElement = null;
        pendingFlier = null;
        isPlacingFlier = false;

        // Create and add the permanent flier
        const flier = createFlierElement(finalFlier);
        board.appendChild(flier);
        
        // Emit the new flier
        socket.emit('add-flier', finalFlier);
        updatePreview();
        
        e.preventDefault();
        e.stopPropagation();
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// Zoom and scroll functionality
document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        // Zoom functionality
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const oldScale = scale;
        scale *= delta;
        scale = Math.min(Math.max(0.1, scale), 5);
        
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const scaleRatio = scale / oldScale;
        
        offsetX = mouseX - (mouseX - offsetX) * scaleRatio;
        offsetY = mouseY - (mouseY - offsetY) * scaleRatio;
    } else {
        // Scrolling functionality
        e.preventDefault();
        const scrollSpeed = 3; // Reduced scroll speed
        
        if (e.shiftKey || e.deltaX !== 0) {
            // Horizontal scrolling with shift+wheel or trackpad horizontal scroll
            offsetX -= (e.deltaX || e.deltaY) * scrollSpeed / scale;
        } else {
            // Vertical scrolling
            offsetY -= e.deltaY * scrollSpeed / scale;
        }
    }
    
    updateBoardPosition();
}, { passive: false });

// Add keyboard scrolling
document.addEventListener('keydown', (e) => {
    const scrollSpeed = 8; // Reduced keyboard scroll speed
    switch (e.key) {
        case 'ArrowUp':
            offsetY += scrollSpeed;
            updateBoardPosition();
            break;
        case 'ArrowDown':
            offsetY -= scrollSpeed;
            updateBoardPosition();
            break;
        case 'ArrowLeft':
            offsetX += scrollSpeed;
            updateBoardPosition();
            break;
        case 'ArrowRight':
            offsetX -= scrollSpeed;
            updateBoardPosition();
            break;
    }
});

// Modal handling
addFlierBtn.addEventListener('click', () => {
    modal.style.display = 'block';
});

cancelFlierBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    resetModal();
});

// Image preview
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// Create pending flier
submitFlierBtn.addEventListener('click', async () => {
    const title = document.getElementById('flier-title').value;
    const body = document.getElementById('flier-body').value;
    const imageFile = imageInput.files[0];

    if (!title || !body) {
        alert('Please fill in both title and content!');
        return;
    }

    let imageData = null;
    if (imageFile) {
        imageData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(imageFile);
        });
    }

    pendingFlier = {
        id: Date.now(),
        title,
        body,
        image: imageData,
        x: 0,
        y: 0
    };

    pendingFlierElement = createFlierElement(pendingFlier);
    pendingFlierElement.classList.add('pending-flier');
    board.appendChild(pendingFlierElement);
    isPlacingFlier = true;
    
    modal.style.display = 'none';
    resetModal();
});

function resetModal() {
    document.getElementById('flier-title').value = '';
    document.getElementById('flier-body').value = '';
    imageInput.value = '';
    imagePreview.innerHTML = '';
}

function createFlierElement(flier) {
    const flierEl = document.createElement('div');
    flierEl.className = 'flier';
    flierEl.dataset.id = flier.id;
    flierEl.style.left = `${flier.x}px`;
    flierEl.style.top = `${flier.y}px`;
    
    // Add thumbtack
    const thumbtack = document.createElement('div');
    thumbtack.className = 'thumbtack';
    flierEl.appendChild(thumbtack);
    
    // Add content wrapper for the paper effect
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'flier-content';
    contentWrapper.innerHTML = `
        <div class="flier-header">
            <h3>${flier.title}</h3>
            <button class="delete-flier" onclick="deleteFlier(${flier.id})">×</button>
        </div>
        <p>${flier.body}</p>
        ${flier.image ? `<img src="${flier.image}" alt="Flier image">` : ''}
    `;
    flierEl.appendChild(contentWrapper);

    return flierEl;
}

// Delete flier
window.deleteFlier = function(id) {
    socket.emit('delete-flier', id);
    const flier = board.querySelector(`.flier[data-id="${id}"]`);
    if (flier) {
        flier.remove();
        updatePreview();
    }
};

// Socket.IO event handlers
socket.on('init-fliers', (fliers) => {
    board.innerHTML = ''; // Clear existing fliers
    fliers.forEach(flier => {
        board.appendChild(createFlierElement(flier));
    });
    updatePreview();
});

socket.on('new-flier', (flier) => {
    // Only add fliers from other clients
    const existingFlier = board.querySelector(`.flier[data-id="${flier.id}"]`);
    if (!existingFlier) {
        const flierEl = createFlierElement(flier);
        board.appendChild(flierEl);
        updatePreview();
    }
});

socket.on('flier-deleted', (id) => {
    const flier = board.querySelector(`.flier[data-id="${id}"]`);
    if (flier) {
        flier.remove();
        updatePreview();
    }
});

// Initialize
centerBoard();
