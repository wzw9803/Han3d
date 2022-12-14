import { PrimitiveType } from './Const.js';
import { Triangle } from './Triangle.js';

const _mat4_1 = glMatrix.mat4.create();
const _vec2_1 = glMatrix.vec2.create();
const _vec2_2 = glMatrix.vec2.create();
const _vec2_3 = glMatrix.vec2.create();
const _vec2_4 = glMatrix.vec2.create();
const _vec2_5 = glMatrix.vec2.create();
const _vec2_6 = glMatrix.vec2.create();
const _vec2_7 = glMatrix.vec2.create();

const _vec3_1 = glMatrix.vec3.create();
const _vec3_2 = glMatrix.vec3.create();
const _vec3_3 = glMatrix.vec3.create();
const _box2_1 = [[Infinity, Infinity], [-Infinity, -Infinity]];	// [min, max]

class Rasterizer {

	constructor(drive) {
		this.drive = drive;
		this.pos_buf = new Map();
		this.ind_buf = new Map();
		this.col_buf = new Map();

		this.model = glMatrix.mat4.create();
		this.view = glMatrix.mat4.create();
		this.projection = glMatrix.mat4.create();

		this._nextId = 0;
	}

	getNextId() {
		return this._nextId++;
	}

	setPositions(positions) {
		const id = this.getNextId();
		this.pos_buf.set(id, positions);
		return id;
	}

	setIndices(indices) {
		const id = this.getNextId();
		this.ind_buf.set(id, indices);
		return id;
	}

	setColors(colors) {
		const id = this.getNextId();
		this.col_buf.set(id, colors);
		return id;
	}

	setModel(model) {
		this.model = model;
	}

	setView(view) {
		this.view = view;
	}

	setProjection(projection) {
		this.projection = projection;
	}

	toVec4(vec3, w) {
		vec3[3] = w;
		return vec3;
	}

