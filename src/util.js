const fs = require('fs');

// Function to save JSON data to a file
const saveJsonToFile = (data, filename) => {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Saved pre-signed URLs to ${filename}`);
};

module.exports = {saveJsonToFile}