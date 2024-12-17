

struct VSInput {
  @location(0) position: vec2f,
  @location(1) uv: vec2f,
  @location(2) color: vec4f,
  @location(3) matrix_row0: vec3f,
  @location(4) matrix_row1: vec3f,
  @location(5) matrix_row2: vec3f,
};

struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) color: vec4f,
};

@vertex
fn vs(input: VSInput) -> VSOutput {
  var vsOut: VSOutput;
  let matrix = mat3x3f(input.matrix_row0, input.matrix_row1, input.matrix_row2);
  let position = vec3f(input.position, 1.0);
  vsOut.position = vec4f((matrix * position).xy, 0.0, 1.0);
  vsOut.uv = input.uv;
  vsOut.color = input.color;
  return vsOut;
}

@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var myTexture: texture_2d<f32>;

@fragment
fn fs(input: VSOutput) -> @location(0) vec4f {
  let textColor = textureSample(myTexture, mySampler, input.uv);
  return input.color * textColor;
}
