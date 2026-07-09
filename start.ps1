$root = "C:\git\Clubly"

# --- BACKEND ---
$backendCmd = "cd '$root\backend'; npm i; npm run build; npm run lint; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal

# --- FRONTEND ---
$frontendCmd = "cd '$root\frontend'; npm i; npm run build; npm run lint; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal

Write-Host "Ejecutando instalación, build y arranque..."
Write-Host "Abriendo Backend  -> http://localhost:4000"
Write-Host "Abriendo Frontend -> http://localhost:5173"