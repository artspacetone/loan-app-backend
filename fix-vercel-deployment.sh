#!/bin/bash

echo "🔧 Fixing Vercel Deployment Issues..."

# Remove any problematic files
rm -f .vercel/project.json 2>/dev/null || true
rm -rf .vercel 2>/dev/null || true

# Clean build artifacts
rm -rf .next 2>/dev/null || true
rm -rf node_modules 2>/dev/null || true

# Reinstall dependencies
echo "📦 Installing dependencies..."
npm install

# Build locally to check for errors
echo "🏗️ Testing local build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful!"
    
    # Add all changes
    git add .
    
    # Commit changes
    git commit -m "Fix Vercel deployment configuration"
    
    # Push to repository
    git push origin main
    
    echo "🚀 Changes pushed to GitHub!"
    echo "📝 Now go to Vercel dashboard and:"
    echo "   1. Delete the current deployment"
    echo "   2. Re-import the repository"
    echo "   3. Add environment variables"
    echo "   4. Deploy again"
else
    echo "❌ Local build failed. Please check the errors above."
fi
