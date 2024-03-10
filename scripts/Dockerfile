FROM ubuntu:jammy
MAINTAINER Audrey Tang <audreyt@audreyt.org>
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get -qq install -y pandoc fonts-noto fonts-noto-cjk texlive-xetex latex-cjk-all texlive-latex-recommended inkscape nodejs
RUN apt-get -qq install -y pdftk
RUN apt-get -qq install -y npm
RUN npm i -g pandoc-filter@^2.0.0 shelljs@^0.8.4 twemoji@^12.1.5
RUN chmod a+rwx /home
ENV HOME /home
ENV NODE_PATH /usr/local/lib/node_modules
WORKDIR /data
ENTRYPOINT ["/usr/bin/pandoc"]
