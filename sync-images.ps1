# Sync topic_images from source to dist
# Run this script after adding/editing images in the root topic_images folder

$source = "topic_images"
$dest = "dist/topic_images"

Write-Host "=== Syncing Topic Images ===" -ForegroundColor Cyan
Write-Host ""

# Check if source exists
if (!(Test-Path $source)) {
    Write-Host "ERROR: Source folder '$source' not found!" -ForegroundColor Red
    exit 1
}

# Create dest if not exists
if (!(Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    Write-Host "Created $dest/" -ForegroundColor Green
}

# Sync each subfolder
$folders = Get-ChildItem $source -Directory
foreach ($folder in $folders) {
    $srcPath = Join-Path $source $folder.Name
    $dstPath = Join-Path $dest $folder.Name
    
    $srcCount = (Get-ChildItem $srcPath -File -EA SilentlyContinue).Count
    
    Copy-Item -Path $srcPath -Destination $dest -Recurse -Force
    
    $dstCount = (Get-ChildItem $dstPath -File -EA SilentlyContinue).Count
    Write-Host "  $($folder.Name)/ - $dstCount files synced" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Sync Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "To sync to Android, run: npx cap sync android" -ForegroundColor Yellow












