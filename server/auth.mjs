//Code in this file takes heavy inspiration from the authentication portion of homework 06

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const User = mongoose.model('User');

const register = async (username, password) => {
    //validate username and its length
    if (!username || username.length < 2) {
        throw { message: 'Username is too short' }; 
    }

    //validate password and its length
    if (!password || password.length < 8) {
        throw { message: 'Password is too short' };
    }

    //check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw { message: 'Username already exists' };
    }

    //hash the password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    //create and save the new user
    const newUser = new User({
        username,
        password: hash,
    });
    await newUser.save();

    //return the new user
    return newUser;
};

const login = async (username, password) => {
    const user = await User.findOne({ username });

    if (!user) {
        throw { message: 'User not found' };
    }

    const match = bcrypt.compareSync(password, user.password);

    if (!match) {
        throw { message: 'Password is incorrect' };
    }

    return user;
};

export {
    register,
    login
};