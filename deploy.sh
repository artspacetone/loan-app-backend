#!/bin/bash

echo "🚀 Preparing deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Add all files
echo "📦 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Initial deployment setup - Fixed environment variable exposure"

# Add remote if not exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Adding remote repository..."
    git remote add origin https://github.com/artspacetone/loan-app-backend.git
fi

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo "✅ Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Setup Supabase project and get your keys"
echo "2. Deploy to Vercel and add environment variables"
echo "3. Run database setup after deployment"
echo ""
echo "Environment variables needed:"
echo "- SUPABASE_NEXT_PUBLIC_SUPABASE_URL"SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo "- JWT_SECRET"
