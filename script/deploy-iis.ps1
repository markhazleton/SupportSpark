<#
.SYNOPSIS
    Deploys SupportSpark application to IIS on Windows 11.

.DESCRIPTION
    This script automates the deployment of SupportSpark to IIS, including:
    - Building the application
    - Copying files to deployment directory
    - Installing production dependencies
    - Setting permissions
    - Configuring IIS site (optional)

.PARAMETER DeployPath
    The target directory for deployment. Default: C:\inetpub\supportspark

.PARAMETER SiteName
    The IIS site name. Default: SupportSpark

.PARAMETER Port
    The HTTP port for the IIS site. Default: 80

.PARAMETER SkipBuild
    Skip the build step if the dist/ folder already exists.

.PARAMETER SkipIISConfig
    Skip IIS site creation and configuration.

.EXAMPLE
    .\deploy-iis.ps1
    Builds and deploys to default location with IIS configuration.

.EXAMPLE
    .\deploy-iis.ps1 -DeployPath "D:\websites\supportspark" -Port 8080
    Deploys to custom location on custom port.

.EXAMPLE
    .\deploy-iis.ps1 -SkipBuild -SkipIISConfig
    Only copies files without building or configuring IIS.

.NOTES
    Requirements:
    - Run as Administrator
    - IIS, iisnode, and URL Rewrite module installed
    - Node.js installed
#>

param(
    [string]$DeployPath = "C:\inetpub\supportspark",
    [string]$SiteName = "SupportSpark",
    [int]$Port = 80,
    [switch]$SkipBuild,
    [switch]$SkipIISConfig
)

# Requires Administrator privileges
#Requires -RunAsAdministrator

# Error handling
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "    ✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "    ⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "    ✗ $Message" -ForegroundColor Red
}

# Verify prerequisites
Write-Step "Checking prerequisites..."

# Check if running as administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js $nodeVersion installed"
} catch {
    Write-Error "Node.js not found. Please install from https://nodejs.org/"
    exit 1
}

# Check if IIS is installed
$iisFeature = Get-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
if ($iisFeature.State -ne "Enabled") {
    Write-Error "IIS is not installed. Enable it via Windows Features."
    exit 1
}
Write-Success "IIS is installed"

# Check if iisnode is installed
$iisnodePath = "${env:ProgramFiles}\iisnode"
if (-not (Test-Path $iisnodePath)) {
    Write-Warning "iisnode may not be installed. Download from https://github.com/Azure/iisnode/releases"
}

# Check if URL Rewrite is installed
$urlRewritePath = "${env:ProgramFiles}\IIS\Microsoft URL Rewrite"
if (-not (Test-Path $urlRewritePath)) {
    Write-Warning "URL Rewrite module may not be installed. Download from https://www.iis.net/downloads/microsoft/url-rewrite"
}

# Get project root
$projectRoot = $PSScriptRoot | Split-Path -Parent
Write-Success "Project root: $projectRoot"

# Build the application
if (-not $SkipBuild) {
    Write-Step "Building application..."
    
    Push-Location $projectRoot
    try {
        Write-Host "    Installing dependencies..."
        npm install
        
        Write-Host "    Running build script..."
        npm run build
        
        if (-not (Test-Path "$projectRoot\dist\index.cjs")) {
            Write-Error "Build failed: dist/index.cjs not found"
            exit 1
        }
        
        Write-Success "Build completed successfully"
    } finally {
        Pop-Location
    }
} else {
    Write-Warning "Skipping build step"
    
    if (-not (Test-Path "$projectRoot\dist\index.cjs")) {
        Write-Error "dist/index.cjs not found. Run without -SkipBuild or build manually."
        exit 1
    }
}

# Create deployment directory
Write-Step "Preparing deployment directory: $DeployPath"

if (Test-Path $DeployPath) {
    Write-Warning "Deployment directory exists. Files will be overwritten."
    
    # Stop the site if it exists
    if (-not $SkipIISConfig) {
        try {
            $site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
            if ($site) {
                Write-Host "    Stopping IIS site..."
                Stop-Website -Name $SiteName -ErrorAction SilentlyContinue
            }
        } catch {
            # Ignore errors
        }
    }
} else {
    New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null
    Write-Success "Created deployment directory"
}

# Copy build output
Write-Step "Copying files to deployment directory..."

Copy-Item -Path "$projectRoot\dist\*" -Destination $DeployPath -Recurse -Force
Write-Success "Copied dist/ contents"

Copy-Item -Path "$projectRoot\data" -Destination $DeployPath -Recurse -Force
Write-Success "Copied data/ folder"

