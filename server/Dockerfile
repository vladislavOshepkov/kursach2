FROM node:18-alpine

# Установка Python и .NET SDK
RUN apk add --no-cache python3 py3-pip bash \
  && wget https://packages.microsoft.com/config/alpine/3.18/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
  && apk add --allow-untrusted packages-microsoft-prod.deb \
  && apk del packages-microsoft-prod.deb \
  && apk add --no-cache dotnet-sdk

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "start"]