const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function readExcelFile(filePath) {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return null;
        }

        console.log(`Reading Excel file: ${filePath}`);
        
        // Read the Excel file
        const workbook = XLSX.readFile(filePath);
        
        // Get sheet names
        const sheetNames = workbook.SheetNames;
        console.log(`Found ${sheetNames.length} sheet(s): ${sheetNames.join(', ')}`);
        
        const result = {};
        
        // Process each sheet
        sheetNames.forEach(sheetName => {
            console.log(`\n--- Processing Sheet: ${sheetName} ---`);
            
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Convert to array of objects with headers
            const objectData = XLSX.utils.sheet_to_json(worksheet);
            
            result[sheetName] = {
                raw: jsonData,
                objects: objectData,
                rowCount: jsonData.length,
                columnCount: jsonData[0] ? jsonData[0].length : 0
            };
            
            console.log(`Rows: ${result[sheetName].rowCount}, Columns: ${result[sheetName].columnCount}`);
            
            // Display first few rows
            if (jsonData.length > 0) {
                console.log('\nFirst few rows:');
                jsonData.slice(0, Math.min(5, jsonData.length)).forEach((row, index) => {
                    console.log(`Row ${index + 1}:`, row);
                });
            }
            
            // Display object format (first 3 records)
            if (objectData.length > 0) {
                console.log('\nData as objects (first 3 records):');
                objectData.slice(0, 3).forEach((obj, index) => {
                    console.log(`Record ${index + 1}:`, obj);
                });
            }
        });
        
        return result;
        
    } catch (error) {
        console.error('Error reading Excel file:', error.message);
        return null;
    }
}

// Main execution
const excelFilePath = path.join(__dirname, '9232025.xlsx');
const data = readExcelFile(excelFilePath);

if (data) {
    console.log('\n=== Excel File Summary ===');
    Object.keys(data).forEach(sheetName => {
        const sheet = data[sheetName];
        console.log(`Sheet "${sheetName}": ${sheet.rowCount} rows, ${sheet.columnCount} columns`);
    });
    
    // Save data to JSON file for web viewing
    fs.writeFileSync('excel-data.json', JSON.stringify(data, null, 2));
    console.log('\nData saved to excel-data.json for web viewing');
} else {
    console.log('Failed to read Excel file');
}
