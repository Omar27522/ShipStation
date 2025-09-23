# Excel Reader - PHP & SQLite

A powerful Excel file reader built with PHP and SQLite that allows you to import, store, and view Excel data through a web interface.

## Features

- 📊 **Excel File Import**: Read .xlsx and .xls files using PhpSpreadsheet
- 🗄️ **SQLite Storage**: Store Excel data in a lightweight SQLite database
- 🌐 **Web Interface**: Beautiful, responsive web interface to view and search data
- 🔍 **Search Functionality**: Search across all sheets or specific sheets
- 📋 **Multiple Sheets**: Support for Excel files with multiple worksheets
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Requirements

- PHP 7.4 or higher
- Composer (for dependency management)
- SQLite support (usually included with PHP)
- Web server (Apache, Nginx, or PHP built-in server)

## Installation

1. **Install Dependencies**
   ```bash
   composer install
   ```

2. **Configure the Excel File**
   - Place your Excel file in the project directory
   - Update the `EXCEL_FILE_PATH` in `config.php` if needed

3. **Set Permissions** (Linux/Mac)
   ```bash
   chmod 755 .
   chmod 666 excel_data.db (after first run)
   ```

## Usage

### Command Line Import

You can import Excel data directly from the command line:

```bash
php excel_reader.php
```

This will:
- Read the Excel file specified in `config.php`
- Clear existing data in the database
- Import all sheets and their data
- Display a summary of imported data

### Web Interface

1. **Start a Web Server**
   
   Using PHP built-in server:
   ```bash
   php -S localhost:8000
   ```
   
   Or use Apache/Nginx pointing to the project directory.

2. **Access the Application**
   
   Open your browser and go to `http://localhost:8000`

3. **Import Excel File**
   
   Click the "Import Excel File to Database" button to import your Excel data.

4. **View and Search Data**
   
   - Browse different sheets using the sheet tabs
   - Use the search functionality to find specific data
   - View statistics about your data

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
