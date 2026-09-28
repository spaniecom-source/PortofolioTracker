from PIL import Image
IMG = "/tmp/claude-0/-home-user-PortofolioTracker/1a92aa62-2e9c-575a-b0fa-e32f82469a35/images/"
# (img, [(cx,cy,h) keyframes])
CROPS = {
 1: [(560,699,1396),(560,560,998)],
 2: [(615,555.5,1110),(615,520,992),(618,475,650)],
 3: [(560,800,1150),(480,620,1050)],
 4: [(600,572.5,1144),(595,480,900)],
}
def rect(cx,cy,h,size=None):
    w=h*9/16
    if size:
        W,H=size; h=min(h,H); w=h*9/16
        cx=min(max(cx,w/2),W-w/2); cy=min(max(cy,h/2),H-h/2)
    return (cx-w/2, cy-h/2, cx+w/2, cy+h/2)
if __name__=="__main__":
    tiles=[]
    for i,ks in CROPS.items():
        im=Image.open(f"{IMG}{i}.webp")
        for k in ks:
            r=rect(*k,size=im.size)
            tiles.append(im.resize((270,480),Image.LANCZOS,box=r))
    sheet=Image.new("RGB",(270*len(tiles),480))
    for j,t in enumerate(tiles): sheet.paste(t,(270*j,0))
    sheet.save("crops_preview.jpg",quality=85)
