# Redémarrage du serveur admin

Write-Host "🔄 Redémarrage du serveur admin..." -ForegroundColor Cyan

# Tuer tous les processus node.js
Write-Host "Arrêt des processus Node.js en cours..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Vérifier que c'est bien arrêté
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠️ Certains processus Node.js sont toujours actifs" -ForegroundColor Red
}
else {
    Write-Host "✅ Tous les processus Node.js arrêtés" -ForegroundColor Green
}

# Redémarrer le serveur
Write-Host "`n🚀 Lancement du nouveau serveur..." -ForegroundColor Green
Write-Host "Serveur : http://localhost:3000" -ForegroundColor Cyan
Write-Host "Admin : http://localhost:3000/admin" -ForegroundColor Cyan
Write-Host "`nAppuyez sur Ctrl+C pour arrêter le serveur`n" -ForegroundColor Yellow

# Lancer le serveur
node server.js
