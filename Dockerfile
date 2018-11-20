FROM ubuntu:16.04

MAINTAINER wuyongchao

WORKDIR /opt/spider

ENV CPU_CORE 2
ENV MONGO_HOST 10.7.38.50
ENV MONGO_PORT 27018
ENV MONGO_DB test
ENV MONGO_COLLECTION test

EXPOSE 6881

RUN apt-get update
RUN apt-get -y install curl
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

COPY . /opt/spider
RUN npm install
RUN npm install -g pm2

CMD ["pm2-docker", "start", "index.js", "-i", "$CPU_CORE"]
