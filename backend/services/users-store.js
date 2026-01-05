const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 简单文件型用户存储：backend/services/users.json
const DATA_DIR = path.join(__dirname);
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureUsersFileExists() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2), 'utf-8');
    }
}

function readUsers() {
    ensureUsersFileExists();
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw).users || [];
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2), 'utf-8');
}

class UsersStore {
    async findOne(query) {
        const users = readUsers();
        if (query.username) {
            return users.find(u => u.username === query.username) || null;
        }
        if (query._id) {
            return users.find(u => u._id === query._id) || null;
        }
        return null;
    }

    async create(userData) {
        const users = readUsers();
        const newUser = {
            _id: uuidv4(),
            username: userData.username,
            password: userData.password,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        writeUsers(users);
        return newUser;
    }
}

module.exports = UsersStore;


