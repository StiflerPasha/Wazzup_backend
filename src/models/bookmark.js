'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('bookmark', {
    guid: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    link: {
      type: DataTypes.STRING(256),
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    description: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false
    },
    favorites: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      get() {
        const date = this.getDataValue('createdAt');
        return new Date(date).getTime();
      }
    }
    
  });
};
