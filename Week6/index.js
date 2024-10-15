let express = require('express');
let app = express();
let port = 3000;

let portfolio = {
    "data": [
        {
            name: "Crash River",
            category: "Art",
            type: "Sculpture",
            images: [
                "images/crash-river/crash-river-1.jpg",
                "images/crash-river/crash-river-2.jpg",
                "images/crash-river/crash-river-3.jpg",
            ],
            date: "2021"
        },
        {
            name: "Evanora:Unlimited Logo",
            category: "GraphicDesign",
            type: "Logo",
            images: [
                "images/evanora-unlimited/logo-1.png",
                "images/evanora-unlimited/logo-2.png",
            ],
            date: "2022"
        },
        {
            name: "Evanora:Unlimited Tour Flier",
            category: "GraphicDesign",
            type: "Flier",
            images: [
                "images/evanora-unlimited/tour-flier-1.jpg",
            ],
            date: "2022"
        },
        {
            name: "Leuder SS23 Flier",
            category: "GraphicDesign",
            type: "Flier",
            images: [
                "images/leuder/leuder-1.jpg",
            ],
            date: "2022"
        }
    ]
}

app.use('/', express.static('public'));

app.get('/', (request, response) => {
    response.send('Hello World');
});

app.get('/portfolio', (request, response) => {
    response.json(portfolio);
});

app.get('/portfolio/:category', (request, response) => {
    const category = request.params.category;
    const filteredItems = portfolio.data.filter(item => item.category.toLowerCase() === category.toLowerCase());
    
    if (filteredItems.length > 0) {
        response.json(filteredItems);
    } else {
        response.status(404).json({ message: "Category not found" });
    }   
});

app.get('/portfolio/:category/:type', (request, response) => {
    const category = request.params.category;
    const type = request.params.type;
    const filteredItems = portfolio.data.filter(item => item.category.toLowerCase() === category.toLowerCase() && item.type.toLowerCase() === type.toLowerCase());
    if (filteredItems.length > 0) {
        response.json(filteredItems);
    } else {
        response.status(404).json({ message: "Item not found" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
