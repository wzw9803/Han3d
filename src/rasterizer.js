import { PrimitiveType } from './Const.js';
import { mat4 } from 'gl-matrix';

const _mat4_1 = mat4.create();
const _mat4_2 = mat4.create();

class Rasterizer {

	constructor(dirive) {
		this.dirive = dirive;
		this.pos_buf = new Map();
		this.ind_buf = new Map();

		this.model = mat4.create();
		this.view = mat4.create();
		this.projection = mat4.create();

		this._nextId = 0;
	}

	getNextId() {
		return this._nextId++;
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

	draw(pos_buf_id, ind_buf_id, type) {
		if (type !== PrimitiveType.Triangle) {
			console.warn("Drawing primitives other than triangle is not implemented yet!");
		}

		const pos_buf = this.pos_buf.get(pos_buf_id);
		const ind_buf = this.ind_buf.get(ind_buf_id);

		const _mat4_2 = mat4.multiply(_mat4_2, this.projection, mat4.multiply(_mat4_1, this.view, this.model));

		for (let i = 0, l = ind_buf.length; i < l; i++) {

		}
	}

}