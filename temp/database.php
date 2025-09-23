<?php
require_once 'config.php';

class Database {
    private $pdo;
    
    public function __construct() {
        try {
            $this->pdo = new PDO('sqlite:' . DB_PATH);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->createTables();
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }
    
    private function createTables() {
        // Create sheets table to store sheet information
        $sql = "CREATE TABLE IF NOT EXISTS sheets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sheet_name TEXT NOT NULL,
            row_count INTEGER DEFAULT 0,
            column_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )";
        $this->pdo->exec($sql);
        
        // Create excel_data table to store actual data
        $sql = "CREATE TABLE IF NOT EXISTS excel_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sheet_id INTEGER,
            row_number INTEGER,
            column_number INTEGER,
            column_name TEXT,
            cell_value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sheet_id) REFERENCES sheets (id)
        )";
        $this->pdo->exec($sql);
        
        // Create index for better performance
        $sql = "CREATE INDEX IF NOT EXISTS idx_sheet_row_col ON excel_data (sheet_id, row_number, column_number)";
        $this->pdo->exec($sql);
    }
    
    public function clearData() {
        $this->pdo->exec("DELETE FROM excel_data");
        $this->pdo->exec("DELETE FROM sheets");
        $this->pdo->exec("DELETE FROM sqlite_sequence WHERE name IN ('sheets', 'excel_data')");
    }
    
    public function insertSheet($sheetName, $rowCount, $columnCount) {
        $sql = "INSERT INTO sheets (sheet_name, row_count, column_count) VALUES (?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$sheetName, $rowCount, $columnCount]);
        return $this->pdo->lastInsertId();
    }
    
    public function insertCellData($sheetId, $rowNumber, $columnNumber, $columnName, $cellValue) {
        $sql = "INSERT INTO excel_data (sheet_id, row_number, column_number, column_name, cell_value) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$sheetId, $rowNumber, $columnNumber, $columnName, $cellValue]);
    }
    
    public function getSheets() {
        $sql = "SELECT * FROM sheets ORDER BY id";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getSheetData($sheetId, $limit = null, $offset = 0) {
        $sql = "SELECT row_number, column_number, column_name, cell_value 
                FROM excel_data 
                WHERE sheet_id = ? 
                ORDER BY row_number, column_number";
        
        if ($limit) {
            $sql .= " LIMIT ? OFFSET ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$sheetId, $limit, $offset]);
        } else {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$sheetId]);
        }
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getSheetDataAsTable($sheetId) {
        $data = $this->getSheetData($sheetId);
        $table = [];
        
        foreach ($data as $cell) {
            $table[$cell['row_number']][$cell['column_number']] = [
                'value' => $cell['cell_value'],
                'column_name' => $cell['column_name']
            ];
        }
        
        return $table;
    }
    
    public function getSheetById($sheetId) {
        $sql = "SELECT * FROM sheets WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$sheetId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function searchData($query, $sheetId = null) {
        $sql = "SELECT s.sheet_name, ed.row_number, ed.column_name, ed.cell_value 
                FROM excel_data ed 
                JOIN sheets s ON ed.sheet_id = s.id 
                WHERE ed.cell_value LIKE ?";
        
        $params = ['%' . $query . '%'];
        
        if ($sheetId) {
            $sql .= " AND ed.sheet_id = ?";
            $params[] = $sheetId;
        }
        
        $sql .= " ORDER BY s.sheet_name, ed.row_number, ed.column_number LIMIT 100";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getPDO() {
        return $this->pdo;
    }
}
?>
