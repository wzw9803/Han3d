import { PrimitiveType } from './Const.js';
import { Triangle } from './Triangle.js'

const _mat4_1 = glMatrix.mat4.create();
const _mat4_2 = glMatrix.mat4.create();

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
		let v = triangle.toVector4();

		// TODO : Find out the bounding box of current triangle.
		// iterate through the pixel and find if the current pixel is inside the triangle

		// If so, use the following code to get the interpolated z value.
		// auto[alpha, beta, gamma] = computeBarycentric2D(x, y, t.v);
		// float w_reciprocal = 1.0/(alpha / v[0].w() + beta / v[1].w() + gamma / v[2].w());
		// float z_interpolated = alpha * v[0].z() / v[0].w() + beta * v[1].z() / v[1].w() + gamma * v[2].z() / v[2].w();
		// z_interpolated *= w_reciprocal;

		// TODO : set the current pixel (use the set_pixel function) to the color of the triangle (use getColor function) if it should be painted.
	}

	insideTriangle(x, y, _v = []) {
		// TODO : Implement this function to check if the point (x, y) is inside the triangle represented by _v[0], _v[1], _v[2]
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

			// 变换到剪裁空间下
			const positions = [
				glMatrix.vec4.transformMat4([], this.toVec4(pos_buf[index[0]], 1), mvp),
				glMatrix.vec4.transformMat4([], this.toVec4(pos_buf[index[1]], 1), mvp),
				glMatrix.vec4.transformMat4([], this.toVec4(pos_buf[index[2]], 1), mvp),
			]

			// 变换到 NDC 空间下
			for (let j = 0, jl = positions.length; j < jl; j++) {
				const position = positions[j];
				position[0] = position[0] / position[3];
				position[1] = position[1] / position[3];
				position[2] = position[2] / position[3];
				position[3] = position[3] / position[3];
			}

			// 视口变换
			for (let j = 0, jl = positions.length; j < jl; j++) {
				const position = positions[j];
				positions[j] = glMatrix.vec4.transformMat4([], position, viewPortMatrix);
			}

			for (let j = 0; j < 3; j++) {
				triangle.setVertex(j, positions[j]);
			}

			let col_x = col_buf[i + 0];
			let col_y = col_buf[i + 1];
			let col_z = col_buf[i + 2];

			triangle.setColor(0, col_x[0], col_x[1], col_x[2]);
			triangle.setColor(1, col_y[0], col_y[1], col_y[2]);
			triangle.setColor(2, col_z[0], col_z[1], col_z[2]);

			this.rasterizeWireframe(triangle);

			this.drive.draw();
		}
	}

}

export {
	Rasterizer
}