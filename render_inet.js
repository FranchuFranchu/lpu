
class PositionData {
	constructor() {
		this.x = undefined;
		this.y = undefined;
		this.new_x = undefined;
		this.new_y = undefined;
		this.old_x = undefined;
		this.old_y = undefined;
	}
	tick(val) {
		this.x += (this.new_x - this.x) / 10;
		this.y += (this.new_y - this.y) / 10;
	}
	set_x(val) {
		if (this.new_x === undefined) {
			this.new_x = val;
		}
		this.old_x = this.new_x
		this.x = this.old_x
		this.new_x = val
	}
	set_y(val) {
		if (this.new_y === undefined) {
			this.new_y = val;
		}
		this.old_y = this.new_y
		this.y = this.old_y
		this.new_y = val
	}
	set_xy(x, y) {
		this.set_x(x)
		this.set_y(y)
	}
	copy() {
		return Object.assign(new PositionData(), this)
	}
}
function init_position_data(v, k) {
	if (v[k] === undefined) {
		v[k] = new PositionData()
	}
}

function position_inet(memory) {
	let i = 1;
	let y = 0;
	let principal_port_y = {}
	for (cell of memory) {
		if (cell.is_filled()) {
			if (cell.slot.render_meta == undefined) {
				cell.slot.render_meta = new PositionData()
			}
			let rm = cell.slot.render_meta
			rm.set_x(i)
			
			let wi = cell.slot.ports[0].wire_id;
			if (principal_port_y[wi]) {
				rm.set_y(principal_port_y[wi])
			} else {
				rm.set_y(y)
				principal_port_y[wi] = y;
				y++;
			}
		}
		i++;
	}
}

function draw_node(ctx, node) {
	ctx.lineWidth = 0.1;
	let head_x = 0.2;
	let tail_x = 0.8;
	if (node.ports[0].is_right()) {
		head_x = 0.8;
		tail_x = 0.2;
	}
	let top_y = 0.2;
	let bot_y = 0.8;
	if (node.type === LPU.nodes.CONSTRUCT || node.type === LPU.nodes.DUPLICATE) {
		ctx.beginPath();
		ctx.moveTo(tail_x, top_y);
		ctx.lineTo(head_x, 0.5);
		ctx.lineTo(tail_x, bot_y);
		ctx.closePath();
		node.ports[0].render_meta.set_xy(head_x, 0.5)
		node.ports[1].render_meta.set_xy(tail_x, 0.3)
		node.ports[2].render_meta.set_xy(tail_x, 0.7)
		if (node.type === LPU.nodes.CONSTRUCT) {
			ctx.fill();
		}
		if (node.type === LPU.nodes.DUPLICATE) {
			ctx.stroke();
		}
	}
	if (node.type === LPU.nodes.ERASE) {
        ctx.beginPath();
        ctx.arc(0.5, 0.5, 0.5);
        ctx.stroke()
		node.ports[0].render_meta.set_xy(head_x, 0.5)
	}
	if (node.type === LPU.nodes.RELAY) {
		ctx.beginPath();
		ctx.moveTo(0, 0.5);
		ctx.lineTo(0, 0.7);
		ctx.lineTo(1, 0.7);
		ctx.lineTo(1, 0.5);
		ctx.closePath();
		ctx.fill();
		node.ports[0].render_meta.set_xy(head_x, 0.5)
		node.ports[1].render_meta.set_xy(tail_x, 0.5)
	}
}

function render_inet(memory) {
	let canvas = document.getElementById("main-canvas")
	let ctx = canvas.getContext("2d")
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.lineCap = "round"
	ctx.lineJoin = "round"
	for (cell of memory) {
		if (cell.is_filled()) {
			ctx.setTransform(100, 1, 1, 100, cell.slot.render_meta.x * 100, cell.slot.render_meta.y * 100)
			draw_node(ctx, cell.slot)
		}
	}
	// Now, draw wires.
	let wire_map = {}
	for (cell of memory) {
		if (cell.is_filled()) {
			ctx.setTransform(100, 1, 1, 100, cell.slot.render_meta.x * 100, cell.slot.render_meta.y * 100)
			n = 0;
			for (port of cell.slot.ports) {
				let x = port.render_meta.new_x + cell.slot.render_meta.x
				let y = port.render_meta.new_y + cell.slot.render_meta.y
				if (wire_map[port.wire_id] == undefined) {
					wire_map[port.wire_id] = []
				}
				wire_map[port.wire_id].push({x: x, y: y, pright: cell.slot.ports[0].is_right(), right: port.is_right(), n: n})
				n += 1;
			}
		}
	}
	ctx.setTransform(100, 1, 1, 100, 0, 0)
	for (k of Object.keys(wire_map)) {
		let v = wire_map[k]
		if (v.length === 1) {
			v[1] = {x: 0, y: Math.floor(v[0].y), right: true, n: 0, pright: true}
		}
		ctx.beginPath();
		let off_0 = ((v[0].pright ^ v[0].n != 0) ? .2 : -.2) * v[0].n;
		let off_1 = ((v[1].pright ^ v[1].n != 0) ? .2 : -.2) * v[1].n;
		let use_y;
		if (v[1].n == 0) {
			use_y = v[1].y
		} else if (v[0].n == 0) {
			use_y = v[0].y
		} else if (v[0].pright == v[1].pright) {
			if ((v[0].x < v[1].x) ^ (v[0].right)) {
				use_y = v[0].y
			} else {
				use_y = v[1].y
			}
		} else {
			use_y = v[0].y
		}
		if (v[0].n == 0 && v[1].n == 0 && v[1].x != 0) {
			ctx.strokeStyle = "red"
		}
		ctx.moveTo(v[0].x, v[0].y);
		ctx.lineTo(v[0].x + off_0, v[0].y);
		ctx.lineTo(v[0].x + off_0, use_y);
		ctx.lineTo(v[1].x + off_1, use_y);
		ctx.lineTo(v[1].x + off_1, v[1].y);
		ctx.lineTo(v[1].x, v[1].y);
		ctx.stroke();
		ctx.strokeStyle = "black"
	}
}

function tick_inet_pos(memory) {
	for (cell of memory) {
		if (cell.is_filled()) {
			cell.slot.render_meta.tick()
			for (port of cell.slot.ports) {
				port.render_meta.tick()
			}
		}
	}
}