FROM node:lts-alpine as building

WORKDIR /app
COPY ./*.json /app/
RUN npm ci

COPY ./src /app/src
COPY ./*.* /app
RUN npm install typescript -g
RUN npm run unix-build

FROM node:lts-alpine

WORKDIR /app

COPY --from=building /app/dist /app
COPY --from=building /app/*.* /app/
RUN npm install --production

ENV NODE_ENV=production

EXPOSE 80
CMD node index.js
