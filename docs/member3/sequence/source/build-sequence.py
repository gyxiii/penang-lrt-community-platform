from pathlib import Path
from datetime import datetime, timezone
import json, hashlib, html, xml.etree.ElementTree as ET
from PIL import ImageFont

root = Path(__file__).resolve().parent.parent
diagrams = root / 'diagrams'
diagrams.mkdir(parents=True, exist_ok=True)
font_path = Path('C:/Windows/Fonts/arial.ttf')
ink, muted, teal, warm = '#142B39', '#657782', '#116B70', '#8D5A20'

def msg(a, b, text, reply=False):
    return {'kind':'message', 'from':a, 'to':b, 'text':text, 'reply':reply}

def fragment(operator, guard, events, otherwise=None, other_guard=None, proposed=False):
    return {'kind':'fragment','operator':operator,'guard':guard,'events':events,'otherwise':otherwise,'otherGuard':other_guard,'proposed':proposed}

A = {'id':'M3A', 'file':'Sequence_Submission', 'title':'Submit feedback', 'width':1280, 'font':26,
     'participants':[('U','Public user',None,110),('UI','Submission UI','feedback pages',440),('M','Feedback model','browser JavaScript',790),('S','Browser storage','localStorage',1140)],
     'events':[
         msg('U','UI','Submit feedback form'),
         msg('UI','UI','Validate form and photo'),
         fragment('break','invalid fields or photo',[msg('UI','U','Show errors; keep input',True)]),
         msg('UI','M','submit(input)'),
         msg('M','S','getItem(key)'), msg('S','M','saved reports',True),
         msg('M','M','ID + Submitted history'),
         msg('M','S','setItem(key, reports)'),
         fragment('alt','storage write fails',[
             msg('S','M','storage error',True), msg('M','UI','save error',True),msg('UI','U','Show error; keep input',True)
         ],[
             msg('S','M','write completed',True),msg('M','UI','report with reference',True),msg('UI','U','Receipt and reference',True)
         ],'write succeeds')
     ]}
B = {'id':'M3B', 'file':'Sequence_Review_Tracking','title':'Update progress and track feedback','width':1600,'font':30,
     'participants':[('U','Public user',None,100),('UI','Feedback UI','public or staff view',450),('M','Feedback model','browser JavaScript',800),('S','Browser storage','localStorage',1150),('A','Authorised staff',None,1486)],
     'events':[
         fragment('opt','staff review occurs through the proposed dashboard',[
             fragment('loop','each valid update to an existing report',[
                 msg('A','UI','Choose status and add a progress note or response'),
                 msg('UI','M','updateStatus(reference,\nstatus, note)'),
                 msg('M','S','getItem(key)'),msg('S','M','saved reports',True),
                 msg('M','M','Set status; add history'),
                 msg('M','S','setItem(key, reports)'),msg('S','M','write completed',True),
                 msg('M','UI','updated report',True),msg('UI','A','Display the saved status and history',True)
             ],proposed=True)
         ],proposed=True),
         msg('U','UI','Enter reference'),
         fragment('break','empty or malformed reference',[msg('UI','U','Show reference error',True)]),
         msg('UI','M','find(reference)'),msg('M','S','getItem(key)'),msg('S','M','saved reports',True),
         msg('M','UI','report or null',True),
         fragment('alt','matching report found',[
             msg('UI','U','Show report and reply',True)
         ],[msg('UI','U','Show no matching report',True)],'no matching report')
     ]}

