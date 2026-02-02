# IIS Deployment Guide for Windows 11

This guide provides step-by-step instructions for deploying SupportSpark to IIS on Windows 11.

## Prerequisites

### 1. Install IIS

1. Open **Windows Features** (Windows + R → `optionalfeatures`)
2. Enable the following components:
   - ✅ Internet Information Services
   - ✅ Web Management Tools → IIS Management Console
   - ✅ World Wide Web Services → Application Development Features → CGI
   - ✅ World Wide Web Services → Common HTTP Features (all)
   - ✅ World Wide Web Services → Security → Request Filtering

### 2. Install Node.js

1. Download Node.js LTS from https://nodejs.org/
2. Run the installer (recommend using default settings)
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

### 3. Install iisnode

1. Download iisnode from https://github.com/Azure/iisnode/releases
2. Install the x64 version: `iisnode-v0.2.26-x64.msi` (or latest)
3. Restart IIS:
   ```powershell
   iisreset
   ```

### 4. Install URL Rewrite Module

1. Download from https://www.iis.net/downloads/microsoft/url-rewrite
2. Install `rewrite_amd64_en-US.msi`
3. Restart IIS:
   ```powershell
   iisreset
   ```

## Build and Deploy

### Step 1: Build the Application

In your project directory:

```powershell
# Install dependencies
npm install

# Run build script
npm run build
```

This creates the `dist/` folder with:

- `index.cjs` - Compiled Express server
- `public/` - Frontend static files
- `web.config` - IIS configuration

### Step 2: Prepare Deployment Folder

```powershell
# Create deployment directory
$deployPath = "C:\inetpub\supportspark"
New-Item -ItemType Directory -Path $deployPath -Force

# Copy build output
Copy-Item -Path "dist\*" -Destination $deployPath -Recurse -Force

# Copy data folder (development)
Copy-Item -Path "data" -Destination $deployPath -Recurse -Force

# Copy package.json for production dependencies
Copy-Item -Path "package.json" -Destination $deployPath

# Install production dependencies
cd $deployPath
npm install --production

# Return to project directory
cd $env:USERPROFILE\path\to\project
```

### Step 3: Create Environment Configuration

Create `.env` file in deployment folder:

```powershell
$envContent = @"
NODE_ENV=production
PORT=5000
SESSION_SECRET=$(New-Guid)
"@

Set-Content -Path "$deployPath\.env" -Value $envContent
```

**Important**: Replace the SESSION_SECRET with a secure random string for production.

### Step 4: Set Folder Permissions

Grant IIS users access to the deployment folder:

```powershell
# Grant read/execute permissions
icacls $deployPath /grant "IIS_IUSRS:(OI)(CI)RX" /T

# Grant write permissions to data folder
icacls "$deployPath\data" /grant "IIS_IUSRS:(OI)(CI)F" /T

# Grant write permissions for iisnode logs
icacls "$deployPath\iisnode" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

### Step 5: Create IIS Website

1. Open **IIS Manager** (Windows + R → `inetmgr`)
2. In the left panel, expand your server and right-click **Sites**
3. Select **Add Website**
4. Configure the new site:
   - **Site name**: `SupportSpark`
   - **Physical path**: `C:\inetpub\supportspark`
   - **Binding**:
     - Type: `http`
     - IP address: `All Unassigned`
     - Port: `80` (or another available port)
     - Host name: (leave blank or enter domain)
5. Click **OK**

### Step 6: Configure Application Pool

1. In IIS Manager, click **Application Pools**
2. Find the `SupportSpark` pool (created automatically)
3. Right-click → **Advanced Settings**
4. Configure:
   - **.NET CLR Version**: `No Managed Code`
   - **Start Mode**: `AlwaysRunning` (optional, for better performance)
   - **Idle Timeout**: `20` minutes
5. Click **OK**

### Step 7: Verify Deployment

1. Start the website if not already running
2. Browse to `http://localhost` (or your configured port)
3. Check for errors in:
   - `C:\inetpub\supportspark\iisnode\` - iisnode logs
   - IIS Manager → Your Site → Failed Request Tracing (if enabled)

## Production Configuration

### SSL/TLS Configuration

For production, configure HTTPS:

1. Obtain an SSL certificate (Let's Encrypt, commercial CA, or self-signed for testing)
2. In IIS Manager, select your site
3. Right-click → **Edit Bindings**
4. Click **Add**, configure:
   - Type: `https`
   - Port: `443`
   - SSL certificate: Select your certificate
5. Update `web.config` to redirect HTTP to HTTPS:

```xml
<rewrite>
  <rules>
    <!-- Force HTTPS -->
    <rule name="Redirect to HTTPS" stopProcessing="true">
      <match url="(.*)" />
      <conditions>
        <add input="{HTTPS}" pattern="^OFF$" />
      </conditions>
      <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
    </rule>
    <!-- ... other rules ... -->
  </rules>
