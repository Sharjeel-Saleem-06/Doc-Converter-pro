# DocConverter Pro - Netlify Deployment Script
# Run this script to build and deploy your application

Write-Host "Starting DocConverter Pro Deployment..." -ForegroundColor Green

# Build the application
Write-Host "Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
    
    # Deploy to Netlify
    Write-Host "Deploying to Netlify..." -ForegroundColor Yellow
    netlify deploy --prod --dir=dist
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Deployment successful!" -ForegroundColor Green
        Write-Host "Your app is live at: https://docconverter-pro-app.netlify.app" -ForegroundColor Cyan
        Write-Host "Admin dashboard: https://app.netlify.com/projects/docconverter-pro-app" -ForegroundColor Cyan
    } else {
        Write-Host "Deployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}

Write-Host "Deployment script completed." -ForegroundColor Green 