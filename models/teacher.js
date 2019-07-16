'use strict';
module.exports = (sequelize, DataTypes) => {
  const Teacher = sequelize.define('Teacher', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true,
      }
    }
  }, {});
  Teacher.associate = function(models) {
    Teacher.hasMany(models.Student, {
      foreignKey: 'registeredBy',
      sourceKey: 'id'
    });
  };
  Teacher.prototype.registerStudents = function (studentsEmail) {
   return sequelize.models.Student.bulkCreate(
     studentsEmail.map((email) => ({email, registeredBy: this.id })),
     { validate: true }
    );
  }
  return Teacher;
};