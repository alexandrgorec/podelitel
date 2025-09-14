require('dotenv').config();
const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const fs = require('fs');

bot.start(async (ctx) => {
    const photoStream = fs.createReadStream('./photo.png');
    await ctx.replyWithPhoto({ source: photoStream }, {
        caption: 'Привет, я умею считать!'
    });
    if (users[ctx.from.id] === undefined)
        users[ctx.from.id] = { state: null, rooms: [], buy: {}, activeRoom: null, username: ctx.from.username, isAdmin: false, arrayMessagesForDelete: [] };
    const user = users[ctx.from.id];
    reply('Выберите пункт меню', menu, ctx, user);
    setTimeout(() => { ctx.deleteMessage(); }, 50)
});

let db = {};
if (fs.existsSync('./db.json')) {
    db = require('./db.json');
} else {
    db = {
        rooms: {},
        users: {},
        roomCounter: 0,
    }
    fs.writeFileSync('./db.json', JSON.stringify(db));
}

setInterval(() => { fs.writeFileSync('./db.json', JSON.stringify(db)); }, 60 * 1000)

const rooms = db.rooms;
const users = db.users;


const commands = {
    createRoom: 'createRoom',
    myRooms: 'myRooms',
    myInvites: 'myInvites',
    mainMenu: 'mainMenu',
    administration: 'administration',
    whoThere: 'whoThere',
    total: 'total',
    addBuy: 'addBuy',
    showAllBuys: 'showAllBuys',
    showMyBuys: 'showMyBuys',
    deleteBuys: 'deleteBuys',
    leave: 'leave',
    buys: 'buys',
    room: 'room',
    addUser: 'addUser',
    deleteUser: 'deleteUser',
    chooseBuyer: 'chooseBuyer',
    changeNameRoom: 'changeNameRoom',
    deleteRoom: 'deleteRoom',
    textRoom: '🏰 В комнату',
}

const states = {
    inputUserName: 'inputUserName',
    inputBuySum: 'inputBuySum',
    inputBuyDescription: 'inputBuyDescription',
    chooseBuyer: 'chooseBuyer',
    changeNameRoom: 'changeNameRoom',
    deleteRoom: 'deleteRoom',
}

const buttons = {
    createRoom: { text: '🆕 Создать комнату', callback_data: JSON.stringify({ command: commands.createRoom, data: null }) },
    deleteRoom: { text: '❌ Удалить комнату', callback_data: JSON.stringify({ command: commands.deleteRoom, data: null }) },
    myRooms: { text: '🏘 Мои комнаты', callback_data: JSON.stringify({ command: commands.myRooms, data: null }) },
    myInvites: { text: '✉️ Мои приглашения', callback_data: JSON.stringify({ command: commands.myInvites, data: null }) },
    mainMenu: { text: '▶️ Главное меню', callback_data: JSON.stringify({ command: commands.mainMenu, data: null }) },
    administration: { text: '⚙️ Администрирование', callback_data: JSON.stringify({ command: commands.administration, data: null }) },
    whoThere: { text: '📋 Участники', callback_data: JSON.stringify({ command: commands.whoThere, data: null }) },
    total: { text: '🧮 РАСЧЕТ', callback_data: JSON.stringify({ command: commands.total, data: null }) },
    addBuy: { text: '🛍 Добавить расход', callback_data: JSON.stringify({ command: commands.addBuy, data: null }) },
    showAllBuys: { text: '👁 Все расходы', callback_data: JSON.stringify({ command: commands.showAllBuys, data: null }) },
    showMyBuys: { text: '🤑 Мои расходы', callback_data: JSON.stringify({ command: commands.showMyBuys, data: null }) },
    deleteBuys: { text: '✏️ Удалить расходы', callback_data: JSON.stringify({ command: commands.deleteBuys, data: null }) },
    leave: { text: '🚪 Выйти', callback_data: JSON.stringify({ command: commands.leave, data: null }) },
    buys: { text: '🛒 К Расходам', callback_data: JSON.stringify({ command: commands.buys, data: null }) },
    room: { text: '🏰 В комнату', callback_data: JSON.stringify({ command: commands.room, data: null }) },
    addUser: { text: "➕ Добавить участника", callback_data: JSON.stringify({ command: commands.addUser, data: null }) },
    deleteUser: { text: "➖ Удалить участника", callback_data: JSON.stringify({ command: commands.deleteUser, data: null }) },
    changeNameRoom: { text: "✏️ Сменить имя комнаты", callback_data: JSON.stringify({ command: commands.changeNameRoom, data: null }) },
}



