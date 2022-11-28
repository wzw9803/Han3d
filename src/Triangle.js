class Triangle {

	constructor() {
		this.positions = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
		this.colors = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
		this.tex_coords = [[0, 0], [0, 0], [0, 0]];
		this.normals = [];
	}

	get a() {
		return this.positions[0];
	}

	get b() {
		return this.positions[1];
	}

	get c() {
		return this.positions[2];
	}

	setVertex(index, position) {
		this.positions[index] = position;
	}

	setNormal(index, normal) {
		this.normals[index] = normal;
	}

	setColor(index, r, g, b) {
		if ((r < 0) || (r > 255) || (g < 0) || (g > 255) || (b < 0) ||
        (b > 255)) {
			console.warn("Invalid color values");
		}

		this.colors[index] = [r / 255, g / 255, b / 255];
	}

	setTexcoord(index, s, t) {
		this.tex_coords[index] = [s, t];
	}

	toVector4() {
		const res = [];
		for (let i = 0, l = this.positions.length; i < l; i++) {
			res.push([...this.positions, 1]);
		}

		return res;
	}

}

export {
	Triangle
}