const sequelize=require('../config/db');
const user=require('./user')(sequelize);
const post=require('./post')(sequelize);
const profile=require('./profile')(sequelize);
const student=require('./student')(sequelize);
const course=require('./course')(sequelize);
const comment=require('./comment')(sequelize);
const enrollment=require('./enrollment')(sequelize);
//one-to-one
user.hasOne(profile,{foreignKey:'user_id'});
profile.belongsTo(user,{foreignKey:'user_id'});

//one-to-many
user.hasMany(post,{foreignKey:'user_id'});
post.belongsTo(user,{foreignKey:'user_id'});

post.hasMany(comment,{foreignKey:'post_id'});
comment.belongsTo(post,{foreignKey:'post_id'});

user.hasMany(comment,{foreignKey:'user_id'});
comment.belongsTo(user,{foreignKey:'user_id'});

//many-to-many
student.belongsToMany(course, {  through: enrollment,  foreignKey: 'student_id'});

course.belongsToMany(student, {  through: enrollment,  foreignKey: 'course_id'});

module.exports={
    sequelize,
    user,
    profile,
    post,
    comment,
    student,
    course,
    enrollment
};

