FROM public.ecr.aws/lambda/nodejs:22-x86_64 AS builder

RUN dnf update -y && \
    dnf install -y zip && \
    dnf clean all

WORKDIR /sharp

RUN npm init -y 
RUN npm install sharp@^0.34.4 --omit=dev

WORKDIR /app

COPY package.json .
RUN npm install

COPY tsconfig.json .
COPY src/ src/

RUN npm run build

RUN mkdir -p final && \
    cp -r ../sharp/node_modules final/ && \
    cp -r dist/* final/ && \
    mkdir -p final/utils && \
    cp -r src/utils/* final/utils/ 2>/dev/null || true

RUN mkdir -p /out && \
    cd final && \
    zip -r /out/function.zip *

FROM alpine:latest
COPY --from=builder /out/function.zip /output/