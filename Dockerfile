FROM node:20-alpine

WORKDIR /app

COPY package.json server.mjs index.html ./
COPY vital/ ./vital/
COPY api/ ./api/

COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
