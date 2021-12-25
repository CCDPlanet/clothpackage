const fs = require('fs/promises');
const { addCCommand } = require('./console');
const util = require('util');
const path = require('path');

const dirname = 'clothes';

function parseYtd(ytdEnt) {
	const out = {};
	const split = ytdEnt.split('_');
	if (split.length !== 5 || split[1] !== 'diff') {
		throw new Error(`invalid entrie for .ytd: got ${ytdEnt}, expected format xxxx_diff_000_a_uni`);
	}
	out.type = String(split[0]);
	out.number = Number(split[2]);
	out.letter = String(split[3]);
	out.race = String(split[4]);
	return out;
}

function parseYdd(yddEnt) {
	const out = {};
	const split = yddEnt.split('_');
	if (split.length !== 3) {
		throw new Error(`invalid entrie for .ydd: got ${yddEnt}, expected format xxxx_000_u`);
	}
	out.type = String(split[0]);
	out.number = Number(split[1]);
	out.race = String(split[2]);
	return out;
}

function parseEnt(entName) {
	const ent = {};
	const split = /^(.*)\.(.*$)/.exec(entName).slice(1, 3);
	ent.name = split[0];
	ent.ext = split[1];
	entName = ent.name;
	switch (ent.ext) {
		case 'ytd':
			ent.isTexture = true;
			ent.isModel = false;
			return { ...ent, ...parseYtd(entName) };
		case 'ydd':
			ent.isTexture = false;
			ent.isModel = true;
			return { ...ent, ...parseYdd(entName) };
		default:
			throw new Error(`unknown extension of the entrie ${entName}`);
	}
}

function entstr(ent) {
	let s = ent.type;
	if (ent.isTexture) {
		s += '_diff';
	}
	s += `_${String(ent.number).padStart(3, '0')}`;
	if (ent.isTexture) {
		s += `_${ent.letter}`;
	}
	s += `_${ent.race}.${ent.ext}`;
	return s;
}

addCCommand('clothes', async (...cargs) => {
	const shift = Number(cargs[0]);
	if (Number.isNaN(shift)) {
		console.error(`Для переименования файлов поместите их в директорию clothes/ и вызовите команду.
Синтаксис: clothes сдвиг [, ...тип], пример:
	clothes 12			сдвиг на 12: 000 -> 012
	clothes 20 feet			сдвиг типа feet на 20: 005 -> 025
	clothes -2			сдвиг на -2: 006 -> 004`);
		return;
	}
	const validate = cargs.slice(1);
	try {
		const dir = await fs.opendir(dirname);
		console.info('чтение файлов из директории clothes/ ...');
		let i = 0;
		const dirents = [];
		for await (const dirent of dir) {
			dirents.push(dirent);
		}
		dirents.sort((a, b) => (a.name > b.name ? -1 : 1) * Math.sign(shift));
		for (const dirent of dirents) {
			if (!dirent.isFile()) {
				continue;
			}
			const rageent = parseEnt(dirent.name);
			if (validate.length > 0 && !validate.includes(rageent.type)) {
				continue;
			}
			rageent.number += shift;
			if (rageent.number < 0 || rageent.number > 999) {
				console.warn(`невозможно присвоить номер ${rageent.number} файлу ${dirent.name}, пропуск`);
				continue;
			}
			const entpath = path.join(dir.path, dirent.name);
			const newentpath = path.join(dir.path, entstr(rageent));
			try {
				await fs.access(newentpath)
				console.warn(`невозможно переименовать файл ${entpath} в ${newentpath}: конечный файл уже существует, пропуск`);
			} catch (err) {
				await fs.rename(entpath, newentpath)
				i++
			}
		}
		console.info(`переименовано ${i} файла(ов).`);
	} catch (err) {
		switch (err.code) {
			case 'ENOENT':
				console.error('поместите файлы в директорию clothes/');
				await fs.mkdir(dirname);
				break;
			case 'ENOTDIR':
				console.error('поместите файлы в директорию clothes/');
				await fs.rm(dirname);
				await fs.mkdir(dirname);
				break;
			case 'EPERM':
				console.error(`нет прав на доступ к директории ${dirname}`);
			default:
				console.error(`не удалось открыть директорию ${dirname}: %O`, err);
		}
	}
});
