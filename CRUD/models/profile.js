module.exports = (sequelize, DataTypes) => {
  const Profile = sequelize.define("Profile", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    bio: DataTypes.STRING
  });

  return Profile;
};