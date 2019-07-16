'use strict';
module.exports = (sequelize, DataTypes) => {
  const StudentTeacher = sequelize.define('StudentTeacher', {
  }, {
    freezeTableName: true,
  });
  StudentTeacher.associate = function(models) {
    // associations can be defined here
    StudentTeacher.belongsTo(models.Teacher)
    StudentTeacher.belongsTo(models.Student)
  };
  return StudentTeacher;
};