<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

// Simple redirect helper
function redirect_with($params = []) {
    $base = '/9232025/index.php';
    if (!empty($params)) {
        $base .= '?' . http_build_query($params);
    }
    header('Location: ' . $base);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        redirect_with(['err' => 'Invalid request method']);
    }

    if (!isset($_FILES['excel']) || $_FILES['excel']['error'] !== UPLOAD_ERR_OK) {
        $code = $_FILES['excel']['error'] ?? 0;
        $map = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds server limit',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds form limit',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file',
            UPLOAD_ERR_EXTENSION => 'Upload stopped by extension'
        ];
        $msg = $map[$code] ?? 'Upload error';
        redirect_with(['err' => $msg]);
    }

    $file = $_FILES['excel'];
    $name = $file['name'];
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $allowed = ['xlsx', 'xls'];
    if (!in_array($ext, $allowed, true)) {
        redirect_with(['err' => 'Only .xlsx or .xls files are allowed']);
    }

    // Optional: size limit 20MB
    if ($file['size'] > 20 * 1024 * 1024) {
        redirect_with(['err' => 'File too large (max 20MB)']);
    }

    // Ensure uploads directory exists
    $uploadsDir = __DIR__ . '/uploads';
    if (!is_dir($uploadsDir)) {
        if (!mkdir($uploadsDir, 0775, true) && !is_dir($uploadsDir)) {
            redirect_with(['err' => 'Failed to prepare uploads directory']);
        }
    }

    $target = $uploadsDir . '/' . uniqid('excel_', true) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], $target)) {
        redirect_with(['err' => 'Failed to save uploaded file']);
    }

    // Import using ExcelReader
    require_once __DIR__ . '/excel_reader.php';
    $reader = new ExcelReader($target);
    $reader->readExcelFile();

    // Cleanup uploaded file
    @unlink($target);

    redirect_with(['msg' => 'Excel uploaded and imported successfully']);

} catch (Throwable $e) {
    redirect_with(['err' => 'Import failed: ' . $e->getMessage()]);
}