class Drawing:
    def __init__(self,spec):
        self.spec=spec; self.w=spec['width']; self.size=spec['font']; self.items=[]; self.rows=[]
        self.positions={p[0]:p[3] for p in spec['participants']}
        self.y=182
    def rect(self,x,y,width,height,fill='none',stroke=muted,sw=1.6):
        self.items.append({'type':'rect','x':x,'y':y,'w':width,'h':height,'fill':fill,'stroke':stroke,'sw':sw})
    def line(self,points,dashed=False,arrow=None,color=ink,sw=2):
        self.items.append({'type':'line','points':points,'dashed':dashed,'arrow':arrow,'color':color,'sw':sw})
    def text(self,x,y,value,size=None,bold=False,anchor='middle',color=ink,white=False):
        size=size or self.size
        lines=value.split('\n')
        font=ImageFont.truetype(str(font_path),size=size)
        widths=[font.getlength(v) for v in lines]
        left=x-max(widths)/2 if anchor=='middle' else x
        assert left>=4 and left+max(widths)<=self.w-4,(self.spec['id'],value,left,max(widths))
        self.items.append({'type':'text','x':x,'y':y,'text':value,'size':size,'bold':bold,'anchor':anchor,'color':color,'width':max(widths),'white':white})
    def events(self,events,depth=0):
        for e in events:
            if e['kind']=='message':
                a,b=self.positions[e['from']],self.positions[e['to']]
                lines=e['text'].split('\n'); top=self.y
                height=max(54,len(lines)*(self.size+3)+20)
                arrow_y=top+height-12
                if a==b:
                    height+=20; arrow_y+=2
                    self.text(a+22,top+self.size,e['text'],anchor='start',size=self.size-1,white=True)
                    self.line([(a,arrow_y),(a+62,arrow_y),(a+62,arrow_y+20),(a,arrow_y+20)],arrow='call')
                else:
                    self.text((a+b)/2,top+self.size,e['text'],white=True)
                    self.line([(a,arrow_y),(b,arrow_y)],dashed=e['reply'],arrow='return' if e['reply'] else 'call')
                self.rows.append({'label':e['text'],'from':e['from'],'to':e['to'],'top':top,'bottom':top+height})
                self.y+=height+5
            else:
                x=18+depth*14; top=self.y; index=len(self.items)
                color=warm if e['proposed'] else muted
                self.items.append(None)
                self.rect(x,top,93,37,fill='#FFF5E9' if e['proposed'] else '#EFF6F6',stroke=color)
                self.text(x+46,top+27,e['operator'],bold=True,size=self.size-1)
                guard=e['guard']
                self.text(x+112,top+28,'['+guard+']',anchor='start',size=self.size-2,color=color,white=True)
                self.y+=40
                self.events(e['events'],depth+1)
                if e['otherwise'] is not None:
                    self.line([(x,self.y),(self.w-x,self.y)],dashed=True,color=color,sw=1.4)
                    self.text(x+112,self.y+31,'['+e['otherGuard']+']',anchor='start',size=self.size-2,color=color,white=True)
                    self.y+=40
                    self.events(e['otherwise'],depth+1)
                self.y+=8
                self.items[index]={'type':'rect','x':x,'y':top,'w':self.w-2*x,'h':self.y-top,'fill':'none','stroke':color,'sw':1.5}
                self.y+=8
    def build(self):
        self.events(self.spec['events'])
        height=self.y+35
        content=self.items; self.items=[]
        self.rect(1,1,self.w-2,height-2,fill='white',stroke='#CAD4D9',sw=1)
        self.text(20,32,'sd  '+self.spec['title'],size=30,bold=True,anchor='start')
        for key,title,detail,x in self.spec['participants']:
            if detail is None:
                self.items.append({'type':'circle','x':x,'y':76,'r':12,'stroke':teal})
                self.line([(x,88),(x,113)],color=teal)
                self.line([(x-19,99),(x+19,99)],color=teal)
                self.line([(x,113),(x-19,130)],color=teal)
                self.line([(x,113),(x+19,130)],color=teal)
                self.text(x,160,title,size=self.size-2)
            else:
                self.rect(x-139,65,278,91,fill='#F1F8F7',stroke=teal)
                self.text(x,100,title,size=self.size-1,bold=True)
                self.text(x,132,detail,size=self.size-5,color=muted)
            self.line([(x,169),(x,height-22)],dashed=True,color='#9BAAB1',sw=1.4)
        self.items+=content
        self.height=height
        return self
    def svg(self):
        lines=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.height}" viewBox="0 0 {self.w} {self.height}" role="img" aria-labelledby="title desc">',f'<title id="title">{html.escape(self.spec["title"])}</title>', '<desc id="desc">UML sequence diagram. Time flows downward. Dashed lifelines, solid calls, dashed replies and guarded interaction fragments. Browser storage is localStorage, not a remote database.</desc>', '<defs><marker id="call" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M 0 0 L 12 6 L 0 12 Z" fill="#142B39"/></marker><marker id="return" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M 0 0 L 12 6 L 0 12" fill="none" stroke="#142B39" stroke-width="1.6"/></marker></defs>', '<g font-family="Arial, sans-serif">']
        for e in self.items:
            if e['type']=='rect': lines.append(f'<rect x="{e["x"]}" y="{e["y"]}" width="{e["w"]}" height="{e["h"]}" fill="{e["fill"]}" stroke="{e["stroke"]}" stroke-width="{e["sw"]}"/>')
            elif e['type']=='circle': lines.append(f'<circle cx="{e["x"]}" cy="{e["y"]}" r="{e["r"]}" fill="white" stroke="{e["stroke"]}" stroke-width="2"/>')
            elif e['type']=='line':
                points=' '.join(f'{x},{y}' for x,y in e['points'])
                dash=' stroke-dasharray="7 6"' if e['dashed'] else ''
                arrow=f' marker-end="url(#{e["arrow"]})"' if e['arrow'] else ''
                lines.append(f'<polyline points="{points}" fill="none" stroke="{e["color"]}" stroke-width="{e["sw"]}"{dash}{arrow}/>')
            else:
                e_lines=e['text'].split('\n'); x=e['x']; y=e['y']; sz=e['size']
                if e['white']:
                    left=x-e['width']/2 if e['anchor']=='middle' else x
                    lines.append(f'<rect x="{left-4}" y="{y-sz+1}" width="{e["width"]+8}" height="{len(e_lines)*(sz+3)}" fill="white"/>')
                for i,line in enumerate(e_lines): lines.append(f'<text x="{x}" y="{y+i*(sz+3)}" font-size="{sz}" fill="{e["color"]}" text-anchor="{e["anchor"]}" font-weight="{"bold" if e["bold"] else "normal"}">{html.escape(line)}</text>')
        return '\n'.join(lines+['</g></svg>'])

