# Vídeo institucional da abertura — Ed. Dr. Homero Tavares

Vídeo "feito em código" (Remotion) que toca na tela de abertura do `homero.html` enquanto a maquete carrega.
Quando o carregamento termina, a página **não entra sozinha**: libera o botão **Entrar na maquete**.
`?intro=0` na URL volta ao comportamento antigo (entra automaticamente).

- Estilo inspirado nos vídeos de exemplo da V4MOS (tipografia cinética, rótulos de capítulo em mono, órbita de
  pontos, selo inclinado, faixa de letreiro e assinatura final), nas cores e fontes do site (marinho `#192a56`/`#0f1d3d`,
  dourado `#f6c15a`, areia `#f4eadc`, KoHo + Arsenal).
- 32 s, 30 fps, duas versões: 16:9 (desktop) e 9:16 (celular em retrato). Cada cena começa num compasso da trilha.
- Trilha composta e sintetizada em código (`trilha/musica.js`, Tone.js com render offline): 105 BPM, Lá maior,
  piano FM, pad, baixo e percussão leve, com virada antes da assinatura e acorde final no corte do logo; masterizada a
  −14 LUFS com teto de −1,2 dBFS (`trilha/master.py`). Três versões: `pulso` (usada), `elegante` e `calmo`. Sem samples.
- Só fatos do repositório (`js/projects/homero/data.js`, `index.js`, `plans.js`): 72 apartamentos, 12 pavimentos, 8 colunas,
  5 plantas oficiais (91,89 m² nas colunas 01/02/07/08; 84,35 na 03; 82,88 na 04; 82,59 na 05; 84,43 na 06), todas com
  3 quartos sendo 1 suíte, lazer completo, Rua Humberto Serrano, Praia da Costa, Vila Velha/ES, Barbosa Barros.

## Roteiro
| Tempo | Cena |
|---|---|
| 0–4,6 s | Abertura: "Edifício Dr. Homero Tavares" + selo "Praia da Costa" |
| 4,6–9,1 s | // 01 O edifício: fachada, Rua Humberto Serrano, contadores 72 apartamentos · 12 pavimentos |
| 9,1–13,7 s | // 02 A localização: órbita (praia, comércio, Terceira Ponte, Vila Velha), "Perto da praia. Perto de tudo." |
| 13,7–20,6 s | // 03 As plantas: "5 plantas. 8 colunas.", planta-chave das 8 colunas acendendo por tipo, cartões com as 5 plantas oficiais (área, colunas, posição, nº de unidades) e faixa de área privativa 82,59 → 91,89 m² |
| 20,6–27,4 s | // 04 O lazer: piscina, gourmet, academia, festas, jogos, playground + letreiro com os 10 itens |
| 27,4–32 s | Assinatura: logo Vimo, "Dr. Homero Tavares", "Explore a maquete 3D." (acorde final da trilha) |

## Como gerar
```bash
cd tools/intro-video
npm ci
npm run prepare-assets          # copia as imagens do projeto para public/ e gera a trilha (precisa de puppeteer-core: NM=…)
npm run studio                  # pré-visualização
CHROME=/caminho/do/chrome npm run render:h && CHROME=/caminho/do/chrome npm run render:v
npm run encode                  # grava assets/homero/intro/*.mp4 e *.jpg (H.264 + AAC, faststart)
```
QA da abertura: `NM=<node_modules com puppeteer-core e three> node qa_splash.mjs` (o Chromium sem codecs
proprietários usa uma cópia VP9 em `out/qa_*.webm`, se existir).
