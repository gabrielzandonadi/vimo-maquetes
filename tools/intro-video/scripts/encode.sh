#!/bin/bash
# comprime para a web (H.264 + AAC, faststart) e tira os pôsteres; saída em ../../assets/homero/intro
set -e
D=${D:-../../assets/homero/intro}; mkdir -p $D
ffmpeg -y -loglevel error -i out/raw_h.mp4 -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -vf scale=1600:-2 -c:a aac -b:a 96k -movflags +faststart $D/homero-16x9.mp4
ffmpeg -y -loglevel error -i out/raw_v.mp4 -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -vf scale=720:-2 -c:a aac -b:a 96k -movflags +faststart $D/homero-9x16.mp4
ffmpeg -y -loglevel error -ss 6.5 -i out/raw_h.mp4 -frames:v 1 -vf scale=1600:-2 -q:v 4 $D/homero-16x9.jpg
ffmpeg -y -loglevel error -ss 6.5 -i out/raw_v.mp4 -frames:v 1 -vf scale=720:-2 -q:v 4 $D/homero-9x16.jpg
ls -la $D
