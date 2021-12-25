require('./clothes');
const typeToComponent = new Map([
	['Верх', 11],
	['Торс', 11],
]);

const topToUndershirtMale = new Map([
	[0, 0],
	[1, 1],
	[5, 5],
	[8, 8],
	[9, 9],
	[12, 64], // проверить текстуры
	[13, 13],
	[14, 29],
	[16, 16],
	[17, 17],
	[18, 19],
	[22, 23], // проверить текстуры
	[26, 27],
	[33, 37],
	[34, 38],
	[36, 40],
	[38, 41],
	[39, 42],
	[41, 43],
	[42, 45],
	[43, 46],
	[44, 47],
	[45, 51],
	[47, 53],
	[71, 67],
	[73, 65],
	[152, 79],
	[208, 101],
	[271, 135],
	[345, 168],
]);

const topToUndershirtFemale = new Map([
	[0, 0],
	[2, 26],
	[11, 11],
	[19, 18],
	[22, 22],
	[26, 23],
	[32, 27],
	[38, 30],
	[40, 31],
	[75, 61],
	[141, 78],
	[149, 84],
	[212, 128],
	[246, 149],
]);

const sleeveToTorso = new Map([
	['sleeve_long', [3, 1]],
	['sleeve_elbow', [1, 0]],
	['sleeve_none', [4, 2]],
])

let clothesItems = {}
let debugLayers = {};

function getClothesItem(gender, itemId) {
	const item = clothesItems[itemId];
	if (!item || (typeof item.gernder === 'number' && item.gender !== gender)) {
		return null;
	}

	return item;
}

function getComponentsFromClothes(gender, layers) {
	const components = new Map();
	const props = new Map();

	const male = gender === 1;

	// Персонаж без одежды
	components.set(1, [0, 0]); // Маска
	components.set(3, [15, 0]); // Торс
	components.set(4, [male ? 21 : 17, 0]); // Ноги
	components.set(5, [0, 0]); // Сумка
	components.set(6, [male ? 34 : 35, 0]); // Обувь
	components.set(7, [0, 0]); // Аксессуар
	components.set(8, [15, 0]); // Undershirt
	components.set(9, [0, 0]); // Body Armors (и бейджики)
	components.set(10, [0, 0]); // Decals
	components.set(11, [15, 0]); // Tops

	props.set(0, [-1, 0]); // Шапка
	props.set(1, [-1, 0]); // Очки
	props.set(2, [-1, 0]); // Уши
	props.set(6, [-1, 0]); // Часы
	props.set(7, [-1, 0]); // Браслеты

	// Маска
	let hideHat = false;
	let hideGlasses = false;
	const maskItem = getClothesItem(gender, layers.mask);
	if (maskItem) {
		hideHat = hideHat || !!mask.hideHat;
		hideGlasses = hideGlasses || !!maskItem.hideGlasses;

		components.set(1, [maskItem.drawableId, maskItem.textureId]);
	}

	// Шапка
	const hatItem = getClothesItem(gender, layers.hat);
	if (hatItem && !hideHat) {
		hideGlasses = hideGlasses || !!hatItem.hideGlasses;

		props.set(0, [hatItem.drawableId, hatItem.textureId]);
	}

	// Аксессуары
	const accessoriesItem = getClothesItem(gender, layers.accessories);
	if (accessoriesItem) {
		components.set(7, [accessoriesItem.drawableId, accessoriesItem.textureId]);
	}

	// Очки
	const glassesItem = getClothesItem(gender, layers.glasses);
	if (glassesItem && !hideGlasses) {
		props.set(1, [glassesItem.drawableId, glassesItem.textureId]);
	}

	// Верх
	const jacketItem = getClothesItem(gender, layers.jacket);
	const shirtItem = getClothesItem(gender, layers.shirt);
	if (jacketItem) {
		components.set(11, [jacketItem.drawableId, jacketItem.textureId]);
		// Выбор торса для длины рукавов
		components.set(3, [sleeveToTorso.get(jacketItem.sleeve)[gender], 0]);

		// Отображение футболки или торса под расстегнутой курткой
		if (shirtItem && jacketItem.torso === 'torso_open') {
			// Undershirt для надетой футболки
			const undershirtId = (male ? topToUndershirtMale : topToUndershirtFemale).get(shirtItem.drawableId);
			if (typeof undershirtId === 'number') {
				components.set(8, [undershirtId, shirtItem.textureId]);
				if (shirtItem.neck === 'neck_open' && jacketItem.sleeve === 'sleeve_long') {
					components.set(3, [male ? 6 : 7, 0]);
				}
			} else {
				// Дефолтный универсальный undershirt
				components.set(8, [male ? 1 : 0, 1]);
			}
		} else { // Футболка не надета
			if (jacketItem.torso === 'torso_partial') {
				components.set(8, [male ? 14 : 1, 1]);
			} else if (jacketItem.torso === 'torso_open') {
				if (jacketItem.sleeve === 'sleeve_long') {
					components.set(3, [male ? 14 : 5, 0]);
				} else {
					components.set(8, [male ? 1 : 0, 1]);
				}
			}
		}

		if (typeof jacketItem.undershirtId === 'number') {
			components.set(8, [jacketItem.undershirtId, jacketItem.undershirtTextureId || 0]);
		}
	}

	// Торс
	if (shirtItem && !jacketItem) {
		components.set(11, [shirtItem.drawableId, shirtItem.textureId]);
		// Выбор торса для длины рукавов
		components.set(3, [sleeveToTorso.get(shirtItem.sleeve)[gender], 0]);
		if (shirtItem.neck === 'neck_open' && shirtItem.sleeve === 'sleeve_none') {
			components.set(3, [male ? 5 : 12, 0]);
		}
		// Открытый живот
		if (!male && shirtItem.bellyOpen) {
			components.set(3, [4, 0]);
		}

		if (typeof shirtItem.undershirtId === 'number') {
			components.set(8, [shirtItem.undershirtId, shirtItem.undershirtTextureId || 0]);
		}
	}

	// Ноги
	const pantsItem = getClothesItem(gender, layers.pants);
	if (pantsItem) {
		components.set(4, [pantsItem.drawableId, pantsItem.textureId]);
	}

	// Обувь
	const shoesItem = getClothesItem(gender, layers.shoes);
	if (shoesItem) {
		components.set(6, [shoesItem.drawableId, shoesItem.textureId]);
	}

	// Обувь
	const backpackItem = getClothesItem(gender, layers.backpack);
	if (backpackItem) {
		components.set(5, [backpackItem.drawableId, backpackItem.textureId]);
	}

	return [components, props];
}

