

LPU.print = function() {
	let s = ""
	for (x of LPU.memory.map((x) => x.to_string())) {
		s += x
	}
	document.getElementById("pre").innerText += "\r\n\r\n" + s
}

function load_nonterminating() {
	LPU.memory[0].slot = new Node(LPU.nodes.ERASE, [new Port("e1", true)])
	LPU.memory[1].slot = new Node(LPU.nodes.CONSTRUCT, [new Port("p1", true), new Port("e1", false), new Port("a1", true)])
	LPU.memory[2].slot = new Node(LPU.nodes.DUPLICATE, [new Port("p1", false), new Port("a1", false), new Port("e2", true)])
	LPU.memory[3].slot = new Node(LPU.nodes.ERASE, [new Port("e2", false)])
}

LPU.load_from_string = function(s, start_idx) {
	if (!start_idx) {
		start_idx = 0
	}
	let idx = start_idx
	s = s.split("\n");
	let occurred = {}
	for (line of s) {
		line = line.trim()
		if (!line) {
			continue;
		}
		if (line[0] === "#") {
			continue;
		}
		let args = line.split(" ")
		let type = args[0]
		let ports = args.slice(1)
		
		
		if (type == "e") {
			type = LPU.nodes.ERASE
		} else if (type == "d") {
			type = LPU.nodes.DUPLICATE
		} else if (type == "c") {
			type = LPU.nodes.CONSTRUCT
		}
		let ports_data = ports.map((x) => new Port(x + "pre", !(occurred[x])))
		ports.forEach((x) => occurred[x] = true)
		let n = new Node(type, ports_data);
		n.render_meta = new PositionData()
		LPU.memory[idx].set_from(n)
		idx += 1;
	}
	
}

let P1 = `
# e 1
# e 2
e 3
e 4
c a 1 2
c b 3 4
d c a b
c c m n
d s n r
d s r m
`
let P2 = `
d l a b
c a 1 ap
c b bp 2
c c bp ap
d c w l
`
let P3 = `
c l a b
c z b a
d z w l
`

LPU.onload = function() {
	LPU.canvas = document.getElementById("main-canvas")
	LPU.canvas.width = window.screen.width
	LPU.canvas.height = window.screen.height
	console.log("Loaded canvas!")
	
	// Initialize memory
	for (let i = 0; i < 200; i++) {
		LPU.memory.push(new MemoryCell())
	}
	LPU.load_from_string(P2);
	
	function f(n) {
		function g(m) {
			if (m == 0) {
				setTimeout(f, 100, n - 1) 
			}
			render_inet(LPU.memory)
			tick_inet_pos(LPU.memory)
			setTimeout(g, 100, m - 1) 
		}
		if (n == 0) {
			return
		}
		if (n % 2) {
			LPU.tick_once_rew()
		} else {
			LPU.tick_once_move()
		}
		position_inet(LPU.memory)
		setTimeout(g, 100, 10) 
	}
	f(50)
	
}