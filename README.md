# AWS Thumbnail Generator

Um projeto de aprendizado para experimentar com AWS S3, Lambda e processamento de imagens, construído com Node.js e TypeScript.

## 🎯 Objetivo

Este projeto demonstra como:
- Fazer upload de imagens para Amazon S3
- Processar imagens automaticamente com AWS Lambda
- Gerar thumbnails de diferentes tamanhos e formatos
- Integrar serviços AWS com Node.js/TypeScript

## 🏗️ Arquitetura

```
1. Upload de Imagem(ns) → API Node.js
2. API → Amazon S3 (bucket input)
3. S3 Event → AWS Lambda (processamento)
4. Lambda → Sharp (redimensionamento)
5. Lambda → S3 (salvar thumbnails no bucket output)
```

## 📁 Estrutura do Projeto

```
├── src/                     # Código fonte da API
│   ├── controllers/         # Controladores das rotas
│   ├── services/           # Serviços (S3, etc.)
│   ├── types/              # Definições de tipos TypeScript
│   ├── utils/              # Utilitários (thumbnail generator)
│   └── index.ts            # Entrada da aplicação
├── lambda/                  # Código da função AWS Lambda
│   ├── src/                # Código fonte da Lambda
│   │   ├── utils/          # Utilitários (thumbnail generator)
│   │   └── index.ts        # Handler da Lambda
│   └── package.json        # Dependências da Lambda
├── tests/                   # Testes automatizados
│   ├── utils/              # Testes dos utilitários
│   └── helpers/            # Helpers para testes
└── docs/                    # Documentação
├── lambda/                 # Código da função Lambda
│   ├── src/                # Código fonte Lambda
│   ├── package.json        # Dependências Lambda
│   └── tsconfig.json       # Config TypeScript Lambda
├── docs/                   # Documentação
└── README.md              # Este arquivo
```

## 🚀 Setup Local

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais AWS:

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=sua_access_key_aqui
AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui
AWS_REGION=us-east-1

# S3 Configuration
S3_BUCKET_NAME=seu-bucket-de-imagens
S3_BUCKET_REGION=us-east-1

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Rodar a Aplicação

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Build e Start
npm run build
npm start
```

## 🧪 Testes

Este projeto utiliza Jest para testes unitários da função de geração de thumbnails.

### Executar Testes

```bash
# Todos os testes
yarn test

# Testes específicos da função generateThumbnail
yarn test:thumbnail

# Testes em modo watch (re-executa quando arquivos mudam)
yarn test:watch
```

## 🔧 Setup AWS (via Console)

### 1. Criar Bucket S3

1. Acesse o Console AWS S3
2. Clique em "Create bucket"
3. Nome: `seu-bucket-de-imagens` (deve ser único globalmente)
4. Clique em "Create bucket"

### 2. Configurar IAM User

1. Acesse o Console AWS IAM
2. Clique em "Users" → "Create user"
3. Nome: `thumbnail-processor-user`
4. Anexe políticas:
   - `AmazonS3FullAccess` (para desenvolvimento)
   - `AWSLambda_FullAccess` (para desenvolvimento)
5. Crie e anote as credenciais (Access Key + Secret Key)

### 3. Criar Função Lambda

1. Acesse o Console AWS Lambda
2. Clique em "Create function"
3. Nome: `thumbnail-processor`
4. Runtime: `Node.js 18.x`
5. Role: Criar nova role com permissões básicas do Lambda
6. Adicionar permissões S3 à role criada

### 4. Configurar S3 Event Trigger

1. No bucket S3, vá para "Configuration > Triggers"
3. Clique em "Add trigger"
4. Vincule ao Bucket criado anteriormente
4. Prefix: `uploads/`4

### 5. Configurar variaveis de ambientes no lambda

COnfiguration > Environment variables

### 5. Faça o build local da funcion presente em /lambda

## 📝 API Endpoints

### Upload Single Image
```http
POST /api/upload/single
Content-Type: multipart/form-data

Form data:
- image: [arquivo de imagem]
```

### Upload Multiple Images (Batch Processing)
```http
POST /api/upload/multiple
Content-Type: multipart/form-data

Form data:
- images: [múltiplos arquivos de imagem]
```

### Health Check
```http
GET /health
GET /api/upload/status
```

## 🖼️ Formatos Suportados

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

**Limite de tamanho:** 10MB por arquivo

## 🔍 Testando a API

### Com cURL

```bash
# Upload single image
curl -X POST http://localhost:3000/api/upload/single \
  -F "image=@/path/to/your/image.jpg"

# Upload multiple images
curl -X POST http://localhost:3000/api/upload/multiple \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg"
```

### Com Postman

1. Selecione `POST` method
2. URL: `http://localhost:3000/api/upload/single`
3. Body → form-data
4. Key: `image`, Type: File
5. Selecione sua imagem e Send

## 🚧 Próximos Passos

1. ✅ Setup básico do projeto
2. ✅ API de upload para S3
3. ⏳ Função Lambda para processamento
4. ⏳ Geração de thumbnails com Sharp
5. ⏳ Triggers S3 → Lambda
6. ⏳ Interface web (opcional)
7. ⏳ Monitoring e logs

## 🐛 Troubleshooting

### Erro de Credenciais AWS
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o usuário IAM tem as permissões necessárias

### Erro "Bucket does not exist"
- Verifique se o bucket foi criado
- Confirme o nome do bucket no `.env`

### Erro de permissão S3
- Verifique as políticas do usuário IAM
- Confirme a região do bucket

## 📚 Recursos de Aprendizado

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)

---

**Status:** 🚧 Em desenvolvimento - Projeto para aprendizado AWS