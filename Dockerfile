FROM node:16.15.1-alpine3.15 AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn add glob rimraf

RUN yarn --only=development

COPY . .

EXPOSE 3000

CMD ["node", "src/main"]