const mainMenu = [
    [buttons.createRoom],
    [buttons.myRooms],
];


const roomMenu = [
    [buttons.buys],
    [buttons.whoThere],
    [buttons.total],
    [buttons.mainMenu]
];

const administrationRoom = [
    [buttons.addUser],
    [buttons.deleteUser],
    [buttons.changeNameRoom],
    [buttons.deleteRoom],
    [buttons.room],
]

const buysMenu = [
    [buttons.addBuy, buttons.deleteBuys],
    [buttons.showAllBuys, buttons.room],
]

const menu = {
    reply_markup: {
        inline_keyboard: mainMenu,
        resize_keyboard: true, // Optional: makes the keyboard smaller
        one_time_keyboard: true // Optional: keeps the keyboard after a button is pressed
    }
};

const menuKeyboard = {
    reply_markup: {
        keyboard: [],
        resize_keyboard: true, // Optional: makes the keyboard smaller
        one_time_keyboard: true // Optional: keeps the keyboard after a button is pressed
    }
};

const setRoomMenu = (user) => {
    menu.reply_markup.inline_keyboard = [...roomMenu];
    if (user.isAdmin)
        menu.reply_markup.inline_keyboard.unshift([buttons.administration])
}

const answerRoom = (user, ctx) => {
    if (user.activeRoom) {
        reply(`${user.activeRoom.name}`, menu, ctx, user);
    } else {
        menu.reply_markup.inline_keyboard = mainMenu;
        reply('Выберите пункт меню', menu, ctx, user);
    }
}

const reply = async (message, menu, ctx, user) => {
    let message_id = (await ctx.reply(message, menu, ctx, user)).message_id;
    user.arrayMessagesForDelete.push(message_id);
}

const deleteBotMessages = (user, CHATID) => {
    if (user?.arrayMessagesForDelete?.length > 0) {
        user.arrayMessagesForDelete = user.arrayMessagesForDelete.filter(id => id != undefined);
        bot.telegram.deleteMessages(CHATID, user.arrayMessagesForDelete);
        user.arrayMessagesForDelete = [];
    }
}

