
LPU = {
	memory: [],
	index: 0,
}

LPU.generate_idx = function() {
	LPU.index = LPU.index + 1
	return LPU.index
}

class Port {
	constructor(wire_id, is_right) {
		this.wire_id = wire_id
		this._is_right = is_right
		this.render_meta = new PositionData()
	}
	flip_direction() {
		this._is_right = !this._is_right
	}
	to_string() {
		let s = ("" + this.wire_id).slice(0, 2).padStart(2,'0')
		if (this.is_right()) {
			s = ">" + s
		} else {
			s = "<" + s
		}
		return s
	}
	is_right() {
		return this._is_right
	}
	is_left() {
		return !this._is_right
	}
}

LPU.nodes = {
	ERASE: {sym: "e"},
	RELAY: {sym: "r"},
	DUPLICATE: {sym: "d"},
	CONSTRUCT: {sym: "c"},
}

class Node {
	constructor(type, ports) {
		this.type = type
		this.ports = ports
	}
	get_ports_with_id(id) {
		return this.ports.filter((x) => x.wire_id == id)
	}
	to_string() {
		let s = this.type.sym;
		for (let i of this.ports) {
			s += i.to_string()
		}
		return s
	}
	principal_port() {
		return this.ports[0]
	}
}

function array_eq(a1, a2) {
	var i = a1.length;
	while (i--) {
	    if (a1[i] != a2[i]) return false;
	}
	return true
}

class MemoryCell {
	constructor() {
		this.slot = null
	}
	is_filled() {
		return this.slot != null
	}
	to_string() {
		if (this.slot == null) {
			return ".........\t"
		} else {
			return this.slot.to_string() + "\t"
		}
	}
	set_from(other) {
		this.slot = other
	}
	move_from(other) {
		this.slot = other.slot
		other.slot = null
	}
	swap_from(other) {
		let b = other.slot
		other.slot = this.slot
		this.slot = b
	}
	smart_swap(other) {
		this.swap_from(other)
		flip_cells(this.slot, other.slot)
	}
	make_empty() {
		this.slot = null
	}
}

function interact(left, right, nodes) {
	let ln = left.slot
	let rn = right.slot
	INTERACTIONS = [
		[LPU.nodes.ERASE, LPU.nodes.ERASE, () => {
			left.make_empty()
			right.make_empty()
		}],
		[LPU.nodes.CONSTRUCT, LPU.nodes.DUPLICATE, () => {
			let a1 = LPU.generate_idx()
			let a2 = LPU.generate_idx()
			let b1 = LPU.generate_idx()
			let b2 = LPU.generate_idx()
			nodes[0].set_from(new Node(LPU.nodes.DUPLICATE, [
				ln.ports[1],
				new Port(a1, true),
				new Port(a2, true),
			]))
			nodes[1].set_from(new Node(LPU.nodes.DUPLICATE, [
				ln.ports[2],
				new Port(b1, true),
				new Port(b2, true),
			]))
			nodes[2].set_from(new Node(LPU.nodes.CONSTRUCT, [
				rn.ports[1],
				new Port(a1, false),
				new Port(b1, false),
			]))
			nodes[3].set_from(new Node(LPU.nodes.CONSTRUCT, [
				rn.ports[2],
				new Port(a2, false),
				new Port(b2, false),
			]))
			nodes[0].slot.render_meta = ln.render_meta.copy()
			nodes[1].slot.render_meta = ln.render_meta.copy()
			nodes[2].slot.render_meta = rn.render_meta.copy()
			nodes[3].slot.render_meta = rn.render_meta.copy()
		}],
		[LPU.nodes.DUPLICATE, LPU.nodes.CONSTRUCT, () => {
			if (nodes.filter((x) => x.is_filled()).length > 2) {
				console.warn("Too full to reduce!")
				return;
			}
			let a1 = LPU.generate_idx()
			let a2 = LPU.generate_idx()
			let b1 = LPU.generate_idx()
			let b2 = LPU.generate_idx()
			nodes[0].set_from(new Node(LPU.nodes.CONSTRUCT, [
				ln.ports[1],
				new Port(a1, true),
				new Port(a2, true),
			]))
			nodes[1].set_from(new Node(LPU.nodes.CONSTRUCT, [
				ln.ports[2],
				new Port(b1, true),
				new Port(b2, true),
			]))
			nodes[2].set_from(new Node(LPU.nodes.DUPLICATE, [
				rn.ports[1],
				new Port(a1, false),
				new Port(b1, false),
			]))
			nodes[3].set_from(new Node(LPU.nodes.DUPLICATE, [
				rn.ports[2],
				new Port(a2, false),
				new Port(b2, false),
			]))
			nodes[0].slot.render_meta = ln.render_meta.copy()
			nodes[1].slot.render_meta = ln.render_meta.copy()
			nodes[2].slot.render_meta = rn.render_meta.copy()
			nodes[3].slot.render_meta = rn.render_meta.copy()
		}],
		[LPU.nodes.ERASE, LPU.nodes.CONSTRUCT, () => {
			left.set_from(new Node(LPU.nodes.ERASE, [
				rn.ports[1]
			]))
			right.set_from(new Node(LPU.nodes.ERASE, [
				rn.ports[2]
			]))
			left.slot.render_meta = ln.render_meta.copy()
			right.slot.render_meta = rn.render_meta.copy()
		}],
		[LPU.nodes.CONSTRUCT, LPU.nodes.ERASE, () => {
			left.set_from(new Node(LPU.nodes.ERASE, [
				ln.ports[1]
			]))
			right.set_from(new Node(LPU.nodes.ERASE, [
				ln.ports[2]
			]))
			left.slot.render_meta = ln.render_meta.copy()
			right.slot.render_meta = rn.render_meta.copy()
		}],
		[LPU.nodes.ERASE, LPU.nodes.DUPLICATE, () => {
			left.set_from(new Node(LPU.nodes.ERASE, [
				rn.ports[1]
			]))
			right.set_from(new Node(LPU.nodes.ERASE, [
				rn.ports[2]
			]))
			left.slot.render_meta = ln.render_meta.copy()
			right.slot.render_meta = rn.render_meta.copy()
		}],
		[LPU.nodes.DUPLICATE, LPU.nodes.ERASE, () => {
			left.set_from(new Node(LPU.nodes.ERASE, [
				ln.ports[1]
			]))
			right.set_from(new Node(LPU.nodes.ERASE, [
				ln.ports[2]
			]))
			left.slot.render_meta = ln.render_meta.copy()
			right.slot.render_meta = rn.render_meta.copy()
		}],
		[LPU.nodes.DUPLICATE, LPU.nodes.DUPLICATE, () => {
			left.set_from(new Node(LPU.nodes.RELAY, [
				ln.ports[1],
				rn.ports[1]
			]))
			right.set_from(new Node(LPU.nodes.RELAY, [
				ln.ports[2],
				rn.ports[2],
			]))
			left.slot.render_meta = ln.render_meta.copy()
			right.slot.render_meta = rn.render_meta.copy()
		}],
		[LPU.nodes.CONSTRUCT, LPU.nodes.CONSTRUCT, () => {
			left.set_from(new Node(LPU.nodes.RELAY, [
				ln.ports[1],
				rn.ports[2]
			]))
			right.set_from(new Node(LPU.nodes.RELAY, [
				ln.ports[2],
				rn.ports[1],
			]))
			left.slot.render_meta = ln.render_meta.copy()
			right.slot.render_meta = rn.render_meta.copy()
		}],
		["any", LPU.nodes.RELAY, () => {
			ln.ports[0] = rn.ports[1]
			right.set_from(null)
		}],
		[LPU.nodes.RELAY, "any", () => {
			rn.ports[0] = ln.ports[1]
			left.set_from(null)
		}]
	]
	
	function matches(pat, t) {
		return (pat == "any" || pat == t);
	}
	
	for ([a, b, c] of INTERACTIONS) {
		if (matches(a, left.slot.type) && matches(b, right.slot.type)) {
			console.log("INTERACT", a.sym, b.sym)
			document.getElementById("pre").innerText += "\r\nINTERACT" + a.sym + b.sym
			c()
			return;
		}
	}
	console.log("no match", left.slot.type, right.slot.type)
}

