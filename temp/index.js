const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const ExcelDatabase = require('./database');

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

// Database operations
async function saveToDatabase(data, filename, filepath) {
    const db = new ExcelDatabase();
    
    try {
        await db.connect();
        await db.createTables();
        
        const fileId = await db.saveExcelData(filename, filepath, data);
        
        // Get and display database stats
        const stats = await db.getStats();
        console.log('\n=== Database Statistics ===');
        console.log(`Total files in database: ${stats.files}`);
        console.log(`Total sheets in database: ${stats.sheets}`);
        console.log(`Total data records in database: ${stats.dataRecords}`);
        
        await db.close();
        return fileId;
        
    } catch (error) {
        console.error('Database operation failed:', error.message);
        await db.close();
        throw error;
    }
}

// Function to list all files in database
async function listDatabaseFiles() {
    const db = new ExcelDatabase();
    
    try {
        await db.connect();
        const files = await db.getAllFiles();
        
        console.log('\n=== Files in Database ===');
        if (files.length === 0) {
            console.log('No files found in database');
        } else {
            files.forEach(file => {
                console.log(`ID: ${file.id}, File: ${file.filename}, Sheets: ${file.sheet_count}, Rows: ${file.total_rows}, Created: ${file.created_at}`);
            });
        }
        
        await db.close();
        return files;
        
    } catch (error) {
        console.error('Error listing database files:', error.message);
        await db.close();
        throw error;
    }
}

// Main execution
async function main() {
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
        
        // Save data to SQLite database
        try {
            console.log('\n=== Saving to Database ===');
            const fileId = await saveToDatabase(data, '9232025.xlsx', excelFilePath);
            console.log(`✅ Data successfully saved to database with file ID: ${fileId}`);
            
            // List all files in database
            await listDatabaseFiles();
            
        } catch (error) {
            console.error('❌ Failed to save to database:', error.message);
        }
        
    } else {
        console.log('Failed to read Excel file');
    }
}

// Run the main function
main().catch(error => {
    console.error('Application error:', error.message);
    process.exit(1);
});
