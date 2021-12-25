const rl = require('readline');

const consoleEface = rl.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: '> ',
});

const chandlers = new Map();

consoleEface.on('line', (cmd) => {
	const cargs = cmd.split(/\s+/);
	const cname = cargs[0];
	const handlers = chandlers.get(cname);
	if (handlers) {
		cargs.shift();
		for (const h of handlers) {
			h(...cargs);
		}
	} else {
		console.error(`unknown command: ${cname}`);
	}
	consoleEface.prompt();
})

consoleEface.prompt();

function addCCommand(cmd, h) {
	let hs = chandlers.get(cmd);
	if (!hs) {
		hs = [];
		chandlers.set(cmd, hs);
	}

	hs.push(h);
}

module.exports = {
	addCCommand,
}
