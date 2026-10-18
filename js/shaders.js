window.App = window.App || {};
// GLSL in the style of threejs-skills/shaders: ShaderMaterial, uniforms, value noise, fresnel, log depth.
App.GL = (function () {
  const noise = `
float h3(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int k=0;k<5;k++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}`;
  const vert = `#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vN;varying vec3 vW;varying vec3 vP;
void main(){vP=normalize(position);vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;
gl_Position=projectionMatrix*viewMatrix*w;
#include <logdepthbuf_vertex>
}`;
  const shadow = `
uniform vec4 uOcc[4];uniform float uSunR;
float occl(vec3 P,vec3 S){float sh=1.;vec3 d=normalize(S-P);float sa=uSunR/length(S-P);
for(int k=0;k<4;k++){vec4 o=uOcc[k];if(o.w<=0.)continue;vec3 oc=o.xyz-P;float t=dot(oc,d);if(t<=0.)continue;
float sep=length(oc-d*t)/t;float oa=o.w/t;float cov=1.-smoothstep(abs(oa-sa),oa+sa,sep);sh*=1.-cov*min(1.,(oa*oa)/(sa*sa));}
return sh;}`;
  const planetFrag = `#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uSun;uniform vec3 c1;uniform vec3 c2;uniform vec3 c3;uniform vec3 uAtm;uniform float uAtmK;uniform int uType;uniform float uTime;uniform float uSeed;uniform int uKind;uniform vec3 uRingN;uniform vec4 uRingC;
varying vec3 vN;varying vec3 vW;varying vec3 vP;
${noise}${shadow}
float ringSh(vec3 P,vec3 L){if(uRingC.w<=0.)return 1.;float dn=dot(L,uRingN);if(abs(dn)<1e-4)return 1.;float t=dot(uRingC.xyz-P,uRingN)/dn;if(t<=0.)return 1.;float r=length(P+L*t-uRingC.xyz)/uRingC.w;
float a=smoothstep(1.525,1.54,r)*(1.-smoothstep(1.945,1.951,r))*.8+smoothstep(2.027,2.035,r)*(1.-smoothstep(2.265,2.27,r))*.55+smoothstep(1.239,1.26,r)*(1.-smoothstep(1.52,1.527,r))*.2;return 1.-a;}
void main(){
#include <logdepthbuf_fragment>
vec3 n=normalize(vN);vec3 L=normalize(uSun-vW);float nd=dot(n,L);float dif=max(nd,0.)*occl(vW,uSun)*ringSh(vW,L);
vec3 p=vP*2.+uSeed;vec3 col;float lat=vP.y;vec3 glow=vec3(0.);float landG=1.;float cloudG=0.;
if(uType==0){float a=fbm(p*2.);col=mix(c2,c1,a);col=mix(col,c3,smoothstep(.62,.8,fbm(p*5.))*.6);
 float cr=fbm(p*9.);col*=.8+.4*smoothstep(.3,.7,cr);}
else if(uType==1){float h=fbm(p*1.4+3.);float land=smoothstep(.5,.535,h);
 vec3 ocean=vec3(.02,.07,.18)+.04*fbm(p*8.);vec3 ground=mix(vec3(.12,.26,.07),vec3(.48,.40,.24),smoothstep(.45,.7,fbm(p*4.)));
 col=mix(ocean,ground,land);landG=land;col=mix(col,vec3(.92),smoothstep(.78,.86,abs(lat)+.08*fbm(p*5.)));
 float cl=smoothstep(.5,.72,fbm(p*2.6+vec3(uTime*.01,0.,uTime*.004)));col=mix(col,vec3(.96),cl*.82);cloudG=cl;
 float nightK=(1.-smoothstep(-.12,.06,nd))*land*(1.-cl*.8)*smoothstep(.62,.8,fbm(p*28.))*(1.-smoothstep(.55,.75,abs(lat)))*smoothstep(.505,.56,h);
 glow=vec3(1.,.74,.42)*nightK*.75;
 float lo=atan(vP.z,vP.x);float au=(1.-smoothstep(.0,.045,abs(abs(lat)-.86+.025*sin(lo*4.+uTime*.05))))*smoothstep(.45,.75,fbm(vec3(lo*6.,lat*20.,uTime*.03)))*(1.-smoothstep(-.15,.05,nd));glow+=vec3(.25,.95,.55)*au*.12;}
else if(uType==2){float b=sin(lat*16.+fbm(p*2.5+vec3(0.,0.,uTime*.002))*3.)*.5+.5;col=mix(c2,c1,b);
 col=mix(col,c3,smoothstep(.5,.8,fbm(vec3(lat*24.,p.x*1.5,p.z*1.5)))*.55);}
else{float b=smoothstep(.2,.8,fbm(vec3(lat*5.,p.x*.6,p.z*.6)));col=mix(c1,c2,b*.6);col=mix(col,c3,smoothstep(.85,1.,abs(lat))*.4);}
vec3 V=normalize(cameraPosition-vW);float lon=atan(vP.z,vP.x);
if(uType==0&&uKind!=2){float mu0=max(nd,0.);float mu=max(dot(n,V),.05);dif*=mu0>0.?2.*mu/(mu0+mu)*1.:0.;dif=min(dif,1.4);}
if(uType==0||uKind==1||uKind==8){float rd=1.-abs(vn(p*14.)*2.-1.);col*=.86+.26*pow(rd,6.);float rd2=1.-abs(vn(p*31.)*2.-1.);col*=.92+.14*pow(rd2,8.);}
if(uKind==8){col=mix(col,vec3(.33,.32,.31),smoothstep(.55,.6,fbm(p*1.2+7.))*.8);}
if(uKind==1){col=mix(col,vec3(.42,.40,.38),.35);}
if(uKind==3){col=mix(col,c2*.55,smoothstep(.55,.66,fbm(p*1.5+2.))*.7);float vm=(1.-smoothstep(.0,.025+.01*fbm(p*8.),abs(lat+.14+.04*sin(lon*3.))))*step(-1.6,lon)*step(lon,-.9);col=mix(col,c2*.45,vm*.8);float om=1.-smoothstep(.05,.09,length(vec2(lon+2.3,lat-.32)));col=mix(col,c3*.9,om*.5);col=mix(col,c2*.4,(1.-smoothstep(.15,.3,length(vec2((lon-1.2)*.8,lat-.15))))*.45);col=mix(col,c3,(1.-smoothstep(.2,.32,length(vec2((lon-1.3)*.7,lat+.7))))*.3);col=mix(col,vec3(.95,.94,.92),smoothstep(.88,.92,abs(lat)+.03*fbm(p*6.)));}
if(uKind==4){float d=length(vec2(lon*1.3,(lat+.36)*2.6));col=mix(col,vec3(.78,.40,.25),(1.-smoothstep(.07,.13,d))*.85);col=mix(col,c2*.8,smoothstep(.06,.0,abs(abs(lat)-.22))*.35);}
if(uKind==4){float neb=smoothstep(.10,.13,lat)*(1.-smoothstep(.27,.31,lat));float seb=smoothstep(-.12,-.09,-lat)*(1.-smoothstep(-.36,-.32,-lat));col=mix(col,vec3(.55,.36,.24),(neb+seb)*(.55+.3*fbm(vec3(lon*3.,lat*40.,uTime*.003))));col=mix(col,vec3(.93,.88,.78),(1.-smoothstep(.0,.09,abs(lat)))*.35);}
if(uKind==4){col=mix(col,vec3(.56,.55,.56),smoothstep(.58,.85,abs(lat))*.5);col=mix(col,vec3(.62,.47,.35),(1.-smoothstep(.0,.03,abs(abs(lat)-.46)))*.4);col=mix(col,vec3(.97,.94,.88),(1.-smoothstep(.04,.07,length(vec2((lon+1.5)*1.6,(lat+.55)*3.))))*.5);}
if(uKind==5){col=mix(col,vec3(.70,.69,.60),smoothstep(.5,.85,abs(lat))*.35);col=mix(col,c3,(1.-smoothstep(.0,.12,abs(lat)))*.25);}
if(uKind==1){col=mix(col,vec3(.63,.61,.58),(1.-smoothstep(.2,.26,length(vec2(lon-.5,lat-.52))))*.35);col=mix(col,vec3(.8,.78,.75),(1.-smoothstep(.0,.05,length(vec2(lon+1.9,lat+.3))))*.6);}
if(uKind==3){col=mix(col,c3*.95,(1.-smoothstep(.12,.2,length(vec2((lon+1.2)*.8,lat+.67))))*.4);col=mix(col,c2*.5,(1.-smoothstep(.0,.03,length(vec2(lon+1.75,lat-.02))))*.6);col=mix(col,c2*.5,(1.-smoothstep(.0,.03,length(vec2(lon+1.85,lat+.15))))*.6);}
if(uKind==5){col=mix(col,vec3(.62,.66,.62),smoothstep(.9,.97,lat)*.6);float hx=.215/cos(mod(lon+3.1416,1.0472)-.5236);float cl=acos(clamp(lat,-1.,1.));col=mix(col,vec3(.45,.5,.48),(1.-smoothstep(.0,.03,abs(cl-hx)))*.7*step(0.,lat));col=mix(col,c2*.85,smoothstep(.0,.04,abs(sin(lat*9.)))*0.);}
if(uKind==7){float d=length(vec2((lon-1.)*1.4,(lat+.42)*3.2));col=mix(col,vec3(.12,.18,.45),(1.-smoothstep(.04,.08,d))*.5);col=mix(col,vec3(.95,.97,1.),(1.-smoothstep(.0,.025,abs(lat+.68)))*smoothstep(.55,.7,fbm(vec3(lon*4.,0.,uTime*.01)))*.6);col=mix(col,vec3(.92,.95,1.),smoothstep(.72,.8,fbm(vec3(lat*30.,p.x,p.z)))*.35);}
if(uKind==2){col=mix(col,c3,fbm(vec3(lat*3.,p.x*2.,p.z*2.))*.25);float y=smoothstep(.05,.0,abs(abs(lat)*1.6-mod(lon+uTime*.02,6.2832)*.12-.25));col=mix(col,c2*.8,y*.35);}
if(uKind==6){col=mix(col,vec3(.82,.95,.96),smoothstep(.55,.85,abs(lat))*.45);col*=.96+.04*sin(lat*22.);}
if(uKind==1){col=mix(col,vec3(.55,.52,.48),(1.-smoothstep(.22,.3,length(vec2(lon-2.9,lat-.5))))*.5);}
if(uKind==15){float hd=length(vec2(lon*.9,(lat-.25)*1.6));col=mix(col,vec3(.94,.91,.86),(1.-smoothstep(.32,.42,hd+.05*fbm(p*6.)))*.85);col=mix(col,vec3(.32,.16,.09),(1.-smoothstep(.0,.16,abs(lat+.05)))*step(.9,abs(lon))*.7);col=mix(col,vec3(.85,.8,.72),smoothstep(.8,.9,lat)*.5);}
if(uKind==16){col=mix(col,vec3(1.,.99,.96),1.-smoothstep(.0,.035,length(vec2(lon-.7,lat-.35))));col=mix(col,vec3(.8),1.-smoothstep(.0,.02,length(vec2(lon+1.4,lat+.1))));}
if(uKind==10){float ln=1.-smoothstep(.0,.02,abs(sin(fbm(p*3.)*18.+lon*2.)));col=mix(col,vec3(.55,.33,.2),ln*.55);col=mix(col,vec3(.6,.42,.3),smoothstep(.55,.7,fbm(p*2.+4.))*.35);}
if(uKind==11){col=mix(col*.55,col*1.15,smoothstep(.45,.6,fbm(p*1.6+1.)));col=mix(col,vec3(.9,.9,.88),smoothstep(.75,.9,fbm(p*12.))*.4);}
if(uKind==12){float lead=smoothstep(-.25,.25,-vP.x);col=mix(vec3(.88,.86,.82),vec3(.16,.1,.07),lead);}
if(uKind==13){col=vec3(.95,.96,.98)*(.9+.1*fbm(p*6.));col=mix(col,vec3(.6,.75,.85),(1.-smoothstep(.0,.03,abs(sin(lon*2.)*.15+lat+.85)))*.6);}
if(uKind==14){col=mix(vec3(.85,.6,.3),vec3(.75,.5,.25),fbm(vec3(lat*4.,p.x*.5,p.z*.5))*.4);}
if(uType==2||uType==3){col*=.7+.3*pow(max(dot(n,V),0.),.45);}
if(uKind==9){float sp=smoothstep(.72,.8,fbm(p*6.));col=mix(col,vec3(.18,.1,.05),sp*.85);col=mix(col,vec3(.95,.93,.8),smoothstep(.7,.78,fbm(p*4.+9.))*.4);col=mix(col,vec3(.6,.35,.2),smoothstep(.75,.95,abs(lat))*.5);}
if(uType==1){vec3 Hh=normalize(L+V);glow+=vec3(1.,.9,.75)*pow(max(dot(n,Hh),0.),70.)*(1.-landG)*(1.-cloudG)*dif*.9;float tw=smoothstep(-.15,.0,nd)*(1.-smoothstep(.0,.2,nd));glow+=vec3(.9,.35,.15)*tw*.08;}
float fr=pow(1.-max(dot(n,V),0.),3.);
vec3 atm=uAtm*fr*uAtmK*smoothstep(-.25,.4,nd);
gl_FragColor=vec4(col*(dif*1.15+.018)+glow+atm,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
  const sunFrag = `#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uTime;varying vec3 vN;varying vec3 vW;varying vec3 vP;
${noise}
void main(){
#include <logdepthbuf_fragment>
vec3 p=vP*6.;float g=fbm(p+vec3(uTime*.05,uTime*.03,0.));float c=fbm(p*3.-vec3(0.,uTime*.08,0.));
vec3 V=normalize(cameraPosition-vW);float mu=max(dot(normalize(vN),V),0.);float limb=.35+.65*pow(mu,.5);
vec3 col=mix(vec3(1.,.42,.08),vec3(1.,.86,.55),g*.8+c*.4)*limb*2.2;
float ss=smoothstep(.74,.8,fbm(vP*3.+vec3(uTime*.004,0.,0.)))*(1.-smoothstep(.25,.55,abs(vP.y)));col*=1.-ss*.55;col=mix(col,col*vec3(1.,.8,.6),1.-mu);
gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
  const ringVert = `#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vW;varying float vR;
void main(){vR=length(position.xy);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;
#include <logdepthbuf_vertex>
}`;
  const ringFrag = `#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uSun;uniform vec4 uPlanet;uniform vec3 uCol;uniform float uAlpha;uniform int uSat;uniform vec3 uNorm;
varying vec3 vW;varying float vR;
${noise}
void main(){
#include <logdepthbuf_fragment>
float r=vR;float a;
if(uSat==1){a=0.;
 a+=smoothstep(1.239,1.26,r)*(1.-smoothstep(1.52,1.527,r))*.18;
 a+=smoothstep(1.525,1.54,r)*(1.-smoothstep(1.945,1.951,r))*(.75+.2*sin(r*180.));
 a+=smoothstep(2.027,2.035,r)*(1.-smoothstep(2.265,2.27,r))*.55*(1.-step(2.212,r)*step(r,2.218))*(1.-step(2.290,r)*step(r,2.297));
 a+=smoothstep(1.11,1.13,r)*(1.-smoothstep(1.23,1.239,r))*.04;
 a+=smoothstep(2.32,2.325,r)*(1.-smoothstep(2.33,2.335,r))*.5;
 a*=.75+.5*vn(vec3(r*300.,0.,0.));}
else if(uSat==2){a=0.;float w=.004;a+=(1.-smoothstep(0.,w,abs(r-1.650)))*.5+(1.-smoothstep(0.,w,abs(r-1.665)))*.5+(1.-smoothstep(0.,w,abs(r-1.679)))*.5+(1.-smoothstep(0.,w,abs(r-1.763)))*.6+(1.-smoothstep(0.,w,abs(r-1.800)))*.6+(1.-smoothstep(0.,w,abs(r-1.860)))*.4+(1.-smoothstep(0.,w,abs(r-1.878)))*.6+(1.-smoothstep(0.,w,abs(r-1.904)))*.6+(1.-smoothstep(0.,.012,abs(r-2.017)))*.95;a=min(a,1.)*.55;}
else if(uSat==3){a=(1.-smoothstep(0.,.04,abs(r-1.702)))*.12+(1.-smoothstep(0.,.005,abs(r-2.161)))*.5+smoothstep(2.16,2.17,r)*(1.-smoothstep(2.31,2.323,r))*.08+(1.-smoothstep(0.,.004,abs(r-2.323)))*.3;float adams=(1.-smoothstep(0.,.006,abs(r-2.556)));float th=atan(vW.z-uPlanet.z,vW.x-uPlanet.x);a+=adams*(.35+.65*smoothstep(.93,.99,cos(th*1.-0.6)));a*=.6;}
else if(uSat==4){a=exp(-pow((r-3.95)/1.1,2.))*.05+smoothstep(3.,3.3,r)*(1.-smoothstep(6.,8.,r))*.015;a+=(1.-smoothstep(0.,.03,abs(r-2.82)))*.05;}
else{a=uAlpha*(.6+.4*vn(vec3(r*80.,0.,0.)));}
vec3 L=normalize(uSun-vW);vec3 oc=uPlanet.xyz-vW;float t=dot(oc,L);float sh=1.;
if(t>0.){float d=length(oc-L*t);sh=smoothstep(uPlanet.w*.97,uPlanet.w*1.03,d);}
float lit=.35+.65*abs(dot(normalize(uNorm),L));
vec3 col=uCol*lit*sh*1.1+uCol*.02;if(uSat==1){col*=mix(vec3(.62,.6,.58),vec3(1.06,1.,.9),smoothstep(1.5,1.6,r));col*=1.-.12*smoothstep(2.03,2.27,r);}
gl_FragColor=vec4(col,a*uAlpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
  const glowFrag = `#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uCol;uniform float uK;varying vec3 vN;varying vec3 vW;varying vec3 vP;
void main(){
#include <logdepthbuf_fragment>
vec3 V=normalize(cameraPosition-vW);float f=1.-abs(dot(normalize(vN),V));
gl_FragColor=vec4(uCol*pow(f,2.5)*uK,1.);
}`;
  return { vert, planetFrag, sunFrag, ringVert, ringFrag, glowFrag };
})();
