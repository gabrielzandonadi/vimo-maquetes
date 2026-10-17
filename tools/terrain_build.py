# Grade de relevo 131x131 (1300 m) a partir dos tiles AWS Terrain (terrarium, z15) já baixados.
# uso: python3 -I terrain_build.py <pasta-dos-tiles> <saida.json> <lat> <lon>
import zlib,struct,math,sys,json,os
def png(fn):
    d=open(fn,'rb').read();assert d[:8]==b'\x89PNG\r\n\x1a\n';i=8;idat=b''
    while i<len(d):
        L=struct.unpack('>I',d[i:i+4])[0];t=d[i+4:i+8];c=d[i+8:i+8+L];i+=12+L
        if t==b'IHDR': w,h,bd,ct=struct.unpack('>IIBB',c[:10])
        elif t==b'IDAT': idat+=c
    bpp={2:3,6:4}[ct];raw=zlib.decompress(idat);st=w*bpp;out=[];prev=bytearray(st);p=0
    for r in range(h):
        f=raw[p];line=bytearray(raw[p+1:p+1+st]);p+=1+st
        for x in range(st):
            a=line[x-bpp] if x>=bpp else 0;b=prev[x];cc=prev[x-bpp] if x>=bpp else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+b)&255
            elif f==3: line[x]=(line[x]+(a+b)//2)&255
            elif f==4:
                pa=abs(b-cc);pb=abs(a-cc);pc=abs(a+b-2*cc)
                pr=a if pa<=pb and pa<=pc else (b if pb<=pc else cc);line[x]=(line[x]+pr)&255
        out.append([(line[x*bpp]*256+line[x*bpp+1]+line[x*bpp+2]/256)-32768 for x in range(w)]);prev=line
    return out
Z=15;n=2**Z;tiles={}
for fn in os.listdir(sys.argv[1]):
    if fn.endswith('.png'):
        _,x,y=fn[:-4].split('_');tiles[(int(x),int(y))]=png(os.path.join(sys.argv[1],fn))
LAT,LON=float(sys.argv[3]),float(sys.argv[4]);k=111320*math.cos(math.radians(LAT))
def elev(lat,lon):
    fx=(lon+180)/360*n*256;fy=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n*256
    def g(px,py):
        t=tiles[(px//256,py//256)];return t[py%256][px%256]
    x0=int(fx);y0=int(fy);tx=fx-x0;ty=fy-y0
    return g(x0,y0)*(1-tx)*(1-ty)+g(x0+1,y0)*tx*(1-ty)+g(x0,y0+1)*(1-tx)*ty+g(x0+1,y0+1)*tx*ty
B=650;N=131;grid=[]
for j in range(N):
    z=-B+2*B*j/(N-1)
    for i in range(N):
        x=-B+2*B*i/(N-1)
        grid.append(round(max(elev(LAT-z/110574,LON+x/k),-5),1))
print('min',min(grid),'max',max(grid),'at origin',elev(LAT,LON),file=sys.stderr)
json.dump({'n':N,'size':2*B,'h':grid},open(sys.argv[2],'w'),separators=(',',':'))
