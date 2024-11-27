

struct VSInput {
  @location(0) position: vec2f,
  @location(1) color: vec4f,
  @location(2) matrix_row0: vec3f,
  @location(3) matrix_row1: vec3f,
  @location(4) matrix_row2: vec3f,
};

struct VSOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@vertex
fn vs(input: VSInput) -> VSOutput {
  var vsOut: VSOutput;
  let matrix = mat3x3f(input.matrix_row0, input.matrix_row1, input.matrix_row2);
  let position = vec3f(input.position, 1.0);
  vsOut.position = vec4f((matrix * position).xy, 0.0, 1.0);
  vsOut.color = input.color;
  return vsOut;
}

@fragment
fn fs(input: VSOutput) -> @location(0) vec4f {
  return input.color;
}
