#!/bin/bash
# YOcreator Deployment Script

echo "🚀 YOcreator Deployment"
echo "======================="

# Check prerequisites
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm required. Install: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "⚠️  Docker not found. Skipping containerization."; }

echo ""
echo "Select deployment target:"
echo "1) Web App (Netlify)"
echo "2) Backend (Docker)"
echo "3) GPU Worker (RunPod)"
echo "4) Full Stack (All)"
echo ""
read -p "Choice [1-4]: " choice

case $choice in
  1)
    echo "📦 Building web app..."
    cd apps/web
    pnpm install
    pnpm build
    echo "✅ Build complete. Deploy to Netlify:"
    echo "   netlify deploy --prod --dir=out"
    ;;
  2)
    echo "🐳 Building backend Docker image..."
    docker build -t yocreator-backend -f deploy/Dockerfile.backend .
    echo "✅ Backend image ready. Push to registry:"
    echo "   docker tag yocreator-backend:latest your-registry/yocreator-backend:latest"
    echo "   docker push your-registry/yocreator-backend:latest"
    ;;
  3)
    echo "🎮 Building GPU worker..."
    docker build -t yocreator-worker -f workers/runpod/Dockerfile .
    echo "✅ Worker image ready. Deploy to RunPod:"
    echo "   1. Push to Docker Hub: docker push your-username/yocreator-worker"
    echo "   2. Create RunPod template with this image"
    echo "   3. Deploy serverless endpoint"
    ;;
  4)
    echo "🌐 Full stack deployment..."
    ./deploy.sh
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac
