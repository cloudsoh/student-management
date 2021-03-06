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
    Teacher.belongsToMany(models.Student, {
      through: 'StudentTeacher',
    });
  };
  Teacher.prototype.registerStudents = function (studentsEmail) {
    return sequelize.transaction(async t => {
      // Find or create all the given students 
      const students = await Promise.all(studentsEmail.map(async (email) => {
        const [ student ] =  await sequelize.models.Student.findOrCreate({
          where: {
            email
          }, transaction: t })
          return student;
        }))
      // Associate student with this teacher
      return this.addStudents(students, { transaction: t });
    })
  }
  return Teacher;
};