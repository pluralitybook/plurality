FROM ubuntu:jammy
MAINTAINER Audrey Tang <audreyt@audreyt.org>
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get -qq install -y pandoc fonts-noto-cjk texlive-xetex latex-cjk-all texlive-latex-recommended
RUN chmod a+rwx /home
ENV HOME /home
WORKDIR /data
ENTRYPOINT ["/usr/bin/pandoc"]