def mermaid(spec):
    lines=['sequenceDiagram']
    for key,title,detail,x in spec['participants']:
        lines.append('    '+('actor' if detail is None else 'participant')+' '+key+' as '+title)
    def add(events,indent=4):
        for e in events:
            pad=' '*indent
            if e['kind']=='message':
                lines.append(pad+e['from']+('-->>' if e['reply'] else '->>')+e['to']+': '+e['text'].replace(';','#59;').replace('\n','<br/>'))
            else:
                lines.append(pad+e['operator']+' '+e['guard'])
                add(e['events'],indent+4)
                if e['otherwise'] is not None:
                    lines.append(pad+'else '+e['otherGuard']);add(e['otherwise'],indent+4)
                lines.append(pad+'end')
    add(spec['events'])
    return '\n'.join(lines)+'\n'

def drawio(drawings):
    mx=ET.Element('mxfile',host='app.diagrams.net',type='device',version='24.7.17')
    for d in drawings:
        page=ET.SubElement(mx,'diagram',id=d.spec['id'],name=d.spec['title'])
        model=ET.SubElement(page,'mxGraphModel',grid='1',gridSize='10',page='1',pageScale='1',pageWidth=str(d.w),pageHeight=str(d.height))
        r=ET.SubElement(model,'root');ET.SubElement(r,'mxCell',id='0');ET.SubElement(r,'mxCell',id='1',parent='0')
        for i,e in enumerate(d.items,2):
            key=str(i)
            if e['type']=='line':
                style=f'endArrow={"block" if e["arrow"]=="call" else "open" if e["arrow"] else "none"};endFill={1 if e["arrow"]=="call" else 0};strokeColor={e["color"]};strokeWidth={e["sw"]};dashed={int(e["dashed"])};rounded=0;'
                cell=ET.SubElement(r,'mxCell',id=key,style=style,edge='1',parent='1')
                geo=ET.SubElement(cell,'mxGeometry',relative='1',attrib={'as':'geometry'})
                start,end=e['points'][0],e['points'][-1]
                ET.SubElement(geo,'mxPoint',x=str(start[0]),y=str(start[1]),attrib={'as':'sourcePoint'})
                ET.SubElement(geo,'mxPoint',x=str(end[0]),y=str(end[1]),attrib={'as':'targetPoint'})
                if len(e['points'])>2:
                    arr=ET.SubElement(geo,'Array',attrib={'as':'points'})
                    for x,y in e['points'][1:-1]: ET.SubElement(arr,'mxPoint',x=str(x),y=str(y))
                continue
            if e['type']=='rect':
                x,y,width,height=e['x'],e['y'],e['w'],e['h'];value=''
                style=f'rounded=0;fillColor={e["fill"]};strokeColor={e["stroke"]};strokeWidth={e["sw"]};'
            elif e['type']=='circle':
                x,y,width,height=e['x']-e['r'],e['y']-e['r'],2*e['r'],2*e['r'];value=''
                style=f'ellipse;fillColor=white;strokeColor={e["stroke"]};strokeWidth=2;'
            else:
                x=e['x']-e['width']/2-3 if e['anchor']=='middle' else e['x']-3
                y=e['y']-e['size'];width=e['width']+6;height=(e['size']+3)*len(e['text'].split('\n'))+5
                value=e['text'];style=f'text;html=0;align={"center" if e["anchor"]=="middle" else "left"};verticalAlign=top;whiteSpace=wrap;spacing=0;fontFamily=Arial;fontSize={e["size"]};fontColor={e["color"]};fontStyle={int(e["bold"])};strokeColor=none;fillColor={"white" if e["white"] else "none"};'
            cell=ET.SubElement(r,'mxCell',id=key,value=value,style=style,vertex='1',parent='1')
            ET.SubElement(cell,'mxGeometry',x=str(x),y=str(y),width=str(width),height=str(height),attrib={'as':'geometry'})
    return ET.tostring(mx,encoding='utf-8',xml_declaration=True)

drawings=[Drawing(s).build() for s in [A,B]]
for d in drawings:
    (diagrams/(d.spec['file']+'.svg')).write_text(d.svg(),encoding='utf-8')
    (diagrams/(d.spec['file']+'.mmd')).write_text(mermaid(d.spec),encoding='utf-8')
(diagrams/'Member3_Sequence_Diagrams.drawio').write_bytes(drawio(drawings))
(root/'source/sequence-model.json').write_text(json.dumps([A,B],ensure_ascii=False,indent=2),encoding='utf-8')
(root/'source/layout.json').write_text(json.dumps([{'id':d.spec['id'],'file':d.spec['file'],'width':d.w,'height':d.height,'messages':len(d.rows),'textItems':sum(e['type']=='text' for e in d.items)} for d in drawings],indent=2),encoding='utf-8')
print(json.dumps({'diagrams':[{'file':d.spec['file'],'width':d.w,'height':d.height,'messages':len(d.rows)} for d in drawings],'drawioPages':2}))