bot.on('callback_query', async (ctx) => {
    
    try {
        if (users[ctx.from.id] === undefined)
            users[ctx.from.id] = { state: null, rooms: [], buy: {}, activeRoom: null, username: ctx.from.username, isAdmin: false, arrayMessagesForDelete: [] };
        const user = users[ctx.from.id];
        const data = JSON.parse(ctx.callbackQuery.data).data;
        const command = JSON.parse(ctx.callbackQuery.data).command;
        const CHATID = ctx.update.callback_query.message.chat.id;
        deleteBotMessages(user, CHATID);
        user.state = null;
        switch (command) {
            case commands.mainMenu: {
                menu.reply_markup.inline_keyboard = mainMenu;
                user.isAdmin = false;
                reply('Выберите пункт меню', menu, ctx, user);
                break;
            }

            case commands.createRoom: {
                rooms[++db.roomCounter] = {
                    users: [],
                    buys: [],
                    admin: user.username,
                    name: `Комната № ${db.roomCounter}`,
                    id: db.roomCounter,
                };
                user.rooms.push(db.roomCounter);
                menu.reply_markup.inline_keyboard = [];
                user.rooms.forEach((roomId) => {
                    if (rooms[roomId] != undefined) {
                        const roomName = rooms[roomId].name;
                        menu.reply_markup.inline_keyboard.push([{ text: roomName, callback_data: JSON.stringify({ command: 'Выбор комнаты', data: roomId }) }]);
                    }
                });
                menu.reply_markup.inline_keyboard.push([buttons.mainMenu]);
                reply(`Поздравляем комната № ${db.roomCounter} создана, вы в ней администратор 😎`, menu, ctx, user);
                break;
            }
            case commands.deleteRoom: {
                menu.reply_markup.inline_keyboard = [];
                menu.reply_markup.inline_keyboard.push([{ text: "ДА", callback_data: JSON.stringify({ command: 'deletingRoom', data: user.activeRoom.id }) }]);
                menu.reply_markup.inline_keyboard.push([buttons.mainMenu]);
                reply(`Точно удаляем?:`, menu, ctx, user);
                break;
            }
            case "deletingRoom": {
                delete rooms[data];
                menu.reply_markup.inline_keyboard = mainMenu;
                reply(`Главное меню:`, menu, ctx, user);
                break;
            }
            case commands.myRooms: {
                menu.reply_markup.inline_keyboard = [];
                user.rooms.forEach((roomId) => {
                    if (rooms[roomId] != undefined) {
                        const roomName = rooms[roomId].name;
                        menu.reply_markup.inline_keyboard.push([{ text: roomName, callback_data: JSON.stringify({ command: 'Выбор комнаты', data: roomId }) }]);
                    }
                });
                menu.reply_markup.inline_keyboard.push([buttons.mainMenu]);
                reply(`В какую зайдем?:`, menu, ctx, user);
                break;
            }
            case 'Выбор комнаты': {
                let findRoom = user.rooms.find((roomId) => {
                    if (roomId == data) {
                        return true;
                    }
                })
                if (findRoom) {
                    if (rooms[findRoom] == undefined) {
                        reply(`Такой комнаты больше нет`, menu, ctx, user);
                    }
                    else {
                        user.activeRoom = rooms[findRoom];
                        if (user.activeRoom.admin === user.username) {
                            user.isAdmin = true;
                        }
                        else {
                            user.isAdmin = false;
                        }
                        setRoomMenu(user);
                        reply(`Вы вошли в комнату: ${user.activeRoom.name}`, menu, ctx, user);

                    }

                }
                else {
                    reply(`Нет комнаты с таким названием`, menu, ctx, user);
                }
                break;
            }
            case commands.room: {
                setRoomMenu(user);
                answerRoom(user, ctx);
                break;

            }
            case commands.administration: {
                if (user.isAdmin) {
                    menu.reply_markup.inline_keyboard = administrationRoom;
                    reply('Меню администратора:', menu, ctx, user);
                } else {
                    menu.reply_markup.inline_keyboard = roomMenu;
                    reply('Вы не админ', menu, ctx, user);
                }
                break;
            }
            case commands.addUser: {
                user.state = states.inputUserName;
                menuKeyboard.reply_markup.keyboard = [[commands.textRoom]]
                reply('Введи имя участника:', menuKeyboard, ctx, user)
                break;
            }
            case commands.deleteUser: {
                menu.reply_markup.inline_keyboard = [];
                user.activeRoom.users.forEach((name, ind) => {
                    menu.reply_markup.inline_keyboard.push([{ text: name, callback_data: JSON.stringify({ command: "deletingUser", data: ind }) }])
                });
                menu.reply_markup.inline_keyboard.push([buttons.administration])
                reply("Выбери участника, который покинет наши ряды:\nи ПОМНИ - Все его расходы удалятся!", menu, ctx, user);
                break;
            }
            case "deletingUser": {
                menu.reply_markup.inline_keyboard = administrationRoom;
                let deleteNameUser = '';
                user.activeRoom.users = user.activeRoom.users.filter((name, ind) => {
                    if (ind == data) {
                        deleteNameUser = name;
                    }
                    return ind != data
                });
                user.activeRoom.buys = user.activeRoom.buys.filter(({ buyer }) => buyer != deleteNameUser);
                user.state = commands.administration;
                reply(`Участника ${deleteNameUser} больше нет с нами, без него стало лучше!`, menu, ctx, user)
                break;
            }
            case commands.whoThere: {
                let spisok = '';
                menu.reply_markup.inline_keyboard = [[buttons.room]];
                if (user.activeRoom) {
                    user.activeRoom.users.forEach((name, ind) => spisok += `\n ${++ind}) ${name}`);
                }
                if (spisok === '') {
                    reply('Не добавлены участники делюги, все вопросы к админу', menu, ctx, user)
                } else {
                    reply(`Вот список участников в этой комнате:${spisok}`, menu, ctx, user)
                }

                break;
            }
            case commands.buys: {
                menu.reply_markup.inline_keyboard = buysMenu;
                reply('Меню расходов:', menu, ctx, user);
                break;
            }
            case commands.addBuy: {
                if (user.activeRoom.users.length == 0) {
                    menu.reply_markup.inline_keyboard = buysMenu;
                    reply('Не добавлены участники делюги, пусть сначала админ порешает вопросик, потом расходы пилить будем', menu, ctx, user)
                }
                else {
                    user.buy = {};
                    user.state = states.inputBuySum;
                    menuKeyboard.reply_markup.keyboard = [[commands.textRoom]];
                    reply('Введи сумму расхода:', menuKeyboard, ctx, user)
                }
                break;
            }
            case commands.chooseBuyer: {
                let buyerName = "";
                user.activeRoom.users.forEach((name, ind) => {
                    if (ind == data)
                        buyerName = name;
                })
                if (user.activeRoom.users.includes(buyerName)) {
                    user.buy.buyer = buyerName;
                    user.buy.manager = `@${user.username}`;
                    user.activeRoom.buys.push({ ...user.buy });
                    menu.reply_markup.inline_keyboard = buysMenu;
                    reply(`Расход добавлен!\n${user.buy.description}\nСумма: ${user.buy.cost}\n Платил: ${user.buy.buyer}\nДобавил: ${user.buy.manager}`, menu, ctx, user)
                } else {
                    reply('Выбранный участник в списках больше не числится, попробуй ещё раз:', menu, ctx, user)
                }
                break;
            }
            case commands.showAllBuys: {
                if (user.activeRoom.buys.length === 0) {
                    reply('Расходов пока не добавлено', menu, ctx, user)
                } else {
                    let answer = "Вот список всех расходов:\n\n";
                    user.activeRoom.buys.forEach(buy => {
                        answer += `${buy.description}\nСумма: ${buy.cost}\nПлатил: ${buy.buyer}\nДобавил: ${buy.manager}\n\n`
                    })
                    reply(answer, menu, ctx, user);
                }
                break;
            }
            case commands.deleteBuys: {
                if (user.activeRoom.buys.length === 0) {
                    reply('Расходов пока не добавлено', menu, ctx, user)
                } else {
                    user.activeRoom.buys.forEach(async (buy, ind) => {
                        if ((buy.buyer === user.name) || user.isAdmin) {
                            menu.reply_markup.inline_keyboard = [];
                            menu.reply_markup.inline_keyboard.push([{ text: "Удалить", callback_data: JSON.stringify({ command: 'deleteBuy', data: ind }) }])
                            reply(`${buy.description}\nСумма: ${buy.cost}\nПлатил: ${buy.buyer}\nДобавил: ${buy.manager}\n\n`, menu, ctx, user);
                        }
                    })
                    menu.reply_markup.inline_keyboard = [[buttons.buys]];
                    setTimeout(() => { reply("Оставить без изменений", menu, ctx, user) }, 10)

                }
                break;
            }
            case "deleteBuy": {
                user.activeRoom.buys = user.activeRoom.buys.filter((buy, ind) => ind != data);
                menu.reply_markup.inline_keyboard = buysMenu;
                reply("Расход удален", menu, ctx, user)
                break;
            }
            case commands.total: {
                const allBuysSumm = user.activeRoom.buys.reduce((sum, { cost }) => {
                    return sum + cost;
                }, 0);
                const avg = allBuysSumm / user.activeRoom.users.length;
                let total = [];
                let totalMessage = `Итоговые затраты участников:\n`;
                user.activeRoom.users.forEach(name => {
                    let userAllBuySum = user.activeRoom.buys.reduce((sum, buy) => {
                        if (name === buy.buyer) {
                            return sum + buy.cost;
                        } else return sum;
                    }, 0)
                    total.push([name, userAllBuySum - avg])
                    totalMessage += `${name}: ${userAllBuySum}\n`
                });
                totalMessage += `Общая стоимость затрат: ${allBuysSumm} \n`;
                totalMessage += `В среднем на человека: ${Math.floor(avg)}\n`;
                totalMessage += `Переводы:\n`;
                let i = 0;
                while (total.find(([name, credit]) => Math.abs(credit) > 1)) {
                    if (i > 10)
                        break;
                    i++;
                    total.sort((a, b) => a[1] - b[1]);
                    const maxPlus = total[total.length - 1];
                    const minMinus = total[0];
                    if (maxPlus[1] >= Math.abs(minMinus[1])) {
                        maxPlus[1] = maxPlus[1] + minMinus[1];
                        totalMessage += `${minMinus[0]} ➡️ ${maxPlus[0]}: ${Math.floor(Math.abs(minMinus[1]))}\n`;
                        minMinus[1] = 0;
                    } else {
                        minMinus[1] = maxPlus[1] + minMinus[1];
                        totalMessage += `${minMinus[0]} ➡️ ${maxPlus[0]}: ${Math.floor(Math.abs(minMinus[1] - maxPlus[1]))}\n`;
                        maxPlus[1] = 0;
                    }
                }
                if (allBuysSumm == 0)
                    totalMessage = 'Никто ничего не тратил'
                reply(totalMessage, menu, ctx, user);
                break;
            }
            case commands.changeNameRoom: {
                user.state = states.changeNameRoom;
                menuKeyboard.reply_markup.keyboard = [[commands.textRoom]];
                reply("Введи новое название:", menuKeyboard, ctx, user)
                break;
            }
            case commands.leave: {
                menu.reply_markup.inline_keyboard = mainMenu;
                user.isAdmin = false;
                reply('Выберите пункт меню', menu, ctx, user);
                break;
            }
        }
    }
    catch (e) {
        console.log(e);
    }
});




