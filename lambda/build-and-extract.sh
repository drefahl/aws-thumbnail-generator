#!/bin/bash

# Script para build e extração automática dos ZIPs da Lambda
set -e

echo "🏗️ Construindo imagem Docker com código Lambda e Sharp Layer..."

# Limpar ZIPs antigos
rm -f function.zip

# Build da imagem Docker
docker build --network=host -t lambda-builder .

echo "📦 Extraindo arquivos ZIP..."

# Criar container temporário e extrair arquivos (sem networking)
CONTAINER_ID=$(docker create lambda-builder)
docker cp $CONTAINER_ID:/output/function.zip ./function.zip
docker rm $CONTAINER_ID

echo "✅ Build concluído! Arquivos disponíveis:"
