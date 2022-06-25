FROM node:16.15.1-alpine3.15 AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn add glob rimraf

RUN yarn --only=development

COPY . .

RUN yarn build

RUN yarn --only=production

COPY . .

EXPOSE 8080

CMD ["node", "src/main"]