bot.on('message', async (ctx) => {

    if (users[ctx.from.id] === undefined)
        users[ctx.from.id] = { state: commands.mainMenu, rooms: [], buy: {}, activeRoom: null, username: ctx.from.username, roomMenu: roomUserMenu, isAdmin: false };
    let user = users[ctx.from.id];
    let message = ctx.message.text;
    const CHATID = ctx.message.chat.id;
    deleteBotMessages(user, CHATID);
    switch (message) {
        case commands.textRoom: {
            user.state = states.room;
            answerRoom(user, ctx);
            break;
        }
    }

    switch (user.state) {
        case states.inputUserName: {
            if (user.activeRoom && user.isAdmin) {
                menu.reply_markup.inline_keyboard = administrationRoom;
                if (!user.activeRoom.users.includes(message)) {
                    const newUser = message;
                    user.activeRoom.users.push(newUser);
                    reply(`Пользователь ${newUser} добавлен`, menu, ctx, user);
                }
                else {
                    reply('Участник с таким именем уже добавлен!', menu, ctx, user)
                }
                user.state = null;
            }
            break;
        }
        case states.inputBuySum: {
            if ((Number.isFinite(+message)) && (+message > 0) && (+message < 10000000)) {
                user.buy.cost = +message;
                user.state = states.inputBuyDescription;
                menuKeyboard.reply_markup.keyboard = [[commands.textRoom]];
                reply('На что потратил? Дай краткое описание расходу:', menuKeyboard, ctx, user)

            } else {
                menuKeyboard.reply_markup.keyboard = [[commands.textRoom]];
                reply('Вводи нормальное число, без всякой херни:', menuKeyboard, ctx, user)
            }

            break;
        }
        case states.inputBuyDescription: {
            user.buy.description = message;
            menu.reply_markup.inline_keyboard = [];
            if (user.activeRoom) {
                user.activeRoom.users.forEach((name, ind) => menu.reply_markup.inline_keyboard.push([{ text: name, callback_data: JSON.stringify({ command: commands.chooseBuyer, data: ind }) }]));
                menu.reply_markup.inline_keyboard.push([buttons.buys]);
                reply('Кто из участников платил?', menu, ctx, user, ctx, user)
            }
            else {
                menu.reply_markup.inline_keyboard = mainMenu;
                reply('Выберите пункт меню:', menu, ctx, user, ctx, user)
            }
            break;
        }
        case states.changeNameRoom: {
            user.activeRoom.name = message;
            setRoomMenu(user);
            reply(message, menu, ctx, user);
            break;
        }
    }
    ctx.deleteMessage();
});


bot.launch()