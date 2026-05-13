const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Profile = sequelize.define('Profile', {

    bio: {
        type: DataTypes.STRING
    },

    city: {
        type: DataTypes.STRING
    }

});

module.exports = Profile;