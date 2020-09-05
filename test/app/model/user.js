/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('user', {
		id: {
			autoIncrement: true,
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING(32),
			allowNull: false
		},
		age: {
			type: DataTypes.INTEGER(6),
			allowNull: false
		}
	}, {
		sequelize,
		tableName: 'user',
		timestamps: false,
		underscored: true
	});
};
