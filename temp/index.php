<?php
require_once 'database.php';

$database = new Database();
$message = '';
$error = '';

// Handle form submissions
if ($_POST) {
    if (isset($_POST['import_excel'])) {
        // Import Excel file
        require_once 'excel_reader.php';
        
        try {
            $reader = new ExcelReader(EXCEL_FILE_PATH);
            $results = $reader->readExcelFile();
            
            if ($results) {
                $message = "Excel file imported successfully! Found " . count($results) . " sheet(s).";
            } else {
                $error = "Failed to import Excel file.";
            }
        } catch (Exception $e) {
            $error = "Error importing Excel file: " . $e->getMessage();
        }
    }
}

// Get current sheets
$sheets = $database->getSheets();
$selectedSheetId = isset($_GET['sheet']) ? (int)$_GET['sheet'] : (count($sheets) > 0 ? $sheets[0]['id'] : null);
$selectedSheet = null;
$sheetData = [];

if ($selectedSheetId) {
    $selectedSheet = $database->getSheetById($selectedSheetId);
    if ($selectedSheet) {
        $sheetData = $database->getSheetDataAsTable($selectedSheetId);
    }
}

// Handle search
$searchResults = [];
if (isset($_GET['search']) && !empty($_GET['search'])) {
    $searchQuery = $_GET['search'];
    $searchSheetId = isset($_GET['search_sheet']) ? (int)$_GET['search_sheet'] : null;
    $searchResults = $database->searchData($searchQuery, $searchSheetId);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Excel Reader - PHP & SQLite</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            overflow: hidden;
        }
        
        .card-header {
            background-color: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .card-header h2 {
            color: #495057;
            margin-bottom: 5px;
        }
        
        .card-body {
            padding: 20px;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        
        .btn:hover {
            background-color: #0056b3;
        }
        
        .btn-success {
            background-color: #28a745;
        }
        
        .btn-success:hover {
            background-color: #1e7e34;
        }
        
        .btn-secondary {
            background-color: #6c757d;
        }
        
        .btn-secondary:hover {
            background-color: #545b62;
        }
        
        .alert {
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        
        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #495057;
        }
        
        .form-control {
            width: 100%;
            padding: 10px;
            border: 1px solid #ced4da;
            border-radius: 6px;
            font-size: 16px;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }
        
        .sheet-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 20px;
        }
        
        .sheet-tab {
            padding: 10px 20px;
            background-color: #e9ecef;
            border: 1px solid #ced4da;
            border-radius: 6px;
            text-decoration: none;
            color: #495057;
            transition: all 0.3s;
        }
        
        .sheet-tab:hover {
            background-color: #dee2e6;
        }
        
        .sheet-tab.active {
            background-color: #007bff;
            color: white;
            border-color: #007bff;
        }
        
        .table-container {
            overflow-x: auto;
            border: 1px solid #dee2e6;
            border-radius: 6px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 600px;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
            position: sticky;
            top: 0;
        }
        
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        tr:hover {
            background-color: #e9ecef;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #6c757d;
            font-size: 0.9em;
        }
        
        .search-form {
            display: flex;
            gap: 10px;
            align-items: end;
            flex-wrap: wrap;
        }
        
        .search-form .form-group {
            margin-bottom: 0;
            flex: 1;
            min-width: 200px;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
        
        .file-info {
            background-color: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .pagination {
            display: flex;
            justify-content: center;
            gap: 5px;
            margin-top: 20px;
        }
        
        .pagination a {
            padding: 8px 12px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            text-decoration: none;
            color: #495057;
        }
        
        .pagination a:hover {
            background-color: #e9ecef;
        }
        
        .pagination .active {
            background-color: #007bff;
            color: white;
            border-color: #007bff;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Excel Reader</h1>
            <p>PHP & SQLite Excel File Reader and Viewer</p>
        </div>
        
        <?php if ($message): ?>
            <div class="alert alert-success"><?php echo htmlspecialchars($message); ?></div>
        <?php endif; ?>
        
        <?php if ($error): ?>
            <div class="alert alert-error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <!-- Import Section -->
        <div class="card">
            <div class="card-header">
                <h2>📁 Import Excel File</h2>
            </div>
            <div class="card-body">
                <div class="file-info">
                    <strong>File to import:</strong> <?php echo htmlspecialchars(basename(EXCEL_FILE_PATH)); ?><br>
                    <strong>Status:</strong> <?php echo file_exists(EXCEL_FILE_PATH) ? '✅ File exists' : '❌ File not found'; ?>
                </div>
                
                <form method="post">
                    <button type="submit" name="import_excel" class="btn btn-success">
                        🔄 Import Excel File to Database
                    </button>
                </form>
            </div>
        </div>
        
        <?php if (count($sheets) > 0): ?>
            <!-- Statistics -->
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number"><?php echo count($sheets); ?></div>
                    <div class="stat-label">Sheets</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?php echo array_sum(array_column($sheets, 'row_count')); ?></div>
                    <div class="stat-label">Total Rows</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?php echo $selectedSheet ? $selectedSheet['column_count'] : 0; ?></div>
                    <div class="stat-label">Columns (Current Sheet)</div>
                </div>
            </div>
            
            <!-- Search Section -->
            <div class="card">
                <div class="card-header">
                    <h2>🔍 Search Data</h2>
                </div>
                <div class="card-body">
                    <form method="get" class="search-form">
                        <div class="form-group">
                            <label for="search">Search Term:</label>
                            <input type="text" id="search" name="search" class="form-control" 
                                   value="<?php echo htmlspecialchars($_GET['search'] ?? ''); ?>" 
                                   placeholder="Enter search term...">
                        </div>
                        <div class="form-group">
                            <label for="search_sheet">Sheet (Optional):</label>
                            <select id="search_sheet" name="search_sheet" class="form-control">
                                <option value="">All Sheets</option>
                                <?php foreach ($sheets as $sheet): ?>
                                    <option value="<?php echo $sheet['id']; ?>" 
                                            <?php echo (isset($_GET['search_sheet']) && $_GET['search_sheet'] == $sheet['id']) ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($sheet['sheet_name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn">Search</button>
                        </div>
                    </form>
                    
                    <?php if (!empty($searchResults)): ?>
                        <h3>Search Results (<?php echo count($searchResults); ?> found):</h3>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Sheet</th>
                                        <th>Row</th>
                                        <th>Column</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($searchResults as $result): ?>
                                        <tr>
                                            <td><?php echo htmlspecialchars($result['sheet_name']); ?></td>
                                            <td><?php echo $result['row_number']; ?></td>
                                            <td><?php echo htmlspecialchars($result['column_name']); ?></td>
                                            <td><?php echo htmlspecialchars($result['cell_value']); ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php elseif (isset($_GET['search']) && !empty($_GET['search'])): ?>
                        <p>No results found for "<?php echo htmlspecialchars($_GET['search']); ?>"</p>
                    <?php endif; ?>
                </div>
            </div>
            
            <!-- Sheet Data Section -->
            <div class="card">
                <div class="card-header">
                    <h2>📋 Sheet Data</h2>
                </div>
                <div class="card-body">
                    <!-- Sheet Tabs -->
                    <div class="sheet-tabs">
                        <?php foreach ($sheets as $sheet): ?>
                            <a href="?sheet=<?php echo $sheet['id']; ?>" 
                               class="sheet-tab <?php echo ($selectedSheetId == $sheet['id']) ? 'active' : ''; ?>">
                                <?php echo htmlspecialchars($sheet['sheet_name']); ?>
                                <small>(<?php echo $sheet['row_count']; ?> rows)</small>
                            </a>
                        <?php endforeach; ?>
                    </div>
                    
                    <?php if ($selectedSheet && !empty($sheetData)): ?>
                        <div class="file-info">
                            <strong>Sheet:</strong> <?php echo htmlspecialchars($selectedSheet['sheet_name']); ?><br>
                            <strong>Dimensions:</strong> <?php echo $selectedSheet['row_count']; ?> rows × <?php echo $selectedSheet['column_count']; ?> columns<br>
                            <strong>Imported:</strong> <?php echo $selectedSheet['created_at']; ?>
                        </div>
                        
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Row</th>
                                        <?php 
                                        // Get headers from first row
                                        $firstRow = reset($sheetData);
                                        if ($firstRow) {
                                            ksort($firstRow);
                                            foreach ($firstRow as $colNum => $cellInfo): ?>
                                                <th><?php echo htmlspecialchars($cellInfo['column_name']); ?></th>
                                            <?php endforeach;
                                        }
                                        ?>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php 
                                    $displayLimit = 50; // Limit rows for performance
                                    $rowCount = 0;
                                    foreach ($sheetData as $rowNumber => $rowData): 
                                        if ($rowCount >= $displayLimit) break;
                                        ksort($rowData);
                                    ?>
                                        <tr>
                                            <td><strong><?php echo $rowNumber; ?></strong></td>
                                            <?php foreach ($rowData as $cellInfo): ?>
                                                <td><?php echo htmlspecialchars($cellInfo['value']); ?></td>
                                            <?php endforeach; ?>
                                        </tr>
                                    <?php 
                                        $rowCount++;
                                    endforeach; 
                                    ?>
                                </tbody>
                            </table>
                        </div>
                        
                        <?php if (count($sheetData) > $displayLimit): ?>
                            <p class="text-center">
                                Showing first <?php echo $displayLimit; ?> rows of <?php echo count($sheetData); ?> total rows.
                            </p>
                        <?php endif; ?>
                        
                    <?php elseif ($selectedSheet): ?>
                        <div class="no-data">
                            <p>No data found in this sheet.</p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
            
        <?php else: ?>
            <div class="card">
                <div class="card-body">
                    <div class="no-data">
                        <h3>No Data Available</h3>
                        <p>Please import an Excel file to view data.</p>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
