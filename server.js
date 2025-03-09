
const express = require('express');
const Busboy = require('busboy');
const cors = require('cors');
const fs = require('fs');
const path = require('path'); // Ensure 'path' is imported at the top

const app = express(); // Initialize the Express app

// Enable CORS for your GitHub Pages domain
app.use(cors({
    origin: 'https://zzon0902.github.io', // Allow requests only from your GitHub Pages domain
    methods: ['GET', 'POST'], // Allow specific HTTP methods
    credentials: true // Allow credentials if needed
}));

app.use('/audio', express.static(path.join(__dirname, 'audio')));


// Serve static files from the 'images' directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Default endpoint for testing
app.get('/', (req, res) => {
    res.send('Server is running and serving images!');
});

// Middleware to log incoming requests
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// Ensure the 'uploads/' directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Function to get KST timestamp in the format YYYYMMDD_HHMMSS
function getKSTTimestamp() {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // KST is UTC+9
    const kstDate = new Date(now.getTime() + kstOffset);

    const datePart = kstDate.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timePart = kstDate.toISOString().slice(11, 19).replace(/:/g, ''); // HHMMSS

    return `${datePart}_${timePart}`; // Combine with an underscore
}

// Endpoint to handle homework submission
app.post('/submit-homework', (req, res) => {
    const busboy = Busboy({ headers: req.headers });
    let studentName = 'anonymous'; // Default student name
    const tempFiles = []; // Store temporary file paths for renaming later

    // Process form fields (e.g., studentName)
    busboy.on('field', (fieldname, val) => {
        if (fieldname === 'studentName') {
            studentName = val.trim() || 'anonymous';
            console.log('Student Name:', studentName); // Debug log
        }
    });

    // Process file uploads
    busboy.on('file', (fieldname, file, info) => {
        if (fieldname === 'audioFile') {
            const tempFilePath = path.join(uploadsDir, `${Date.now()}_${info.filename}`);
            console.log('Saving file temporarily:', tempFilePath); // Debug log
            tempFiles.push(tempFilePath);

            // Save the file temporarily
            const writeStream = fs.createWriteStream(tempFilePath);
            file.pipe(writeStream);

            writeStream.on('close', () => {
                console.log('File successfully uploaded temporarily:', tempFilePath); // Debug log
            });
        }
    });

    // When Busboy finishes processing
    busboy.on('close', () => {
        tempFiles.forEach((tempFilePath) => {
            const timestamp = getKSTTimestamp(); // Generate KST timestamp
            const sanitizedStudentName = studentName.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize name
            const fileExtension = path.extname(tempFilePath);
            const finalFileName = `${sanitizedStudentName}_${timestamp}${fileExtension}`;
            const finalFilePath = path.join(uploadsDir, finalFileName);

            // Rename the temporary file to the final name
            fs.rename(tempFilePath, finalFilePath, (err) => {
                if (err) {
                    console.error('Error renaming file:', err);
                    return res.status(500).send('Error saving file.');
                }
                console.log(`File renamed to: ${finalFileName}`); // Debug log
            });
        });

        res.status(200).send('Homework received successfully.');
    });

    // Pipe the request to Busboy
    req.pipe(busboy);
});

// Start the server
app.listen(5000, '0.0.0.0', () => {
    console.log('Server running on port 5000');
});


