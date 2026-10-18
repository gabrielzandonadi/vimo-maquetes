# Maquetes 3D Vimo · Apogeo Residences e Edifício Dr. Homero Tavares

Páginas estáticas em three.js para navegar em empreendimentos da Vimo, com disponibilidade, sol real e tour
interno das unidades disponíveis. O mesmo motor atende a todos os empreendimentos; cada um é um descritor em
`js/projects/<id>/`.

| Página | Empreendimento |
|---|---|
| `apogeo.html` | Apogeo Residences (Javé) |
| `index.html` | lista das maquetes |
| `homero.html` | Edifício Dr. Homero Tavares (Barbosa Barros) |

Publicado em https://gabrielzandonadi.github.io/vimo-maquetes/apogeo.html e
https://gabrielzandonadi.github.io/vimo-maquetes/homero.html. O endereço antigo (`/apogeo-3d/`) redireciona.

## Rodar

```bash
cd apogeo-3d && python3 -m http.server 5174
```

Abra http://localhost:5174/apogeo.html ou http://localhost:5174/homero.html. É preciso um servidor, porque
módulos ES não carregam via `file://`. O entorno fotorrealista do Google liga sozinho quando há uma chave em
`js/config.js`; a chave deve estar restrita por referenciador no Google Cloud.

## Desempenho (pensado para notebooks comuns)

Medido com `scratchpad/bench` (Chrome headless, CPU desacelerada e GPU por software):

| Perfil | Antes | Depois |
|---|---|---|
| Notebook (CPU 4×, rede 30 Mbps): 1º quadro | 4,1 s | 1,3 s |
| Notebook: entorno Google pronto | 19,7 s | 8,4 s |
| Notebook: sol com prédios reais | 45 s | 1,9 s |
| Notebook: travamentos (long tasks) | 23,4 s | 1,0 s |
| GPU por software + CPU 6×: 1º quadro | 15,3 s | 7,9 s |
| GPU por software: quadros/s ao girar | 1,2 | 4,2 |

O que foi feito:

1. **Insolação pré-calculada** (`js/projects/<id>/sun.json`, ~26 kB com gzip). O cálculo com a geometria real
   do Google (≈280 mil triângulos + BVH) roda uma vez, offline, via `?bake=1`; o visitante só lê o resultado.
   A diferença para o cálculo ao vivo é zero nos dias calculados e no máximo 10 min nos intermediários.
2. **Entorno simplificado mais rápido**: máscara terra/mar rasterizada em vez de ponto-em-polígono por vértice.
3. **Renderização sob demanda**: com a cena parada, nada é redesenhado; a GPU fica livre para carregar o entorno.
4. **Qualidade adaptativa** (`alta` → `media` → `leve`): o nível inicial vem da placa de vídeo e do número de
   núcleos; um governador de quadros reduz a resolução interna e depois o nível se a máquina não acompanhar.
   `?q=alta|media|leve` força um nível. A qualidade alta é a mesma da versão anterior.
5. **Google 3D Tiles**: erro de tela por nível (8/20/28 px; no 28 a imagem fica praticamente igual com 45% menos
   tiles), sombras dos tiles desligadas no nível leve, e o entorno só substitui o simplificado depois de calibrado
   (sem tela vazia durante o carregamento).

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `js/main.js` | motor: cena, sol, UI, abas, tours, qualidade adaptativa |
| `js/projects/<id>/index.js` | descritor do empreendimento (dados, câmera, vistas, rótulos, plantas, obra) |
| `js/projects/apogeo/` | Apogeo (usa `js/data.js`, `js/terrain.js`, `js/building.js`, `js/interiors/`) |
| `js/projects/homero/` | Homero: `data.js`, `terrain.js`, `building.js`, `plans.js`, `sun.json` |
| `js/context.js` | relevo, solo, vizinhos OSM, mar |
| `js/tiles.js` | Google 3D Tiles (sob demanda) |
| `js/analysis.js` | insolação por unidade (ao vivo ou pré-calculada) |
| `js/interior.js` | motor de interiores (planta → 3D, navegação estilo Street View) |

## Edifício Dr. Homero Tavares

- **Fontes:** página da Vimo (72 unidades, 11 disponíveis, preços, plantas por tipologia, imagens) e página da
  Barbosa Barros (estágio da obra em 28/05/2026 e fotos datadas, na aba *Sobre*).
- **Lote:** atravessa a quadra entre a Rua Humberto Serrano (frente, leste) e a Rua Romero Botelho (oeste;
  no OpenStreetMap ela ainda aparece como "Rua Curitiba"), ~64 × 29 m, eixo a 99°.
- **Volumetria:** térreo envidraçado, 2 pavimentos de garagem com ripado de madeira e friso de LED, lazer
  envidraçado no 3º (piscina e deck ao norte, playground e churrasqueira ao sul) e torre do 4º ao 12º com
  8 apartamentos por andar (ímpares ao norte, pares ao sul), varandas em "bumerangue" com LED nas pontas.
- **Plantas e tours:** coluna 04 traçada sobre a planta oficial (escala 0,0114 m/px, conferida pelos quartos de
  8,10 m², pela suíte de 11,25 m² e pelas camas); coluna 06 = 04 espelhada com a varanda do estar avançando
  0,5 m; colunas 05 e 03 = 04 e 06 giradas 180° — exatamente como nas plantas oficiais. As 11 unidades
  disponíveis (colunas 03–06) têm tour.
- **Aproximações:** as colunas de ponta (01/02/07/08) e o embasamento seguem a planta-chave e as perspectivas,
  não o projeto executivo; a posição da torre no lote é estimada.

## Novo empreendimento (passo a passo)

1. Extrair `full.json` da página da Vimo e o entorno do Overpass; gerar `data.js` com `site_build.py`
   (parâmetros: coordenada, eixo do lote, testada e polígono do lote) e `terrain.js` com o script de relevo.
2. Escrever `building.js` (volumetria) e traçar as plantas das colunas disponíveis em `plans.js`.
3. Criar `js/projects/<id>/index.js` e uma página `<id>.html` com `data-project="<id>"`.
4. Gerar a insolação: `node bake.mjs http://localhost:5174/<id>.html js/projects/<id>/sun.json`.
