FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY build.js ./
COPY vital/ ./vital/
COPY api/ ./api/
COPY index.html ./

# Injeta a senha no HTML em tempo de build
ARG SENHADOPAINEL
ENV SENHADOPAINEL=${SENHADOPAINEL}
RUN node build.js

# Instala serve para o site estático
RUN npm install -g serve

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
