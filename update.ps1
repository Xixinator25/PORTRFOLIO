# ========================================
# PORTFOLIO UPDATE - Script PowerShell
# ========================================
# Ce script automatise la mise à jour du portfolio

param(
    [switch]$Web,        # Lance l'interface web admin
    [switch]$Generate,   # Génère albums.json depuis les dossiers
    [switch]$Optimize,   # Optimise les images
    [switch]$Deploy,     # Déploie sur GitHub
    [string]$Message = "Mise à jour portfolio"
)

$ErrorActionPreference = "Stop"

Write-Host "🎨 PORTFOLIO UPDATE TOOL" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

# Fonction pour afficher les options
function Show-Menu {
    Write-Host "`n📋 MENU PRINCIPAL" -ForegroundColor Yellow
    Write-Host "==================`n" -ForegroundColor Yellow
    Write-Host "1. 🌐 Ouvrir l'Admin Web (Éditer albums et matchs)" -ForegroundColor Green
    Write-Host "2. 📸 Optimiser les images" -ForegroundColor Green
    Write-Host "3. 🚀 Déployer vers GitHub" -ForegroundColor Green
    Write-Host "4. 📁 Générer albums.json depuis les dossiers" -ForegroundColor Green
    Write-Host "5. ⚡ TOUT EN UN : Optimiser + Déployer" -ForegroundColor Magenta
    Write-Host "0. ❌ Quitter`n" -ForegroundColor Red
    
    $choice = Read-Host "Choix"
    return $choice
}

# Fonction pour lancer l'admin web
function Start-WebAdmin {
    Write-Host "`n🌐 Lancement de l'Admin Web..." -ForegroundColor Cyan
    Write-Host "Serveur : http://localhost:3000" -ForegroundColor Green
    Write-Host "Admin : http://localhost:3000/admin`n" -ForegroundColor Green
    Write-Host "Appuyez sur Ctrl+C pour arrêter le serveur`n" -ForegroundColor Yellow
    
    # Lance le serveur
    node server.js
}

# Fonction pour générer albums.json
function Start-Generate {
    Write-Host "`n📁 Génération de albums.json..." -ForegroundColor Cyan
    node generate.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ albums.json généré avec succès !`n" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Erreur lors de la génération`n" -ForegroundColor Red
        exit 1
    }
}

# Fonction pour optimiser les images
function Start-Optimize {
    Write-Host "`n📸 Optimisation des images..." -ForegroundColor Cyan
    node optimize_images.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Images optimisées avec succès !`n" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Erreur lors de l'optimisation`n" -ForegroundColor Red
        exit 1
    }
}

# Fonction pour déployer
function Start-Deploy {
    param(
        [string]$CommitMessage = "Mise à jour portfolio",
        [bool]$SkipConfirm = $false
    )
    
    Write-Host "`n🚀 Déploiement vers GitHub..." -ForegroundColor Cyan
    
    # Vérifier les changements
    git status --short
    
    if (-not $SkipConfirm) {
        Write-Host "`nFichiers modifiés ci-dessus. Continuer le déploiement ? (O/N)" -ForegroundColor Yellow
        $confirm = Read-Host
        
        if ($confirm -ne "O" -and $confirm -ne "o") {
            Write-Host "❌ Déploiement annulé`n" -ForegroundColor Red
            return
        }
    }
    
    Write-Host "`nAjout des fichiers..." -ForegroundColor Cyan
    git add .
    
    Write-Host "Commit..." -ForegroundColor Cyan
    git commit -m $CommitMessage
    
    Write-Host "Push vers GitHub..." -ForegroundColor Cyan
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Déploiement réussi !`n" -ForegroundColor Green
        Write-Host "🌍 Vercel va déployer automatiquement dans quelques instants`n" -ForegroundColor Magenta
    }
    else {
        Write-Host "❌ Erreur lors du déploiement`n" -ForegroundColor Red
        exit 1
    }
}

# Fonction pour tout faire d'un coup
function Start-All {
    Write-Host "`n⚡ WORKFLOW COMPLET" -ForegroundColor Magenta
    Write-Host "===================`n" -ForegroundColor Magenta
    
    Start-Optimize
    
    $message = Read-Host "Message de commit (ou Entrée pour 'Mise à jour portfolio')"
    if ([string]::IsNullOrWhiteSpace($message)) {
        $message = "Mise à jour portfolio"
    }
    
    Start-Deploy -CommitMessage $message
}

# Traitement des paramètres
if ($Web) {
    Start-WebAdmin
    exit
}

if ($Generate) {
    Start-Generate
    exit
}

if ($Optimize) {
    Start-Optimize
    exit
}

if ($Deploy) {
    # Si appelé en paramètre, on saute la confirmation
    Start-Deploy -CommitMessage $Message -SkipConfirm:$true
    exit
}

# Mode interactif
while ($true) {
    $choice = Show-Menu
    
    switch ($choice) {
        "1" { Start-WebAdmin; break }
        "2" { Start-Optimize }
        "3" { 
            $msg = Read-Host "Message de commit (ou Entrée pour message par défaut)"
            if ([string]::IsNullOrWhiteSpace($msg)) { $msg = "Mise à jour portfolio" }
            Start-Deploy -CommitMessage $msg
        }
        "4" { Start-Generate }
        "5" { Start-All }
        "0" { 
            Write-Host "`n👋 Au revoir !`n" -ForegroundColor Cyan
            exit 
        }
        default { Write-Host "`n❌ Choix invalide`n" -ForegroundColor Red }
    }
}
