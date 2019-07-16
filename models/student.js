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
    Student.belongsToMany(models.Teacher, {
      through: 'StudentTeacher',
    });
  };
  return Student;
};