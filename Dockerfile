FROM node:22

WORKDIR /usr/src/app

COPY . ./

RUN cd ./3dparty/cesium-img-selector && \
    yarn && yarn build

RUN cd /usr/src/app && \
    yarn && yarn build
