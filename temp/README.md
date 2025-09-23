# Excel Reader - Node.js & SQLite

A powerful Excel file reader built with Node.js and SQLite that allows you to import, store, and view Excel data through a web interface.

## Features

- 📊 **Excel File Import**: Read .xlsx and .xls files using SheetJS
- 🗄️ **SQLite Storage**: Store Excel data in a lightweight SQLite database
- 🌐 **Web Interface**: Beautiful, responsive web interface to view and manage data
- 🔄 **Real-time Operations**: Save, load, and delete Excel data from database
- 📋 **Multiple Sheets**: Support for Excel files with multiple worksheets
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🚀 **Express Server**: RESTful API endpoints for database operations

## Requirements

- Node.js 14.0 or higher
- npm (Node Package Manager)
- SQLite3 (installed via npm)

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Place Excel File**
   - Place your Excel file (e.g., `9232025.xlsx`) in the project directory
   - The application will automatically detect and process it

## Usage

### Command Line Processing

You can process Excel data directly from the command line:

```bash
npm start
```

This will:
- Read the Excel file (`9232025.xlsx`)
- Save data to JSON file for web viewing
- Save data to SQLite database (`excel_data.db`)
- Display a summary of processed data

### Web Interface with Database

1. **Start the Express Server**
   ```bash
   npm run server
   ```

2. **Access the Application**
   
   Open your browser and go to `http://localhost:3000`

3. **Use Database Features**
   
   - **Load Excel Data**: Click "Load 9232025.xlsx" to view Excel data
   - **Save to Database**: Click "Save to Database" to store current data in SQLite
   - **View Database Files**: Click "View Database Files" to see all stored files
   - **Load from Database**: Click "Load" next to any database file to view it
   - **Delete from Database**: Click "Delete" to remove files from database

4. **Browse Data**
   
   - Switch between different sheets using the sheet tabs
   - View file information and statistics
   - All data is preserved with full fidelity in the database

## File Structure

```
├── composer.json          # PHP dependencies
├── config.php            # Configuration settings
├── database.php          # Database class and operations
├── excel_reader.php      # Excel reading and import logic
├── index.php            # Web interface
├── excel_data.db        # SQLite database (created automatically)
├── 9232025.xlsx         # Your Excel file
└── README.md           # This file
```

## Database Schema

The application creates two main tables:

### `sheets` table
- `id`: Primary key
- `sheet_name`: Name of the Excel sheet
- `row_count`: Number of rows in the sheet
- `column_count`: Number of columns in the sheet
- `created_at`: Import timestamp

### `excel_data` table
- `id`: Primary key
- `sheet_id`: Foreign key to sheets table
- `row_number`: Row number in the original Excel sheet
- `column_number`: Column number in the original Excel sheet
- `column_name`: Column header/name
- `cell_value`: The actual cell value
- `created_at`: Import timestamp

## Features in Detail

### Excel Import
- Supports .xlsx and .xls formats
- Handles multiple worksheets
- Preserves data types (dates, numbers, text)
- Automatically detects column headers
- Progress tracking for large files

### Web Interface
- Clean, modern design
- Sheet navigation tabs
- Real-time search across all data
- Responsive table display
- Statistics dashboard
- Error handling and user feedback

### Search Functionality
- Search across all sheets or specific sheets
- Case-insensitive search
- Results show sheet name, row, column, and value
- Limited to 100 results for performance

## Troubleshooting

### Common Issues

1. **"Excel file not found" error**
   - Check that your Excel file exists in the project directory
   - Verify the file path in `config.php`

2. **"Database connection failed" error**
   - Ensure SQLite is enabled in PHP
   - Check file permissions for the database directory

3. **"Memory limit exceeded" error**
   - Increase PHP memory limit in php.ini
   - Process large files in smaller chunks

4. **Web interface not loading**
   - Check that PHP is running correctly
   - Verify web server configuration
   - Check PHP error logs

### Performance Tips

- For very large Excel files (>10MB), consider processing in batches
- The web interface limits display to 50 rows per sheet for performance
- Use the search function to find specific data quickly
- Consider indexing if you need to search frequently

## Customization

### Adding New Features

1. **Custom Data Processing**: Modify `excel_reader.php` to add custom data validation or transformation
2. **Enhanced UI**: Update `index.php` to add new interface elements
3. **Export Features**: Add functionality to export filtered data back to Excel
4. **API Endpoints**: Create REST API endpoints for programmatic access

### Configuration Options

Edit `config.php` to customize:
- Database file location
- Excel file path
- Error reporting levels
- Timezone settings

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review PHP error logs
3. Ensure all requirements are met
4. Verify file permissions and paths