// 001=>010, 010=>010, 100=>100, 011=>011, 101=>101, 110=>101
function adjust_cells(nodes) {
	b = nodes.map((x) => x.is_filled())
	if (array_eq(b, [0, 0, 1])) {
		nodes[1].move_from(nodes[2])
	} else if (array_eq(b, [1, 1, 0])) {
		nodes[2].move_from(nodes[1])
	}
}

function flip_cells(left, right) {
	with_id = {}
	for (x of right.ports) {
		with_id[x.wire_id] = x
	}
	for (x of left.ports) {
		if (with_id[x.wire_id] !== undefined) {
			x.flip_direction()
			with_id[x.wire_id].flip_direction()
		}
	}
}

function tick_cells(nodes) {
	let filled_nodes = nodes.filter((x) => x.is_filled())
	
	if (filled_nodes.length == 0) {
		return;
	}
	if (filled_nodes.length == 1) {
		return;
	}
	if (filled_nodes.length > 2) {
		console.warn("Too full!")
		return;
	}
	let left, right;
	left = filled_nodes[0]
	right = filled_nodes[1]
	
	if (left.is_filled() && right.is_filled()) {
		if (left.slot.principal_port().wire_id == right.slot.principal_port().wire_id ) {
			console.log("Interact!")
			interact(left, right, nodes)
			
		} else if (left.slot.principal_port().is_right() && right.slot.principal_port().is_left()) {
		 	// We have not interacted, so swap the nodes
			left.smart_swap(right)
		}
		// Otherwise, both face the same direction
		// We can't do anything there.
	}
}

LPU.tick_once_move = function() {
	for (let j = 0; j < 3; j++) {
		for (let i = 0; i < LPU.memory.length / 3 - 3; i++) {
			let a = LPU.memory[(i * 3 + j) % LPU.memory.length]
			let b = LPU.memory[(i * 3 + j + 1) % LPU.memory.length]
			let c = LPU.memory[(i * 3 + j + 2) % LPU.memory.length]
			adjust_cells([a, b, c])
		}
	}
}

LPU.tick_once_rew = function() {
	for (let j = 0; j < 4; j++) {
		for (let i = 0; i < LPU.memory.length / 4 - 4; i++) {
			let a = LPU.memory[(i * 4 + j) % LPU.memory.length]
			let b = LPU.memory[(i * 4 + j + 1) % LPU.memory.length]
			let c = LPU.memory[(i * 4 + j + 2) % LPU.memory.length]
			let d = LPU.memory[(i * 4 + j + 3) % LPU.memory.length]
			tick_cells([a, b, c, d])
		}
	}
}

LPU.tick_once = function() {
}
