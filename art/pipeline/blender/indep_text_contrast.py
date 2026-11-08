import sys,json,glob,os,numpy as np
from PIL import Image
D=sys.argv[1]
def Y(v):v=np.asarray(v,float)/255;l=np.where(v<=0.04045,v/12.92,((v+0.055)/1.055)**2.4);return 0.2126*l[...,0]+0.7152*l[...,1]+0.0722*l[...,2]
out={}
for v in ['calendar','board','plan','chrome']:
    A=np.asarray(Image.open(f'{D}/view_{v}.png').convert('RGB'));B=np.asarray(Image.open(f'{D}/view_{v}_bg.png').convert('RGB'))
    YA,YB=Y(A),Y(B);H,W=YA.shape;rois=json.load(open(f'{D}/view_{v}_rois.json'))['objects'];res={}
    for k,o in rois.items():
        if 'body' not in o: continue
        x0,y0,x1,y1=o['px_tl'] if W==640 else o.get('px_tl_1280',o['px_tl'])
        x0,y0=max(0,int(x0)),max(0,int(y0));x1,y1=min(W,int(np.ceil(x1))+1),min(H,int(np.ceil(y1))+1)
        if x1-x0<2 or y1-y0<2: res[k]={'skip':'tiny roi'};continue
        a=YA[y0:y1,x0:x1];b=YB[y0:y1,x0:x1];diff=np.abs(a-b)>0.02
        ink=a[diff]
        if ink.size<4: res[k]={'body':o['body'],'h_px':o.get('h_px_640' if W==640 else 'h_px_1280'),'ink_px':int(ink.size),'C':None};continue
        fg=np.percentile(ink,10);bgw=np.percentile(b,95) if fg<np.median(b) else np.percentile(b,5)  # worst bg = closest to ink
        bgw=b.min() if fg<b.mean() else b.max()
        C=lambda f,g:(max(f,g)+0.05)/(min(f,g)+0.05)
        res[k]={'body':o['body'][:24],'h_px':round(o.get('h_px_640' if W==640 else 'h_px_1280',0),1),'ink_px':int(ink.size),'C_median_bg':round(float(C(fg,np.median(b))),2),'C_worst_bg':round(float(C(fg,bgw)),2)}
    out[v]=res
json.dump(out,open(sys.argv[2],'w'),indent=1)
for v,r in out.items():
    Cs=[(x.get('C_worst_bg'),k) for k,x in r.items() if x.get('C_worst_bg') is not None]
    fails=[(c,k,r[k]['h_px']) for c,k in Cs if c<4.5];none=[k for k,x in r.items() if x.get('C_worst_bg') is None]
    print(v,'n',len(r),'min worst',min(Cs)[0] if Cs else None,'fails<4.5',len(fails),fails[:6],'unmeasured',none[:6])
