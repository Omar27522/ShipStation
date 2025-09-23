const express = require('express');
const path = require('path');
const ExcelDatabase = require('./database');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Initialize database
const db = new ExcelDatabase();

// Initialize database on server start
async function initializeDatabase() {
    try {
        await db.connect();
        await db.createTables();
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
    }
}

// API Routes

// Save Excel data to database
app.post('/api/save-to-database', async (req, res) => {
    try {
        const { filename, data } = req.body;
        
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({ error: 'No data provided' });
        }

        console.log(`\n=== API: Saving ${filename} to database ===`);
        
        // Calculate file path (if it exists)
        const filepath = path.join(__dirname, filename);
        
        const fileId = await db.saveExcelData(filename, filepath, data);
        
        // Get updated stats
        const stats = await db.getStats();
        
        res.json({
            success: true,
            fileId: fileId,
            message: `Successfully saved ${filename} to database`,
            stats: stats
        });
        
    } catch (error) {
        console.error('Error saving to database:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get all files from database
app.get('/api/database-files', async (req, res) => {
    try {
        const files = await db.getAllFiles();
        res.json(files);
    } catch (error) {
        console.error('Error getting database files:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get specific file data from database
app.get('/api/database-file/:id', async (req, res) => {
    try {
        const fileId = parseInt(req.params.id);
        
        // Get file info
        const files = await db.getAllFiles();
        const file = files.find(f => f.id === fileId);
        
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Get sheets for this file
        const sheets = await db.getSheetsByFileId(fileId);
        
        // Reconstruct Excel data format
        const excelData = {};
        
        for (const sheet of sheets) {
            const sheetData = await db.getSheetData(sheet.id, 10000); // Get up to 10k records
            
            // Convert back to Excel format
            const rawData = [];
            const maxRow = Math.max(...sheetData.map(d => d.row_number));
            const maxCol = Math.max(...sheetData.map(d => d.column_number));
            
            // Initialize array
            for (let i = 0; i < maxRow; i++) {
                rawData[i] = new Array(maxCol).fill('');
            }
            
            // Fill data
            sheetData.forEach(cell => {
                rawData[cell.row_number - 1][cell.column_number - 1] = cell.cell_value;
            });
            
            excelData[sheet.sheet_name] = {
                raw: rawData,
                objects: [], // Could reconstruct this if needed
                rowCount: sheet.row_count,
                columnCount: sheet.column_count
            };
        }
        
        res.json({
            file: file,
            excelData: excelData
        });
        
    } catch (error) {
        console.error('Error getting file from database:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Delete file from database
app.delete('/api/database-file/:id', async (req, res) => {
    try {
        const fileId = parseInt(req.params.id);
        const changes = await db.deleteFile(fileId);
        
        if (changes === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        res.json({
            success: true,
            message: `File deleted successfully`,
            changes: changes
        });
        
    } catch (error) {
        console.error('Error deleting file from database:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get database statistics
app.get('/api/database-stats', async (req, res) => {
    try {
        const stats = await db.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting database stats:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Upload and process Excel file
app.post('/api/upload-excel', async (req, res) => {
    try {
        // This would handle file uploads in a real scenario
        // For now, we'll just return a placeholder
        res.json({ message: 'File upload endpoint - implement with multer for full functionality' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Excel Reader Server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🗄️  SQLite database: excel_data.db`);
    
    // Initialize database
    await initializeDatabase();
    
    console.log('\n=== Available Endpoints ===');
    console.log('GET  /                     - Main Excel Reader interface');
    console.log('POST /api/save-to-database - Save Excel data to SQLite');
    console.log('GET  /api/database-files   - Get all files from database');
    console.log('GET  /api/database-file/:id - Get specific file data');
    console.log('DELETE /api/database-file/:id - Delete file from database');
    console.log('GET  /api/database-stats   - Get database statistics');
    console.log('\n✅ Server ready! Open http://localhost:3000 in your browser');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await db.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down server...');
    await db.close();
    process.exit(0);
});
