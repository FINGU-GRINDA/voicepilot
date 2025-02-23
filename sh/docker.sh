#!/bin/bash

# 도커 이미지 빌드
docker build -t nextjs-app .

# 도커 컨테이너 실행
docker run -d -p 3000:3000 --name nextjs-container nextjs-app 