Copy-Item -Path "$projectRoot\package.json" -Destination $DeployPath -Force
Write-Success "Copied package.json"

# Create .env file if it doesn't exist
$envPath = Join-Path $DeployPath ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "    Creating .env file..."
    
    $sessionSecret = [System.Guid]::NewGuid().ToString()
    $envContent = @"
NODE_ENV=production
PORT=5000
SESSION_SECRET=$sessionSecret
"@
    
    Set-Content -Path $envPath -Value $envContent
    Write-Success "Created .env file with random SESSION_SECRET"
} else {
    Write-Warning ".env file already exists, not overwriting"
}

# Install production dependencies
Write-Step "Installing production dependencies..."

Push-Location $DeployPath
try {
    npm install --production --silent
    Write-Success "Dependencies installed"
} catch {
    Write-Error "Failed to install dependencies: $_"
    exit 1
} finally {
    Pop-Location
}

# Set permissions
Write-Step "Setting folder permissions..."

# Grant IIS users read/execute permissions
icacls $DeployPath /grant "IIS_IUSRS:(OI)(CI)RX" /T /Q | Out-Null
Write-Success "Granted read/execute permissions to IIS_IUSRS"

# Grant write permissions to data folder
$dataPath = Join-Path $DeployPath "data"
icacls $dataPath /grant "IIS_IUSRS:(OI)(CI)F" /T /Q | Out-Null
Write-Success "Granted full permissions to data/ folder"

# Create and set permissions for iisnode log directory
$iisnodeLogPath = Join-Path $DeployPath "iisnode"
if (-not (Test-Path $iisnodeLogPath)) {
    New-Item -ItemType Directory -Path $iisnodeLogPath -Force | Out-Null
}
icacls $iisnodeLogPath /grant "IIS_IUSRS:(OI)(CI)F" /T /Q | Out-Null
Write-Success "Configured iisnode log directory permissions"

# Configure IIS site
if (-not $SkipIISConfig) {
    Write-Step "Configuring IIS site: $SiteName"
    
    Import-Module WebAdministration
    
    # Check if site exists
    $existingSite = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
    
    if ($existingSite) {
        Write-Warning "Site '$SiteName' already exists"
        
        # Update physical path
        Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value $DeployPath
        Write-Success "Updated site physical path"
        
        # Check if binding exists
        $binding = Get-WebBinding -Name $SiteName -Protocol "http" -Port $Port
        if (-not $binding) {
            New-WebBinding -Name $SiteName -Protocol "http" -Port $Port -IPAddress "*"
            Write-Success "Added HTTP binding on port $Port"
        } else {
            Write-Success "HTTP binding already exists on port $Port"
        }
    } else {
        # Create new site
        New-Website -Name $SiteName `
                    -PhysicalPath $DeployPath `
                    -Port $Port `
                    -Force | Out-Null
        
        Write-Success "Created IIS site '$SiteName'"
    }
    
    # Configure application pool
    $appPool = Get-IISAppPool -Name $SiteName -ErrorAction SilentlyContinue
    if ($appPool) {
        # Set to No Managed Code
        Set-ItemProperty "IIS:\AppPools\$SiteName" -Name managedRuntimeVersion -Value ""
        Write-Success "Configured application pool"
    }
    
    # Start the site
    Start-Website -Name $SiteName
    Write-Success "Started IIS site"
    
} else {
    Write-Warning "Skipping IIS configuration"
}

# Summary
Write-Step "Deployment Summary"
Write-Host ""
Write-Success "Deployment completed successfully!"
Write-Host ""
Write-Host "    Deployment Path: $DeployPath" -ForegroundColor White
Write-Host "    Site Name: $SiteName" -ForegroundColor White
Write-Host "    Port: $Port" -ForegroundColor White
Write-Host ""

if (-not $SkipIISConfig) {
    Write-Host "    Application URL: http://localhost:$Port" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "    Next steps:" -ForegroundColor Yellow
    Write-Host "    1. Browse to http://localhost:$Port to test the application" -ForegroundColor White
    Write-Host "    2. Configure SSL/TLS for production (recommended)" -ForegroundColor White
    Write-Host "    3. Set up database instead of file-based storage" -ForegroundColor White
    Write-Host "    4. Review security settings in web.config" -ForegroundColor White
} else {
    Write-Host "    IIS configuration was skipped. Configure manually or run without -SkipIISConfig" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "    Logs:" -ForegroundColor Yellow
Write-Host "    - iisnode: $DeployPath\iisnode\" -ForegroundColor White
Write-Host ""
