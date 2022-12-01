import { PrimitiveType } from "../../src/Const.js";
import { Rasterizer } from "../../src/Rasterizer.js";
import { CanvasDrive } from "../../src/CanvasDrive.js";

const getViewMatrix = (eyePosition) => {
	// TODO: Implement this function
	// Create the view matrix for eye position.
	// Then return it.

	const view = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];

	return view;
}

const getModelMatrix = (angle) => {
	// TODO: Implement this function
	// Create the model matrix for rotating the triangle around the Z axis.
	// Then return it.

	const model = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];

	return model;
}

const getProjectionMatrix = (eyeFov, aspectRatio, zNear, zFar) => {
	// Students will implement this function

	// TODO: Implement this function
	// Create the projection matrix for the given parameters.
	// Then return it.

	const projection = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];

	return projection;
}

const renderer = () => {
	let angle = 0, eye_pos = [0, 0, 5];
	let rasterizer = null;
	let posId, indId;

	const canvas = document.createElement('canvas');
	document.body.appendChild(canvas);

	return {
		setAngle: (a) => {
			angle = a;
		},
		setEye: (eye) => {
			eye_pos = eye;
		},
		init: (width = 512, height = 512) => {
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext('2d');
			const drive = new CanvasDrive(context, width, height);
			rasterizer = new Rasterizer(drive);

			const positions = [[2, 0, -2], [0, 2, -2], [-2, 0, -2]];
			const indices = [[0, 1, 2]];

			posId = rasterizer.setPositions(positions);
			indId = rasterizer.setIndices(indices);
		},
		setCearColor: (color = [255, 0, 0, 255]) => {
			rasterizer.drive.setClearColor(color);
		},
		render: () => {
			rasterizer.drive.clear();

			rasterizer.setModel(getModelMatrix(angle));
			rasterizer.setView(getViewMatrix(eye_pos));
			rasterizer.setProjection(getProjectionMatrix(45, 1, 0.1, 50));

			rasterizer.draw(posId, indId, PrimitiveType.Triangle);
		}
	}
}

export {
	renderer
}