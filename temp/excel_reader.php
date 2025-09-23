<?php
require_once 'vendor/autoload.php';
require_once 'database.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class ExcelReader {
    private $database;
    private $filePath;
    
    public function __construct($filePath) {
        $this->database = new Database();
        $this->filePath = $filePath;
    }
    
    public function readExcelFile($clearExisting = true) {
        try {
            if (!file_exists($this->filePath)) {
                throw new Exception("Excel file not found: " . $this->filePath);
            }
            
            echo "Reading Excel file: " . $this->filePath . "\n";
            
            // Clear existing data if requested
            if ($clearExisting) {
                $this->database->clearData();
                echo "Cleared existing data from database.\n";
            }
            
            // Load the Excel file
            $spreadsheet = IOFactory::load($this->filePath);
            $worksheetNames = $spreadsheet->getSheetNames();
            
            echo "Found " . count($worksheetNames) . " worksheet(s): " . implode(', ', $worksheetNames) . "\n";
            
            $results = [];
            
            foreach ($worksheetNames as $sheetName) {
                echo "\nProcessing sheet: $sheetName\n";
                
                $worksheet = $spreadsheet->getSheetByName($sheetName);
                $highestRow = $worksheet->getHighestRow();
                $highestColumn = $worksheet->getHighestColumn();
                $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);
                
                echo "Sheet dimensions: $highestRow rows x $highestColumnIndex columns\n";
                
                // Insert sheet record
                $sheetId = $this->database->insertSheet($sheetName, $highestRow, $highestColumnIndex);
                
                // Read headers (first row)
                $headers = [];
                for ($col = 1; $col <= $highestColumnIndex; $col++) {
                    $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
                    $headerValue = $worksheet->getCell($columnLetter . '1')->getCalculatedValue();
                    $headers[$col] = $headerValue ?: "Column_$col";
                }
                
                // Read all data
                $rowCount = 0;
                for ($row = 1; $row <= $highestRow; $row++) {
                    for ($col = 1; $col <= $highestColumnIndex; $col++) {
                        $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
                        $cell = $worksheet->getCell($columnLetter . $row);
                        
                        // Get cell value
                        $cellValue = $cell->getCalculatedValue();
                        
                        // Handle different data types
                        if ($cellValue !== null) {
                            // Check if it's a date
                            if (Date::isDateTime($cell)) {
                                $cellValue = Date::excelToDateTimeObject($cellValue)->format('Y-m-d H:i:s');
                            } else {
                                $cellValue = (string) $cellValue;
                            }
                        } else {
                            $cellValue = '';
                        }
                        
                        // Insert cell data
                        $this->database->insertCellData(
                            $sheetId,
                            $row,
                            $col,
                            $headers[$col],
                            $cellValue
                        );
                    }
                    
                    $rowCount++;
                    if ($rowCount % 100 == 0) {
                        echo "Processed $rowCount rows...\n";
                    }
                }
                
                $results[$sheetName] = [
                    'sheet_id' => $sheetId,
                    'rows' => $highestRow,
                    'columns' => $highestColumnIndex,
                    'headers' => $headers
                ];
                
                echo "Completed processing sheet '$sheetName': $highestRow rows, $highestColumnIndex columns\n";
            }
            
            echo "\nExcel file successfully imported to database!\n";
            return $results;
            
        } catch (Exception $e) {
            echo "Error reading Excel file: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    public function getDatabase() {
        return $this->database;
    }
    
    public function displaySummary() {
        $sheets = $this->database->getSheets();
        
        echo "\n=== Database Summary ===\n";
        foreach ($sheets as $sheet) {
            echo "Sheet: {$sheet['sheet_name']} (ID: {$sheet['id']})\n";
            echo "  Rows: {$sheet['row_count']}, Columns: {$sheet['column_count']}\n";
            echo "  Created: {$sheet['created_at']}\n\n";
        }
    }
    
    public function displaySheetData($sheetId, $limit = 10) {
        $sheet = $this->database->getSheetById($sheetId);
        if (!$sheet) {
            echo "Sheet not found!\n";
            return;
        }
        
        echo "\n=== Data from Sheet: {$sheet['sheet_name']} ===\n";
        
        $tableData = $this->database->getSheetDataAsTable($sheetId);
        
        if (empty($tableData)) {
            echo "No data found in this sheet.\n";
            return;
        }
        
        $rowCount = 0;
        foreach ($tableData as $rowNumber => $rowData) {
            if ($rowCount >= $limit) break;
            
            echo "Row $rowNumber: ";
            $cellValues = [];
            ksort($rowData); // Sort by column number
            
            foreach ($rowData as $colNumber => $cellInfo) {
                $cellValues[] = $cellInfo['column_name'] . ': ' . $cellInfo['value'];
            }
            
            echo implode(' | ', $cellValues) . "\n";
            $rowCount++;
        }
        
        if (count($tableData) > $limit) {
            echo "... and " . (count($tableData) - $limit) . " more rows\n";
        }
    }
}

// Command line execution
if (php_sapi_name() === 'cli') {
    echo "Excel Reader - PHP CLI\n";
    echo "=====================\n\n";
    
    $excelFile = EXCEL_FILE_PATH;
    
    if (!file_exists($excelFile)) {
        echo "Error: Excel file not found at: $excelFile\n";
        echo "Please make sure the file exists.\n";
        exit(1);
    }
    
    $reader = new ExcelReader($excelFile);
    
    echo "Starting Excel import process...\n";
    $results = $reader->readExcelFile();
    
    if ($results) {
        $reader->displaySummary();
        
        // Display sample data from each sheet
        $sheets = $reader->getDatabase()->getSheets();
        foreach ($sheets as $sheet) {
            $reader->displaySheetData($sheet['id'], 5);
        }
        
        echo "\nExcel data has been successfully imported to SQLite database!\n";
        echo "Database file: " . DB_PATH . "\n";
        echo "You can now view the data through the web interface.\n";
    } else {
        echo "Failed to import Excel data.\n";
        exit(1);
    }
}
?>
