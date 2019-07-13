'use strict';
module.exports = (sequelize, DataTypes) => {
  const Teacher = sequelize.define('Teacher', {
    email: {
      type: DataTypes.STRING,
      unique: true
    }
  }, {});
  Teacher.associate = function(models) {
    // associations can be defined here
  };
  return Teacher;
};