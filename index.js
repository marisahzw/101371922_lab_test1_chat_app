const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const userModel = require(__dirname + '/models/User');
const gmModel = require(__dirname + '/models/Groupchat');
const pmModel = require(__dirname + '/models/Privatechat');

const mongoDB ="mongodb+srv://admin:admin123@cluster0.dqrno8h.mongodb.net/chatapp?retryWrites=true&w=majority";
mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(success => {
    console.log('MongoDB connected')
}).catch(err => {
    console.log('Error while MongoDB connection')
});

const socketio = require('socket.io');
const formatMessage = require('./models/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require('./models/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = "ChatBot";


io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Chat app'));

        socket.broadcast
            .to(user.room)
            .emit(
                'message',
                formatMessage(botName, `${user.username} joined`)
            );

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });


    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });


    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message',
                formatMessage(botName, `${user.username} has left`)
            );

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

app.get('/', (req, res) => {
  res.redirect('/login');
});

// Signup
app.get('/signup', async (req, res) => {
    res.sendFile(__dirname + '/public/signup.html')
});

// Login
app.get('/login', async (req, res) => {
    res.sendFile(__dirname + '/public/login.html')
});

app.post('/login', async (req, res) => {
    const user = new userModel(req.body);

    try {
        await user.save((err) => {
            if(err){
                if (err.code === 11000) {
                    return res.redirect('/signup?err=username')
                }
                res.send(err)
            } else {
                res.redirect('/room-selection');
            }
        });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Handle login form submission
app.post('/', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = await userModel.findOne({ username });

    try {
        if (user) {
            if (user.password === password) {
                res.redirect('/');
            } else {
                res.redirect('/login?wrong=pass');
            }
        } else {
            res.redirect('/login?wrong=uname');
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

// Chat
app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/public/login.html')
});

app.get('/chat/:room', async (req, res) => {
    const room = req.params.room
    const msg = await gmModel.find({room: room}).sort({'date_sent': 'desc'}).limit(10);
    if(msg.length!=0){
        res.send(msg)
    } else {
        res.sendFile(__dirname + '/html/chat.html')
    }
});

app.post('/chat', async (req, res) => {
    const username = req.body.username
    const user = await userModel.findOne({ username: username });

    if (user) {
        res.redirect('/chat/' + username)
    } else {
        res.redirect('/?err=noUser')
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
