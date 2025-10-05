// Usage: node fix-csv.js input.csv output.json
// Requires: npm install csv-parser

const fs = require('fs');
const csv = require('csv-parser');

if (process.argv.length < 4) {
  console.log('Usage: node fix-csv.js input.csv output.json');
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const results = [];

fs.createReadStream(inputFile)
  .pipe(csv())
  .on('data', (row) => {
    // Attempt to fix types for any field
    for (const key in row) {
      if (row[key] === 'true' || row[key] === 'TRUE') {
        row[key] = true;
      } else if (row[key] === 'false' || row[key] === 'FALSE') {
        row[key] = false;
      } else if (!isNaN(row[key]) && row[key].trim() !== '') {
        // Only convert to number if it doesn't have leading zeros and isn't empty
        if (/^\d+(\.\d+)?$/.test(row[key])) {
          row[key] = Number(row[key]);
        }
      } else if (row[key].startsWith('[') && row[key].endsWith(']')) {
        // Try to parse arrays
        try {
          row[key] = JSON.parse(row[key]);
        } catch {}
      } else if (row[key] === '') {
        // Convert empty string to undefined (will be omitted in JSON)
        row[key] = undefined;
      }
    }
    results.push(row);
  })
  .on('end', () => {
    // Remove undefined fields
    const cleaned = results.map(obj => {
      const o = {};
      for (const k in obj) {
        if (obj[k] !== undefined) o[k] = obj[k];
      }
      return o;
    });
    fs.writeFileSync(outputFile, JSON.stringify(cleaned, null, 2));
    console.log('Converted and fixed:', outputFile);
  });
