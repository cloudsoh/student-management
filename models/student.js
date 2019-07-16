'use strict';
module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true,
      }
    },
    suspendedAt: DataTypes.DATE,
  }, {});
  Student.associate = function(models) {
    Student.belongsTo(models.Teacher, {
      foreignKey: 'registeredBy',
      targetKey: 'id'
    });
  };
  return Student;
};