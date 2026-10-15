FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY build.js ./
COPY vital/ ./vital/
COPY api/ ./api/
COPY index.html ./

RUN npm install -g serve

EXPOSE 3000 3001

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
