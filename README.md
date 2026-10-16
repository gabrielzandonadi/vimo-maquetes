# Apogeo Residences · maquete 3D navegável (protótipo)

Página estática em three.js com o empreendimento Apogeo Residences (Javé, Praia da Costa, Vila Velha/ES).

## Rodar

```bash
cd apogeo-3d && python3 -m http.server 5174
```

## Visual (v2)

- **Design:** cores, fontes e componentes do design system de vempravimo.com.br (azul `#192a56`, dourado `#f6c15a`, areia `#f4eadc`, KoHo/Arsenal, raio 16/20 px), com tema claro.
- **Render:** MSAA 4x, oclusão de ambiente (GTAO), tone mapping AgX, névoa atmosférica, fachadas texturizadas nos vizinhos e coqueiros na orla.
- **Entorno fotorrealista opcional:** Google Photorealistic 3D Tiles. Ative em *Camadas → Entorno fotorrealista* com uma chave Google Maps Platform que tenha a **Map Tiles API** habilitada. Testado com chave real: a orientação foi corrigida (rotação de 180° do plugin com up `+y`), as normais são calculadas no carregamento, a altura é calibrada automaticamente pela avenida em frente ao lote e a construção atual dentro do lote é recortada no shader. A análise de insolação ainda usa os prédios do OSM, não a geometria do Google.

Abra http://localhost:5174. É preciso um servidor (módulos ES não carregam via `file://`).

## O que tem

- **Maquete 3D** procedural: embasamento escalonado (1º–7º), lazer no 8º (praia suspensa, piscina, spa) e torre (9º–15º), com as 31 unidades clicáveis.
- **Disponibilidade** real (status, área, preço, R$/m²), extraída da página da Vimo em 15/10/2026, com modo de cor "Disponibilidade".
- **Sol realista**: posição solar NOAA para a coordenada do lote, céu físico, sombras em tempo real, trajetória do sol do dia e dos solstícios. Também tem noite com janelas acesas, postes e estrelas.
- **Análise de insolação por unidade**: horas de sol da manhã e da tarde em cada varanda e uma linha do tempo por fachada, para qualquer data. O cálculo usa raycasting contra o próprio prédio, os prédios vizinhos (OSM) e o relevo (Morro do Moreno). O modo "Insolação" mostra um mapa de calor do prédio inteiro.
- **Navegação**: orbitar, caminhar (WASD), vistas prontas e "vista da unidade" (câmera na varanda).
- **Street View**: embed público do Google, sem chave. O botão "📍 Street View aqui" abre o panorama no ponto clicado da maquete, já na direção da câmera. Com uma chave da Maps JS API, o panorama fica interativo e aparece como marcador na maquete.
- Mapa de satélite, galeria (fotos e plantas) e página "Sobre".

## Tour interno das unidades disponíveis

A ficha da unidade tem o botão **Entrar no apartamento**: a navegação é estilo Street View (arrastar para olhar, clicar no piso ou nos círculos para andar, minimapa com a planta oficial). A luz é a do sol real no horário escolhido.

| Unidade | Planta usada | Observação |
|---|---|---|
| 901 | `c4_0` (Tipo · 4 suítes · 901) | planta exata |
| 204 | `c3_0` (tipologia 205/305/404/503) | a planta exata da 204 não foi publicada |
| 102 | `c2_0` (Garden Duplex) | dois pavimentos, escada interna, jardim, deck e piscina |
| 1401 | `c5_0` (Cobertura Duplex) | dois pavimentos, cobertura com piscina |
| 501 | — | sem planta publicada (sem tour) |

Cada planta é **só dados** em `js/interiors/planXXX.js`: paredes, portas, janelas, vidros, pisos, móveis e pontos de navegação, em pixels da imagem oficial, com escala e âncora. O motor (`js/interior.js`) é o mesmo para todas as unidades.

## Para escalar aos outros empreendimentos da Vimo

O código já separa o que é genérico do que é específico de cada prédio:

- **Genérico (reaproveitável):** motor 3D, sol/sombra (`sun.js`, `analysis.js`), entorno (`context.js`, Google 3D Tiles), motor de interiores, UI e design system Vimo.
- **Por empreendimento:** `data.js` (gerado automaticamente da página da Vimo + OpenStreetMap), `terrain.js` (gerado), `building.js` (volumetria) e `interiors/*.js` (plantas).

Hoje, o trabalho manual por empreendimento é a volumetria do prédio e o traçado das plantas. Para 20+ empreendimentos, o próximo passo é:
1. transformar `building.js` num gerador a partir de um JSON de pavimentos (contorno + altura por andar);
2. criar uma ferramenta interna de traçado de planta (clicar sobre a imagem → JSON) ou pedir à incorporadora o DWG/IFC/GLB.

Com isso, cada empreendimento vira dados, sem código novo.

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `js/data.js` | dados do imóvel + entorno OSM em metros locais (gerado) |
| `js/terrain.js` | grade de relevo 131×131 (AWS Terrain Tiles/SRTM) |
| `js/building.js` | modelo procedural e distribuição das unidades |
| `js/context.js` | relevo, textura do solo, vizinhos, mar, postes |
| `js/sun.js` | posição solar, nascer/pôr |
| `js/analysis.js` | insolação por unidade |
| `js/tiles.js` | Google 3D Tiles (carregado sob demanda) |
| `js/interior.js` | motor de interiores (planta → 3D, navegação) |
| `js/interiors/*.js` | plantas traçadas das unidades |
| `js/main.js` | cena, UI, abas |

## Aproximações (importante antes de usar com cliente)

- A volumetria é **interpretada** das perspectivas e da tabela. Não é o projeto executivo. A posição de cada unidade no pavimento é estimada pela área.
- O lote foi posicionado entre a Av. Antônio Gil Veloso e a Rua Lúcio Bacelar, a 101° (perpendicular à orla), com 84 × 28 m estimados.
- Prédios vizinhos sem altura no OSM recebem uma altura estimada (11 pavimentos se forem residenciais, 2 nos demais casos) e aparecem num tom mais frio.
- O relevo SRTM tem resolução de ~30 m: bom para o morro, grosseiro para detalhes urbanos.

Para um resultado "quase perfeito", o próximo passo natural é trocar o entorno pelo **Google Photorealistic 3D Tiles** (via `3d-tiles-renderer`, requer chave) e usar o modelo 3D oficial da incorporadora (glTF/IFC), se houver.
