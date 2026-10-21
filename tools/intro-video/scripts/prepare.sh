#!/bin/bash
# copia as imagens do projeto para public/ e gera a trilha (rode na pasta tools/intro-video)
set -e
mkdir -p public
A=../../assets
cp $A/vimo-logo-white.png public/
for f in c8_0 c1_0 noite c3_0 c7_0 c7_1 c7_2 c7_3 c7_4 c7_5; do cp $A/homero/$f.jpg public/; done
python3 scripts/trilha.py public/trilha.wav
