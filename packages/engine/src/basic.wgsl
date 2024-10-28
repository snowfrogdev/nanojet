struct Uniforms {
  color: vec4f,
  matrix: mat3x3f,
};

struct Vertex {
  @location(0) position: vec2f,
};

struct VSOutput {
  @builtin(position) position: vec4f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;

@vertex
fn vs(vert: Vertex) -> VSOutput {
  var vsOut: VSOutput;
  let position = vec3f(vert.position, 1.0);
  vsOut.position = vec4f((uni.matrix * position).xy, 0.0, 1.0);
  return vsOut;
}

@fragment
fn fs(vsOut: VSOutput) -> @location(0) vec4f {
  return uni.color;
}
