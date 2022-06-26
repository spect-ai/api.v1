FROM node:16-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .
RUN yarn

EXPOSE 8080
RUN yarn run build
CMD node dist/main