"use client";

import { useCanvasLoop, type Palette } from "./useCanvasLoop";

/**
 * A slow, domain-warped gradient in the audit's accent: one fragment shader,
 * no libraries, a few kilobytes. Renders at reduced resolution (gradients
 * don't need pixels) and is scaled up by CSS.
 */
const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision mediump float;
uniform vec2 r;uniform float t;uniform vec3 live;uniform vec3 page;uniform float dark;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r.xy;vec2 p=uv*vec2(r.x/r.y,1.)*1.6;
  float s=t*.045;
  vec2 q=vec2(fbm(p+vec2(0.,s)),fbm(p+vec2(5.2,1.3)-s));
  vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+s*1.4),fbm(p+3.*q+vec2(8.3,2.8)-s));
  float f=fbm(p+2.6*w);
  // Light gathers to the right, so the headline on the left stays calm.
  float lean=smoothstep(.05,.95,uv.x)*.85+.15;
  float glow=smoothstep(.35,.95,f)*lean;
  float band=smoothstep(.55,.9,w.y)*lean*.6;
  vec3 deep=mix(live*.55,live,.5+.5*sin(f*3.+s));
  vec3 col=mix(page,deep,glow*(dark>.5?.85:.55));
  col=mix(col,mix(page,vec3(1.),dark>.5?.06:.5),band*(dark>.5?.25:.35));
  float vig=smoothstep(1.2,.3,length(uv-vec2(.7,.55)));
  col=mix(page,col,vig);
  gl_FragColor=vec4(col,1.);
}`;

export default function ShaderHero() {
  const ref = useCanvasLoop((canvas, initial) => {
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, powerPreference: "low-power" });
    if (!gl) return null;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = {
      r: gl.getUniformLocation(prog, "r"),
      t: gl.getUniformLocation(prog, "t"),
      live: gl.getUniformLocation(prog, "live"),
      page: gl.getUniformLocation(prog, "page"),
      dark: gl.getUniformLocation(prog, "dark"),
    };
    const setPalette = (p: Palette) => {
      gl.uniform3fv(u.live, p.live);
      gl.uniform3fv(u.page, p.page);
      gl.uniform1f(u.dark, p.dark ? 1 : 0);
    };
    setPalette(initial);
    return {
      resize: (w, h, dpr) => {
        // Half resolution: the gradient is soft, and the GPU stays cool.
        const scale = dpr * 0.5;
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(u.r, canvas.width, canvas.height);
      },
      frame: (t) => {
        gl.uniform1f(u.t, t + 12);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      palette: setPalette,
      dispose: () => gl.getExtension("WEBGL_lose_context")?.loseContext(),
    };
  });

  return <canvas ref={ref} aria-hidden className="absolute inset-0 size-full opacity-0 transition-opacity duration-[1400ms] data-[ready]:opacity-100" />;
}