	drawLine(begin, end) {
		const x1 = begin[0];
		const y1 = begin[1];
		const x2 = end[0];
		const y2 = end[1];

		const lineColor = [255, 0, 0, 255];

		let x, y, dx, dy, dx1, dy1, px, py, xe, ye, i;

		dx = x2 - x1;
		dy = y2 - y1;
		dx1 = Math.abs(dx);
		dy1 = Math.abs(dy);
		px = 2 * dy1 - dx1;
		py = 2 * dx1 - dy1;

		if (dy1 <= dx1) {
			if (dx >= 0) {
				x = x1;
				y = y1;
				xe = x2;
			} else {
				x = x2;
				y = y2;
				xe = x1;
			}

			const index = this.drive.getIndex(x, y);
			this.drive.setPixelColor(index, lineColor);
			for (let i = 0; x < xe; i++) {
				x = x + 1;
				if (px < 0) {
					px = px + 2 * dy1;
				} else {
					if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
						y = y + 1;
					} else {
						y = y - 1;
					}
					px = px + 2 * (dy1 - dx1);
				}
				const index = this.drive.getIndex(x, y);
				this.drive.setPixelColor(index, lineColor);
			}
		} else {
			if (dy >= 0) {
				x = x1;
				y = y1;
				ye = y2;
			} else {
				x = x2;
				y = y2;
				ye = y1;
			}
			const index = this.drive.getIndex(x, y);
			this.drive.setPixelColor(index, lineColor);
			for (i = 0; y < ye; i++) {
				y = y + 1;
				if (py <= 0) {
					py = py + 2 * dx1;
				} else {
					if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
						x = x + 1;
					} else {
						x = x - 1;
					}
					py = py + 2 * (dx1 - dy1);
				}
				const index = this.drive.getIndex(x, y);
				this.drive.setPixelColor(index, lineColor);
			}
		}
	}

	rasterizeWireframe(triangle) {
		this.drawLine(triangle.c, triangle.a);
		this.drawLine(triangle.c, triangle.b);
		this.drawLine(triangle.b, triangle.a);
	}

	// Screen space rasterization
	rasterizeTriangle(triangle) {
		const v = triangle.toVector4();

		// TODO : Find out the bounding box of current triangle.
		// iterate through the pixel and find if the current pixel is inside the triangle
		_box2_1[0][0] = _box2_1[0][1] = Infinity;
		_box2_1[1][0] = _box2_1[1][1] = -Infinity;
		for (let i = 0, l = v.length; i < l; i++) {
			const point = v[i];
			_box2_1[0][0] = Math.min(_box2_1[0][0], point[0]);
			_box2_1[0][1] = Math.min(_box2_1[0][1], point[1]);

			_box2_1[1][0] = Math.max(_box2_1[1][0], point[0]);
			_box2_1[1][1] = Math.max(_box2_1[1][1], point[1]);
		}

		for (let y = _box2_1[0][1]; y < _box2_1[1][1]; y++) {
			for (let x = _box2_1[0][0]; x < _box2_1[1][0]; x++) {
				if (!this.insideTriangle(x + 0.5, y + 0.5, v)) {
					continue;
				}

				const { alpha, beta, gamma } = this.computeBarycentric2D(x, y, v);
				const w_reciprocal = 1.0 / (alpha / v[0][3] + beta / v[1][3] + gamma / v[2][3]);
				let z_interpolated = alpha * v[0][2] / v[0][3] + beta * v[1][2] / v[1][3] + gamma * v[2][2] / v[2][3];
				z_interpolated *= w_reciprocal;

				const index = this.drive.getIndex(x, y);
				if (z_interpolated < this.drive.zBuffer[index]) {
					const color = this.interpolate(alpha, beta, gamma, triangle.colors);
					this.drive.zBuffer[index] = z_interpolated;
					this.drive.setPixelColor(index, color);
				}
			}
		}

		// If so, use the following code to get the interpolated z value.
		// auto[alpha, beta, gamma] = computeBarycentric2D(x, y, t.v);
		// float w_reciprocal = 1.0/(alpha / v[0].w() + beta / v[1].w() + gamma / v[2].w());
		// float z_interpolated = alpha * v[0].z() / v[0].w() + beta * v[1].z() / v[1].w() + gamma * v[2].z() / v[2].w();
		// z_interpolated *= w_reciprocal;

		// TODO : set the current pixel (use the set_pixel function) to the color of the triangle (use getColor function) if it should be painted.
	}

	interpolate(alpha, beta, gamma, value) {
		const color = [0, 0, 0, 0];
		color[0] = alpha * value[0][0] + beta * value[1][0] + gamma * value[2][0];
		color[1] = alpha * value[0][1] + beta * value[1][1] + gamma * value[2][1];
		color[2] = alpha * value[0][2] + beta * value[1][2] + gamma * value[2][2];
		color[3] = alpha * value[0][3] + beta * value[1][3] + gamma * value[2][3];

		return color;
	}

	computeBarycentric2D(x, y, v) {
		const gamma = (x * (v[0][1] - v[1][1]) + (v[1][0] - v[0][0]) * y + v[0][0] * v[1][1] - v[1][0] * v[0][1]) / (v[2][0] * (v[0][1] - v[1][1]) + (v[1][0] - v[0][0]) * v[2][1] + v[0][0] * v[1][1] - v[1][0] * v[0][1]);
		const alpha = (x * (v[1][1] - v[2][1]) + (v[2][0] - v[1][0]) * y + v[1][0] * v[2][1] - v[2][0] * v[1][1]) / (v[0][0] * (v[1][1] - v[2][1]) + (v[2][0] - v[1][0]) * v[0][1] + v[1][0] * v[2][1] - v[2][0] * v[1][1]);
		const beta = (x * (v[2][1] - v[0][1]) + (v[0][0] - v[2][0]) * y + v[2][0] * v[0][1] - v[0][0] * v[2][1]) / (v[1][0] * (v[2][1] - v[0][1]) + (v[0][0] - v[2][0]) * v[1][1] + v[2][0] * v[0][1] - v[0][0] * v[2][1]);
		return { alpha, beta, gamma };
	}

	insideTriangle(x, y, _v = []) {
		// TODO : Implement this function to check if the point (x, y) is inside the triangle represented by _v[0], _v[1], _v[2]

		glMatrix.vec2.set(_vec2_1, x, y);
		glMatrix.vec2.subtract(_vec2_2, _v[1], _v[0]);
		glMatrix.vec2.subtract(_vec2_5, _vec2_1, _v[0]);
		glMatrix.vec2.cross(_vec3_1, _vec2_2, _vec2_5);

		glMatrix.vec2.subtract(_vec2_3, _v[2], _v[1]);
		glMatrix.vec2.subtract(_vec2_6, _vec2_1, _v[1]);
		glMatrix.vec2.cross(_vec3_2, _vec2_3, _vec2_6);

		glMatrix.vec2.subtract(_vec2_4, _v[0], _v[2]);
		glMatrix.vec2.subtract(_vec2_7, _vec2_1, _v[2]);
		glMatrix.vec2.cross(_vec3_3, _vec2_4, _vec2_7);

		if ((_vec3_1[2] > 0 && _vec3_2[2] > 0 && _vec3_3[2] > 0)
		|| (_vec3_1[2] < 0 && _vec3_2[2] < 0 && _vec3_3[2] < 0)) {
			return true;
		}

		return false;
	}

	draw(pos_buf_id, ind_buf_id, col_buf_id, type) {
		if (type !== PrimitiveType.Triangle) {
			console.warn("Drawing primitives other than triangle is not implemented yet!");
		}

		const pos_buf = this.pos_buf.get(pos_buf_id);
		const ind_buf = this.ind_buf.get(ind_buf_id);
		const col_buf = this.col_buf.get(col_buf_id);

		const f1 = (50 - 0.1) / 2.0;	// (far - near) / 2
		const f2 = (50 + 0.1) / 2.0;	// (far + near) / 2
		const width = this.drive.width;
		const height = this.drive.height;

		const viewPortMatrix = glMatrix.mat4.set([],
			width / 2, 0, 0, 0,
			0, -height / 2, 0, 0,
			0, 0, f1, 0,
			0 + width / 2, 0 + height / 2,  f2, 1
		)

		const viewModelMatrix = glMatrix.mat4.multiply([], this.view, this.model);
		const mvp = glMatrix.mat4.multiply([], this.projection, viewModelMatrix);

		for (let i = 0, l = ind_buf.length; i < l; i++) {
			const index = ind_buf[i];
			const triangle = new Triangle();

			// ????????????????????????
			const positions = [
				glMatrix.vec4.transformMat4([], this.toVec4(pos_buf[index[0]], 1), mvp),
				glMatrix.vec4.transformMat4([], this.toVec4(pos_buf[index[1]], 1), mvp),
				glMatrix.vec4.transformMat4([], this.toVec4(pos_buf[index[2]], 1), mvp),
			]

			// ????????? NDC ?????????
			for (let j = 0, jl = positions.length; j < jl; j++) {
				const position = positions[j];
				position[0] = position[0] / position[3];
				position[1] = position[1] / position[3];
				position[2] = position[2] / position[3];
				position[3] = position[3] / position[3];
			}

			// ????????????
			for (let j = 0, jl = positions.length; j < jl; j++) {
				const position = positions[j];
				positions[j] = glMatrix.vec4.transformMat4([], position, viewPortMatrix);
			}

			for (let j = 0; j < 3; j++) {
				positions[j].pop();
				triangle.setVertex(j, positions[j]);
			}

			const col_x = col_buf[i * 3 + 0];
			const col_y = col_buf[i * 3 + 1];
			const col_z = col_buf[i * 3 + 2];

			triangle.setColor(0, col_x[0], col_x[1], col_x[2]);
			triangle.setColor(1, col_y[0], col_y[1], col_y[2]);
			triangle.setColor(2, col_z[0], col_z[1], col_z[2]);

			this.rasterizeTriangle(triangle);

			this.drive.draw();
		}
	}

}

export {
	Rasterizer
}