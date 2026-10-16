FROM node:24

RUN apt update && \
    apt install -y vim tmux nginx git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY . ./

RUN cd ./3dparty/cesium-img-selector && \
    yarn && yarn build

RUN cd /usr/src/app && \
    yarn && yarn build

COPY docker/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

STOPSIGNAL SIGTERM
CMD ["nginx", "-g", "daemon off;"]
