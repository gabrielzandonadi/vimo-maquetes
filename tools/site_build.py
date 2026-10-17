# Gera data.js de um empreendimento: entorno do OSM (no sistema local x=leste, z=sul, origem no pino)
# + dados da página Vimo. uso: python3 -I site_build.py params.json osm.json full.json saida.js
import json, math, sys
P = json.load(open(sys.argv[1])); osm = json.load(open(sys.argv[2])); FJ = json.load(open(sys.argv[3]))
LAT, LON = P['lat'], P['lon']
k = 111320 * math.cos(math.radians(LAT))
def X(p): return [round((p['lon'] - LON) * k, 2), round(-(p['lat'] - LAT) * 110574, 2)]
B = P.get('box', 650)
AX = math.radians(P['lotAxisBearing'])          # direção do eixo x local do edifício (frente)
ux, uz = math.sin(AX), -math.cos(AX); vx, vz = -uz, ux
front = P['front']                               # centro da testada (mundo)
lot = P['lot']                                   # polígono do lote (mundo)
def inside(pt, poly):
    x, y = pt; c = False
    for i in range(len(poly)):
        x1, y1 = poly[i]; x2, y2 = poly[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c
buildings = []; roads = []; beach = []; green = []; coast = []; pools = []
RW = {'tertiary': 11, 'secondary': 13, 'primary': 15, 'residential': 8, 'service': 5, 'cycleway': 2.5, 'footway': 2, 'pedestrian': 4, 'path': 1.5, 'track': 3, 'living_street': 6, 'unclassified': 7}
for e in osm['elements']:
    if 'geometry' not in e: continue
    t = e.get('tags', {}); g = [X(p) for p in e['geometry']]
    if 'building' in t:
        cx = sum(p[0] for p in g) / len(g); cz = sum(p[1] for p in g) / len(g)
        if inside((cx, cz), lot): continue
        if abs(cx) > B or abs(cz) > B: continue
        lv = t.get('building:levels'); h = t.get('height'); est = False
        try:
            if h: H = float(h.split()[0])
            elif lv: H = float(lv) * 3.1 + 1.5
            else: raise ValueError
        except ValueError:
            est = True
            H = 11 * 3.1 if (t['building'] in ('apartments', 'residential') or t.get('name', '').startswith('Edif')) else 7
        if g[0] == g[-1]: g = g[:-1]
        if len(g) >= 3: buildings.append({'p': g, 'h': round(H, 1), 'est': est, 'n': t.get('name', ''), 't': t['building']})
    elif 'highway' in t:
        roads.append({'p': g, 'w': RW.get(t['highway'], 4), 't': t['highway'], 'n': t.get('name', '')})
    elif t.get('natural') in ('beach', 'sand'): beach.append(g)
    elif t.get('natural') == 'coastline': coast.append(g)
    elif t.get('leisure') in ('park', 'garden', 'pitch', 'playground') or t.get('natural') in ('wood', 'scrub', 'heath', 'grassland'): green.append(g)
    elif t.get('leisure') == 'swimming_pool': pools.append(g)
chains = [c[:] for c in coast]; merged = True
while merged:
    merged = False
    for i in range(len(chains)):
        for j in range(len(chains)):
            if i != j and chains[i][-1] == chains[j][0]:
                chains[i] = chains[i] + chains[j][1:]; chains.pop(j); merged = True; break
        if merged: break
islands = [c for c in chains if c[0] == c[-1]]
main = [c for c in chains if c[0] != c[-1]]
main = max(main, key=len)
inb = [p for p in main if abs(p[0]) < B and abs(p[1]) < B]
# a costa entra no recorte; o polígono de terra fecha pelo lado oeste (mar a leste)
out = {'origin': {'lat': LAT, 'lon': LON}, 'lotAxisBearing': P['lotAxisBearing'], 'lot': lot, 'front': front, 'ux': [ux, uz], 'vx': [vx, vz],
       'flatten': P.get('flatten'), 'seaLevel': P.get('seaLevel'),
       'buildings': buildings, 'roads': roads, 'beach': beach, 'green': green, 'pools': pools,
       'coast': inb, 'islands': [c for c in islands if any(abs(p[0]) < B and abs(p[1]) < B for p in c)], 'box': B}
it = FJ['details']['item']
units = sorted(FJ['availabilityItems'], key=lambda u: int(u['name']))
cats = sorted(it['constructionCategories'], key=lambda c: c.get('order', 0))
prop = {'name': it['name'], 'code': it['code'], 'about': it['about'], 'priceRange': it['priceRange'], 'readiness': it['readiness'],
        'address': it['address'], 'city': it['city'], 'state': it['state'], 'neighborhood': it['neighborhood'],
        'company': {'name': it['company']['name'], 'about': it['company']['about']},
        'characteristics': it['characteristics'], 'broker': {k2: (it.get('broker') or {}).get(k2) for k2 in ('name', 'description', 'creciNumber')},
        'categories': [{'name': c['name'], 'images': ['c%d_%d' % (c.get('order', 0), i) for i in range(len(c['images']))]} for c in cats],
        'units': [{'name': u['name'], 'bedrooms': u['bedrooms'], 'area': u['area'], 'status': u['status'], 'price': u['price']} for u in units],
        'source': P['source']}
open(sys.argv[4], 'w').write('// Gerado automaticamente a partir do OpenStreetMap (© OSM contributors) e da página Vimo.\nexport const SITE=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\nexport const PROPERTY=' + json.dumps(prop, ensure_ascii=False, indent=1) + ';\n')
print(len(buildings), 'prédios', len(roads), 'vias', len(inb), 'pontos de costa', file=sys.stderr)
