# Vídeo institucional da abertura — Ed. Dr. Homero Tavares

Vídeo "feito em código" (Remotion) que toca na tela de abertura do `homero.html` enquanto a maquete carrega.
Quando o carregamento termina, a página **não entra sozinha**: libera o botão **Entrar na maquete**.
`?intro=0` na URL volta ao comportamento antigo (entra automaticamente).

- Estilo inspirado nos vídeos de exemplo da V4MOS (tipografia cinética, rótulos de capítulo em mono, órbita de
  pontos, selo inclinado, faixa de letreiro e assinatura final), nas cores e fontes do site (marinho `#192a56`/`#0f1d3d`,
  dourado `#f6c15a`, areia `#f4eadc`, KoHo + Arsenal).
- 28 s, 30 fps, duas versões: 16:9 (desktop) e 9:16 (celular em retrato). Trilha gerada em código (`scripts/trilha.py`).
- Só fatos do repositório (`js/projects/homero/data.js` e `index.js`): 72 apartamentos, 12 pavimentos, 3 quartos com suíte,
  82,59 a 91,89 m², 2 vagas, lazer completo, Rua Humberto Serrano, Praia da Costa, Vila Velha/ES, Barbosa Barros.

## Roteiro
| Tempo | Cena |
|---|---|
| 0–4 s | Abertura: "Edifício Dr. Homero Tavares" + selo "Praia da Costa" |
| 4–8,5 s | // 01 O edifício: fachada, Rua Humberto Serrano, contadores 72 apartamentos · 12 pavimentos |
| 8,5–13 s | // 02 A localização: órbita (praia, comércio, Terceira Ponte, Vila Velha), "Perto da praia. Perto de tudo." |
| 13–18 s | // 03 O apartamento: planta da coluna 04 desenhada, "3 quartos. 1 suíte.", 82,59 a 91,89 m², itens |
| 18–23,5 s | // 04 O lazer: piscina, gourmet, academia, festas, jogos, playground + letreiro com os 10 itens |
| 23,5–28 s | Assinatura: logo Vimo, "Dr. Homero Tavares", "Explore a maquete 3D." |

## Como gerar
```bash
cd tools/intro-video
npm ci
npm run prepare-assets          # copia as imagens do projeto para public/ e gera a trilha
npm run studio                  # pré-visualização
CHROME=/caminho/do/chrome npm run render:h && CHROME=/caminho/do/chrome npm run render:v
npm run encode                  # grava assets/homero/intro/*.mp4 e *.jpg (H.264 + AAC, faststart)
```
QA da abertura: `NM=<node_modules com puppeteer-core e three> node qa_splash.mjs` (o Chromium sem codecs
proprietários usa uma cópia VP9 em `out/qa_*.webm`, se existir).
