import { PrimitiveType } from './Const.js';
import { Triangle } from './Triangle.js'
// import { glMatrix.mat4, glMatrix.vec4 } from 'gl-matrix';

const _mat4_1 = glMatrix.mat4.create();
const _mat4_2 = glMatrix.mat4.create();

class Rasterizer {

	constructor(drive) {
		this.drive = drive;
		this.pos_buf = new Map();
		this.ind_buf = new Map();

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

	draw(pos_buf_id, ind_buf_id, type) {
		if (type !== PrimitiveType.Triangle) {
			console.warn("Drawing primitives other than triangle is not implemented yet!");
		}

		const pos_buf = this.pos_buf.get(pos_buf_id);
		const ind_buf = this.ind_buf.get(ind_buf_id);

		const f1 = (100 - 0.1) / 2.0;
		const f2 = (100 + 0.1) / 2.0;
		const width = this.drive.width;
		const height = this.drive.height;

		const mvp = glMatrix.mat4.multiply(_mat4_2, this.projection, glMatrix.mat4.multiply(_mat4_1, this.view, this.model));

		for (let i = 0, l = ind_buf.length; i < l; i++) {
			const index = ind_buf[i];
			const triangle = new Triangle();

			const positions = [
				glMatrix.vec4.transformMat4([], this.toVec4(pos_buf[index[0]], 1), mvp),
				glMatrix.vec4.transformMat4([], this.toVec4(pos_buf[index[1]], 1), mvp),
				glMatrix.vec4.transformMat4([], this.toVec4(pos_buf[index[2]], 1), mvp),
			]

			for (let j = 0, jl = positions.length; j < jl; j++) {
				const position = positions[j];
				position[0] = position[0] / position[3];
				position[1] = position[1] / position[3];
				position[2] = position[2] / position[3];
				position[3] = position[3] / position[3];
			}

			for (let j = 0, jl = positions.length; j < jl; j++) {
				const position = positions[j];
				position[0] = 0.5 * width * (position[0] + 1.0);
				position[1] = 0.5 * height * (position[1] + 1.0);
				position[2] = position[2] * f1 + f2;
			}

			triangle.setVertex(0, [positions[0][0], positions[0][1], positions[0][2]]);
			triangle.setVertex(1, [positions[1][0], positions[1][1], positions[1][2]]);
			triangle.setVertex(2, [positions[2][0], positions[2][1], positions[2][2]]);

			triangle.setColor(0, 255,  0,  0);
			triangle.setColor(1, 0, 255,  0);
			triangle.setColor(2, 0,  0, 255);

			this.rasterizeWireframe(triangle);

			this.drive.draw();
		}
	}

}

export {
	Rasterizer
}