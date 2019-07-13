'use strict';
module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    registeredBy: DataTypes.INTEGER,
    suspendedAt: DataTypes.DATE,
  }, {});
  Student.associate = function(models) {
    Student.belongsTo(models.Teacher, {
      foreignKey: 'id',
    });
    // associations can be defined here
  };
  return Student;
};