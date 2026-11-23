// Ashima / Stefan Gustavson simplex noise 3D (MIT)
const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

export const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uProgress;
uniform float uSize;
uniform float uPixelRatio;
uniform float uViewH;
uniform vec3 uMouse;
uniform float uMouseStrength;
uniform float uIntro;

attribute vec3 aP0;
attribute vec3 aP1;
attribute vec3 aP2;
attribute vec3 aP3;
attribute vec3 aP4;
attribute vec4 aAccA;
attribute float aAccB;
attribute vec4 aRand;

varying float vAccent;
varying float vAlpha;

${noise}

mat3 rotY(float a){ float c=cos(a); float s=sin(a); return mat3(c,0.0,-s, 0.0,1.0,0.0, s,0.0,c); }

vec3 shapePos(int i){
  if(i==0) return aP0;
  if(i==1) return rotY(uTime*0.05) * aP1;
  if(i==2) return rotY(uTime*0.16) * aP2;
  if(i==3) return aP3;
  return aP4;
}
float shapeAcc(int i){
  if(i==0) return aAccA.x;
  if(i==1) return aAccA.y;
  if(i==2) return aAccA.z;
  if(i==3) return aAccA.w;
  return aAccB;
}

void main(){
  float p = clamp(uProgress, 0.0, 4.0);
  float fi = min(floor(p), 3.0);
  float f = p - fi;
  float delay = aRand.x * 0.42;
  float t = smoothstep(delay, delay + 0.58, f);
  int i = int(fi);

  vec3 pos = mix(shapePos(i), shapePos(i + 1), t);
  float mid = sin(t * 3.14159265);
  float w1 = (i == 0) ? t : ((i == 1) ? 1.0 - t : 0.0);

  // entrée : les points tombent du chaos vers la forme
  float intro = smoothstep(aRand.x * 0.6, aRand.x * 0.6 + 0.4, uIntro);
  vec3 chaos = (aRand.xyz - 0.5) * vec3(26.0, 16.0, 14.0);
  pos = mix(chaos, pos, intro);

  float amp = 0.035 + mid * 1.15 + w1 * 0.3 + (1.0 - intro) * 0.6;
  vec3 q = pos * 0.33 + vec3(0.0, uTime * 0.07, uTime * 0.03);
  pos += vec3(snoise(q), snoise(q + 19.1), snoise(q + 41.7)) * amp;

  vec4 world = modelMatrix * vec4(pos, 1.0);
  vec2 dm = world.xy - uMouse.xy;
  float dl = length(dm);
  float push = smoothstep(1.5, 0.0, dl) * uMouseStrength;
  world.xy += (dm / max(dl, 0.0001)) * push * 0.6;
  world.z += push * 0.5;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;

  float acc = mix(shapeAcc(i), shapeAcc(i + 1), t);
  vAccent = acc;
  float sz = uSize * (0.5 + aRand.y * 1.0) * (1.0 + acc * 0.55) * (1.0 + mid * 0.35);
  gl_PointSize = sz * uPixelRatio * (uViewH / 900.0) * (11.0 / max(-mv.z, 0.5));

  float tw = 0.72 + 0.28 * sin(uTime * 1.6 + aRand.w * 31.0);
  vAlpha = (0.42 + aRand.z * 0.58) * tw * (0.35 + 0.65 * intro);
}
`;

export const fragmentShader = /* glsl */ `
uniform vec3 uColA;
uniform vec3 uColB;
uniform float uOpacity;
varying float vAccent;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 1.6);
  vec3 col = mix(uColA, uColB, vAccent);
  gl_FragColor = vec4(col, a * vAlpha * uOpacity);
}
`;
