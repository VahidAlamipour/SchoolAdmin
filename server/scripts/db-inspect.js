const SequelizeAuto = require('sequelize-auto');
const config = require('../config').get('db');

const auto = new SequelizeAuto(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    directory: '../server/models/',
    additional: {
        timestamps: false,
        underscored: true,
    },
    typescript: true,
});

auto.run((err) => {
    if (err) throw err;

    console.log(auto.tables);
    console.log(auto.foreignKeys);
});
