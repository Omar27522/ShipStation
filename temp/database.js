const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class ExcelDatabase {
    constructor(dbPath = './excel_data.db') {
        this.dbPath = dbPath;
        this.db = null;
    }

    // Initialize database connection
    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log(`Connected to SQLite database: ${this.dbPath}`);
                    resolve();
                }
            });
        });
    }

    // Close database connection
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                        reject(err);
                    } else {
                        console.log('Database connection closed.');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Create tables for storing Excel data
    async createTables() {
        return new Promise((resolve, reject) => {
            // Create files table to track Excel files
            const createFilesTable = `
                CREATE TABLE IF NOT EXISTS files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    filepath TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    sheet_count INTEGER,
                    total_rows INTEGER,
                    file_size INTEGER
                )
            `;

            // Create sheets table to track individual sheets
            const createSheetsTable = `
                CREATE TABLE IF NOT EXISTS sheets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_id INTEGER,
                    sheet_name TEXT NOT NULL,
                    row_count INTEGER,
                    column_count INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
                )
            `;

            // Create data table to store actual cell data
            const createDataTable = `
                CREATE TABLE IF NOT EXISTS sheet_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sheet_id INTEGER,
                    row_number INTEGER,
                    column_number INTEGER,
                    column_name TEXT,
                    cell_value TEXT,
                    data_type TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sheet_id) REFERENCES sheets (id) ON DELETE CASCADE
                )
            `;

            // Create indexes for better performance
            const createIndexes = [
                'CREATE INDEX IF NOT EXISTS idx_sheet_data_sheet_id ON sheet_data(sheet_id)',
                'CREATE INDEX IF NOT EXISTS idx_sheet_data_row ON sheet_data(sheet_id, row_number)',
                'CREATE INDEX IF NOT EXISTS idx_sheets_file_id ON sheets(file_id)'
            ];

            this.db.serialize(() => {
                this.db.run(createFilesTable);
                this.db.run(createSheetsTable);
                this.db.run(createDataTable);
                
                // Create indexes
                createIndexes.forEach(indexSql => {
                    this.db.run(indexSql);
                });

                console.log('Database tables created successfully');
                resolve();
            });
        });
    }

    // Save Excel file metadata
    async saveFileMetadata(filename, filepath, sheetCount, totalRows, fileSize) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO files (filename, filepath, sheet_count, total_rows, file_size)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [filename, filepath, sheetCount, totalRows, fileSize], function(err) {
                if (err) {
                    console.error('Error saving file metadata:', err.message);
                    reject(err);
                } else {
                    console.log(`File metadata saved with ID: ${this.lastID}`);
                    resolve(this.lastID);
                }
            });
        });
    }

    // Save sheet metadata
    async saveSheetMetadata(fileId, sheetName, rowCount, columnCount) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO sheets (file_id, sheet_name, row_count, column_count)
                VALUES (?, ?, ?, ?)
            `;
            
            this.db.run(sql, [fileId, sheetName, rowCount, columnCount], function(err) {
                if (err) {
                    console.error('Error saving sheet metadata:', err.message);
                    reject(err);
                } else {
                    console.log(`Sheet metadata saved with ID: ${this.lastID}`);
                    resolve(this.lastID);
                }
            });
        });
    }

    // Save sheet data in bulk
    async saveSheetData(sheetId, data) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO sheet_data (sheet_id, row_number, column_number, column_name, cell_value, data_type)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                
                const stmt = this.db.prepare(sql);
                let insertCount = 0;

                data.forEach((row, rowIndex) => {
                    if (Array.isArray(row)) {
                        row.forEach((cell, colIndex) => {
                            if (cell !== null && cell !== undefined && cell !== '') {
                                const cellValue = String(cell);
                                const dataType = this.detectDataType(cell);
                                const columnName = rowIndex === 0 ? cellValue : `Column_${colIndex + 1}`;
                                
                                stmt.run([sheetId, rowIndex + 1, colIndex + 1, columnName, cellValue, dataType], (err) => {
                                    if (err) {
                                        console.error('Error inserting data:', err.message);
                                    }
                                });
                                insertCount++;
                            }
                        });
                    }
                });

                stmt.finalize((err) => {
                    if (err) {
                        this.db.run('ROLLBACK');
                        reject(err);
                    } else {
                        this.db.run('COMMIT', (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                console.log(`Inserted ${insertCount} data records for sheet ID: ${sheetId}`);
                                resolve(insertCount);
                            }
                        });
                    }
                });
            });
        });
    }

    // Detect data type of a cell value
    detectDataType(value) {
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'integer' : 'float';
        } else if (typeof value === 'boolean') {
            return 'boolean';
        } else if (value instanceof Date) {
            return 'date';
        } else if (typeof value === 'string') {
            // Check if it's a date string
            const dateRegex = /^\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/;
            if (dateRegex.test(value)) {
                return 'date_string';
            }
            // Check if it's a number string
            if (!isNaN(value) && !isNaN(parseFloat(value))) {
                return 'number_string';
            }
            return 'text';
        }
        return 'unknown';
    }

    // Save complete Excel data to database
    async saveExcelData(filename, filepath, excelData) {
        try {
            console.log(`\n=== Saving Excel data to database ===`);
            
            // Calculate totals
            const sheetNames = Object.keys(excelData);
            const totalRows = sheetNames.reduce((sum, name) => sum + excelData[name].rowCount, 0);
            const fileSize = fs.existsSync(filepath) ? fs.statSync(filepath).size : 0;

            // Save file metadata
            const fileId = await this.saveFileMetadata(filename, filepath, sheetNames.length, totalRows, fileSize);

            // Save each sheet
            for (const sheetName of sheetNames) {
                const sheetData = excelData[sheetName];
                console.log(`Saving sheet: ${sheetName}`);
                
                // Save sheet metadata
                const sheetId = await this.saveSheetMetadata(fileId, sheetName, sheetData.rowCount, sheetData.columnCount);
                
                // Save sheet data
                if (sheetData.raw && sheetData.raw.length > 0) {
                    await this.saveSheetData(sheetId, sheetData.raw);
                }
            }

            console.log(`✅ Successfully saved Excel data to database`);
            return fileId;

        } catch (error) {
            console.error('Error saving Excel data to database:', error.message);
            throw error;
        }
    }

    // Get all files from database
    async getAllFiles() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM files ORDER BY created_at DESC';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get sheets for a specific file
    async getSheetsByFileId(fileId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM sheets WHERE file_id = ? ORDER BY id';
            
            this.db.all(sql, [fileId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get data for a specific sheet
    async getSheetData(sheetId, limit = 1000) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT row_number, column_number, column_name, cell_value, data_type
                FROM sheet_data 
                WHERE sheet_id = ? 
                ORDER BY row_number, column_number
                LIMIT ?
            `;
            
            this.db.all(sql, [sheetId, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Delete a file and all its associated data
    async deleteFile(fileId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM files WHERE id = ?';
            
            this.db.run(sql, [fileId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Deleted file with ID: ${fileId} and ${this.changes} records`);
                    resolve(this.changes);
                }
            });
        });
    }

    // Get database statistics
    async getStats() {
        return new Promise((resolve, reject) => {
            const queries = [
                'SELECT COUNT(*) as file_count FROM files',
                'SELECT COUNT(*) as sheet_count FROM sheets',
                'SELECT COUNT(*) as data_count FROM sheet_data'
            ];

            Promise.all(queries.map(query => {
                return new Promise((res, rej) => {
                    this.db.get(query, [], (err, row) => {
                        if (err) rej(err);
                        else res(row);
                    });
                });
            })).then(results => {
                resolve({
                    files: results[0].file_count,
                    sheets: results[1].sheet_count,
                    dataRecords: results[2].data_count
                });
            }).catch(reject);
        });
    }
}

module.exports = ExcelDatabase;