function showClothesOnPlayer(player, components, props) {
	components.forEach(([drawableId, textureId], componentId) => {
		player.setClothes(componentId, drawableId, textureId, 0);
	});

	props.forEach(([drawableId, textureId], propId) => {
		player.setProp(propId, drawableId, textureId);
	});
}

const pLayersMap = new Map([
	['🧥 Верх', 'jacket'],
	['👕 Торс', 'shirt'],
	['👖 Ноги', 'pants'],
	['👞 Обувь', 'shoes'],
	['🤿 Маска', 'mask'],
	['🎩 Шапка', 'hat'],
	['👓 Очки', 'glasses'],
	['👜 Рюкзак', 'backpack'],
	['🧣 Аксессуары', 'accessories'],
]);

const pSleeveMap = new Map([
	['До запястья', 'sleeve_long'],
	['До локтя', 'sleeve_elbow'],
	['Без рукавов', 'sleeve_none'],
]);

const pTorsoMap = new Map([
	['Закрытый', 'torso_closed'],
	['Частичный', 'torso_partial'],
	['Расстегнут', 'torso_open'],
]);

const pNeckMap = new Map([
	['Обычный', 'neck_closed'],
	['Большой', 'neck_open'],
]);

mp.events.addCommand('wear', (player, cmd, ...args) => {
	const data = args.join(' ');
	const params = data.split('\t');
	const [
		pGender,
		pLayer,
		pName,
		pPrice,
		pDrawable,
		pTexture,
		pSleeve,
		pTorso,
		pNeck,
		pHideHat,
		pHideGlasses,
		pBellyOpen,
		pUndershirt,
		pUndershirtTexture
	] = params;
	const playerGender = player.model === mp.joaat('mp_f_freemode_01') ? 0 : 1;

	const gender = pGender ? (pGender.includes('Муж') ? 1 : 0) : null;
	const layer = pLayersMap.get(pLayer);
	if (!layer) {
		player.outputChatBox(`Неизвестный тип "${pLayer}"`);
	}
	const item = {
		gender,
		layer,
		id: `debug_${layer}`,
		name: pName,
		price: parseInt(pPrice) || 0,
		drawableId: parseInt(pDrawable),
		textureId: parseInt(pTexture),
		sleeve: pSleeveMap.get(pSleeve) || '',
		torso: pTorsoMap.get(pTorso) || '',
		neck: pNeckMap.get(pNeck) || '',
		hideHat: pHideHat === 'TRUE',
		hideGlasses: pHideGlasses === 'TRUE',
		bellyOpen: pBellyOpen === 'TRUE',
		undershirtId: parseInt(pUndershirt) || false,
		undershirtTextureId: parseInt(pUndershirtTexture) || false,
	}

	clothesItems[item.id] = item;
	debugLayers[layer] = item.id;

	const [components, props] = getComponentsFromClothes(playerGender, debugLayers);
	showClothesOnPlayer(player, components, props);
	player.outputChatBox(`Примерка: надета вещь "${pName}" на слой ${layer}`);
});

mp.events.addCommand('unwear', (player) => {
	debugLayers = {};
	const playerGender = player.model === mp.joaat('mp_f_freemode_01') ? 0 : 1;
	showClothesOnPlayer(player, ...getComponentsFromClothes(playerGender, debugLayers));
	player.outputChatBox('Примерка: сняты все вещи');
});

mp.events.addCommand('comp', (player, cmd, component, drawable, texture) => {
	if (!texture) texture = '0';

	player.outputChatBox(`Компонент: ${component}; drawableId: ${drawable}; textureId: ${texture}`);
	player.setClothes(parseInt(component), parseInt(drawable), parseInt(texture), 0);
});

mp.events.addCommand('prop', (player, cmd, component, drawable, texture) => {
	if (!texture) texture = '0';

	player.outputChatBox(`Проп: ${component}; drawableId: ${drawable}; textureId: ${texture}`);
	player.setProp(parseInt(component), parseInt(drawable), parseInt(texture));
});

mp.events.addCommand('help', (player) => {
	player.outputChatBox('Примерка одежды:');
	player.outputChatBox(`/wear <строка из таблицы> - примерить одежду`);
	player.outputChatBox(`/unwear - снять всю одежду`);
	player.outputChatBox(' ');
	player.outputChatBox('Проверка вещей по ID:');
	player.outputChatBox(`/comp componentId drawableId textureId - тест компонента`);
	player.outputChatBox(`/prop propId drawableId textureId - тест пропа`);
});


console.log('Clothes editor loaded');