</rewrite>
```

### Database Configuration

For production, migrate from file-based storage to PostgreSQL:

1. Install PostgreSQL on Windows or use a hosted service
2. Update environment variables in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/supportspark
   ```
3. Update `server/storage.ts` to use database instead of JSON files

### Performance Tuning

Edit `web.config` iisnode settings for production load:

```xml
<iisnode
  nodeProcessCountPerApplication="4"
  maxConcurrentRequestsPerProcess="2048"
  loggingEnabled="false"
/>
```

## Troubleshooting

### 503 Service Unavailable

- Check iisnode logs in `C:\inetpub\supportspark\iisnode\`
- Verify Node.js is installed and in PATH
- Ensure `index.cjs` exists and has correct permissions

### 404 Not Found on Routes

- Verify URL Rewrite module is installed
- Check `web.config` exists in deployment root
- Review URL rewrite rules in IIS Manager

### Permission Errors

- Ensure `IIS_IUSRS` has appropriate permissions
- Check Event Viewer → Windows Logs → Application for detailed errors

### Application Pool Crashes

- Check for unhandled exceptions in iisnode logs
- Verify all dependencies are installed (`npm install --production`)
- Ensure `.env` file exists with required variables

### Static Files Not Loading

- Verify files exist in `dist/public/`
- Check IIS MIME types for `.js`, `.css`, `.json` files
- Review static content rules in `web.config`

## Monitoring and Maintenance

### View Logs

```powershell
# View latest iisnode log
Get-Content "C:\inetpub\supportspark\iisnode\*.log" -Tail 50
```

### Restart Application

```powershell
# Recycle application pool
Restart-WebAppPool -Name "SupportSpark"

# Or restart entire IIS
iisreset
```

### Update Application

```powershell
# Stop the site
Stop-Website -Name "SupportSpark"

# Build new version
cd $env:USERPROFILE\path\to\project
npm run build

# Copy new files
Copy-Item -Path "dist\*" -Destination "C:\inetpub\supportspark" -Recurse -Force

# Start the site
Start-Website -Name "SupportSpark"
```

## Security Checklist

- [ ] SSL/TLS configured with valid certificate
- [ ] SESSION_SECRET set to secure random value
- [ ] Database credentials in environment variables (not hardcoded)
- [ ] File upload limits configured
- [ ] Rate limiting implemented on auth endpoints
- [ ] Security headers configured in `web.config`
- [ ] Regular Windows updates applied
- [ ] IIS logs reviewed regularly
- [ ] Backup strategy implemented for data folder

## References

- [iisnode Documentation](https://github.com/Azure/iisnode)
- [IIS URL Rewrite](https://docs.microsoft.com/en-us/iis/extensions/url-rewrite-module/)
- [SupportSpark Constitution](../../.specify/memory/constitution.md)

---

**Last Updated**: 2026-02-01  
**Constitution Compliance**: Principle VIII (Deployment & Hosting Standards)
