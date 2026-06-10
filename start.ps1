# Inicia backend y frontend en ventanas separadas
# Ejecuta desde la carpeta Volitics:
#   powershell -ExecutionPolicy Bypass -File start.ps1

$root = "c:\Users\cente\Desktop\Volitics"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm --prefix '$root\backend' run dev" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm --prefix '$root\frontend' run dev" -WindowStyle Normal

Write-Host "Abriendo Backend  -> http://localhost:4000"
Write-Host "Abriendo Frontend -> http://localhost:5173"
